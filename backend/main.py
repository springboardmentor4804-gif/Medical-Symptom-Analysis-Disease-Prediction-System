from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
import joblib

from database import Base, engine, get_db


# =========================================
# LOAD MODEL
# =========================================

disease_model = joblib.load("disease_model.pkl")
disease_features = joblib.load("disease_features.pkl")


# =========================================
# CREATE DATABASE TABLES
# =========================================

Base.metadata.create_all(bind=engine)


# =========================================
# FASTAPI
# =========================================

app = FastAPI(title="MedAssist AI API")


# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================
# HOME
# =========================================

@app.get("/")
def home():
    return {
        "message": "MedAssist AI Backend is Running!"
    }


# =========================================
# REGISTER
# =========================================

@app.post("/register")
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password=user.password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration Successful",
        "user_id": new_user.id
    }


# =========================================
# LOGIN
# =========================================

@app.post("/login")
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    if existing_user.password != user.password:
        raise HTTPException(
            status_code=401,
            detail="Incorrect password."
        )

    return {
        "message": "Login Successful",
        "id": existing_user.id,
        "name": existing_user.name,
        "email": existing_user.email,
        "role": existing_user.role
    }


# =========================================
# SAVE SYMPTOMS
# =========================================

@app.post("/save-symptoms")
def save_symptoms(
    data: schemas.SymptomCreate,
    db: Session = Depends(get_db)
):

    patient = db.query(models.Patient).filter(
        models.Patient.user_id == data.user_id
    ).first()

    if not patient:

        patient = models.Patient(
            user_id=data.user_id
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

    symptom = models.Symptom(
        patient_id=patient.id,
        symptoms=data.symptoms,
        medical_history=data.medical_history
    )

    db.add(symptom)
    db.commit()

    return {
        "message": "Symptoms saved successfully."
    }


# =========================================
# SAVE MEDICAL HISTORY
# =========================================

@app.post("/medical-history")
def save_medical_history(
    data: schemas.MedicalHistoryCreate,
    db: Session = Depends(get_db)
):

    patient = db.query(models.Patient).filter(
        models.Patient.user_id == data.user_id
    ).first()

    if not patient:

        patient = models.Patient(
            user_id=data.user_id
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

    existing_history = (
        db.query(models.Symptom)
        .filter(
            models.Symptom.patient_id == patient.id
        )
        .order_by(
            models.Symptom.id.desc()
        )
        .first()
    )

    if existing_history:

        existing_history.medical_history = (
            data.medical_history
        )

    else:

        new_history = models.Symptom(
            patient_id=patient.id,
            symptoms="",
            medical_history=data.medical_history
        )

        db.add(new_history)

    db.commit()

    return {
        "message": "Medical history saved successfully."
    }


# =========================================
# GET MEDICAL HISTORY
# =========================================

@app.get("/medical-history/{user_id}")
def get_medical_history(
    user_id: int,
    db: Session = Depends(get_db)
):

    patient = db.query(models.Patient).filter(
        models.Patient.user_id == user_id
    ).first()

    if not patient:
        return {
            "medical_history": ""
        }

    history = (
        db.query(models.Symptom)
        .filter(
            models.Symptom.patient_id == patient.id,
            models.Symptom.medical_history.isnot(None),
            models.Symptom.medical_history != ""
        )
        .order_by(
            models.Symptom.id.desc()
        )
        .first()
    )

    if not history:
        return {
            "medical_history": ""
        }

    return {
        "medical_history": history.medical_history
    }


# =========================================
# PREDICT DISEASE
# =========================================

@app.post("/predict-disease")
def predict_disease(
    data: dict,
    db: Session = Depends(get_db)
):

    symptoms = data.get("symptoms", [])
    user_id = data.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required."
        )

    if not symptoms:
        raise HTTPException(
            status_code=400,
            detail="Please select at least one symptom."
        )

    # -----------------------------------------
    # FIND / CREATE PATIENT
    # -----------------------------------------

    patient = db.query(models.Patient).filter(
        models.Patient.user_id == user_id
    ).first()

    if not patient:

        patient = models.Patient(
            user_id=user_id
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

    # -----------------------------------------
    # PREPARE FEATURES
    # -----------------------------------------

    input_data = [0] * len(disease_features)

    for symptom in symptoms:

        if symptom in disease_features:

            index = disease_features.index(symptom)

            input_data[index] = 1

    # -----------------------------------------
    # MODEL PREDICTION
    # -----------------------------------------

    prediction = disease_model.predict(
        [input_data]
    )[0]

    probabilities = disease_model.predict_proba(
        [input_data]
    )[0]

    confidence = max(probabilities) * 100

    # -----------------------------------------
    # RECOMMENDATION
    # -----------------------------------------

    recommendation = (
        "This is an AI-generated prediction. "
        "Please consult a qualified healthcare professional "
        "for proper diagnosis and medical advice."
    )

    # -----------------------------------------
    # SAVE PREDICTION
    # -----------------------------------------

    saved_prediction = models.Prediction(
        patient_id=patient.id,
        predicted_disease=str(prediction),
        confidence=float(confidence),
        risk_level="AI Prediction",
        recommendation=recommendation
    )

    db.add(saved_prediction)
    db.commit()
    db.refresh(saved_prediction)

    # -----------------------------------------
    # RETURN RESULT
    # -----------------------------------------

    return {
        "message": "Prediction generated and saved successfully.",
        "prediction_id": saved_prediction.id,
        "predicted_disease": str(prediction),
        "confidence": round(float(confidence), 2),
        "risk_level": "AI Prediction",
        "recommendation": recommendation,
        "created_at": saved_prediction.created_at
    }


# =========================================
# PREDICTION HISTORY
# =========================================

@app.get("/prediction-history/{user_id}")
def prediction_history(
    user_id: int,
    db: Session = Depends(get_db)
):

    patient = db.query(models.Patient).filter(
        models.Patient.user_id == user_id
    ).first()

    if not patient:

        return {
            "history": []
        }

    predictions = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.patient_id == patient.id
        )
        .order_by(
            models.Prediction.created_at.desc()
        )
        .all()
    )

    history = []

    for item in predictions:

        history.append({
            "id": item.id,
            "predicted_disease": item.predicted_disease,
            "confidence": item.confidence,
            "risk_level": item.risk_level,
            "created_at": item.created_at,
            "recommendation": item.recommendation
        })

    return {
        "history": history
    }
