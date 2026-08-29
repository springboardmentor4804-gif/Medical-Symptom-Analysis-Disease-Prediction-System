
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import re
import joblib

import models
import schemas

from database import Base, engine, get_db


# ============================================================
# LOAD MACHINE LEARNING MODEL
# ============================================================

disease_model = joblib.load("disease_model.pkl")
disease_features = joblib.load("disease_features.pkl")


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="MedAssist AI API",
    description="AI-powered healthcare recommendation and disease prediction API",
    version="4.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HEALTHCARE RECOMMENDATION ENGINE
# ============================================================

recommendation_map = {

    "diabetes": {
        "risk": "Moderate",
        "treatment": (
            "A healthcare professional may recommend blood glucose "
            "testing, dietary management, regular physical activity "
            "and appropriate clinical follow-up. Medication decisions "
            "should be made only after professional evaluation."
        ),
        "advisory": (
            "Maintain regular meals, stay adequately hydrated and "
            "follow any blood glucose monitoring plan provided by "
            "your healthcare professional."
        ),
        "recommendation": (
            "Discuss blood glucose testing and diabetes risk with "
            "a healthcare professional, especially if excessive thirst, "
            "frequent urination, fatigue or unexplained changes in "
            "health continue."
        )
    },

    "hypertension": {
        "risk": "Moderate",
        "treatment": (
            "Regular blood pressure monitoring and lifestyle "
            "management may be recommended. A healthcare professional "
            "will determine whether further testing or medication "
            "is appropriate."
        ),
        "advisory": (
            "Maintain a balanced lifestyle, remain physically active "
            "as appropriate and avoid excessive dietary salt. Monitor "
            "blood pressure according to professional guidance."
        ),
        "recommendation": (
            "Check blood pressure regularly and discuss persistent "
            "elevated readings with a healthcare professional."
        )
    },

    "heart disease": {
        "risk": "High",
        "treatment": (
            "Professional cardiovascular evaluation is recommended. "
            "Further testing and treatment should be determined by "
            "a qualified healthcare professional."
        ),
        "advisory": (
            "Pay attention to persistent chest discomfort, breathlessness, "
            "unusual fatigue or palpitations and discuss these symptoms "
            "with a healthcare professional."
        ),
        "recommendation": (
            "The prediction indicates a potentially significant "
            "cardiovascular condition. Arrange professional medical "
            "evaluation rather than relying on the AI prediction alone."
        )
    },

    "asthma": {
        "risk": "Moderate",
        "treatment": (
            "A healthcare professional can evaluate breathing symptoms "
            "and determine whether lung-function testing or an "
            "appropriate management plan is required."
        ),
        "advisory": (
            "Avoid known environmental triggers where possible and "
            "follow any existing asthma management plan provided by "
            "a healthcare professional."
        ),
        "recommendation": (
            "If coughing, wheezing or breathing difficulty continues, "
            "discuss the symptoms with a healthcare professional "
            "for proper evaluation."
        )
    },

    "migraine": {
        "risk": "Low",
        "treatment": (
            "Frequent, severe, unusual or worsening headaches should "
            "be evaluated by a healthcare professional."
        ),
        "advisory": (
            "Regular sleep, adequate hydration and identifying possible "
            "headache triggers may be helpful."
        ),
        "recommendation": (
            "Keep track of headache frequency and possible triggers. "
            "Seek professional evaluation if headaches become frequent, "
            "severe or different from usual."
        )
    },

    "common cold": {
        "risk": "Low",
        "treatment": (
            "Most uncomplicated cold symptoms can be monitored with "
            "rest and adequate fluid intake. Professional evaluation "
            "is appropriate if symptoms persist or worsen."
        ),
        "advisory": (
            "Get adequate rest, maintain hydration and monitor the "
            "progression of symptoms."
        ),
        "recommendation": (
            "Continue monitoring symptoms and allow adequate time "
            "for recovery. Seek professional advice if symptoms "
            "worsen or do not improve."
        )
    },

    "flu": {
        "risk": "Moderate",
        "treatment": (
            "Monitor symptoms and consult a healthcare professional "
            "if symptoms become severe, persistent or progressively worse."
        ),
        "advisory": (
            "Rest adequately, maintain hydration and monitor temperature "
            "and other symptoms."
        ),
        "recommendation": (
            "Monitor the illness closely and discuss persistent or "
            "worsening symptoms with a healthcare professional."
        )
    },

    "pneumonia": {
        "risk": "High",
        "treatment": (
            "Professional medical evaluation is recommended because "
            "pneumonia may require specific clinical assessment and "
            "treatment."
        ),
        "advisory": (
            "Monitor breathing and overall condition carefully. "
            "Worsening breathing difficulty or significant deterioration "
            "requires prompt medical attention."
        ),
        "recommendation": (
            "Arrange professional medical evaluation rather than relying "
            "only on the AI prediction."
        )
    },

    "malaria": {
        "risk": "High",
        "treatment": (
            "Prompt professional medical evaluation is recommended "
            "because malaria requires appropriate diagnostic testing "
            "and treatment."
        ),
        "advisory": (
            "Monitor fever and other symptoms closely and maintain "
            "adequate fluid intake while seeking appropriate medical care."
        ),
        "recommendation": (
            "Discuss the symptoms and prediction with a healthcare "
            "professional and obtain appropriate diagnostic testing."
        )
    },

    "dengue": {
        "risk": "High",
        "treatment": (
            "Professional medical evaluation and appropriate clinical "
            "testing are recommended. Treatment decisions should be "
            "made by a healthcare professional."
        ),
        "advisory": (
            "Maintain adequate hydration and monitor symptoms carefully. "
            "Worsening symptoms should be assessed by a healthcare professional."
        ),
        "recommendation": (
            "Discuss the symptoms and AI prediction with a healthcare "
            "professional and obtain appropriate diagnostic testing."
        )
    },

    "typhoid": {
        "risk": "High",
        "treatment": (
            "Professional medical evaluation and appropriate diagnostic "
            "testing are recommended. Any treatment should be determined "
            "by a qualified healthcare professional."
        ),
        "advisory": (
            "Maintain hydration and monitor fever, weakness and digestive "
            "symptoms while seeking appropriate medical evaluation."
        ),
        "recommendation": (
            "Discuss the prediction with a healthcare professional "
            "because typhoid requires proper clinical evaluation and confirmation."
        )
    },

    "fungal infection": {
        "risk": "Low",
        "treatment": (
            "A healthcare professional can evaluate the affected area "
            "and determine the appropriate treatment based on the type "
            "and severity of the infection."
        ),
        "advisory": (
            "Keep affected areas clean and dry and avoid sharing personal "
            "items such as towels until the condition has been evaluated."
        ),
        "recommendation": (
            "Consider professional evaluation if the skin changes persist, "
            "spread or become uncomfortable."
        )
    },

    "allergy": {
        "risk": "Low",
        "treatment": (
            "Treatment depends on the suspected trigger and severity. "
            "A healthcare professional can help identify possible "
            "triggers and appropriate management."
        ),
        "advisory": (
            "Try to identify and avoid known triggers where possible "
            "and monitor whether symptoms change."
        ),
        "recommendation": (
            "Discuss persistent or recurring allergic symptoms with "
            "a healthcare professional to identify possible triggers."
        )
    },

    "gerd": {
        "risk": "Moderate",
        "treatment": (
            "A healthcare professional can evaluate recurring digestive "
            "symptoms and determine whether further assessment or "
            "treatment is appropriate."
        ),
        "advisory": (
            "Avoid large meals and note whether particular foods appear "
            "to trigger symptoms. Avoid lying down immediately after eating."
        ),
        "recommendation": (
            "Discuss recurring heartburn, acid reflux or swallowing "
            "difficulty with a healthcare professional."
        )
    },

    "gastroesophageal reflux disease": {
        "risk": "Moderate",
        "treatment": (
            "A healthcare professional can evaluate recurring reflux "
            "symptoms and recommend an appropriate management plan."
        ),
        "advisory": (
            "Monitor foods and habits that appear to trigger symptoms "
            "and avoid lying down immediately after meals."
        ),
        "recommendation": (
            "Seek professional evaluation if reflux symptoms are frequent "
            "or persistent."
        )
    },

    "peptic ulcer disease": {
        "risk": "Moderate",
        "treatment": (
            "Professional evaluation may be required to determine the "
            "cause of persistent stomach discomfort and the appropriate "
            "treatment."
        ),
        "advisory": (
            "Monitor abdominal symptoms and discuss persistent pain or "
            "digestive changes with a healthcare professional."
        ),
        "recommendation": (
            "Persistent stomach pain or digestive symptoms should be "
            "evaluated by a healthcare professional."
        )
    },

    "chronic cholestasis": {
        "risk": "Moderate",
        "treatment": (
            "Professional medical evaluation is recommended to assess "
            "liver and bile-flow related symptoms."
        ),
        "advisory": (
            "Monitor changes in skin or eye color, digestion and general "
            "health and maintain appropriate hydration."
        ),
        "recommendation": (
            "Discuss the prediction with a healthcare professional "
            "because liver and bile-related conditions require clinical evaluation."
        )
    },

    "drug reaction": {
        "risk": "Moderate",
        "treatment": (
            "A healthcare professional should evaluate suspected "
            "medication-related reactions and determine appropriate management."
        ),
        "advisory": (
            "Keep a record of recently used medicines and discuss "
            "possible reactions with a healthcare professional."
        ),
        "recommendation": (
            "Seek professional evaluation for suspected medication-related "
            "symptoms, particularly if they are worsening."
        )
    },

    "aids": {
        "risk": "High",
        "treatment": (
            "Professional medical evaluation and appropriate laboratory "
            "testing are required to assess this prediction."
        ),
        "advisory": (
            "Do not rely on an AI prediction for confirmation. Appropriate "
            "clinical testing should be performed by a healthcare professional."
        ),
        "recommendation": (
            "Arrange professional medical evaluation and appropriate "
            "diagnostic testing rather than relying on the AI prediction."
        )
    },

    "hepatitis": {
        "risk": "High",
        "treatment": (
            "Professional evaluation and appropriate laboratory testing "
            "may be required to determine the underlying cause and treatment."
        ),
        "advisory": (
            "Monitor symptoms and discuss persistent fatigue, abdominal "
            "discomfort or changes in skin or eye color with a healthcare professional."
        ),
        "recommendation": (
            "A healthcare professional should evaluate the prediction "
            "and determine whether liver-related testing is appropriate."
        )
    },

    "hepatitis a": {
        "risk": "Moderate",
        "treatment": (
            "Professional medical evaluation and appropriate testing "
            "are recommended to confirm the condition."
        ),
        "advisory": (
            "Maintain hydration and monitor symptoms while seeking "
            "professional medical advice."
        ),
        "recommendation": (
            "Discuss the prediction with a healthcare professional "
            "and obtain appropriate diagnostic confirmation."
        )
    },

    "hepatitis b": {
        "risk": "High",
        "treatment": (
            "Professional medical evaluation and laboratory testing "
            "are recommended to assess the condition."
        ),
        "advisory": (
            "Follow professional medical guidance and monitor overall health."
        ),
        "recommendation": (
            "Seek professional evaluation and appropriate laboratory "
            "testing to confirm or rule out the condition."
        )
    },

    "hepatitis c": {
        "risk": "High",
        "treatment": (
            "Professional medical evaluation and laboratory testing "
            "are recommended to assess the condition."
        ),
        "advisory": (
            "Follow professional medical guidance and complete any "
            "recommended diagnostic testing."
        ),
        "recommendation": (
            "Discuss the prediction with a healthcare professional "
            "and obtain appropriate diagnostic confirmation."
        )
    },

    "heart attack": {
        "risk": "High",
        "treatment": (
            "This prediction requires prompt professional medical "
            "assessment rather than relying on an AI result."
        ),
        "advisory": (
            "Symptoms such as significant chest discomfort, severe "
            "breathlessness or fainting require prompt medical attention."
        ),
        "recommendation": (
            "Seek prompt professional medical assessment if symptoms "
            "suggestive of a serious cardiac problem are present."
        )
    },

    "bronchial asthma": {
        "risk": "Moderate",
        "treatment": (
            "A healthcare professional can evaluate breathing symptoms "
            "and determine the appropriate management plan."
        ),
        "advisory": (
            "Avoid known triggers and follow any existing asthma "
            "management plan provided by a healthcare professional."
        ),
        "recommendation": (
            "Discuss persistent wheezing, coughing or breathing "
            "difficulty with a healthcare professional."
        )
    },

    "tuberculosis": {
        "risk": "High",
        "treatment": (
            "Professional medical evaluation and appropriate diagnostic "
            "testing are required to confirm tuberculosis."
        ),
        "advisory": (
            "Persistent cough, fever, fatigue or other concerning symptoms "
            "should be evaluated by a healthcare professional."
        ),
        "recommendation": (
            "Arrange professional evaluation and appropriate diagnostic "
            "testing rather than relying on the AI prediction alone."
        )
    },

    "urinary tract infection": {
        "risk": "Moderate",
        "treatment": (
            "A healthcare professional can evaluate urinary symptoms "
            "and determine whether diagnostic testing or treatment is needed."
        ),
        "advisory": (
            "Maintain adequate hydration and monitor urinary symptoms."
        ),
        "recommendation": (
            "Discuss persistent burning, frequent urination, discomfort "
            "or fever with a healthcare professional."
        )
    },

    "uti": {
        "risk": "Moderate",
        "treatment": (
            "A healthcare professional can evaluate urinary symptoms "
            "and determine whether testing or treatment is appropriate."
        ),
        "advisory": (
            "Maintain adequate hydration and monitor urinary symptoms."
        ),
        "recommendation": (
            "Seek professional evaluation if urinary symptoms persist "
            "or become worse."
        )
    },

    "gastroenteritis": {
        "risk": "Moderate",
        "treatment": (
            "Management depends on the cause and severity. Professional "
            "evaluation may be appropriate when symptoms are persistent "
            "or significant."
        ),
        "advisory": (
            "Maintain hydration and monitor symptoms carefully."
        ),
        "recommendation": (
            "Seek professional advice if vomiting, diarrhea, fever or "
            "other digestive symptoms are persistent or worsening."
        )
    },

    "food poisoning": {
        "risk": "Moderate",
        "treatment": (
            "Management depends on symptom severity. Professional "
            "evaluation is appropriate if symptoms are severe or persistent."
        ),
        "advisory": (
            "Maintain hydration and monitor for worsening symptoms."
        ),
        "recommendation": (
            "Seek professional medical advice if symptoms are severe, "
            "persistent or associated with significant weakness."
        )
    },

    "thyroid": {
        "risk": "Moderate",
        "treatment": (
            "A healthcare professional can assess thyroid-related symptoms "
            "and determine whether blood tests or other evaluation are appropriate."
        ),
        "advisory": (
            "Keep track of persistent changes in energy, weight, temperature "
            "sensitivity or heart rate and discuss them with a professional."
        ),
        "recommendation": (
            "Consider professional evaluation and appropriate thyroid "
            "testing if symptoms persist."
        )
    }
}


