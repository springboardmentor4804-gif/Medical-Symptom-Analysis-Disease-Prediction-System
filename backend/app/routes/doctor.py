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
    prefix="/doctor",
    tags=["Doctor"]
)


def verify_doctor(current_user):
    if current_user["role"].lower() != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )


@router.get("/dashboard")
def doctor_dashboard(
    current_user=Depends(get_current_user)
):
    verify_doctor(current_user)

    return {
        "message": f"Welcome Dr. {current_user['sub']}"
    }


@router.get("/patients")
def get_patients(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_doctor(current_user)

    doctor = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    assignments = db.query(
        DoctorPatientAssignment
    ).filter(
        DoctorPatientAssignment.doctor_id == doctor.id
    ).all()

    patient_ids = [
        assignment.patient_id
        for assignment in assignments
    ]

    if not patient_ids:
        return []

    patients = db.query(User).filter(
        User.id.in_(patient_ids)
    ).all()

    return patients
@router.get("/patient/{patient_id}")
def patient_profile(
    patient_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_doctor(current_user)

    user = db.query(User).filter(User.id == patient_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    profile = db.query(PatientProfile).filter(
        PatientProfile.user_id == patient_id
    ).first()

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,

        "phone": profile.phone if profile else None,
        "date_of_birth": profile.date_of_birth if profile else None,
        "gender": profile.gender if profile else None,
        "blood_group": profile.blood_group if profile else None,
        "height": profile.height if profile else None,
        "weight": profile.weight if profile else None,
        "address": profile.address if profile else None,
        "emergency_contact": profile.emergency_contact if profile else None,
        "allergies": profile.allergies if profile else None,
        "medical_history": profile.medical_history if profile else None,
    }

@router.get("/patient/{patient_id}/symptoms")
def patient_symptoms(
    patient_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_doctor(current_user)

    return db.query(Symptom).filter(
        Symptom.patient_id == patient_id
    ).all()


@router.get("/patient/{patient_id}/predictions")
def patient_predictions(
    patient_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_doctor(current_user)

    return db.query(Prediction).filter(
        Prediction.patient_id == patient_id
    ).all()

@router.get("/summary")
def doctor_summary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_doctor(current_user)

    doctor = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    # Get patients assigned to this doctor
    assignments = db.query(
        DoctorPatientAssignment
    ).filter(
        DoctorPatientAssignment.doctor_id == doctor.id
    ).all()

    patient_ids = [
        assignment.patient_id
        for assignment in assignments
    ]

    # No assigned patients
    if not patient_ids:
        return {
            "total_patients": 0,
            "total_predictions": 0,
            "total_reports": 0,
            "high_risk_patients": 0,
            "critical_risk_patients": 0,
            "average_risk_score": 0,
            "average_severity_score": 0,
            "disease_distribution": [],
            "risk_distribution": [],
            "health_trends": []
        }

    # Get predictions only for assigned patients
    predictions = db.query(Prediction).filter(
        Prediction.patient_id.in_(patient_ids)
    ).order_by(
        Prediction.created_at.asc()
    ).all()

    # Basic statistics
    total_patients = len(patient_ids)
    total_predictions = len(predictions)

    total_reports = db.query(PatientProfile).filter(
        PatientProfile.user_id.in_(patient_ids)
    ).count()

    high_risk_patients = len({
        prediction.patient_id
        for prediction in predictions
        if prediction.risk_level == "High"
    })

    critical_risk_patients = len({
        prediction.patient_id
        for prediction in predictions
        if prediction.risk_level == "Critical"
    })

    # Disease distribution
    disease_counts = {}

    for prediction in predictions:
        disease = prediction.predicted_disease

        if disease:
            disease_counts[disease] = (
                disease_counts.get(disease, 0) + 1
            )

    disease_distribution = [
        {
            "disease": disease,
            "count": count
        }
        for disease, count in disease_counts.items()
    ]

    # Risk distribution
    risk_counts = {}

    for prediction in predictions:
        risk = prediction.risk_level or "Unknown"

        risk_counts[risk] = (
            risk_counts.get(risk, 0) + 1
        )

    risk_distribution = [
        {
            "level": level,
            "count": count
        }
        for level, count in risk_counts.items()
    ]

    # Average scores
    risk_scores = []
    severity_scores = []

    for prediction in predictions:

        
        if prediction.risk_score is not None:
            risk_scores.append(
                float(prediction.risk_score)
            )

        
        if prediction.severity_score is not None:
            severity_scores.append(
                float(prediction.severity_score)
            )

    average_risk_score = (
        round(
            sum(risk_scores) / len(risk_scores),
            2
        )
        if risk_scores
        else 0
    )

    average_severity_score = (
        round(
            sum(severity_scores) / len(severity_scores),
            2
        )
        if severity_scores
        else 0
    )

    # Health trends
    health_trends = []

    for prediction in predictions:

        health_trends.append({
        "date": prediction.created_at,
        "disease": prediction.predicted_disease,
        "risk_score": float(
            prediction.risk_score
        )
        if prediction.risk_score is not None
        else 0,

        "severity_score": float(
            prediction.severity_score
        )
        if prediction.severity_score is not None
        else 0,
        })

       

    return {
        "total_patients": total_patients,
        "total_predictions": total_predictions,
        "total_reports": total_reports,
        "high_risk_patients": high_risk_patients,
        "critical_risk_patients": critical_risk_patients,
        "average_risk_score": average_risk_score,
        "average_severity_score": average_severity_score,
        "disease_distribution": disease_distribution,
        "risk_distribution": risk_distribution,
        "health_trends": health_trends
    }
@router.get("/profile")
def doctor_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_doctor(current_user)

    doctor = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    return {
        "id": doctor.id,
        "full_name": doctor.full_name,
        "email": doctor.email,
        "role": doctor.role,
        "created_at": doctor.created_at,
    }