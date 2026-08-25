from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class UserCreate(BaseModel):
    full_name: str = Field(..., max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern='^(patient|doctor|admin)$')
    phone: Optional[str] = None

    # Common optional profile fields
    dob: Optional[str] = None
    gender: Optional[str] = None

    # Patient-specific
    blood_group: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    age: Optional[int] = None
    emergency_contact: Optional[str] = None
    existing_conditions: Optional[str] = None
    allergies: Optional[str] = None

    # Provider-specific
    hospital_name: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    years_experience: Optional[int] = None
    qualification: Optional[str] = None
    department: Optional[str] = None

    @field_validator('height', 'weight', 'age', 'years_experience', mode='before')
    def blank_string_to_none(cls, value):
        if value == '':
            return None
        return value

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    phone: Optional[str]

    class Config:
        orm_mode = True


class PatientProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    emergency_contact: Optional[str] = None
    existing_conditions: Optional[str] = None
    allergies: Optional[str] = None
    profile_picture_url: Optional[str] = None


class MedicalHistoryCreate(BaseModel):
    disease: str
    diagnosed_date: Optional[str] = None
    treatment: Optional[str] = None
    status: Optional[str] = None
    surgery: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    family_history: Optional[str] = None
    ongoing_treatment: Optional[str] = None


class MedicalHistoryUpdate(MedicalHistoryCreate):
    pass


class SymptomEntry(BaseModel):
    symptom_id: Optional[int] = None
    symptom_name: Optional[str] = None
    severity: Optional[int] = None
    duration: Optional[str] = None
    frequency: Optional[str] = None
    notes: Optional[str] = None


class PatientSymptomCreate(BaseModel):
    symptoms: list[SymptomEntry]


class PredictionRequest(BaseModel):
    symptom_ids: Optional[list[int]] = None
    symptom_names: Optional[list[str]] = None


class PredictionFeedbackRequest(BaseModel):
    prediction_id: int
    feedback: Optional[str] = None
    status: Optional[str] = None
    comments: Optional[str] = None

    @field_validator('status', mode='before')
    def normalize_status(cls, value):
        if value is None:
            return None
        return str(value).strip().lower()

    @field_validator('feedback', mode='before')
    def normalize_feedback(cls, value):
        if value is None:
            return None
        return str(value).strip().lower()


class RiskAssessmentRequest(BaseModel):
    notes: Optional[str] = None


class SettingsUpdate(BaseModel):
    old_password: Optional[str] = None
    new_password: Optional[str] = None
    notification_preferences: Optional[str] = None
    profile_preferences: Optional[str] = None


class ProviderProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    hospital_name: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    years_experience: Optional[int] = None
    qualification: Optional[str] = None
    department: Optional[str] = None
    profile_picture_url: Optional[str] = None
    availability: Optional[str] = None


class ProviderSettingsUpdate(BaseModel):
    old_password: Optional[str] = None
    new_password: Optional[str] = None
    notification_preferences: Optional[str] = None
    profile_preferences: Optional[str] = None


class ProviderReportCreate(BaseModel):
    patient_id: int
    report_name: str
    report_type: Optional[str] = None
    status: Optional[str] = None
    report_url: Optional[str] = None
    symptoms: Optional[list[str]] = None
    predicted_disease: Optional[str] = None
    confidence_score: Optional[float] = None
    risk_assessment: Optional[str] = None
    provider_status: Optional[str] = None
    provider_comments: Optional[str] = None
    recommendations: Optional[str] = None


class ProviderRecommendationCreate(BaseModel):
    patient_id: int
    recommendation: str
    medicine: Optional[str] = None
    priority: Optional[str] = None
    recommendation_type: Optional[str] = None
    status: Optional[str] = None
    provider_comments: Optional[str] = None


class ProviderRecommendationUpdate(BaseModel):
    recommendation: Optional[str] = None
    medicine: Optional[str] = None
    priority: Optional[str] = None
    recommendation_type: Optional[str] = None
    status: Optional[str] = None
    provider_comments: Optional[str] = None


class RecommendationReviewRequest(BaseModel):
    recommendation_id: int
    recommendation: Optional[str] = None
    medicine: Optional[str] = None
    priority: Optional[str] = None
    recommendation_type: Optional[str] = None
    status: Optional[str] = None
    provider_comments: Optional[str] = None