# ============================================================
# DISEASE NAME NORMALIZATION
# ============================================================

def normalize_disease_name(disease):

    if disease is None:
        return ""

    disease_key = str(disease).lower().strip()

    disease_key = disease_key.replace("_", " ")
    disease_key = disease_key.replace("-", " ")

    disease_key = re.sub(r"\s+", " ", disease_key)

    aliases = {
        "heart diseases": "heart disease",
        "diabetes mellitus": "diabetes",
        "type 2 diabetes": "diabetes",
        "type ii diabetes": "diabetes",
        "high blood pressure": "hypertension",
        "high blood pressure disease": "hypertension",
        "bronchial asthma": "asthma",
        "influenza": "flu",
        "urinary tract infections": "urinary tract infection",
        "gastro oesophageal reflux disease": "gastroesophageal reflux disease",
        "gastroesophageal reflux": "gastroesophageal reflux disease"
    }

    return aliases.get(
        disease_key,
        disease_key
    )


# ============================================================
# GENERIC RECOMMENDATION
# ============================================================

def create_generic_recommendation(disease):

    readable_name = str(disease).replace("_", " ").strip()

    return {
        "risk": "Moderate",

        "treatment": (
            f"The AI model predicted {readable_name}. "
            "This is a preliminary prediction and requires clinical "
            "evaluation before any diagnosis or treatment decision "
            "is made."
        ),

        "advisory": (
            "Monitor your symptoms, keep your medical history updated "
            "and note any changes in severity or duration."
        ),

        "recommendation": (
            f"Consider discussing the {readable_name} prediction, "
            "your symptoms and medical history with a qualified "
            "healthcare professional for appropriate evaluation."
        )
    }


