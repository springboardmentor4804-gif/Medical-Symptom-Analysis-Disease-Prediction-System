import os
from datetime import datetime, timedelta, timezone
from typing import List

import jwt
from bson.objectid import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import get_db
from models.user import (
    PatientMedicalUpdate,
    UserLogin,
    UserSignup,
    UserUpdate,
    hash_password,
    serialize_user,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "medassist_secret_key_987654321")

def generate_token(user_id: str) -> str:
    # Expire in 30 days
    expiration = datetime.now(timezone.utc) + timedelta(days=30)
    payload = {
        "id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# Dependency to protect routes and get the current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authorized, token failed",
            )
        
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authorized, user not found",
            )
        return user
    except (jwt.PyJWTError, InvalidId):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized, token failed",
        )

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignup):
    db = get_db()
    email_lower = user_data.email.lower()
    
    # Check if user already exists
    if db.users.find_one({"email": email_lower}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists with this email"
        )
    
    # Prepare User document
    hashed = hash_password(user_data.password)
    user_dict = user_data.model_dump()
    user_dict["email"] = email_lower
    user_dict["password"] = hashed
    
    # speciality is only for doctors
    if user_dict["role"] != "doctor":
        user_dict.pop("speciality", None)
        
    now = datetime.now(timezone.utc)
    user_dict["createdAt"] = now
    user_dict["updatedAt"] = now
    
    # Insert user
    result = db.users.insert_one(user_dict)
    new_user_id = str(result.inserted_id)
    
    return {
        "_id": new_user_id,
        "name": user_dict["name"],
        "email": user_dict["email"],
        "role": user_dict["role"],
        "token": generate_token(new_user_id)
    }

@router.post("/login")
async def login(credentials: UserLogin):
    db = get_db()
    email_lower = credentials.email.lower()
    
    user = db.users.find_one({"email": email_lower})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
        
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
        
    return {
        "_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "token": generate_token(str(user["_id"]))
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)

@router.put("/me")
async def update_me(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Extract non-None values to update
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if "email" in update_dict:
        update_dict["email"] = update_dict["email"].lower()
        # Check if email is taken by another user
        if update_dict["email"] != current_user["email"]:
            if db.users.find_one({"email": update_dict["email"]}):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User already exists with this email"
                )
                
    if update_dict:
        update_dict["updatedAt"] = datetime.now(timezone.utc)
        db.users.update_one({"_id": current_user["_id"]}, {"$set": update_dict})
        # Fetch updated user
        updated_user = db.users.find_one({"_id": current_user["_id"]})
    else:
        updated_user = current_user
        
    return serialize_user(updated_user)

@router.get("/patients")
async def get_patients(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors can view patients."
        )
        
    db = get_db()
    patients_cursor = db.users.find({"role": "patient"})
    return [serialize_user(p) for p in patients_cursor]

@router.put("/patients/{patient_id}")
async def update_patient(patient_id: str, update_data: PatientMedicalUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
        
    db = get_db()
    try:
        obj_id = ObjectId(patient_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
        
    patient = db.users.find_one({"_id": obj_id, "role": "patient"})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
        
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["updatedAt"] = datetime.now(timezone.utc)
        db.users.update_one({"_id": obj_id}, {"$set": update_dict})
        updated_patient = db.users.find_one({"_id": obj_id})
    else:
        updated_patient = patient
        
    return serialize_user(updated_patient)
