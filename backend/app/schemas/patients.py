from pydantic import BaseModel, Field
from typing import Optional

class PatientUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=150)
    gender: str = Field(..., min_length=1)
    medical_history: Optional[str] = None

class PatientResponse(BaseModel):
    id: int
    user_id: int
    name: str
    age: int
    gender: str
    medical_history: Optional[str] = None
    email: str

    class Config:
        from_attributes = True

class SymptomItem(BaseModel):
    id: int
    symptom_name: str
    submitted_at: str

class PatientReportResponse(BaseModel):
    report_id: str
    generated_at: str
    patient: PatientResponse
    symptoms: list[SymptomItem]
    total_symptoms: int
    health_status_summary: str
    ai_prediction: Optional[dict] = None

