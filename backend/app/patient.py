from datetime import date

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.auth import get_current_user, require_patient
from app.database import get_database_connection
from app.prediction_service import (
    predict_disease,
    predict_top_conditions,
    get_disease_description,
    get_disease_precautions,
    feature_names
)

from app.schemas import CaretakerSelection, PatientRiskAssessmentRequest
from app.patient_risk_service import assess_patient_risk
from app.treatment_data import get_treatment_suggestions
from app.report_generator import generate_prediction_report_pdf


from pathlib import Path
import uuid

router = APIRouter(
    prefix="/patient",
    tags=["Patient"]
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]

REPORT_UPLOAD_DIR = (
    PROJECT_ROOT / "uploads" / "patient_reports"
)

REPORT_UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================
# REQUEST MODELS
# =========================

class PatientProfileCreate(BaseModel):
    date_of_birth: date
    gender: str
    phone: str
    blood_group: str
    height_cm: float
    weight_kg: float
    emergency_contact_name: str
    emergency_contact_phone: str


class SymptomCreate(BaseModel):
    symptom_name: str
    severity: str


class DiseasePredictionRequest(BaseModel):
    symptoms: list[str]


# =========================
# PATIENT PROFILE
# =========================

@router.post("/profile")
def create_patient_profile(
    profile: PatientProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        SELECT id
        FROM patient_profiles
        WHERE user_id = %s
        """,
        (user_id,)
    )

    existing_profile = cursor.fetchone()

    if existing_profile:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Patient profile already exists"
        )

    cursor.execute(
        """
        INSERT INTO patient_profiles (
            user_id,
            date_of_birth,
            gender,
            phone,
            blood_group,
            height_cm,
            weight_kg,
            emergency_contact_name,
            emergency_contact_phone
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            user_id,
            profile.date_of_birth,
            profile.gender,
            profile.phone,
            profile.blood_group,
            profile.height_cm,
            profile.weight_kg,
            profile.emergency_contact_name,
            profile.emergency_contact_phone
        )
    )

    profile_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Patient profile created successfully",
        "profile_id": profile_id,
        "user_id": user_id
    }



@router.get("/profile")
def get_patient_profile(
    current_user: dict = Depends(get_current_user)
):

    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        SELECT
            date_of_birth,
            gender,
            phone,
            blood_group,
            height_cm,
            weight_kg,
            emergency_contact_name,
            emergency_contact_phone
        FROM patient_profiles
        WHERE user_id = %s
        """,
        (user_id,)
    )

    profile = cursor.fetchone()

    cursor.close()
    connection.close()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    return {
        "date_of_birth": profile[0],
        "gender": profile[1],
        "phone": profile[2],
        "blood_group": profile[3],
        "height_cm": profile[4],
        "weight_kg": profile[5],
        "emergency_contact_name": profile[6],
        "emergency_contact_phone": profile[7]
    }


@router.put("/profile")
def update_patient_profile(
    profile: PatientProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        UPDATE patient_profiles
        SET
            date_of_birth = %s,
            gender = %s,
            phone = %s,
            blood_group = %s,
            height_cm = %s,
            weight_kg = %s,
            emergency_contact_name = %s,
            emergency_contact_phone = %s
        WHERE user_id = %s
        RETURNING id
        """,
        (
            profile.date_of_birth,
            profile.gender,
            profile.phone,
            profile.blood_group,
            profile.height_cm,
            profile.weight_kg,
            profile.emergency_contact_name,
            profile.emergency_contact_phone,
            user_id
        )
    )

    updated_profile = cursor.fetchone()

    if not updated_profile:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Patient profile updated successfully"
    }


# =========================
# ADD PATIENT SYMPTOM
# =========================

@router.post("/symptoms")
def add_patient_symptom(
    symptom: SymptomCreate,
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        INSERT INTO patient_symptoms (
            user_id,
            symptom_name,
            severity
        )
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (
            user_id,
            symptom.symptom_name,
            symptom.severity
        )
    )

    symptom_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Symptom added successfully",
        "symptom_id": symptom_id,
        "user_id": user_id
    }


