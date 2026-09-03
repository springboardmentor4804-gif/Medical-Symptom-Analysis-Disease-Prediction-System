from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from pydantic import BaseModel, Field

import pickle
import joblib
import pandas as pd
import csv
import shutil
import os
import sqlite3

from datetime import datetime

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from database import conn, cursor
from disease_info import disease_info, recommendation_data


print("THIS IS MY MAIN.PY")
def get_db():
    return sqlite3.connect(
        "medassist.db",
        timeout=10
    )


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI()


# ============================================================
# LOAD DATASET
# ============================================================

df = pd.read_csv("data/Training.csv")

# Remove unnecessary column if it exists
df = df.drop(columns=["Unnamed: 133"], errors="ignore")

# All columns except prognosis are symptoms
symptoms_list = list(df.columns[:-1])

print("Number of symptoms:", len(symptoms_list))


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.104:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD MODELS
# ============================================================

model_data = pickle.load(open("model.pkl", "rb"))
model = model_data["model"]

risk_model = joblib.load("risk_model.pkl")


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "MedAssist AI Backend Running"
    }


# ============================================================
# DATASET INFORMATION
# ============================================================

@app.get("/dataset")
def dataset_info():
    return {
        "Rows": len(df),
        "Columns": len(df.columns),
        "Diseases": df["prognosis"].nunique()
    }


# ============================================================
# GET DISEASES
# ============================================================

@app.get("/diseases")
def get_diseases():
    return {
        "diseases": [
            disease.strip()
            for disease in df["prognosis"].unique()
        ]
    }


# ============================================================
# REQUEST MODELS
# ============================================================

class SymptomRequest(BaseModel):
    patient_name: str
    symptoms: list[str]


class ReportRequest(BaseModel):
    patient_name: str
    symptoms: list[str]


class RiskAssessmentRequest(BaseModel):
    GENHLTH: float
    PHYSHLTH: float
    MENTHLTH: float
    CVDINFR4: float
    CVDSTRK3: float
    DIABETE4: float
    ASTHMA3: float
    CHCCOPD3: float
    CHCKDNY2: float
    HAVARTH4: float
    SMOKE100: float
    EXERANY2: float

    bmi5: float = Field(alias="_BMI5")
    age_g: float = Field(alias="_AGE_G")
    sex: float = Field(alias="_SEX")


class RegisterRequest(BaseModel):
    fullname: str
    age: int
    gender: str
    phone: str
    email: str
    password: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str


class AppointmentRequest(BaseModel):
    patient_name: str
    doctor_name: str
    appointment_date: str
    appointment_time: str
    consultation_type: str
    reason: str

class MedicalHistoryRequest(BaseModel):

    patient_name: str

    allergies: str = ""

    medications: str = ""

    previous_treatments: str = ""

# ============================================================
# SAVE / UPDATE MEDICAL HISTORY
# ============================================================

