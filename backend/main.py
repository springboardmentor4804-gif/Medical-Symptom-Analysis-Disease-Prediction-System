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

model = pickle.load(open("model.pkl", "rb"))

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

    user_symptoms = [
        symptom.lower().strip().replace(" ", "_")
        for symptom in request.symptoms
    ]

    symptom_aliases = {
        "fever": "high_fever",
        "high_fever": "high_fever"
    }

    matched_symptoms = []

    for symptom in user_symptoms:

        symptom = symptom_aliases.get(
            symptom,
            symptom
        )

        if symptom in symptoms_list:
            matched_symptoms.append(symptom)

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
    # Risk level based on number of symptoms
    # --------------------------------------------------------

    symptom_count = len(request.symptoms)

    if symptom_count <= 2:
        risk_level = "Low Risk"

    elif symptom_count <= 4:
        risk_level = "Moderate Risk"

    else:
        risk_level = "High Risk"

    # --------------------------------------------------------
    # GET DISEASE INFORMATION
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
    # GET MILESTONE 3 RECOMMENDATIONS
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
    # SAVE PREDICTION TO DATABASE
    # --------------------------------------------------------

    cursor.execute(
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

    conn.commit()

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {

        # Prediction
        "Predicted Disease":
            primary_disease,

        "Confidence":
            primary_confidence,

        "Risk Level":
            risk_level,

        # Symptoms
        "Symptoms Entered":
            symptom_count,

        "Matched Symptoms":
            matched_symptoms,

        # Other possibilities
        "Other Possible Diseases":
            other_diseases,

        # Disease information
        "Disease Information": {

            "About":
                about,

            "Common Symptoms":
                common_symptoms,

            "Basic Recommendation":
                basic_recommendation
        },

        # Milestone 3 recommendation engine
        "Healthcare Recommendations": {

            "Treatment":
                treatment,

            "Preventive Care":
                prevention,

            "Follow-up Advice":
                follow_up
        }
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


# ============================================================
# GENERATE MEDICAL REPORT
# ============================================================

@app.post("/generate-report")
def generate_report(
    data: ReportRequest
):

    # --------------------------------------------------------
    # Normalize symptoms
    # --------------------------------------------------------

    user_symptoms = [

        s.strip()
        .lower()
        .replace(" ", "_")

        for s in data.symptoms

    ]


    # --------------------------------------------------------
    # Create model input
    # --------------------------------------------------------

    input_data = [
        0
    ] * len(symptoms_list)


    for symptom in user_symptoms:

        if symptom in symptoms_list:

            index = symptoms_list.index(
                symptom
            )

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


    confidence = round(
        max(probabilities) * 100,
        2
    )


    # --------------------------------------------------------
    # Low confidence handling
    # --------------------------------------------------------

    if confidence < 50:

        prediction = (
            "Uncertain prediction - "
            "please provide more specific symptoms"
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


    elements.append(
        Paragraph(
            "<b>MedAssist-AI Medical Report</b>",
            styles["Title"]
        )
    )


    elements.append(
        Spacer(1, 12)
    )


    elements.append(
        Paragraph(
            f"<b>Patient Name:</b> "
            f"{data.patient_name}",
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
        Spacer(1, 12)
    )


    elements.append(
        Paragraph(
            "<b>Symptoms:</b>",
            styles["Heading2"]
        )
    )


    for symptom in data.symptoms:

        elements.append(
            Paragraph(
                f"• {symptom}",
                styles["BodyText"]
            )
        )


    elements.append(
        Spacer(1, 12)
    )


    elements.append(
        Paragraph(
            "<b>Prediction:</b>",
            styles["Heading2"]
        )
    )


    elements.append(
        Paragraph(
            f"Disease: {prediction.strip()}",
            styles["BodyText"]
        )
    )


    elements.append(
        Paragraph(
            f"Confidence: {confidence}%",
            styles["BodyText"]
        )
    )


    elements.append(
        Spacer(1, 20)
    )


    elements.append(
        Paragraph(
            "Generated by MedAssist-AI",
            styles["Italic"]
        )
    )


    doc.build(elements)


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
def login(
    user: LoginRequest
):

    cursor.execute(

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


    existing_user = cursor.fetchone()


    if existing_user:

        return {

            "message":
                "Login Successful",

            "role":
                user.role,

            "fullname":
                existing_user[1],

            "age":
                existing_user[2],

            "gender":
                existing_user[3],

            "phone":
                existing_user[4],

            "email":
                existing_user[5]
        }


    return {

        "message":
            "Invalid Email or Password"
    }


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


    cursor.execute(

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


    conn.commit()


    return {

        "message":
            "Report uploaded successfully"
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