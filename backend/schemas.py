from pydantic import BaseModel, EmailStr


# ---------------- USERS ----------------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ---------------- SYMPTOMS ----------------

class SymptomCreate(BaseModel):
    user_id: int
    symptoms: str
    medical_history: str


# ---------------- MEDICAL HISTORY ----------------

class MedicalHistoryCreate(BaseModel):
    user_id: int
    medical_history: str

# ---------------- PATIENT PROFILE ----------------

class PatientProfileCreate(BaseModel):
    user_id: int
    age: int
    gender: str
    blood_group: str