@app.post("/medical-history")
def save_medical_history(data: MedicalHistoryRequest):

    cursor.execute(
        """
        SELECT id
        FROM medical_history
        WHERE patient_name = ?
        """,
        (data.patient_name,)
    )

    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            """
            UPDATE medical_history
            SET allergies = ?,
                medications = ?,
                previous_treatments = ?
            WHERE patient_name = ?
            """,
            (
                data.allergies,
                data.medications,
                data.previous_treatments,
                data.patient_name
            )
        )

    else:
        cursor.execute(
            """
            INSERT INTO medical_history
            (
                patient_name,
                allergies,
                medications,
                previous_treatments
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                data.patient_name,
                data.allergies,
                data.medications,
                data.previous_treatments
            )
        )

    conn.commit()

    return {
        "message": "Medical history saved successfully"
    }


# ============================================================
# GET MEDICAL HISTORY
# ============================================================

@app.get("/medical-history/{patient_name}")
def get_medical_history(patient_name: str):

    cursor.execute(
        """
        SELECT
            patient_name,
            allergies,
            medications,
            previous_treatments
        FROM medical_history
        WHERE patient_name = ?
        """,
        (patient_name,)
    )

    row = cursor.fetchone()

    if not row:
        return {
            "patient_name": patient_name,
            "allergies": "",
            "medications": "",
            "previous_treatments": ""
        }

    return {
        "patient_name": row[0],
        "allergies": row[1] or "",
        "medications": row[2] or "",
        "previous_treatments": row[3] or ""
    }

# ============================================================
# PREDICT DISEASE
# ============================================================

# ============================================================
# PREDICT DISEASE + RECOMMENDATION ENGINE
# ============================================================

@app.post("/predict")
def predict(request: SymptomRequest):

    # --------------------------------------------------------
    # Normalize user symptoms
    # --------------------------------------------------------

    user_symptoms = []

    for symptom in request.symptoms:

        cleaned = (
            symptom.lower()
            .strip()
            .replace(",", " ")
            .replace(".", " ")
            .replace("!", " ")
            .replace("?", " ")
        )

        cleaned = " ".join(cleaned.split())

        user_symptoms.append(cleaned)

    # --------------------------------------------------------
    # Symptom aliases
    # --------------------------------------------------------

    symptom_aliases = {

        # Fever
        "fever": "high_fever",
        "high_fever": "high_fever",
        "high_temperature": "high_fever",
        "high_temp": "high_fever",
        "temperature": "high_fever",
        "very_high_temperature": "high_fever",
        "body_temperature": "high_fever",

        # Chills
        "feeling_cold": "chills",
        "feel_cold": "chills",
        "feeling_very_cold": "chills",
        "very_cold": "chills",
        "shivering": "shivering",
        "shivering_a_lot": "shivering",

        # Fatigue
        "tiredness": "fatigue",
        "feeling_tired": "fatigue",
        "feel_tired": "fatigue",
        "very_tired": "fatigue",
        "extremely_tired": "fatigue",
        "extreme_tiredness": "fatigue",
        "extreme_fatigue": "fatigue",
        "feeling_weak": "fatigue",
        "weakness": "fatigue",
        "no_energy": "fatigue",
        "low_energy": "fatigue",

        # Headache
        "head_pain": "headache",
        "head_ache": "headache",
        "head_hurts": "headache",
        "my_head_hurts": "headache",
        "pain_in_head": "headache",
        "pain_in_my_head": "headache",
        "severe_head_pain": "headache",

        # Stomach pain
        "stomach_ache": "stomach_pain",
        "stomach_hurts": "stomach_pain",
        "my_stomach_hurts": "stomach_pain",
        "pain_in_stomach": "stomach_pain",
        "pain_in_my_stomach": "stomach_pain",
        "belly_pain": "stomach_pain",
        "belly_ache": "stomach_pain",

        # Breathing
        "difficulty_breathing": "breathlessness",
        "trouble_breathing": "breathlessness",
        "hard_to_breathe": "breathlessness",
        "cannot_breathe": "breathlessness",
        "cant_breathe": "breathlessness",
        "shortness_of_breath": "breathlessness",
        "breathing_problem": "breathlessness",

        # Vomiting
        "throwing_up": "vomiting",
        "threw_up": "vomiting",
        "feeling_like_vomiting": "vomiting",
        "vomiting": "vomiting",
        "throwing": "vomiting",

        # Cough
        "coughing": "cough",
        "cough": "cough",
        "bad_cough": "cough",

        # Joint pain
        "joint_pain": "joint_pain",
        "pain_in_joints": "joint_pain",
        "painful_joints": "joint_pain",
        "my_joints_hurt": "joint_pain",

        # Eyes
        "red_eyes": "redness_of_eyes",
        "red_eye": "redness_of_eyes",
        "eyes_are_red": "redness_of_eyes",
        "watery_eyes": "watering_from_eyes",
        "watering_eyes": "watering_from_eyes",
        "eyes_are_watery": "watering_from_eyes",
        "teary_eyes": "watering_from_eyes",

        # Appetite
        "loss_of_appetite": "loss_of_appetite",
        "no_appetite": "loss_of_appetite",
        "dont_feel_like_eating": "loss_of_appetite",
        "do_not_feel_like_eating": "loss_of_appetite",

        # Smell
        "loss_of_smell": "loss_of_smell",
        "cannot_smell": "loss_of_smell",
        "cant_smell": "loss_of_smell",
        "no_smell": "loss_of_smell",

        # Dizziness
        "feeling_dizzy": "dizziness",
        "feel_dizzy": "dizziness",
        "dizzy": "dizziness",

        # Other
        "loose_motion": "diarrhoea",
        "loose_motions": "diarrhoea",
        "stomach_upset": "diarrhoea",
        "backache": "back_pain",
        "pain_in_back": "back_pain",
        "back_hurts": "back_pain",
    }

    matched_symptoms = []
    unrecognized_symptoms = []

    # --------------------------------------------------------
    # Understand natural-language symptoms
    # --------------------------------------------------------

    for symptom in user_symptoms:

        # Convert spaces to underscores
        normalized = symptom.replace(" ", "_")

        # ----------------------------------------------------
        # 1. Exact alias
        # ----------------------------------------------------

        if normalized in symptom_aliases:

            mapped_symptom = symptom_aliases[normalized]

            if mapped_symptom in symptoms_list:

                if mapped_symptom not in matched_symptoms:
                    matched_symptoms.append(mapped_symptom)

            continue

        # ----------------------------------------------------
        # 2. Exact dataset symptom
        # ----------------------------------------------------

        if normalized in symptoms_list:

            if normalized not in matched_symptoms:
                matched_symptoms.append(normalized)

            continue

        # ----------------------------------------------------
        # 3. Search natural-language sentence
        # ----------------------------------------------------

        words = normalized.split("_")

        found_symptoms = []

        # Search aliases inside the sentence
        for alias, mapped_symptom in symptom_aliases.items():

            alias_words = alias.split("_")

            if all(word in words for word in alias_words):

                if mapped_symptom in symptoms_list:

                    if mapped_symptom not in found_symptoms:
                        found_symptoms.append(mapped_symptom)

        # Add found aliases
        for found in found_symptoms:

            if found not in matched_symptoms:
                matched_symptoms.append(found)

        # ----------------------------------------------------
        # 4. Search dataset symptoms inside sentence
        # ----------------------------------------------------

        if not found_symptoms:

            for dataset_symptom in symptoms_list:

                symptom_words = dataset_symptom.split("_")

                if all(word in words for word in symptom_words):

                    if dataset_symptom not in matched_symptoms:
                        matched_symptoms.append(dataset_symptom)

            # If nothing was found at all
            if not any(
                all(
                    word in words
                    for word in dataset_symptom.split("_")
                )
                for dataset_symptom in symptoms_list
            ):

                unrecognized_symptoms.append(symptom)

    # --------------------------------------------------------
    # Stop prediction if nothing was understood
    # --------------------------------------------------------

    if not matched_symptoms:

        return {
            "message": "No recognized symptoms were provided.",
            "Symptoms Entered": len(request.symptoms),
            "Matched Symptoms": [],
            "Unrecognized Symptoms": unrecognized_symptoms,
            "Recommendation": "Please describe your symptoms using common medical terms."
        }

    # --------------------------------------------------------
    # Create model input
    # --------------------------------------------------------

    input_data = [0] * len(symptoms_list)

    for symptom in matched_symptoms:

        index = symptoms_list.index(symptom)

        input_data[index] = 1

    # --------------------------------------------------------
    # Predict disease
    # --------------------------------------------------------

    prediction = model.predict(
        [input_data]
    )[0]

    probabilities = model.predict_proba(
        [input_data]
    )[0]

    disease_probabilities = list(
        zip(model.classes_, probabilities)
    )

    disease_probabilities.sort(
        key=lambda x: x[1],
        reverse=True
    )

    # --------------------------------------------------------
    # Primary prediction
    # --------------------------------------------------------

    primary_disease = disease_probabilities[0][0].strip()

    primary_confidence = round(
        disease_probabilities[0][1] * 100,
        2
    )

    # --------------------------------------------------------
    # Other possible diseases
    # --------------------------------------------------------

    other_diseases = []

    for disease, probability in disease_probabilities[1:5]:

        if probability > 0:

            other_diseases.append({
                "Disease": disease.strip(),
                "Confidence": round(
                    probability * 100,
                    2
                )
            })

    # --------------------------------------------------------
    # Risk level
    # --------------------------------------------------------

    symptom_count = len(request.symptoms)

    if symptom_count <= 2:

        risk_level = "Low Risk"

    elif symptom_count <= 4:

        risk_level = "Moderate Risk"

    else:

        risk_level = "High Risk"

    # --------------------------------------------------------
    # Disease information
    # --------------------------------------------------------

    disease_details = disease_info.get(
        primary_disease,
        {}
    )

    about = disease_details.get(
        "about",
        "Information about this condition is not available."
    )

    common_symptoms = disease_details.get(
        "symptoms",
        "Please consult a healthcare provider for more information."
    )

    basic_recommendation = disease_details.get(
        "recommendation",
        "Consult a qualified healthcare provider for appropriate evaluation."
    )

    # --------------------------------------------------------
    # Healthcare recommendations
    # --------------------------------------------------------

    detailed_recommendation = recommendation_data.get(
        primary_disease,
        {}
    )

    treatment = detailed_recommendation.get(
        "treatment",
        basic_recommendation
    )

    prevention = detailed_recommendation.get(
        "prevention",
        "Maintain healthy lifestyle habits and follow appropriate preventive healthcare practices."
    )

    follow_up = detailed_recommendation.get(
        "follow_up",
        "Consult a healthcare provider if symptoms persist, worsen, or cause concern."
    )

    # --------------------------------------------------------
    # Save prediction to database
    # --------------------------------------------------------

    local_conn = sqlite3.connect("medassist.db")
    local_cursor = local_conn.cursor()

    try:

        local_cursor.execute(
            """
            INSERT INTO predictions
            (
                patient_name,
                symptoms,
                predicted_disease,
                confidence,
                risk_level
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                request.patient_name,
                ", ".join(matched_symptoms),
                primary_disease,
                primary_confidence,
                risk_level
            )
        )

        local_conn.commit()

    finally:

        local_cursor.close()
        local_conn.close()

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {

        "Predicted Disease":
            primary_disease,

        "Confidence":
            primary_confidence,

        "Risk Level":
            risk_level,

        "Symptoms Entered":
            symptom_count,

        "Matched Symptoms":
            matched_symptoms,

        "Unrecognized Symptoms":
            unrecognized_symptoms,

        "Other Possible Diseases":
            other_diseases,

        "Disease Information": {

            "About":
                about,

            "Common Symptoms":
                common_symptoms,

            "Basic Recommendation":
                basic_recommendation
        },

        "Healthcare Recommendations": {

            "Treatment":
                treatment,

            "Preventive Care":
                prevention,

            "Follow-up Advice":
                follow_up
        }
    }
