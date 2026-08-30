from sqlalchemy import Column, Integer, String
from app.database import Base

class SymptomDiseaseReference(Base):
    __tablename__ = "symptom_disease_reference"

    id = Column(Integer, primary_key=True, index=True)
    symptom = Column(String, nullable=True)
    disease = Column(String, nullable=False)
    
    # Extra columns present in the Kaggle CSV
    fever = Column(String, nullable=True)
    cough = Column(String, nullable=True)
    fatigue = Column(String, nullable=True)
    difficulty_breathing = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    blood_pressure = Column(String, nullable=True)
    cholesterol_level = Column(String, nullable=True)
    outcome_variable = Column(String, nullable=True)
