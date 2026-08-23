import json
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import get_current_user
from database import Assessment, Prescription, ProviderProfile, User, get_db
from roles import CLINICAL_STAFF_ROLES
from services import get_cascade

router = APIRouter()

REPORTS_DIR = "generated_reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


# ===== Pydantic Models =====
class ProviderProfileCreate(BaseModel):
    full_name: str
    qualifications: str
    registration_number: str
    clinic_name: str
    clinic_address: str
    clinic_contact: str
    signature_image: Optional[str] = None
    stamp_image: Optional[str] = None
    signature_type: str = "typed"


class MedicationItem(BaseModel):
    drug_name: str
    brand_name: Optional[str] = None
    dosage_form: str
    strength: str
    frequency: str
    route: str
    duration: str
    instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    patient_id: int
    patient_name: str
    patient_age: int = Field(..., ge=0, le=150)
    patient_sex: str
    patient_address: Optional[str] = None
    medications: List[MedicationItem]
    additional_notes: Optional[str] = None


# ===== Provider Profile Endpoints =====
@router.post("/provider-profile")
def create_or_update_provider_profile(
    profile_data: ProviderProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update provider practice profile (clinical staff only)"""
    if current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Only clinical staff can create provider profiles")
    
    # Check if profile exists
    existing_profile = db.query(ProviderProfile).filter(
        ProviderProfile.user_id == current_user.id
    ).first()
    
    if existing_profile:
        # Update existing profile
        for key, value in profile_data.model_dump().items():
            setattr(existing_profile, key, value)
        db.commit()
        db.refresh(existing_profile)
        return {"message": "Provider profile updated successfully", "profile_id": existing_profile.id}
    else:
        # Create new profile
        new_profile = ProviderProfile(
            user_id=current_user.id,
            **profile_data.model_dump()
        )
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return {"message": "Provider profile created successfully", "profile_id": new_profile.id}


@router.get("/provider-profile")
def get_provider_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's provider profile"""
    if current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Only clinical staff can access provider profiles")
    
    profile = db.query(ProviderProfile).filter(
        ProviderProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        return {"exists": False, "profile": None}
    
    return {
        "exists": True,
        "profile": {
            "id": profile.id,
            "full_name": profile.full_name,
            "qualifications": profile.qualifications,
            "registration_number": profile.registration_number,
            "clinic_name": profile.clinic_name,
            "clinic_address": profile.clinic_address,
            "clinic_contact": profile.clinic_contact,
            "signature_image": profile.signature_image,
            "stamp_image": profile.stamp_image,
            "signature_type": profile.signature_type,
        }
    }


# ===== Prescription Endpoints =====
@router.post("/prescriptions")
def create_prescription(
    prescription_data: PrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new prescription (clinical staff only, requires complete provider profile)"""
    if current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Only clinical staff can create prescriptions")
    
    # Check if provider profile is complete
    provider_profile = db.query(ProviderProfile).filter(
        ProviderProfile.user_id == current_user.id
    ).first()
    
    if not provider_profile:
        raise HTTPException(
            status_code=400,
            detail="Complete your practice details before issuing prescriptions"
        )
    
    # Validate required fields
    if not all([
        provider_profile.full_name,
        provider_profile.qualifications,
        provider_profile.registration_number,
        provider_profile.clinic_name,
        provider_profile.clinic_address,
        provider_profile.clinic_contact
    ]):
        raise HTTPException(
            status_code=400,
            detail="Provider profile is incomplete. Please fill all required fields."
        )
    
    # Create prescription
    new_prescription = Prescription(
        patient_id=prescription_data.patient_id,
        provider_id=current_user.id,
        patient_name=prescription_data.patient_name,
        patient_age=prescription_data.patient_age,
        patient_sex=prescription_data.patient_sex,
        patient_address=prescription_data.patient_address,
        medications_json=json.dumps([med.model_dump() for med in prescription_data.medications]),
        additional_notes=prescription_data.additional_notes,
        is_signed=True,  # Auto-sign on creation
    )
    
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)
    
    return {
        "message": "Prescription created successfully",
        "prescription_id": new_prescription.id,
        "patient_id": new_prescription.patient_id,
    }


@router.get("/prescriptions/my-prescriptions")
def get_my_prescriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions for current patient"""
    prescriptions = (
        db.query(Prescription, User, ProviderProfile)
        .join(User, Prescription.provider_id == User.id)
        .join(ProviderProfile, ProviderProfile.user_id == User.id)
        .filter(Prescription.patient_id == current_user.id)
        .order_by(Prescription.date_issued.desc())
        .all()
    )
    
    return [{
        "id": prescription.id,
        "provider_name": provider_profile.full_name,
        "provider_qualifications": provider_profile.qualifications,
        "clinic_name": provider_profile.clinic_name,
        "date_issued": prescription.date_issued.isoformat(),
        "medications": json.loads(prescription.medications_json),
        "patient_name": prescription.patient_name,
        "patient_age": prescription.patient_age,
        "patient_sex": prescription.patient_sex,
        "additional_notes": prescription.additional_notes,
    } for prescription, provider, provider_profile in prescriptions]


@router.get("/prescriptions/issued")
def get_issued_prescriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions issued by current provider"""
    if current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Only clinical staff can access this endpoint")
    
    prescriptions = (
        db.query(Prescription, User)
        .join(User, Prescription.patient_id == User.id)
        .filter(Prescription.provider_id == current_user.id)
        .order_by(Prescription.date_issued.desc())
        .all()
    )
    
    return [{
        "id": prescription.id,
        "patient_name": prescription.patient_name,
        "patient_email": patient.email,
        "patient_age": prescription.patient_age,
        "date_issued": prescription.date_issued.isoformat(),
        "medications_count": len(json.loads(prescription.medications_json)),
    } for prescription, patient in prescriptions]


@router.get("/prescriptions")
def get_all_prescriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions (Clinical staff only - for viewing patient history)"""
    if current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Only clinical staff can access this endpoint")
    
    prescriptions = (
        db.query(Prescription, User, ProviderProfile)
        .join(User, Prescription.patient_id == User.id)
        .join(ProviderProfile, Prescription.provider_id == ProviderProfile.user_id)
        .order_by(Prescription.date_issued.desc())
        .all()
    )
    
    return [{
        "id": prescription.id,
        "patient_id": prescription.patient_id,
        "patient_name": prescription.patient_name,
        "patient_email": patient.email,
        "patient_age": prescription.patient_age,
        "patient_sex": prescription.patient_sex,
        "provider_id": prescription.provider_id,
        "provider_name": provider_profile.full_name,
        "provider_qualifications": provider_profile.qualifications,
        "clinic_name": provider_profile.clinic_name,
        "date_issued": prescription.date_issued.isoformat(),
        "medications": json.loads(prescription.medications_json),
    } for prescription, patient, provider_profile in prescriptions]


@router.get("/prescriptions/{prescription_id}")
def get_prescription_detail(
    prescription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get prescription details"""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Check access
    if prescription.patient_id != current_user.id and prescription.provider_id != current_user.id:
        if current_user.role not in CLINICAL_STAFF_ROLES:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get provider profile
    provider_profile = db.query(ProviderProfile).filter(
        ProviderProfile.user_id == prescription.provider_id
    ).first()
    
    return {
        "id": prescription.id,
        "patient_name": prescription.patient_name,
        "patient_age": prescription.patient_age,
        "patient_sex": prescription.patient_sex,
        "patient_address": prescription.patient_address,
        "medications": json.loads(prescription.medications_json),
        "additional_notes": prescription.additional_notes,
        "date_issued": prescription.date_issued.isoformat(),
        "provider": {
            "name": provider_profile.full_name,
            "qualifications": provider_profile.qualifications,
            "registration_number": provider_profile.registration_number,
            "clinic_name": provider_profile.clinic_name,
            "clinic_address": provider_profile.clinic_address,
            "clinic_contact": provider_profile.clinic_contact,
            "signature_image": provider_profile.signature_image,
            "stamp_image": provider_profile.stamp_image,
            "signature_type": provider_profile.signature_type,
        } if provider_profile else None
    }


@router.get("/prescriptions/{prescription_id}/download")
def download_prescription(
    prescription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download prescription as PDF"""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Check access
    if prescription.patient_id != current_user.id and prescription.provider_id != current_user.id:
        if current_user.role not in CLINICAL_STAFF_ROLES:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get provider profile
    provider_profile = db.query(ProviderProfile).filter(
        ProviderProfile.user_id == prescription.provider_id
    ).first()
    
    filepath = os.path.join(REPORTS_DIR, f"prescription_{prescription_id}.pdf")
    
    # Build PDF
    from report_builder import build_prescription_pdf
    build_prescription_pdf(
        filepath=filepath,
        prescription=prescription,
        provider_profile=provider_profile,
    )
    
    return FileResponse(
        filepath,
        media_type='application/pdf',
        filename=f"Prescription_{prescription_id}.pdf"
    )


# ===== Treatment suggestions for the prescription form =====

PRESCRIBING_NOTE = (
    "Decision support only. Dose, frequency, route and duration are the "
    "prescriber's judgement - the models do not estimate them.")

@router.get("/treatment-suggestions")
def treatment_suggestions(
    query: Optional[str] = None,
    patient_id: Optional[int] = None,
    top_n: int = 8,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cascade recommendations for the prescriber, keyed either to a free-text
    condition or to a patient's most recent assessment.

    This is the bridge between the assessment and the prescription pad. It
    exists so a prescriber does not have to retype a drug name they were just
    shown - and, more importantly, so the SOURCE travels with it. The response
    carries `layer` and the caveat, and the UI must show them: "co-prescribed
    in similar admissions" and "patients rated this highly" are not
    interchangeable grounds for writing a prescription.

    Nothing here writes a prescription. The prescriber still types the strength,
    frequency, route and duration, because the models have no opinion on any of
    those and must not appear to.
    """
    if current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized for this action")

    disease = None
    source = "query"
    assessment_id = None

    def _empty(reason: str, **extra):
        """Same envelope as a real answer, so the UI never branches on shape."""
        return {"available": False, "reason": reason, "layer": "none",
                "layer_label": "No treatment data available for this condition",
                "gate_reason": "no_data", "condition": None, "drugs": [],
                "evidence": {"source": None, "caveat": reason},
                "source": source, "query": query, "disease": disease,
                "assessment_id": assessment_id,
                "prescribing_note": PRESCRIBING_NOTE, **extra}

    if patient_id is not None:
        record = (db.query(Assessment)
                    .filter(Assessment.user_id == patient_id)
                    .order_by(Assessment.created_at.desc())
                    .first())
        if record is None:
            return _empty("This patient has no assessment on record.")
        try:
            result = json.loads(record.result_json)
        except (TypeError, ValueError):
            raise HTTPException(status_code=500,
                                detail="Stored assessment could not be read")
        diagnosis = result.get("diagnosis") or {}
        disease = diagnosis.get("top_disease")
        assessment_id = record.id
        source = "latest_assessment"
        if not disease:
            return _empty("The patient's latest assessment matched no "
                          "condition, so there is nothing to suggest.")

    text = (query or disease or "").strip()
    if not text:
        raise HTTPException(status_code=400,
                            detail="Provide either `query` or `patient_id`.")

    result = get_cascade().recommend(text, disease=disease,
                                     top_n=max(1, min(top_n, 20)))
    result["source"] = source
    result["query"] = text
    result["disease"] = disease
    result["assessment_id"] = assessment_id
    result["prescribing_note"] = PRESCRIBING_NOTE
    return result
