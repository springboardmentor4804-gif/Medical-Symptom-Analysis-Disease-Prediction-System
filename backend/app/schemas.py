from pydantic import BaseModel


class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "patient"


class CaretakerSelection(BaseModel):
    caretaker_user_id: int




class PatientRiskAssessmentRequest(BaseModel):

    fever: str

    cough: str

    fatigue: str

    difficulty_breathing: str

    age: int

    gender: str

    blood_pressure: str

    cholesterol_level: str