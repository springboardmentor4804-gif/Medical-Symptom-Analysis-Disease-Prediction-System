from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, PatientProfile, Symptom, Prediction

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/profile")
def profile_report(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    profile = db.query(PatientProfile).filter(
        PatientProfile.user_id == user.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


@router.get("/symptoms")
def symptoms_report(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

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