# ============================================================
# GENERATE HEALTHCARE RECOMMENDATION
# ============================================================

def generate_recommendation(disease, confidence):

    disease_key = normalize_disease_name(disease)

    information = recommendation_map.get(disease_key)

    if information is None:
        information = create_generic_recommendation(disease)

    return {
        "risk_level": information["risk"],
        "recommendation": information["recommendation"],
        "treatment": information["treatment"],
        "advisory": information["advisory"]
    }


# ============================================================
# HOME / HEALTH CHECK
# ============================================================

@app.get("/")
def home():

    return {
        "message": "MedAssist AI Backend is Running!",
        "version": "4.0.0",
        "status": "healthy"
    }


# ============================================================
# REGISTER
# ============================================================

@app.post("/register")
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(models.User)
        .filter(models.User.email == user.email)
        .first()
    )

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


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(models.User)
        .filter(models.User.email == user.email)
        .first()
    )

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


# ============================================================
# SAVE SYMPTOMS
# ============================================================

@app.post("/save-symptoms")
def save_symptoms(
    data: schemas.SymptomCreate,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.user_id == data.user_id)
        .first()
    )

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


# ============================================================
# SAVE MEDICAL HISTORY
# ============================================================

@app.post("/medical-history")
def save_medical_history(
    data: schemas.MedicalHistoryCreate,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.user_id == data.user_id)
        .first()
    )

    if not patient:

        patient = models.Patient(
            user_id=data.user_id
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

    existing_history = (
        db.query(models.Symptom)
        .filter(models.Symptom.patient_id == patient.id)
        .order_by(models.Symptom.id.desc())
        .first()
    )

    if existing_history:

        existing_history.medical_history = data.medical_history

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


# ============================================================
# GET MEDICAL HISTORY
# ============================================================

@app.get("/medical-history/{user_id}")
def get_medical_history(
    user_id: int,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.user_id == user_id)
        .first()
    )

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
        .order_by(models.Symptom.id.desc())
        .first()
    )

    if not history:
        return {
            "medical_history": ""
        }

    return {
        "medical_history": history.medical_history
    }


