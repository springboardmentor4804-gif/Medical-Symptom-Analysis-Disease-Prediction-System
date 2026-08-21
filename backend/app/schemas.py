from typing import Optional

from pydantic import BaseModel, EmailStr


# -------------------------
# Authentication Schemas
# -------------------------

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


# -------------------------
# Patient Profile Schemas
# -------------------------

class PatientProfileBase(BaseModel):
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None


class PatientProfileCreate(PatientProfileBase):
    pass


class PatientProfileUpdate(PatientProfileBase):
    full_name: Optional[str] = None


class PatientProfileResponse(PatientProfileBase):
    id: int
    user_id: int
    full_name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True
        
class SymptomBase(BaseModel):
    fever: str | None = None
    cough: str | None = None
    headache: str | None = None
    fatigue: str | None = None
    chest_pain: str | None = None
    shortness_of_breath: str | None = None
    blood_pressure: str | None = None
    heart_rate: str | None = None
    blood_sugar: str | None = None
    temperature: str | None = None
    notes: str | None = None


class SymptomCreate(SymptomBase):
    pass


class SymptomUpdate(SymptomBase):
    pass


class SymptomResponse(SymptomBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True

# -------------------------
# Prediction Schemas
# -------------------------

class PredictionBase(BaseModel):
    symptom_id: int
    predicted_disease: str
    confidence: str
    risk_level: str
    recommendation: str


class PredictionCreate(PredictionBase):
    pass


class PredictionUpdate(BaseModel):
    predicted_disease: Optional[str] = None
    confidence: Optional[str] = None
    risk_level: Optional[str] = None
    recommendation: Optional[str] = None


class PredictionResponse(PredictionBase):
    id: int
    patient_id: int
    symptoms: list[str] = []

    class Config:
        from_attributes = True
# -------------------------
# Doctor Patient Assignment
# -------------------------

class AssignmentCreate(BaseModel):
    doctor_id: int
    patient_id: int


class AssignmentResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: int

    class Config:
        from_attributes = True

class AdminDashboardResponse(BaseModel):
    total_doctors: int
    total_patients: int
    total_predictions: int
    total_assignments: int# ======================================================
# AI Prediction Request / Response
# ======================================================

class AIPredictionRequest(BaseModel):
    symptoms: list[str]

class AIPredictionUpdateRequest(BaseModel):
    symptoms: list[str]

class AIPredictionResponse(BaseModel):
    disease: str
    confidence: float
    description: str
    precautions: list[str]