# ============================================================
# DISEASE PREDICTION REPORT
# ============================================================

@app.get("/prediction-report/{patient_name}")
def generate_prediction_report(patient_name: str):

    cursor.execute(
        """
        SELECT
            patient_name,
            symptoms,
            predicted_disease,
            confidence,
            risk_level
        FROM predictions
        WHERE patient_name = ?
        ORDER BY rowid DESC
        LIMIT 1
        """,
        (patient_name,)
    )

    row = cursor.fetchone()

    if not row:
        return {
            "message": "No prediction found for this patient"
        }

    patient_name = row[0]
    symptoms = row[1]
    predicted_disease = row[2]
    confidence = row[3]
    risk_level = row[4]

    disease_details = disease_info.get(
        predicted_disease,
        {}
    )

    recommendations = recommendation_data.get(
        predicted_disease,
        {}
    )

    return {
        "Patient Name": patient_name,

        "Symptoms": symptoms,

        "Predicted Disease": predicted_disease,

        "Confidence": confidence,

        "Risk Level": risk_level,

        "Disease Information": {
            "About": disease_details.get(
                "about",
                ""
            ),

            "Common Symptoms": disease_details.get(
                "symptoms",
                ""
            ),

            "Basic Recommendation": disease_details.get(
                "recommendation",
                ""
            )
        },

        "Healthcare Recommendations": {
            "Treatment": recommendations.get(
                "treatment",
                ""
            ),

            "Preventive Care": recommendations.get(
                "prevention",
                ""
            ),

            "Follow-up Advice": recommendations.get(
                "follow_up",
                ""
            )
        }
    }
