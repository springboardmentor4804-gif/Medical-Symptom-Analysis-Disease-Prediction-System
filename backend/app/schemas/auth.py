from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["patient", "doctor", "admin", "clinic"] = "patient"
    name: str = Field(..., min_length=1)
    age: Optional[int] = Field(default=None, ge=0, le=150)
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    specialty: Optional[str] = None  # For doctor role
    medical_reg_no: Optional[str] = None  # Doctor Medical Registration Number
    council_type: Optional[str] = None   # National Medical Commission (NMC) or State Medical Council
    state_council: Optional[str] = None  # State Medical Council name
    qualification: Optional[str] = None  # MBBS, MD, MS, etc.
    registration_year: Optional[int] = None  # Year of Registration
    is_verified: Optional[bool] = False  # Verification status

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
