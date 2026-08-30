from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field


class DoctorCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)
    specialty: Optional[str] = None


class DoctorResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    role: str
    specialty: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    total_patients: int
    total_doctors: int
    total_clinics: int
    pending_reviews: int


class AdminDoctorListItem(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    specialty: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminClinicListItem(BaseModel):
    id: int
    user_id: int
    email: EmailStr
    clinic_name: str
    address: str
    doctor_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AdminSymptomItem(BaseModel):
    id: int
    symptom_name: str
    submitted_at: str

    class Config:
        from_attributes = True


class AdminPatientDetail(BaseModel):
    id: int
    user_id: int
    name: str
    age: int
    gender: str
    email: EmailStr
    medical_history: Optional[str] = None
    symptoms: List[AdminSymptomItem] = []
    latest_diagnosis: Optional[str] = None
    latest_prescription: Optional[str] = None
    case_status: Optional[str] = None