# ============================================================
# HEALTHCARE ANALYTICS
# ============================================================

@app.get("/analytics")
def get_analytics():

    # Total patients
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'Patient'")
    total_patients = cursor.fetchone()[0]

    # Total predictions
    cursor.execute("SELECT COUNT(*) FROM predictions")
    total_predictions = cursor.fetchone()[0]
 
    # Total reports
    cursor.execute("SELECT COUNT(*) FROM reports")
    total_reports = cursor.fetchone()[0]

    # Total appointments
    cursor.execute("SELECT COUNT(*) FROM appointments")
    total_appointments = cursor.fetchone()[0]

    # Disease distribution
    cursor.execute("""
        SELECT predicted_disease, COUNT(*)
        FROM predictions
        GROUP BY predicted_disease
        ORDER BY COUNT(*) DESC
    """)

    disease_rows = cursor.fetchall()

    disease_distribution = []

    for row in disease_rows:
        disease_distribution.append({
            "disease": row[0],
            "count": row[1]
        })

    # Risk distribution
    cursor.execute("""
        SELECT risk_level, COUNT(*)
        FROM predictions
        GROUP BY risk_level
    """)

    risk_rows = cursor.fetchall()

    risk_distribution = []

    for row in risk_rows:
        risk_distribution.append({
            "risk_level": row[0],
            "count": row[1]
        })

    return {
        "total_patients": total_patients,
        "total_predictions": total_predictions,
        "total_reports": total_reports,
        "total_appointments": total_appointments,
        "disease_distribution": disease_distribution,
        "risk_distribution": risk_distribution
    }