# ============================================================
# DISEASE PREDICTION
# ============================================================

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

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.user_id == user_id)
        .first()
    )

    if not patient:

        patient = models.Patient(
            user_id=user_id
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

    # --------------------------------------------------------
    # BUILD ML INPUT
    # --------------------------------------------------------

    input_data = [0] * len(disease_features)

    for symptom in symptoms:

        symptom_clean = str(symptom).strip()

        if symptom_clean in disease_features:

            index = disease_features.index(symptom_clean)
            input_data[index] = 1

        else:

            for index, feature in enumerate(disease_features):

                if (
                    str(feature).lower().strip()
                    == symptom_clean.lower()
                ):

                    input_data[index] = 1
                    break

    # --------------------------------------------------------
    # ML PREDICTION
    # --------------------------------------------------------

    try:

        prediction = disease_model.predict(
            [input_data]
        )[0]

        # THIS IS WHERE predict_proba() IS USED
        probabilities = disease_model.predict_proba(
            [input_data]
        )[0]

        confidence = float(
            max(probabilities) * 100
        )

        print("====================================")
        print("INPUT SYMPTOMS:", symptoms)
        print("PREDICTION:", prediction)
        print("PROBABILITIES:", probabilities)
        print("MAX PROBABILITY:", max(probabilities))
        print("CONFIDENCE:", confidence)
        print("====================================")

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Disease prediction failed: {str(error)}"
        )

    # --------------------------------------------------------
    # RECOMMENDATION ENGINE
    # --------------------------------------------------------

    recommendation_data = generate_recommendation(
        prediction,
        confidence
    )

    # --------------------------------------------------------
    # SAVE SYMPTOMS
    # --------------------------------------------------------

    symptom_record = models.Symptom(
        patient_id=patient.id,
        symptoms=", ".join(
            [str(symptom) for symptom in symptoms]
        ),
        medical_history=""
    )

    db.add(symptom_record)

    # --------------------------------------------------------
    # SAVE PREDICTION
    # --------------------------------------------------------

    saved_prediction = models.Prediction(
        patient_id=patient.id,
        predicted_disease=str(prediction),
        confidence=confidence,
        risk_level=recommendation_data["risk_level"],
        recommendation=recommendation_data["recommendation"]
    )

    db.add(saved_prediction)

    db.commit()
    db.refresh(saved_prediction)

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "message": "Prediction generated and saved successfully.",

        "prediction_id": saved_prediction.id,

        "predicted_disease": str(prediction),

        "confidence": round(
            confidence,
            2
        ),

        "risk_level": recommendation_data["risk_level"],

        "recommendation": recommendation_data["recommendation"],

        "treatment": recommendation_data["treatment"],

        "advisory": recommendation_data["advisory"],

        "created_at": saved_prediction.created_at
    }


