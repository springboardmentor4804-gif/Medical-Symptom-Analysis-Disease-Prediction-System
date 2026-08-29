from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional


# =========================================================
# USERS
# =========================================================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# =========================================================
# SYMPTOMS
# =========================================================

class SymptomCreate(BaseModel):
    user_id: int
    symptoms: str
    medical_history: str = ""


# =========================================================
# MEDICAL HISTORY
# =========================================================

class MedicalHistoryCreate(BaseModel):
    user_id: int
    medical_history: str = ""


# =========================================================
# PATIENT PROFILE
# =========================================================

class PatientProfileCreate(BaseModel):
    user_id: int
    age: Optional[int] = None
    gender: str = ""
    blood_group: str = ""


# =========================================================
# DISEASE PREDICTION
# =========================================================

class DiseasePredictionRequest(BaseModel):
    user_id: int
    symptoms: List[str] = Field(
        ...,
        min_length=1
    )


# =========================================================
# RECOMMENDATION REQUEST
# =========================================================

class RecommendationRequest(BaseModel):
    user_id: int
    predicted_disease: str
    confidence: Optional[float] = 0.0


# =========================================================
# HEALTH ADVISORY REQUEST
# =========================================================

class AdvisoryRequest(BaseModel):
    user_id: int
    predicted_disease: str
    risk_level: Optional[str] = "Moderate"


# =========================================================
# REPORT REQUEST
# =========================================================

class ReportRequest(BaseModel):
    user_id: int
    prediction_id: Optional[int] = None


# =========================================================
# ANALYTICS REQUEST
# =========================================================

class AnalyticsRequest(BaseModel):
    user_id: Optional[int] = None


# =========================================================
# HEALTH TREND REQUEST
# =========================================================

class HealthTrendRequest(BaseModel):
    user_id: int


# =========================================================
# COMMON RESPONSE MODELS
# =========================================================

class MessageResponse(BaseModel):
    message: str


# =========================================================
# RECOMMENDATION RESPONSE
# =========================================================

class RecommendationResponse(BaseModel):
    risk_level: str
    recommendation: str
    treatment: str
    advisory: str


# =========================================================
# HEALTH ADVISORY RESPONSE
# =========================================================

class AdvisoryResponse(BaseModel):
    disease: str
    risk_level: str
    advisory_message: str
    warning_message: str


# =========================================================
# PREDICTION RESPONSE
# =========================================================

class PredictionResponse(BaseModel):
    prediction_id: int
    predicted_disease: str
    confidence: float
    risk_level: str
    recommendation: str
    treatment: Optional[str] = ""
    advisory: Optional[str] = ""


# =========================================================
# HEALTH TREND RESPONSE
# =========================================================

class HealthTrendItem(BaseModel):
    date: str
    disease: str
    confidence: float
    risk_level: str


class HealthTrendResponse(BaseModel):
    trends: List[HealthTrendItem]


# =========================================================
# ANALYTICS RESPONSE
# =========================================================

class RiskDistribution(BaseModel):
    high: int = 0
    moderate: int = 0
    low: int = 0
    needs_review: int = 0


class DiseaseDistribution(BaseModel):
    disease: str
    count: int


class AnalyticsResponse(BaseModel):
    total_patients: int
    total_predictions: int
    high_risk_cases: int
    risk_distribution: RiskDistribution
    disease_distribution: List[DiseaseDistribution]


# =========================================================
# REPORT RESPONSE
# =========================================================

class ReportPatient(BaseModel):
    patient_id: int
    name: str
    email: str
    age: Optional[int] = None
    gender: Optional[str] = ""
    blood_group: Optional[str] = ""


class ClinicalInformation(BaseModel):
    symptoms: str = ""
    medical_history: str = ""


class ReportPrediction(BaseModel):
    disease: str
    confidence: float
    risk_level: str
    prediction_date: Optional[str] = None


class PredictionReportResponse(BaseModel):
    report_id: int
    generated_at: str
    patient: ReportPatient
    clinical_information: ClinicalInformation
    prediction: ReportPrediction
    recommendation: str
    disclaimer: str


# =========================================================
# DOCTOR ANALYTICS
# =========================================================

class RecentPrediction(BaseModel):
    id: int
    disease: str
    confidence: float
    risk_level: str
    created_at: Optional[str] = None


class DoctorAnalyticsResponse(BaseModel):
    total_patients: int
    total_predictions: int
    high_risk_cases: int
    moderate_risk_cases: int
    low_risk_cases: int
    recent_predictions: List[RecentPrediction]