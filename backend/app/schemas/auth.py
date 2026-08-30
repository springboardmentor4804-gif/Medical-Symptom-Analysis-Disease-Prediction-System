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

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