# ============================================================
# PREDICTION HISTORY
# ============================================================

@app.get("/prediction-history/{user_id}")
def prediction_history(
    user_id: int,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.user_id == user_id)
        .first()
    )

    if not patient:
        return {
            "history": []
        }

    predictions = (
        db.query(models.Prediction)
        .filter(models.Prediction.patient_id == patient.id)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )

    history = []

    for item in predictions:

        recommendation_data = generate_recommendation(
            item.predicted_disease,
            float(item.confidence)
        )

        history.append({

            "id": item.id,

            "predicted_disease": item.predicted_disease,

            "confidence": round(
                float(item.confidence),
                2
            ),

            "risk_level": recommendation_data["risk_level"],

            "created_at": item.created_at,

            "recommendation": recommendation_data["recommendation"],

            "treatment": recommendation_data["treatment"],

            "advisory": recommendation_data["advisory"]
        })

    return {
        "history": history
    }


# ============================================================
# DELETE PREDICTION
# ============================================================

@app.delete("/prediction-history/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db)
):

    prediction = (
        db.query(models.Prediction)
        .filter(models.Prediction.id == prediction_id)
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


# ============================================================
# GET ALL PATIENTS
# ============================================================

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


# ============================================================
# GET SELECTED PATIENT RECORDS
# ============================================================

@app.get("/patient-records/{patient_id}")
def get_patient_records(
    patient_id: int,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.id == patient_id)
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found."
        )

    user = (
        db.query(models.User)
        .filter(models.User.id == patient.user_id)
        .first()
    )

    symptom_records = (
        db.query(models.Symptom)
        .filter(models.Symptom.patient_id == patient.id)
        .order_by(models.Symptom.id.desc())
        .all()
    )

    medical_history = ""
    latest_symptoms = ""

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

    predictions = (
        db.query(models.Prediction)
        .filter(models.Prediction.patient_id == patient.id)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )

    prediction_history = []

    for prediction in predictions:

        recommendation_data = generate_recommendation(
            prediction.predicted_disease,
            float(prediction.confidence)
        )

        prediction_history.append({

            "id": prediction.id,

            "predicted_disease": prediction.predicted_disease,

            "confidence": round(
                float(prediction.confidence),
                2
            ),

            "risk_level": recommendation_data["risk_level"],

            "recommendation": recommendation_data["recommendation"],

            "treatment": recommendation_data["treatment"],

            "advisory": recommendation_data["advisory"],

            "created_at": prediction.created_at
        })

    return {

        "patient": {

            "patient_id": patient.id,

            "user_id": patient.user_id,

            "name": (
                user.name
                if user
                else "Unknown"
            ),

            "email": (
                user.email
                if user
                else ""
            ),

            "age": patient.age,

            "gender": patient.gender,

            "blood_group": patient.blood_group
        },

        "medical_history": medical_history,

        "latest_symptoms": latest_symptoms,

        "prediction_history": prediction_history
    }


