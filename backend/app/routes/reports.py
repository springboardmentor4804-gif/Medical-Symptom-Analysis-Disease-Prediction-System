from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    User,
    PatientProfile,
    Symptom,
    Prediction,
    DoctorPatientAssignment,
)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


# ============================================================
# PATIENT REPORTS
# ============================================================

@router.get("/profile")
def profile_report(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    profile = db.query(PatientProfile).filter(
        PatientProfile.user_id == user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return profile


@router.get("/symptoms")
def symptoms_report(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return db.query(Symptom).filter(
        Symptom.patient_id == user.id
    ).all()


@router.get("/predictions")
def predictions_report(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return db.query(Prediction).filter(
        Prediction.patient_id == user.id
    ).all()


@router.get("/summary")
def summary_report(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    profile = db.query(PatientProfile).filter(
        PatientProfile.user_id == user.id
    ).first()

    symptoms = (
        db.query(Symptom)
        .filter(Symptom.patient_id == user.id)
        .order_by(Symptom.created_at.desc())
        .all()
    )

    predictions = (
        db.query(Prediction)
        .filter(Prediction.patient_id == user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    profile_data = None

    if profile:
        profile_data = {
            "id": profile.id,
            "user_id": profile.user_id,

            # User table data
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,

            # Patient profile data
            "phone": profile.phone,
            "date_of_birth": profile.date_of_birth,
            "gender": profile.gender,
            "blood_group": profile.blood_group,
            "height": profile.height,
            "weight": profile.weight,
            "address": profile.address,
            "emergency_contact": profile.emergency_contact,
            "allergies": profile.allergies,
            "medical_history": profile.medical_history,
        }

    return {
        "profile": profile_data,
        "symptoms": symptoms,
        "predictions": predictions,
    }


# ============================================================
# DOCTOR REPORTS
# ============================================================

@router.get("/doctor")
def doctor_reports(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Verify doctor
    # --------------------------------------------------------

    if current_user["role"].lower() != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    # --------------------------------------------------------
    # Find logged-in doctor
    # --------------------------------------------------------

    doctor = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    # --------------------------------------------------------
    # Get assigned patients
    # --------------------------------------------------------

    assignments = db.query(
        DoctorPatientAssignment
    ).filter(
        DoctorPatientAssignment.doctor_id == doctor.id
    ).all()

    patient_ids = [
        assignment.patient_id
        for assignment in assignments
    ]

    # --------------------------------------------------------
    # No assigned patients
    # --------------------------------------------------------

    if not patient_ids:
        return {
            "doctor": {
                "id": doctor.id,
                "full_name": doctor.full_name,
                "email": doctor.email,
            },
            "total_reports": 0,
            "reports": []
        }

    # --------------------------------------------------------
    # Get predictions for assigned patients
    # --------------------------------------------------------

    predictions = (
        db.query(Prediction)
        .filter(
            Prediction.patient_id.in_(patient_ids)
        )
        .order_by(
            Prediction.created_at.desc()
        )
        .all()
    )

    # --------------------------------------------------------
    # Get patient information
    # --------------------------------------------------------

    patients = db.query(User).filter(
        User.id.in_(patient_ids)
    ).all()

    patient_map = {
        patient.id: patient
        for patient in patients
    }

    # --------------------------------------------------------
    # Build report list
    # --------------------------------------------------------

    reports = []

    for prediction in predictions:

        patient = patient_map.get(
            prediction.patient_id
        )

        if not patient:
            continue

        reports.append({
            "prediction_id": prediction.id,
            "patient_id": prediction.patient_id,

            "patient": {
                "id": patient.id,
                "full_name": patient.full_name,
                "email": patient.email,
            },

            "predicted_disease": prediction.predicted_disease,

            "confidence": float(
                prediction.confidence
            )
            if prediction.confidence is not None
            else None,

            "risk_score": float(
                prediction.risk_score
            )
            if prediction.risk_score is not None
            else None,

            "risk_level": prediction.risk_level,

            "severity_score": float(
                prediction.severity_score
            )
            if prediction.severity_score is not None
            else None,

            "severity_level": prediction.severity_level,

            "recommendation": prediction.recommendation,

            "created_at": prediction.created_at,
        })

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "doctor": {
            "id": doctor.id,
            "full_name": doctor.full_name,
            "email": doctor.email,
        },
        "total_reports": len(reports),
        "reports": reports,
    }