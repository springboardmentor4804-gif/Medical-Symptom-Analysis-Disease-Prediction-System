from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Symptom
from app.schemas import (
    SymptomCreate,
    SymptomUpdate,
    SymptomResponse,
)

router = APIRouter(
    prefix="/patient/symptoms",
    tags=["Symptoms"]
)


@router.post("/", response_model=SymptomResponse)
def create_symptom(
    symptom: SymptomCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_symptom = Symptom(
        patient_id=user.id,
        **symptom.model_dump()
    )

    db.add(new_symptom)
    db.commit()
    db.refresh(new_symptom)

    return new_symptom


@router.get("/", response_model=SymptomResponse)
def get_latest_symptom(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    symptom = (
        db.query(Symptom)
        .filter(Symptom.patient_id == user.id)
        .order_by(Symptom.created_at.desc())
        .first()
    )

    if not symptom:
        raise HTTPException(status_code=404, detail="No symptom records found")

    return symptom


@router.get("/history", response_model=list[SymptomResponse])
def get_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    return (
        db.query(Symptom)
        .filter(Symptom.patient_id == user.id)
        .order_by(Symptom.created_at.desc())
        .all()
    )


@router.put("/{symptom_id}", response_model=SymptomResponse)
def update_symptom(
    symptom_id: int,
    symptom_data: SymptomUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    symptom = (
        db.query(Symptom)
        .filter(
            Symptom.id == symptom_id,
            Symptom.patient_id == user.id
        )
        .first()
    )

    if not symptom:
        raise HTTPException(status_code=404, detail="Record not found")

    update_data = symptom_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(symptom, key, value)

    db.commit()
    db.refresh(symptom)

    return symptom


@router.delete("/{symptom_id}")
def delete_symptom(
    symptom_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    symptom = (
        db.query(Symptom)
        .filter(
            Symptom.id == symptom_id,
            Symptom.patient_id == user.id
        )
        .first()
    )

    if not symptom:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(symptom)
    db.commit()

    return {
        "message": "Symptom record deleted successfully"
    }