# ============================================================
# SAVE / UPDATE PATIENT PROFILE
# ============================================================

@app.post("/patient-profile")
def save_patient_profile(
    data: schemas.PatientProfileCreate,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.user_id == data.user_id)
        .first()
    )

    if not patient:

        patient = models.Patient(
            user_id=data.user_id
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

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


# ============================================================
# GET PATIENT PROFILE
# ============================================================

@app.get("/patient-profile/{user_id}")
def get_patient_profile(
    user_id: int,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.user_id == user_id)
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


# ============================================================
# HEALTHCARE ANALYTICS
# ============================================================

@app.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db)
):

    total_patients = (
        db.query(models.Patient).count()
    )

    total_predictions = (
        db.query(models.Prediction).count()
    )

    high_risk_cases = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level.ilike("%high%")
        )
        .count()
    )

    moderate_risk_cases = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level.ilike("%moderate%")
        )
        .count()
    )

    low_risk_cases = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level.ilike("%low%")
        )
        .count()
    )

    needs_review_cases = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level.ilike("%review%")
        )
        .count()
    )

    disease_results = (
        db.query(
            models.Prediction.predicted_disease,
            func.count(models.Prediction.id)
        )
        .group_by(
            models.Prediction.predicted_disease
        )
        .order_by(
            func.count(models.Prediction.id).desc()
        )
        .all()
    )

    disease_distribution = []

    for disease, count in disease_results:

        disease_distribution.append({

            "disease": disease,

            "count": count
        })

    average_confidence = (
        db.query(
            func.avg(models.Prediction.confidence)
        )
        .scalar()
    )

    if average_confidence is None:
        average_confidence = 0

    average_confidence = round(
        float(average_confidence),
        2
    )

    recent_predictions = (
        db.query(models.Prediction)
        .order_by(
            models.Prediction.created_at.desc()
        )
        .limit(10)
        .all()
    )

    recent = []

    for prediction in recent_predictions:

        patient = (
            db.query(models.Patient)
            .filter(
                models.Patient.id == prediction.patient_id
            )
            .first()
        )

        user = None

        if patient:

            user = (
                db.query(models.User)
                .filter(
                    models.User.id == patient.user_id
                )
                .first()
            )

        recommendation_data = generate_recommendation(
            prediction.predicted_disease,
            float(prediction.confidence)
        )

        recent.append({

            "id": prediction.id,

            "patient_id": (
                patient.id
                if patient
                else None
            ),

            "patient_name": (
                user.name
                if user
                else "Unknown"
            ),

            "disease": prediction.predicted_disease,

            "confidence": round(
                float(prediction.confidence),
                2
            ),

            "risk_level": recommendation_data["risk_level"],

            "created_at": prediction.created_at
        })

    return {

        "total_patients": total_patients,

        "total_predictions": total_predictions,

        "high_risk_cases": high_risk_cases,

        "moderate_risk_cases": moderate_risk_cases,

        "low_risk_cases": low_risk_cases,

        "needs_review_cases": needs_review_cases,

        "average_confidence": average_confidence,

        "risk_distribution": {

            "high": high_risk_cases,

            "moderate": moderate_risk_cases,

            "low": low_risk_cases,

            "needs_review": needs_review_cases
        },

        "disease_distribution": disease_distribution,

        "recent_predictions": recent
    }