@app.post("/risk-assessment")
def risk_assessment(
    request: RiskAssessmentRequest
):

    risk_input = [[

        request.GENHLTH,

        request.PHYSHLTH,

        request.MENTHLTH,

        request.CVDINFR4,

        request.CVDSTRK3,

        request.DIABETE4,

        request.ASTHMA3,

        request.CHCCOPD3,

        request.CHCKDNY2,

        request.HAVARTH4,

        request.SMOKE100,

        request.EXERANY2,

        request.bmi5,

        request.age_g,

        request.sex

    ]]


    prediction = risk_model.predict(
        risk_input
    )[0]


    probabilities = risk_model.predict_proba(
        risk_input
    )[0]


    confidence = round(
        max(probabilities) * 100,
        2
    )


    return {

        "Risk Level":
            prediction,

        "Confidence":
            confidence
    }


@app.post("/generate-report")
def generate_report(data: ReportRequest):

    # --------------------------------------------------------
    # Get the patient's latest prediction from database
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT
            predicted_disease,
            confidence,
            risk_level,
            symptoms
        FROM predictions
        WHERE patient_name = ?
        ORDER BY rowid DESC
        LIMIT 1
        """,
        (data.patient_name,)
    )

    row = cursor.fetchone()

    if not row:
        return {
            "message": "No prediction found for this patient"
        }

    prediction = row[0].strip()
    confidence = row[1]
    risk_level = row[2]
    saved_symptoms = row[3]

    # --------------------------------------------------------
    # Get disease information
    # --------------------------------------------------------

    disease_details = disease_info.get(
        prediction,
        {}
    )

    about = disease_details.get(
        "about",
        "Information about this condition is not available."
    )

    common_symptoms = disease_details.get(
        "symptoms",
        "Information not available."
    )

    basic_recommendation = disease_details.get(
        "recommendation",
        "Please consult a qualified healthcare provider."
    )

    # --------------------------------------------------------
    # Get healthcare recommendations
    # --------------------------------------------------------

    recommendations = recommendation_data.get(
        prediction,
        {}
    )

    treatment = recommendations.get(
        "treatment",
        basic_recommendation
    )

    prevention = recommendations.get(
        "prevention",
        "Maintain healthy lifestyle habits and follow appropriate preventive healthcare practices."
    )

    follow_up = recommendations.get(
        "follow_up",
        "Consult a healthcare provider if symptoms persist or worsen."
    )

    # --------------------------------------------------------
    # Create reports folder
    # --------------------------------------------------------

    os.makedirs(
        "reports",
        exist_ok=True
    )

    filename = (
        f"report_"
        f"{data.patient_name.replace(' ', '_')}.pdf"
    )

    filepath = os.path.join(
        "reports",
        filename
    )

    # --------------------------------------------------------
    # Create PDF
    # --------------------------------------------------------

    doc = SimpleDocTemplate(
        filepath
    )

    styles = getSampleStyleSheet()

    elements = []

    # --------------------------------------------------------
    # Title
    # --------------------------------------------------------

    elements.append(
        Paragraph(
            "<b>MedAssist-AI Medical Report</b>",
            styles["Title"]
        )
    )

    elements.append(
        Spacer(1, 12)
    )

    # --------------------------------------------------------
    # Patient details
    # --------------------------------------------------------

    elements.append(
        Paragraph(
            f"<b>Patient Name:</b> {data.patient_name}",
            styles["BodyText"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Date:</b> "
            f"{datetime.now().strftime('%d-%m-%Y %H:%M')}",
            styles["BodyText"]
        )
    )

    elements.append(
        Spacer(1, 15)
    )

    # --------------------------------------------------------
    # Symptoms
    # --------------------------------------------------------

    elements.append(
        Paragraph(
            "<b>Symptoms</b>",
            styles["Heading2"]
        )
    )

    elements.append(
        Paragraph(
            saved_symptoms,
            styles["BodyText"]
        )
    )

    elements.append(
        Spacer(1, 12)
    )

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    elements.append(
        Paragraph(
            "<b>Prediction</b>",
            styles["Heading2"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Predicted Disease:</b> {prediction}",
            styles["BodyText"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Confidence:</b> {confidence}%",
            styles["BodyText"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Risk Level:</b> {risk_level}",
            styles["BodyText"]
        )
    )

    elements.append(
        Spacer(1, 15)
    )

    # --------------------------------------------------------
    # Disease Information
    # --------------------------------------------------------

    elements.append(
        Paragraph(
            "<b>Disease Information</b>",
            styles["Heading2"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>About:</b> {about}",
            styles["BodyText"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Common Symptoms:</b> {common_symptoms}",
            styles["BodyText"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Basic Recommendation:</b> "
            f"{basic_recommendation}",
            styles["BodyText"]
        )
    )

    elements.append(
        Spacer(1, 15)
    )

    # --------------------------------------------------------
    # Healthcare Recommendations
    # --------------------------------------------------------

    elements.append(
        Paragraph(
            "<b>Healthcare Recommendations</b>",
            styles["Heading2"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Treatment / Management:</b> {treatment}",
            styles["BodyText"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Preventive Care:</b> {prevention}",
            styles["BodyText"]
        )
    )

    elements.append(
        Paragraph(
            f"<b>Follow-up Advice:</b> {follow_up}",
            styles["BodyText"]
        )
    )

    elements.append(
        Spacer(1, 20)
    )

    # --------------------------------------------------------
    # Footer
    # --------------------------------------------------------

    elements.append(
        Paragraph(
            "Generated by MedAssist-AI",
            styles["Italic"]
        )
    )

    doc.build(elements)

    # --------------------------------------------------------
    # Return PDF
    # --------------------------------------------------------

    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=filename
    )

# ============================================================
# REGISTER
# ============================================================

@app.post("/register")
def register(
    user: RegisterRequest
):

    # --------------------------------------------------------
    # Save to SQLite
    # --------------------------------------------------------

    cursor.execute(
        """
        INSERT INTO users
        (
            fullname,
            age,
            gender,
            phone,
            email,
            password,
            role
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,

        (
            user.fullname,
            user.age,
            user.gender,
            user.phone,
            user.email,
            user.password,
            user.role
        )
    )


    conn.commit()


    # --------------------------------------------------------
    # Get user ID
    # --------------------------------------------------------

    user_id = cursor.lastrowid


    # --------------------------------------------------------
    # Save to CSV
    # --------------------------------------------------------

    csv_file = "data/users.csv"


    with open(
        csv_file,
        mode="a",
        newline=""
    ) as file:

        writer = csv.writer(file)


        writer.writerow([

            user_id,

            user.fullname,

            user.age,

            user.gender,

            user.phone,

            user.email,

            user.password,

            user.role

        ])


    return {

        "message":
            "Registration Successful"
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(user: LoginRequest):

    # Create a separate connection and cursor for this request
    local_conn = sqlite3.connect("medassist.db")
    local_cursor = local_conn.cursor()

    try:
        local_cursor.execute(
            """
            SELECT *
            FROM users
            WHERE email=?
            AND password=?
            AND role=?
            """,
            (
                user.email,
                user.password,
                user.role
            )
        )

        existing_user = local_cursor.fetchone()

        if existing_user:
            return {
                "message": "Login Successful",
                "role": user.role,
                "fullname": existing_user[1],
                "age": existing_user[2],
                "gender": existing_user[3],
                "phone": existing_user[4],
                "email": existing_user[5]
            }

        return {
            "message": "Invalid Email or Password"
        }

    finally:
        local_cursor.close()
        local_conn.close()
# ============================================================
# GET SYMPTOMS
# ============================================================

@app.get("/symptoms")
def get_symptoms():

    return {

        "symptoms":
            list(symptoms_list)
    }


# ============================================================
# FILE UPLOAD
# ============================================================

UPLOAD_FOLDER = "uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOAD_FOLDER
    ),
    name="uploads"
)