# =========================
# GET PATIENT SYMPTOMS
# =========================

@router.get("/symptoms")
def get_patient_symptoms(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        SELECT
            id,
            symptom_name,
            severity,
            recorded_at
        FROM patient_symptoms
        WHERE user_id = %s
        ORDER BY recorded_at DESC
        """,
        (user_id,)
    )

    symptoms = cursor.fetchall()

    cursor.close()
    connection.close()

    return {
        "user_id": user_id,
        "symptoms": [
            {
                "id": symptom[0],
                "symptom_name": symptom[1],
                "severity": symptom[2],
                "recorded_at": symptom[3]
            }
            for symptom in symptoms
        ]
    }


# =========================
# DELETE PATIENT SYMPTOM
# =========================

@router.delete("/symptoms/{symptom_id}")
def delete_patient_symptom(
    symptom_id: int,
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        DELETE FROM patient_symptoms
        WHERE id = %s
        AND user_id = %s
        RETURNING id
        """,
        (symptom_id, user_id)
    )

    deleted_symptom = cursor.fetchone()

    if not deleted_symptom:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Symptom not found"
        )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Symptom deleted successfully",
        "symptom_id": symptom_id
    }


# =========================
# DISEASE PREDICTION
# =========================

@router.post("/predict-disease")
def predict_patient_disease(
    request: DiseasePredictionRequest,
    current_user: dict = Depends(get_current_user)
):
    # Predict disease using ML model
    predicted_disease = predict_disease(
        request.symptoms
    )

    top_conditions = predict_top_conditions(
    request.symptoms
)

    # Connect to PostgreSQL
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    # Save prediction history
    cursor.execute(
        """
        INSERT INTO disease_predictions (
            user_id,
            predicted_disease
        )
        VALUES (%s, %s)
        """,
        (
            user_id,
            predicted_disease
        )
    )

    connection.commit()

    cursor.close()
    connection.close()

    return {
    "user_id": user_id,
    "symptoms": request.symptoms,
    "predicted_disease": predicted_disease,
    "top_conditions": top_conditions,
    "disclaimer": (
        "This result is generated by an AI model for educational "
        "purposes and is not a medical diagnosis."
    )
}


# =========================
# PATIENT RECOMMENDATIONS
# =========================