# ============================================================
# HEALTH TRENDS
# ============================================================

@app.get("/health-trends/{user_id}")
def get_health_trends(
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

            "user_id": user_id,

            "total_predictions": 0,

            "average_confidence": 0,

            "latest_prediction": None,

            "trends": []
        }

    predictions = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.patient_id == patient.id
        )
        .order_by(
            models.Prediction.created_at.asc()
        )
        .all()
    )

    trends = []

    for prediction in predictions:

        recommendation_data = generate_recommendation(
            prediction.predicted_disease,
            float(prediction.confidence)
        )

        trends.append({

            "id": prediction.id,

            "date": prediction.created_at,

            "disease": prediction.predicted_disease,

            "confidence": round(
                float(prediction.confidence),
                2
            ),

            "risk_level": recommendation_data["risk_level"]
        })

    average_confidence = 0

    if trends:

        average_confidence = round(

            sum(
                item["confidence"]
                for item in trends
            ) / len(trends),

            2
        )

    latest_prediction = (
        trends[-1]
        if trends
        else None
    )

    return {

        "user_id": user_id,

        "total_predictions": len(trends),

        "average_confidence": average_confidence,

        "latest_prediction": latest_prediction,

        "trends": trends
    }


# ============================================================
# DISEASE PREDICTION REPORT
# ============================================================

