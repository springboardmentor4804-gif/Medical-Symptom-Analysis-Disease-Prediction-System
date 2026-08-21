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

    assigned_patient_ids = [
        assignment.patient_id
        for assignment in db.query(
            DoctorPatientAssignment
        ).filter(
            DoctorPatientAssignment.doctor_id == doctor.id
        ).all()
]

    total_patients = len(assigned_patient_ids)

    total_predictions = db.query(Prediction).count()

    total_reports = db.query(PatientProfile).count()

    high_risk = db.query(Prediction).filter(
        Prediction.patient_id.in_(assigned_patient_ids),
        Prediction.risk_level == "High"
    ).count()
    return {
        "total_patients": total_patients,
        "total_predictions": total_predictions,
        "total_reports": total_reports,
        "high_risk_patients": high_risk
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