@router.get("/recommendations")
def get_patient_recommendations(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    # Get the patient's latest disease prediction
    cursor.execute(
        """
        SELECT
            predicted_disease,
            created_at
        FROM disease_predictions
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (user_id,)
    )

    prediction = cursor.fetchone()

    cursor.close()
    connection.close()

    # No prediction exists yet
    if not prediction:
        return {
            "disease": None,
            "description": None,
            "recommendations": [],
            "prediction_date": None
        }

    disease = prediction[0]
    prediction_date = prediction[1]

    description = get_disease_description(
        disease
    )

    precautions = get_disease_precautions(
        disease
    )

    return {
        "disease": disease,
        "description": description,
        "recommendations": precautions,
        "prediction_date": prediction_date
    }


# =========================
# DISEASE PREDICTION HISTORY
# =========================

@router.get("/predictions")
def get_patient_predictions(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        SELECT
            id,
            predicted_disease,
            created_at
        FROM disease_predictions
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,)
    )

    predictions = cursor.fetchall()

    cursor.close()
    connection.close()

    return {
        "user_id": user_id,
        "total_predictions": len(predictions),
        "predictions": [
            {
                "id": prediction[0],
                "predicted_disease": prediction[1],
                "created_at": prediction[2]
            }
            for prediction in predictions
        ]
    }



# =========================
# AVAILABLE ML SYMPTOMS
# =========================

@router.get("/available-symptoms")
def get_available_symptoms(
    current_user: dict = Depends(get_current_user)
):
    return {
        "total_symptoms": len(feature_names),
        "symptoms": feature_names
    }


# =========================
# PREDICTION REPORT PDF
# =========================

@router.get("/prediction-report/pdf")
def download_prediction_report_pdf(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    # 1. Get user info
    cursor.execute(
        """
        SELECT full_name, email
        FROM users
        WHERE id = %s
        """,
        (user_id,)
    )

    user = cursor.fetchone()

    # 2. Get patient profile
    cursor.execute(
        """
        SELECT
            date_of_birth, gender, blood_group,
            height_cm, weight_kg
        FROM patient_profiles
        WHERE user_id = %s
        """,
        (user_id,)
    )

    profile = cursor.fetchone()

    patient_info = {
        "full_name": user[0] if user else "N/A",
        "email": user[1] if user else "N/A",
        "gender": profile[1] if profile else None,
        "date_of_birth": str(profile[0]) if profile and profile[0] else None,
        "blood_group": profile[2] if profile else None,
        "height_cm": float(profile[3]) if profile and profile[3] else None,
        "weight_kg": float(profile[4]) if profile and profile[4] else None,
    }

    # 3. Get symptoms
    cursor.execute(
        """
        SELECT symptom_name, severity, recorded_at
        FROM patient_symptoms
        WHERE user_id = %s
        ORDER BY recorded_at DESC
        """,
        (user_id,)
    )

    symptoms = [
        {
            "symptom_name": row[0],
            "severity": row[1],
            "recorded_at": str(row[2])
        }
        for row in cursor.fetchall()
    ]

    # 4. Get latest prediction
    cursor.execute(
        """
        SELECT predicted_disease
        FROM disease_predictions
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (user_id,)
    )

    pred_row = cursor.fetchone()
    predicted_disease = pred_row[0] if pred_row else None

    # Fail early if no prediction exists
    if not predicted_disease:
        cursor.close()
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="No disease prediction found. "
            "Run a prediction first."
        )

    # 5. Get top conditions using the prediction service
    top_conditions = []
    if symptoms:
        try:
            symptom_names = list(set(
                s["symptom_name"] for s in symptoms
            ))
            top_conditions = predict_top_conditions(symptom_names)
        except Exception as e:
            print(f"Warning: Could not get top conditions: {e}")
            top_conditions = []

    # 6. Get latest risk assessment
    cursor.execute(
        """
        SELECT
            predicted_outcome,
            positive_model_score,
            negative_model_score,
            blood_pressure,
            cholesterol_level
        FROM patient_risk_assessments
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (user_id,)
    )

    risk_row = cursor.fetchone()
    risk_data = None
    if risk_row:
        risk_data = {
            "predicted_outcome": risk_row[0],
            "positive_model_score": float(risk_row[1]),
            "negative_model_score": float(risk_row[2]),
            "blood_pressure": risk_row[3],
            "cholesterol_level": risk_row[4],
        }

    # 7. Get recommendations
    recommendations_list = []
    try:
        precautions = get_disease_precautions(predicted_disease)
        recommendations_list = precautions
    except Exception as e:
        print(f"Warning: Could not get precautions: {e}")
        recommendations_list = []

    cursor.close()
    connection.close()

    # Generate PDF
    from io import BytesIO

    pdf_bytes = generate_prediction_report_pdf(
        patient_info=patient_info,
        symptoms=symptoms,
        prediction_data=predicted_disease,
        top_conditions=top_conditions,
        risk_data=risk_data,
        recommendations=recommendations_list
    )

    buffer = BytesIO(pdf_bytes)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=MedAssist_Prediction_Report.pdf"
        }
    )



@router.post("/select-caretaker")
def select_caretaker(

    request: CaretakerSelection,

    current_user=Depends(require_patient)

):

    conn = get_database_connection()
    cursor = conn.cursor()

    # Check patient already assigned

    cursor.execute(
        """
        SELECT id
        FROM patient_assignments
        WHERE patient_user_id=%s
        """,
        (current_user["user_id"],)
    )

    existing = cursor.fetchone()

    if existing:

        cursor.close()
        conn.close()

        raise HTTPException(
            status_code=400,
            detail="Caretaker already selected."
        )

    cursor.execute(
        """
        INSERT INTO patient_assignments(

            patient_user_id,

            caretaker_user_id

        )

        VALUES(%s,%s)
        """,
        (
            current_user["user_id"],
            request.caretaker_user_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {

        "message": "Caretaker selected successfully."

    }



@router.post("/risk-assessment")
def patient_risk_assessment(
    request: PatientRiskAssessmentRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])

    patient_data = {
        "Fever": request.fever,
        "Cough": request.cough,
        "Fatigue": request.fatigue,
        "Difficulty Breathing": request.difficulty_breathing,
        "Age": request.age,
        "Gender": request.gender,
        "Blood Pressure": request.blood_pressure,
        "Cholesterol Level": request.cholesterol_level,
    }

    # Run ML risk model
    result = assess_patient_risk(patient_data)

    # Save assessment to PostgreSQL
    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO patient_risk_assessments (
            user_id,
            fever,
            cough,
            fatigue,
            difficulty_breathing,
            age,
            gender,
            blood_pressure,
            cholesterol_level,
            predicted_outcome,
            positive_model_score,
            negative_model_score
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        RETURNING id
        """,
        (
            user_id,
            request.fever,
            request.cough,
            request.fatigue,
            request.difficulty_breathing,
            request.age,
            request.gender,
            request.blood_pressure,
            request.cholesterol_level,
            result["predicted_outcome"],
            result["positive_model_score"],
            result["negative_model_score"],
        )
    )

    assessment_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "assessment_id": assessment_id,
        "user_id": user_id,
        "risk_assessment": result
    }