@app.post("/upload-report")
async def upload_report(
    patient_name: str = Form(...),
    file: UploadFile = File(...)
):

    # --------------------------------------------------------
    # Save uploaded file
    # --------------------------------------------------------

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    # --------------------------------------------------------
    # Save report information to database
    # Use a LOCAL connection and cursor
    # --------------------------------------------------------

    local_conn = sqlite3.connect("medassist.db")
    local_cursor = local_conn.cursor()

    try:

        local_cursor.execute(
            """
            INSERT INTO reports
            (patient_name, filename)
            VALUES (?, ?)
            """,
            (
                patient_name,
                file.filename
            )
        )

        local_conn.commit()

    finally:

        local_cursor.close()
        local_conn.close()

    return {
        "message": "Report uploaded successfully"
    }

# ============================================================
# GET REPORTS
# ============================================================

@app.get("/reports")
def get_reports():

    local_conn = sqlite3.connect(
        "medassist.db"
    )

    local_cursor = local_conn.cursor()


    local_cursor.execute(
        """
        SELECT patient_name, filename
        FROM reports
        """
    )


    reports = local_cursor.fetchall()


    local_conn.close()


    return {

        "reports": [

            {
                "patient_name": row[0],
                "filename": row[1]
            }

            for row in reports
        ]
    }


