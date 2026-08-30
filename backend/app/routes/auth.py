import asyncio
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.clinic import Clinic
from app.schemas.auth import UserRegister, UserLogin, TokenResponse
from app.security import get_password_hash, verify_password, create_access_token
from app.mongo_database import users_collection, patients_collection, user_inputs_collection
from app.mongo_models import MongoUser, MongoPatient, MongoUserInput

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def _mirror_registration_to_mongo(
    user_in: UserRegister,
    password_hash: str,
) -> None:
    """Background task: write registration data to MongoDB (fire-and-forget)."""
    try:
        # 1. Insert into `users` collection
        mongo_user = MongoUser(
            email=user_in.email,
            name=user_in.name,
            role=user_in.role,
            specialty=user_in.specialty if user_in.role == "doctor" else None,
            password_hash=password_hash,
        )
        await users_collection().update_one(
            {"email": user_in.email},
            {"$set": mongo_user.model_dump()},
            upsert=True,
        )

        # 2. Insert into `patients` collection (patients only)
        if user_in.role == "patient" and user_in.age is not None and user_in.gender:
            mongo_patient = MongoPatient(
                user_email=user_in.email,
                name=user_in.name or "",
                age=user_in.age,
                gender=user_in.gender,
                medical_history=user_in.medical_history,
            )
            await patients_collection().update_one(
                {"user_email": user_in.email},
                {"$set": mongo_patient.model_dump()},
                upsert=True,
            )

        # 3. Log the raw input in the generic `user_inputs` collection
        safe_payload = {
            "email": user_in.email,
            "name": user_in.name,
            "role": user_in.role,
            "age": user_in.age,
            "gender": user_in.gender,
            "specialty": user_in.specialty,
            "medical_history": user_in.medical_history,
        }
        mongo_input = MongoUserInput(
            input_type="registration",
            user_email=user_in.email,
            payload=safe_payload,
        )
        await user_inputs_collection().insert_one(mongo_input.model_dump())
    except Exception as exc:
        # MongoDB failures must never crash the main API response
        print(f"[MongoDB] ⚠️  Registration mirror failed: {exc}")

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )
    
    if user_in.role == "patient":
        if user_in.age is None or not user_in.gender:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient registration requires age and gender."
            )

    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        name=user_in.name,
        role=user_in.role,
        specialty=user_in.specialty if user_in.role == "doctor" else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if user_in.role == "patient":
        new_patient = Patient(
            user_id=new_user.id,
            name=user_in.name,
            age=user_in.age,
            gender=user_in.gender,
            medical_history=user_in.medical_history
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
    elif user_in.role == "clinic":
        new_clinic = Clinic(
            user_id=new_user.id,
            clinic_name=user_in.name if user_in.name else "MedAssist Medical Clinic",
            address="Main Healthcare Center"
        )
        db.add(new_clinic)
        db.commit()
        db.refresh(new_clinic)
    
    # Generate token
    token = create_access_token(data={"sub": new_user.email, "user_id": new_user.id, "role": new_user.role})

    # Mirror registration data to MongoDB (non-blocking, fire-and-forget)
    asyncio.create_task(
        _mirror_registration_to_mongo(user_in, new_user.password_hash)
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=new_user.role
    )

@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(data={"sub": user.email, "user_id": user.id, "role": user.role})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role
    )