# =========================
# RISK ASSESSMENT HISTORY
# =========================

@router.get("/risk-assessments")
def get_patient_risk_assessments(
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])

    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            fever,
            cough,
            fatigue,
            difficulty_breathing,
            age,
            gender,
            blood_pressure,
            cholesterol_level,
            predicted_outcome,
            positive_model_score,
            negative_model_score,
            created_at
        FROM patient_risk_assessments
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,)
    )

    assessments = cursor.fetchall()

    cursor.close()
    connection.close()

    return {
        "user_id": user_id,
        "total_assessments": len(assessments),
        "assessments": [
            {
                "id": assessment[0],
                "fever": assessment[1],
                "cough": assessment[2],
                "fatigue": assessment[3],
                "difficulty_breathing": assessment[4],
                "age": assessment[5],
                "gender": assessment[6],
                "blood_pressure": assessment[7],
                "cholesterol_level": assessment[8],
                "predicted_outcome": assessment[9],
                "positive_model_score": float(assessment[10]),
                "negative_model_score": float(assessment[11]),
                "created_at": assessment[12]
            }
            for assessment in assessments
        ]
    }


# =========================
# UPLOAD PATIENT REPORT
# =========================

@router.post("/reports")
async def upload_patient_report(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])

    # ---------------------------------
    # 1. Validate file type
    # ---------------------------------

    allowed_types = {
        "application/pdf",
        "image/jpeg",
        "image/png"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, JPG, and PNG files are allowed"
        )

    # ---------------------------------
    # 2. Read file
    # ---------------------------------

    file_content = await file.read()

    # ---------------------------------
    # 3. Validate file size
    # Maximum: 10 MB
    # ---------------------------------

    max_file_size = 10 * 1024 * 1024

    if len(file_content) > max_file_size:
        raise HTTPException(
            status_code=400,
            detail="File size must not exceed 10 MB"
        )

    # ---------------------------------
    # 4. Generate unique stored name
    # ---------------------------------

    extension = Path(
        file.filename or ""
    ).suffix.lower()

    stored_file_name = (
        f"{uuid.uuid4().hex}{extension}"
    )

    file_path = (
        REPORT_UPLOAD_DIR /
        stored_file_name
    )

    # ---------------------------------
    # 5. Save file
    # ---------------------------------

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    # ---------------------------------
    # 6. Save metadata in database
    # ---------------------------------

    connection = get_database_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO patient_reports (
                patient_user_id,
                file_name,
                stored_file_name,
                file_path,
                file_type,
                file_size
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, uploaded_at
            """,
            (
                user_id,
                file.filename,
                stored_file_name,
                str(file_path),
                file.content_type,
                len(file_content)
            )
        )

        report = cursor.fetchone()

        connection.commit()

    except Exception:

        connection.rollback()

        # Remove physical file if database insertion fails
        if file_path.exists():
            file_path.unlink()

        raise

    finally:

        cursor.close()
        connection.close()

    return {
        "message": "Report uploaded successfully",
        "report": {
            "id": report[0],
            "file_name": file.filename,
            "file_type": file.content_type,
            "file_size": len(file_content),
            "uploaded_at": report[1]
        }
    }


# =========================
# GET PATIENT REPORTS
# =========================

@router.get("/reports")
def get_patient_reports(
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])

    connection = get_database_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                file_name,
                file_type,
                file_size,
                uploaded_at
            FROM patient_reports
            WHERE patient_user_id = %s
            ORDER BY uploaded_at DESC
            """,
            (user_id,)
        )

        reports = cursor.fetchall()

    finally:

        cursor.close()
        connection.close()

    return {
        "total_reports": len(reports),

        "reports": [
            {
                "id": row[0],
                "file_name": row[1],
                "file_type": row[2],
                "file_size": row[3],
                "uploaded_at": row[4]
            }
            for row in reports
        ]
    }


