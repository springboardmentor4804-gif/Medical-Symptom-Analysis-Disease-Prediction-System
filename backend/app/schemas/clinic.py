from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class ClinicCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    clinic_name: str = Field(..., min_length=1)
    address: str = Field(..., min_length=1)


class ClinicProfileUpdate(BaseModel):
    clinic_name: str = Field(..., min_length=1)
    address: str = Field(..., min_length=1)


class ClinicAssignDoctor(BaseModel):
    doctor_id: int


class ClinicPatientUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=150)
    gender: str = Field(..., min_length=1)
    medical_history: Optional[str] = None


class ClinicDoctorUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    specialty: Optional[str] = None


class ClinicStatsResponse(BaseModel):
    total_doctors: int
    total_patients: int
    solved_cases: int


class ClinicResponse(BaseModel):
    id: int
    user_id: int
    email: EmailStr
    clinic_name: str
    address: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClinicDoctorResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    role: str
    specialty: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ClinicPatientResponse(BaseModel):
    id: int
    user_id: int
    name: str
    age: int
    gender: str
    medical_history: Optional[str] = None
    email: EmailStr
    assigned_doctor: Optional[str] = None

    class Config:
        from_attributes = True