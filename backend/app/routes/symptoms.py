import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.symptom import Symptom
from app.schemas.symptoms import SymptomCreate, SymptomUpdate, SymptomResponse
from app.dependencies import RoleChecker
from app.mongo_database import symptoms_collection, user_inputs_collection
from app.mongo_models import MongoSymptom, MongoUserInput

router = APIRouter(prefix="/symptoms", tags=["Symptoms"])


async def _mirror_symptoms_to_mongo(
    symptoms: list,
    user_email: str,
    patient_name: str,
    submitted_at: datetime,
) -> None:
    """Background task: insert symptoms into MongoDB (fire-and-forget)."""
    try:
        docs = []
        for sym in symptoms:
            mongo_sym = MongoSymptom(
                user_email=user_email,
                patient_name=patient_name,
                symptom_name=sym.symptom_name,
                submitted_at=submitted_at,
            )
            docs.append(mongo_sym.model_dump())

        if docs:
            await symptoms_collection().insert_many(docs)

        # Log to generic user_inputs collection
        mongo_input = MongoUserInput(
            input_type="symptom_submission",
            user_email=user_email,
            payload={
                "symptoms": [s["symptom_name"] for s in docs],
                "patient_name": patient_name,
                "submitted_at": submitted_at.isoformat(),
            },
        )
        await user_inputs_collection().insert_one(mongo_input.model_dump())
    except Exception as exc:
        print(f"[MongoDB] ⚠️  Symptom mirror failed: {exc}")

@router.post("", response_model=List[SymptomResponse], status_code=status.HTTP_201_CREATED)
async def create_symptoms(
    symptom_data: SymptomCreate,
    current_user: User = Depends(RoleChecker(["patient"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )
    
    now = datetime.utcnow()
    created_records = []
    
    raw_names = []
    if symptom_data.symptom_name:
        raw_names.append(symptom_data.symptom_name)
    if symptom_data.symptom_names:
        raw_names.extend(symptom_data.symptom_names)

    for symptom_name in raw_names:
        # Strip whitespace and check if name is empty
        clean_name = symptom_name.strip()
        if not clean_name:
            continue
        new_sym = Symptom(
            patient_id=patient.id,
            symptom_name=clean_name,
            occurrence_count=symptom_data.occurrence_count or 1,
            duration_onset=symptom_data.duration_onset or "Just today",
            submitted_at=now
        )
        db.add(new_sym)
        created_records.append(new_sym)
        
    if not created_records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid symptoms provided."
        )
        
    db.commit()
    for record in created_records:
        db.refresh(record)

    # Mirror symptom submissions to MongoDB (non-blocking)
    asyncio.create_task(
        _mirror_symptoms_to_mongo(
            symptoms=created_records,
            user_email=current_user.email,
            patient_name=patient.name,
            submitted_at=now,
        )
    )

    return created_records

@router.get("/me", response_model=List[SymptomResponse])
def get_my_symptoms(
    current_user: User = Depends(RoleChecker(["patient"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )
    
    symptoms = db.query(Symptom).filter(Symptom.patient_id == patient.id).order_by(Symptom.submitted_at.desc()).all()
    return symptoms

@router.get("/frequency-stats")
def get_symptom_frequency_stats(
    current_user: User = Depends(RoleChecker(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient and current_user.role == "patient":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )
    
    patient_id = patient.id if patient else 1
    symptoms = db.query(Symptom).filter(Symptom.patient_id == patient_id).all()
    
    freq_map = {}
    duration_map = {}
    total_episodes = 0
    for sym in symptoms:
        name = sym.symptom_name.strip()
        cnt = sym.occurrence_count or 1
        freq_map[name] = freq_map.get(name, 0) + cnt
        duration_map[name] = sym.duration_onset or "Just today"
        total_episodes += cnt
        
    return {
        "symptom_counts": freq_map,
        "symptom_durations": duration_map,
        "total_records": len(symptoms),
        "total_episodes": total_episodes
    }

@router.put("/{symptom_id}", response_model=SymptomResponse)
def update_symptom(
    symptom_id: int,
    symptom_data: SymptomUpdate,
    current_user: User = Depends(RoleChecker(["patient"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    symptom = db.query(Symptom).filter(
        Symptom.id == symptom_id,
        Symptom.patient_id == patient.id
    ).first()

    if not symptom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Symptom record not found or access denied."
        )

    clean_name = symptom_data.symptom_name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Symptom name cannot be empty."
        )

    symptom.symptom_name = clean_name
    if symptom_data.occurrence_count is not None:
        symptom.occurrence_count = symptom_data.occurrence_count
    if symptom_data.duration_onset is not None:
        symptom.duration_onset = symptom_data.duration_onset

    db.commit()
    db.refresh(symptom)
    return symptom

@router.delete("/{symptom_id}")
def delete_symptom(
    symptom_id: int,
    current_user: User = Depends(RoleChecker(["patient"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    symptom = db.query(Symptom).filter(
        Symptom.id == symptom_id,
        Symptom.patient_id == patient.id
    ).first()

    if not symptom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Symptom record not found or access denied."
        )

    db.delete(symptom)
    db.commit()
    return {"message": "Symptom deleted successfully", "symptom_id": symptom_id}
