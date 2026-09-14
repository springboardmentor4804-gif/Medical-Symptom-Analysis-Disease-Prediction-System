from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RecommendationCreate(BaseModel):
    diagnosis: str
    recommendations: Optional[str] = None
    prescription: Optional[str] = None
    status: Optional[str] = "Solved"

class RecommendationResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    doctor_name: Optional[str] = None
    doctor_specialty: Optional[str] = None
    diagnosis: str
    recommendations: Optional[str] = None
    prescription: Optional[str] = None
    status: str
    created_at: str

    class Config:
        from_attributes = True

class PatientDetailWithStatus(BaseModel):
    id: int
    user_id: int
    name: str
    age: int
    gender: str
    medical_history: Optional[str] = None
    email: str
    case_status: str  # "Pending", "Under Review", "Solved"
    last_diagnosis: Optional[str] = None
    ai_predicted_risk: Optional[str] = None
    ai_predicted_disease: Optional[str] = None

class AIDiagnosticSuggestion(BaseModel):
    disease: str
    match_score: int
    matched_symptoms: List[str]
    suggested_action: str

class DoctorProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    specialty: str
    age: int
    role: str
    total_patients: int
    medical_reg_no: Optional[str] = None
    council_type: Optional[str] = None
    state_council: Optional[str] = None
    qualification: Optional[str] = None
    registration_year: Optional[int] = None
    is_verified: Optional[bool] = False

class DoctorClinicalReportResponse(BaseModel):
    report_id: str
    generated_at: str
    doctor: dict
    patient: dict
    symptoms: List[dict]
    latest_recommendation: Optional[RecommendationResponse] = None
    ai_suggestions: List[AIDiagnosticSuggestion] = []
    ai_prediction: Optional[dict] = None