@app.get("/prediction-report/{prediction_id}")
def get_prediction_report(
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

    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.id == prediction.patient_id
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found."
        )

    user = (
        db.query(models.User)
        .filter(
            models.User.id == patient.user_id
        )
        .first()
    )

    latest_symptom = (
        db.query(models.Symptom)
        .filter(
            models.Symptom.patient_id == patient.id,
            models.Symptom.symptoms.isnot(None),
            models.Symptom.symptoms != ""
        )
        .order_by(
            models.Symptom.id.desc()
        )
        .first()
    )

    latest_history = (
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

    recommendation_data = generate_recommendation(
        prediction.predicted_disease,
        float(prediction.confidence)
    )

    return {

        "report": {

            "report_id": prediction.id,

            "generated_at": datetime.now(),

            "patient": {

                "patient_id": patient.id,

                "name": (
                    user.name
                    if user
                    else "Unknown"
                ),

                "email": (
                    user.email
                    if user
                    else ""
                ),

                "age": patient.age,

                "gender": patient.gender,

                "blood_group": patient.blood_group
            },

            "clinical_information": {

                "symptoms": (
                    latest_symptom.symptoms
                    if latest_symptom
                    else ""
                ),

                "medical_history": (
                    latest_history.medical_history
                    if latest_history
                    else ""
                )
            },

            "prediction": {

                "disease": prediction.predicted_disease,

                "confidence": round(
                    float(prediction.confidence),
                    2
                ),

                "risk_level": recommendation_data["risk_level"],

                "prediction_date": prediction.created_at
            },

            "treatment": recommendation_data["treatment"],

            "advisory": recommendation_data["advisory"],

            "recommendation": recommendation_data["recommendation"],

            "disclaimer": (
                "This report contains an AI-generated preliminary "
                "prediction based on the symptoms provided. It is not "
                "a confirmed medical diagnosis and should not replace "
                "professional medical evaluation, diagnosis or treatment."
            )
        }
    }


# ============================================================
# DOCTOR ANALYTICS
# ============================================================

@app.get("/doctor-analytics")
def doctor_analytics(
    db: Session = Depends(get_db)
):

    total_patients = (
        db.query(models.Patient).count()
    )

    total_predictions = (
        db.query(models.Prediction).count()
    )

    high_risk = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level.ilike("%high%")
        )
        .count()
    )

    moderate_risk = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level.ilike("%moderate%")
        )
        .count()
    )

    low_risk = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level.ilike("%low%")
        )
        .count()
    )

    needs_review = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level.ilike("%review%")
        )
        .count()
    )

    average_confidence = (
        db.query(
            func.avg(models.Prediction.confidence)
        )
        .scalar()
    )

    if average_confidence is None:
        average_confidence = 0

    average_confidence = round(
        float(average_confidence),
        2
    )

    recent_predictions = (
        db.query(models.Prediction)
        .order_by(
            models.Prediction.created_at.desc()
        )
        .limit(10)
        .all()
    )

    recent = []

    for prediction in recent_predictions:

        patient = (
            db.query(models.Patient)
            .filter(
                models.Patient.id == prediction.patient_id
            )
            .first()
        )

        user = None

        if patient:

            user = (
                db.query(models.User)
                .filter(
                    models.User.id == patient.user_id
                )
                .first()
            )

        recommendation_data = generate_recommendation(
            prediction.predicted_disease,
            float(prediction.confidence)
        )

        recent.append({

            "id": prediction.id,

            "patient_id": (
                patient.id
                if patient
                else None
            ),

            "patient_name": (
                user.name
                if user
                else "Unknown"
            ),

            "disease": prediction.predicted_disease,

            "confidence": round(
                float(prediction.confidence),
                2
            ),

            "risk_level": recommendation_data["risk_level"],

            "recommendation": recommendation_data["recommendation"],

            "treatment": recommendation_data["treatment"],

            "advisory": recommendation_data["advisory"],

            "created_at": prediction.created_at
        })

    return {

        "total_patients": total_patients,

        "total_predictions": total_predictions,

        "high_risk_cases": high_risk,

        "moderate_risk_cases": moderate_risk,

        "low_risk_cases": low_risk,

        "needs_review_cases": needs_review,

        "average_confidence": average_confidence,

        "risk_distribution": {

            "high": high_risk,

            "moderate": moderate_risk,

            "low": low_risk,

            "needs_review": needs_review
        },

        "recent_predictions": recent
    }