# ============================================================
# GET REGISTERED PATIENTS
# ============================================================

@app.get("/patients")
def get_patients():

    cursor.execute(

        """
        SELECT rowid,
               fullname,
               age,
               gender,
               phone
        FROM users
        WHERE role='Patient'
        """
    )


    patients = cursor.fetchall()


    result = []


    for patient in patients:

        result.append({

            "id":
                patient[0],

            "fullname":
                patient[1],

            "age":
                patient[2],

            "gender":
                patient[3],

            "phone":
                patient[4]
        })


    return result


# ============================================================
# GET PREDICTION HISTORY
# ============================================================

@app.get("/predictions")
def get_predictions():

    local_cursor = conn.cursor()

    local_cursor.execute(
        """
        SELECT
            patient_name,
            symptoms,
            predicted_disease,
            confidence,
            risk_level
        FROM predictions
        """
    )

    rows = local_cursor.fetchall()

    local_cursor.close()

    predictions = []

    for row in rows:
        predictions.append({
            "patient_name": row[0],
            "symptoms": row[1],
            "predicted_disease": row[2],
            "confidence": row[3],
            "risk_level": row[4]
        })

    return {
        "predictions": predictions
    }

# ============================================================
# GET APPOINTMENTS
# ============================================================

@app.get("/appointments")
def get_appointments():

    cursor.execute(

        """
        SELECT
            patient_name,
            doctor_name,
            appointment_date,
            appointment_time,
            consultation_type,
            reason
        FROM appointments
        """
    )


    rows = cursor.fetchall()


    appointments = []


    for row in rows:

        appointments.append({

            "patient_name":
                row[0],

            "doctor_name":
                row[1],

            "appointment_date":
                row[2],

            "appointment_time":
                row[3],

            "consultation_type":
                row[4],

            "reason":
                row[5]
        })


    return {

        "appointments":
            appointments
    }


# ============================================================
# BOOK APPOINTMENT
# ============================================================

@app.post("/book-appointment")
def book_appointment(
    data: AppointmentRequest
):

    cursor.execute(

        """
        INSERT INTO appointments
        (
            patient_name,
            doctor_name,
            appointment_date,
            appointment_time,
            consultation_type,
            reason
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,

        (
            data.patient_name,
            data.doctor_name,
            data.appointment_date,
            data.appointment_time,
            data.consultation_type,
            data.reason
        )
    )


    conn.commit()


    return {

        "message":
            "Appointment booked successfully"
    }