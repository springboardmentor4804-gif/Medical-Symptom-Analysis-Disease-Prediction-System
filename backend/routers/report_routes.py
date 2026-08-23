import json
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import Assessment, PatientProfile, ProviderReport, User, get_db
from report_builder import build_pdf
from roles import CLINICAL_STAFF_ROLES

router = APIRouter()

REPORTS_DIR = "generated_reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


class ProviderReportCreate(BaseModel):
    assessment_id: int
    patient_id: int
    provider_insights: str
    treatment_suggestions: str
    health_recommendations: str
    doctor_suggestions: Optional[str] = None
    additional_notes: Optional[str] = None


@router.post("/provider-reports")
def create_provider_report(
    report_data: ProviderReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new provider report for a patient assessment (Clinical staff only)"""
    if current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Only clinical staff can create reports")
    
    # Verify assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == report_data.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Check if report already exists for this assessment
    existing_report = db.query(ProviderReport).filter(
        ProviderReport.assessment_id == report_data.assessment_id
    ).first()
    if existing_report:
        raise HTTPException(status_code=400, detail="Report already exists for this assessment")
    
    # Create new provider report
    new_report = ProviderReport(
        assessment_id=report_data.assessment_id,
        patient_id=report_data.patient_id,
        provider_id=current_user.id,
        provider_insights=report_data.provider_insights,
        treatment_suggestions=report_data.treatment_suggestions,
        health_recommendations=report_data.health_recommendations,
        doctor_suggestions=report_data.doctor_suggestions,
        additional_notes=report_data.additional_notes,
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {
        "id": new_report.id,
        "assessment_id": new_report.assessment_id,
        "patient_id": new_report.patient_id,
        "message": "Provider report created successfully"
    }


@router.get("/provider-reports/patient/{patient_id}")
def get_patient_reports(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all provider reports for a specific patient (Clinical staff only)"""
    if current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Only clinical staff can view patient reports")
    
    reports = db.query(ProviderReport).filter(ProviderReport.patient_id == patient_id).all()
    
    return [{
        "id": r.id,
        "assessment_id": r.assessment_id,
        "patient_id": r.patient_id,
        "provider_id": r.provider_id,
        "created_at": r.created_at.isoformat(),
        "updated_at": r.updated_at.isoformat(),
    } for r in reports]


@router.get("/my-provider-reports")
def get_my_provider_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all provider reports for the current patient"""
    reports = (
        db.query(ProviderReport, Assessment, User)
        .join(Assessment, ProviderReport.assessment_id == Assessment.id)
        .join(User, ProviderReport.provider_id == User.id)
        .filter(ProviderReport.patient_id == current_user.id)
        .order_by(ProviderReport.created_at.desc())
        .all()
    )
    
    return [{
        "id": report.id,
        "assessment_id": report.assessment_id,
        "provider_email": provider.email,
        "provider_role": provider.role,
        "provider_insights": report.provider_insights,
        "treatment_suggestions": report.treatment_suggestions,
        "health_recommendations": report.health_recommendations,
        "doctor_suggestions": report.doctor_suggestions,
        "additional_notes": report.additional_notes,
        "created_at": report.created_at.isoformat(),
        "assessment_date": assessment.created_at.isoformat(),
        "risk_flag": assessment.risk_flag,
    } for report, assessment, provider in reports]


@router.get("/provider-reports")
def get_all_provider_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all provider reports (Clinical staff only)"""
    if current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Only clinical staff can view all reports")
    
    reports = (
        db.query(ProviderReport, User)
        .join(User, ProviderReport.patient_id == User.id)
        .order_by(ProviderReport.created_at.desc())
        .all()
    )
    
    return [{
        "id": report.id,
        "assessment_id": report.assessment_id,
        "patient_id": report.patient_id,
        "patient_email": patient.email,
        "provider_id": report.provider_id,
        "created_at": report.created_at.isoformat(),
    } for report, patient in reports]


@router.get("/provider-reports/{report_id}/download")
def download_provider_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a provider report as PDF"""
    report = db.query(ProviderReport).filter(ProviderReport.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Only the patient or clinical staff can download
    if report.patient_id != current_user.id and current_user.role not in CLINICAL_STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get related data
    assessment = db.query(Assessment).filter(Assessment.id == report.assessment_id).first()
    provider = db.query(User).filter(User.id == report.provider_id).first()
    patient = db.query(User).filter(User.id == report.patient_id).first()
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == report.patient_id).first()
    
    filepath = os.path.join(REPORTS_DIR, f"provider_report_{report_id}.pdf")
    
    # Build the PDF with provider report data
    from report_builder import build_provider_report_pdf
    build_provider_report_pdf(
        filepath=filepath,
        report=report,
        assessment=assessment,
        provider=provider,
        patient=patient,
        profile=profile,
    )
    
    return FileResponse(
        filepath,
        media_type='application/pdf',
        filename=f"MedAssist_Provider_Report_{report_id}.pdf"
    )


@router.get("/report/{assessment_id}")
def generate_report(assessment_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")

    input_data = json.loads(record.input_json)
    result = json.loads(record.result_json)

    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    profile_dict = None
    if profile:
        profile_dict = {
            "full_name": profile.full_name,
            "date_of_birth": profile.date_of_birth,
            "gender": profile.gender,
            "allergies": profile.allergies,
            "medical_history": profile.medical_history,
        }

    filepath = os.path.join(REPORTS_DIR, f"report_{assessment_id}_{current_user.id}.pdf")

    build_pdf(
        filepath,
        patient_email=current_user.email,
        profile=profile_dict,
        input_data=input_data,
        result=result,
        assessment_created_at=record.created_at,
        assessment_id=assessment_id,
    )

    return FileResponse(filepath, media_type='application/pdf', filename=f"MedAssist_Report_{assessment_id}.pdf")
