from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class SymptomCreate(BaseModel):
    symptom_name: Optional[str] = None
    symptom_names: Optional[List[str]] = None
    occurrence_count: Optional[int] = Field(1, ge=1, le=100, description="How many times the symptom has occurred")
    duration_onset: Optional[str] = Field("Just today", description="Duration / onset (e.g. Just today, 1-3 days, Past week, Chronic)")

class SymptomUpdate(BaseModel):
    symptom_name: str = Field(..., min_length=1, description="Updated symptom description")
    occurrence_count: Optional[int] = Field(1, ge=1, le=100)
    duration_onset: Optional[str] = Field("Just today")

class SymptomResponse(BaseModel):
    id: int
    patient_id: int
    symptom_name: str
    occurrence_count: int = 1
    duration_onset: Optional[str] = "Just today"
    submitted_at: datetime

    class Config:
        from_attributes = True