# =========================
# DOWNLOAD PATIENT REPORT
# =========================

@router.get("/reports/{report_id}/download")
def download_patient_report(
    report_id: int,
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])

    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT file_name, stored_file_name, file_path, file_type
        FROM patient_reports
        WHERE id = %s AND patient_user_id = %s
        """,
        (report_id, user_id)
    )

    report = cursor.fetchone()

    cursor.close()
    connection.close()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found."
        )

    file_name = report[0]
    file_path = Path(report[2])

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Report file not found on server."
        )

    from fastapi.responses import FileResponse

    return FileResponse(
        path=str(file_path),
        filename=file_name,
        media_type=report[3]
    )


# =========================
# DELETE PATIENT REPORT
# =========================

@router.delete("/reports/{report_id}")
def delete_patient_report(
    report_id: int,
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["user_id"])

    connection = get_database_connection()
    cursor = connection.cursor()

    # Get file path before deleting
    cursor.execute(
        """
        SELECT file_path
        FROM patient_reports
        WHERE id = %s AND patient_user_id = %s
        """,
        (report_id, user_id)
    )

    report = cursor.fetchone()

    if not report:
        cursor.close()
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Report not found."
        )

    file_path = Path(report[0])

    # Delete from database
    cursor.execute(
        """
        DELETE FROM patient_reports
        WHERE id = %s AND patient_user_id = %s
        """,
        (report_id, user_id)
    )

    connection.commit()
    cursor.close()
    connection.close()

    # Delete physical file
    if file_path.exists():
        file_path.unlink()

    return {
        "message": "Report deleted successfully."
    }


# =========================
# TREATMENT SUGGESTIONS
# =========================

@router.get("/treatment-suggestions")
def get_patient_treatment_suggestions(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    # 1. Get latest disease prediction
    cursor.execute(
        """
        SELECT predicted_disease, created_at
        FROM disease_predictions
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (user_id,)
    )

    prediction = cursor.fetchone()

    # 2. Get latest risk assessment
    cursor.execute(
        """
        SELECT
            predicted_outcome,
            positive_model_score,
            negative_model_score,
            blood_pressure,
            cholesterol_level,
            age,
            gender
        FROM patient_risk_assessments
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (user_id,)
    )

    risk = cursor.fetchone()

    # 3. Get patient profile
    cursor.execute(
        """
        SELECT
            date_of_birth,
            gender,
            blood_group
        FROM patient_profiles
        WHERE user_id = %s
        """,
        (user_id,)
    )

    profile = cursor.fetchone()

    cursor.close()
    connection.close()

    # No prediction yet
    if not prediction:
        return {
            "disease": None,
            "treatment": None,
            "risk_context": None,
            "profile_tips": [],
            "message": "No disease prediction found. Run a prediction first."
        }

    disease = prediction[0]
    prediction_date = prediction[1]

    # Get treatment data from our mapping
    treatment = get_treatment_suggestions(disease)

    # Build risk context
    risk_context = None
    if risk:
        risk_context = {
            "predicted_outcome": risk[0],
            "positive_score": float(risk[1]),
            "negative_score": float(risk[2]),
            "blood_pressure": risk[3],
            "cholesterol_level": risk[4],
        }

    # Build profile-based tips
    profile_tips = []
    if profile:
        dob = profile[0]
        gender = profile[1]
        blood_group = profile[2]

        if dob:
            from datetime import date as date_type
            today = date_type.today()
            age = today.year - dob.year - (
                (today.month, today.day) < (dob.month, dob.day)
            )

            if age > 60:
                profile_tips.append(
                    "As a senior patient, prioritise regular health checkups and gentle exercise."
                )
            elif age < 18:
                profile_tips.append(
                    "As a young patient, ensure proper nutrition and adequate rest for recovery."
                )

        if gender and gender.lower() == "female":
            profile_tips.append(
                "Ensure adequate iron and calcium intake in your diet."
            )

    if risk_context:
        if risk_context["blood_pressure"] == "High":
            profile_tips.append(
                "Your blood pressure is high — reduce sodium intake and monitor BP regularly."
            )
        if risk_context["cholesterol_level"] == "High":
            profile_tips.append(
                "Your cholesterol is high — avoid saturated fats and include more fibre."
            )

    return {
        "disease": disease,
        "prediction_date": prediction_date,
        "treatment": treatment,
        "risk_context": risk_context,
        "profile_tips": profile_tips,
    }


# =========================
# HEALTH ADVISORY
# =========================

@router.get("/health-advisory")
def get_patient_health_advisory(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    # 1. Latest disease prediction
    cursor.execute(
        """
        SELECT predicted_disease, created_at
        FROM disease_predictions
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (user_id,)
    )

    prediction = cursor.fetchone()

    # 2. Latest risk assessment
    cursor.execute(
        """
        SELECT
            predicted_outcome,
            positive_model_score,
            negative_model_score,
            fever,
            cough,
            fatigue,
            difficulty_breathing,
            blood_pressure,
            cholesterol_level
        FROM patient_risk_assessments
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (user_id,)
    )

    risk = cursor.fetchone()

    cursor.close()
    connection.close()

    # No data at all
    if not prediction and not risk:
        return {
            "urgency": None,
            "advisory_message": "No health data available yet.",
            "next_steps": [
                "Record your symptoms in the Symptoms section.",
                "Run an AI Disease Prediction.",
                "Complete a Risk Assessment."
            ],
            "warning_signs": [],
            "lifestyle_modifications": [],
            "prediction_summary": None,
            "risk_summary": None,
        }

    # Build prediction summary
    prediction_summary = None
    if prediction:
        prediction_summary = {
            "disease": prediction[0],
            "prediction_date": prediction[1],
        }

    # Build risk summary
    risk_summary = None
    positive_score = 0
    if risk:
        positive_score = float(risk[1])
        risk_summary = {
            "predicted_outcome": risk[0],
            "positive_score": positive_score,
            "negative_score": float(risk[2]),
            "fever": risk[3],
            "cough": risk[4],
            "fatigue": risk[5],
            "difficulty_breathing": risk[6],
            "blood_pressure": risk[7],
            "cholesterol_level": risk[8],
        }

    # Determine urgency level
    urgency = "Low"
    if risk and risk[0] == "Positive":
        if positive_score >= 75:
            urgency = "High"
        elif positive_score >= 50:
            urgency = "Medium"
        else:
            urgency = "Low"
    elif risk and risk[0] == "Negative":
        urgency = "Low"

    # High-risk diseases override
    high_risk_diseases = [
        "Heart attack", "Paralysis (brain hemorrhage)",
        "AIDS", "Tuberculosis", "Pneumonia",
        "Dengue", "Malaria", "Hepatitis B",
        "Hepatitis C", "Hepatitis D"
    ]

    if prediction and prediction[0] in high_risk_diseases:
        if urgency != "High":
            urgency = "Medium"

    # Generate advisory message
    advisory_parts = []
    if prediction:
        advisory_parts.append(
            f"Your latest AI prediction indicates '{prediction[0]}'."
        )

    if risk:
        advisory_parts.append(
            f"Your risk assessment outcome is '{risk[0]}' "
            f"with a positive risk score of {positive_score:.1f}%."
        )

    if urgency == "High":
        advisory_parts.append(
            "Based on the combined analysis, we recommend seeking "
            "medical attention promptly."
        )
    elif urgency == "Medium":
        advisory_parts.append(
            "Based on the combined analysis, we recommend scheduling "
            "a medical consultation soon."
        )
    else:
        advisory_parts.append(
            "Your current health indicators are within a manageable range. "
            "Continue monitoring your health."
        )

    advisory_message = " ".join(advisory_parts)

    # Next steps based on urgency
    next_steps = []
    if urgency == "High":
        next_steps = [
            "Consult a healthcare professional as soon as possible.",
            "Share your prediction report with your doctor.",
            "Monitor your vitals closely.",
            "Avoid self-medication and follow professional advice."
        ]
    elif urgency == "Medium":
        next_steps = [
            "Schedule a medical appointment within the next few days.",
            "Review your recommendations and follow precautions.",
            "Monitor symptoms and note any changes.",
            "Maintain a healthy diet and adequate rest."
        ]
    else:
        next_steps = [
            "Continue following your personalised recommendations.",
            "Maintain regular health checkups.",
            "Keep recording symptoms for future reference.",
            "Stay active and eat a balanced diet."
        ]

    # Warning signs
    warning_signs = []
    if risk_summary:
        if risk_summary["fever"] == "Yes":
            warning_signs.append("Persistent or high fever.")
        if risk_summary["difficulty_breathing"] == "Yes":
            warning_signs.append("Difficulty breathing or shortness of breath.")
        if risk_summary["blood_pressure"] == "High":
            warning_signs.append("High blood pressure readings.")
        if risk_summary["cholesterol_level"] == "High":
            warning_signs.append("Elevated cholesterol levels.")

    if not warning_signs:
        warning_signs.append("No immediate warning signs detected.")

    # Lifestyle modifications
    lifestyle_modifications = []
    if risk_summary:
        if risk_summary["blood_pressure"] == "High":
            lifestyle_modifications.append(
                "Reduce sodium intake and practise stress management."
            )
        if risk_summary["cholesterol_level"] == "High":
            lifestyle_modifications.append(
                "Switch to a low-fat, high-fibre diet."
            )
        if risk_summary["fatigue"] == "Yes":
            lifestyle_modifications.append(
                "Ensure 7-8 hours of sleep and avoid overexertion."
            )

    lifestyle_modifications.extend([
        "Stay hydrated — drink at least 2-3 litres of water daily.",
        "Exercise for at least 30 minutes most days.",
        "Avoid smoking and limit alcohol consumption."
    ])

    return {
        "urgency": urgency,
        "advisory_message": advisory_message,
        "next_steps": next_steps,
        "warning_signs": warning_signs,
        "lifestyle_modifications": lifestyle_modifications,
        "prediction_summary": prediction_summary,
        "risk_summary": risk_summary,
    }