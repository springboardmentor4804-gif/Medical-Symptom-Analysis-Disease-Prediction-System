#!/usr/bin/env python3
"""Directly test the evaluate_patient_risk function"""

from app.main import evaluate_patient_risk
from db.connection import SessionLocal
from app.models import PatientProfile, DiseasePrediction, MedicalHistory, PatientSymptom
from sqlalchemy import select

session = SessionLocal()

# Get a patient profile
profile = session.execute(select(PatientProfile)).first()[0]
print(f"Testing with patient profile: ID={profile.id}")

# Get their symptoms
symptoms = session.execute(
    select(PatientSymptom.symptom_name)
    .where(PatientSymptom.patient_id == profile.id)
).scalars().all()
print(f"Symptoms: {symptoms}")

# Get medical history
medical_history = ', '.join([
    str(item.disease or '')
    for item in session.execute(
        select(MedicalHistory).where(MedicalHistory.patient_id == profile.id)
    ).scalars().all()
])
print(f"Medical history: {medical_history}")

# Get predicted disease
predicted_disease = session.execute(
    select(DiseasePrediction.predicted_disease)
    .where(DiseasePrediction.patient_id == profile.id)
    .order_by(DiseasePrediction.prediction_date.desc())
).scalar_one_or_none() or ''
print(f"Predicted disease: {predicted_disease}")

# Test the function
print("\nCalling evaluate_patient_risk...")
try:
    result = evaluate_patient_risk(
        profile=profile,
        symptoms=symptoms,
        predicted_disease=predicted_disease,
        medical_history=medical_history,
        lifestyle={'smoking': 'no', 'alcohol': 'no', 'exercise': 'low'}
    )
    print("✓ Function executed successfully")
    print(f"Result: {result}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

session.close()