# =========================================
# DELETE PREDICTION HISTORY
# =========================================

@app.delete("/prediction-history/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db)
):

    prediction = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.id == prediction_id
        )
        .first()
    )

    if not prediction:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found."
        )

    db.delete(prediction)
    db.commit()

    return {
        "message": "Prediction deleted successfully."
    }


# =========================================
# GET ALL PATIENTS
# =========================================

@app.get("/patients")
def get_patients(
    db: Session = Depends(get_db)
):

    patients = (
        db.query(models.Patient, models.User)
        .join(
            models.User,
            models.Patient.user_id == models.User.id
        )
        .filter(
            models.User.role.ilike("patient")
        )
        .all()
    )

    result = []

    for patient, user in patients:

        result.append({
            "patient_id": patient.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "age": patient.age,
            "gender": patient.gender,
            "blood_group": patient.blood_group
        })

    return {
        "patients": result
    }
# =========================================
# GET SELECTED PATIENT RECORDS
# =========================================

@app.get("/patient-records/{patient_id}")
def get_patient_records(
    patient_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------
    # FIND PATIENT
    # -----------------------------------------

    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.id == patient_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found."
        )

    # -----------------------------------------
    # GET USER DETAILS
    # -----------------------------------------

    user = (
        db.query(models.User)
        .filter(
            models.User.id == patient.user_id
        )
        .first()
    )

    # -----------------------------------------
    # GET MEDICAL HISTORY / SYMPTOMS
    # -----------------------------------------

    symptom_records = (
        db.query(models.Symptom)
        .filter(
            models.Symptom.patient_id == patient.id
        )
        .order_by(
            models.Symptom.id.desc()
        )
        .all()
    )

    medical_history = ""

    latest_symptoms = ""

    if symptom_records:

        for record in symptom_records:

            if (
                not medical_history
                and record.medical_history
            ):
                medical_history = record.medical_history

            if (
                not latest_symptoms
                and record.symptoms
            ):
                latest_symptoms = record.symptoms

            if medical_history and latest_symptoms:
                break

    # -----------------------------------------
    # GET PREDICTION HISTORY
    # -----------------------------------------

    predictions = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.patient_id == patient.id
        )
        .order_by(
            models.Prediction.created_at.desc()
        )
        .all()
    )

    prediction_history = []

    for prediction in predictions:

        prediction_history.append({
            "id": prediction.id,
            "predicted_disease": prediction.predicted_disease,
            "confidence": prediction.confidence,
            "risk_level": prediction.risk_level,
            "recommendation": prediction.recommendation,
            "created_at": prediction.created_at
        })

    # -----------------------------------------
    # RETURN PATIENT RECORD
    # -----------------------------------------

    return {
        "patient": {
            "patient_id": patient.id,
            "user_id": patient.user_id,
            "name": user.name if user else "Unknown",
            "email": user.email if user else "",
            "age": patient.age,
            "gender": patient.gender,
            "blood_group": patient.blood_group
        },

        "medical_history": medical_history,

        "latest_symptoms": latest_symptoms,

        "prediction_history": prediction_history
    }
# =========================================
# SAVE / UPDATE PATIENT PROFILE
# =========================================

@app.post("/patient-profile")
def save_patient_profile(
    data: schemas.PatientProfileCreate,
    db: Session = Depends(get_db)
):

    # Find patient
    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.user_id == data.user_id
        )
        .first()
    )

    # Create patient if it doesn't exist
    if not patient:

        patient = models.Patient(
            user_id=data.user_id
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

    # Update profile
    patient.age = data.age
    patient.gender = data.gender
    patient.blood_group = data.blood_group

    db.commit()
    db.refresh(patient)

    return {
        "message": "Patient profile saved successfully.",
        "patient": {
            "patient_id": patient.id,
            "user_id": patient.user_id,
            "age": patient.age,
            "gender": patient.gender,
            "blood_group": patient.blood_group
        }
    }
# =========================================
# GET PATIENT PROFILE
# =========================================

@app.get("/patient-profile/{user_id}")
def get_patient_profile(
    user_id: int,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.user_id == user_id
        )
        .first()
    )

    if not patient:
        return {
            "profile": {
                "age": None,
                "gender": "",
                "blood_group": ""
            }
        }

    return {
        "profile": {
            "patient_id": patient.id,
            "user_id": patient.user_id,
            "age": patient.age,
            "gender": patient.gender or "",
            "blood_group": patient.blood_group or ""
        }
    }