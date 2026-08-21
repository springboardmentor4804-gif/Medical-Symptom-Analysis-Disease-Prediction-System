import bcrypt
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional, Any
from datetime import datetime

# Password helpers
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(10)
    # bcrypt.hashpw expects bytes
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# Base User Schema representing shared attributes
class UserBase(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    age: int = Field(..., ge=1)
    sex: str
    phone: str
    role: str = "patient"
    speciality: Optional[str] = None
    weight: float = 70.0
    height: float = 170.0
    bloodType: str = "O+"
    chronicConditions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)
    medicalHistory: List[Any] = Field(default_factory=list)
    emergencyContactName: Optional[str] = ""
    emergencyContactRelationship: Optional[str] = ""
    emergencyContactPhone: Optional[str] = ""

    @field_validator('sex')
    @classmethod
    def validate_sex(cls, v: str) -> str:
        v_lower = v.lower()
        if v_lower not in ["male", "female", "other"]:
            raise ValueError("Gender must be 'male', 'female', or 'other'")
        return v_lower

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        v_lower = v.lower()
        if v_lower not in ["patient", "doctor"]:
            raise ValueError("Role must be 'patient' or 'doctor'")
        return v_lower

# Schema for signing up (includes password)
class UserSignup(UserBase):
    password: str = Field(..., min_length=6)

# Schema for logging in
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema for updating profile (PUT /api/auth/me)
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = Field(None, ge=1)
    sex: Optional[str] = None
    phone: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    bloodType: Optional[str] = None
    chronicConditions: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    medicalHistory: Optional[List[Any]] = None
    emergencyContactName: Optional[str] = None
    emergencyContactRelationship: Optional[str] = None
    emergencyContactPhone: Optional[str] = None

    @field_validator('sex')
    @classmethod
    def validate_sex(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_lower = v.lower()
            if v_lower not in ["male", "female", "other"]:
                raise ValueError("Gender must be 'male', 'female', or 'other'")
            return v_lower
        return v

# Schema for doctor updating a patient's medical details
class PatientMedicalUpdate(BaseModel):
    chronicConditions: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    medicalHistory: Optional[List[Any]] = None

# Serializer helper to convert MongoDB doc to JSON dict
def serialize_user(user_doc: dict) -> dict:
    if not user_doc:
        return {}
    serialized = {**user_doc}
    serialized["_id"] = str(user_doc["_id"])
    if "password" in serialized:
        del serialized["password"]
    # Handle timestamps or other fields if needed
    if "createdAt" in serialized and isinstance(serialized["createdAt"], datetime):
        serialized["createdAt"] = serialized["createdAt"].isoformat()
    if "updatedAt" in serialized and isinstance(serialized["updatedAt"], datetime):
        serialized["updatedAt"] = serialized["updatedAt"].isoformat()
    return serialized
