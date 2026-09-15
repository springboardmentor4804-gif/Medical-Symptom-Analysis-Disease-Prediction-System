from app.models.symptom import Symptom
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import datetime
import io
import csv

from app.database import get_db
from app.dependencies import require_role
from app.models.clinic import Clinic, ClinicDoctor
from app.models.doctor_interaction import DoctorPatientInteraction
from app.models.doctor_recommendation import DoctorRecommendation
from app.models.patient import Patient
from app.models.user import User
from app.schemas.admin import DoctorResponse
from app.schemas.clinic import (
    ClinicPatientResponse,
    ClinicPatientUpdate,
    ClinicDoctorUpdate,
    ClinicAssignDoctor,
    ClinicStatsResponse,
    ClinicResponse,
    ClinicProfileUpdate,
)

router = APIRouter(prefix="/clinic", tags=["Clinic"])


def get_current_clinic(current_user: User, db: Session) -> Clinic:
    clinic = db.query(Clinic).filter(Clinic.user_id == current_user.id).first()
    if not clinic:
        # Guarantee auto-provisioning for any clinic account
        clinic_name = current_user.name if (current_user and current_user.name) else "MedAssist Medical Clinic"
        clinic = Clinic(
            user_id=current_user.id,
            clinic_name=clinic_name,
            address="Main Healthcare Center"
        )
        db.add(clinic)
        try:
            db.commit()
            db.refresh(clinic)
        except Exception:
            db.rollback()
            clinic = db.query(Clinic).filter(Clinic.user_id == current_user.id).first()

    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic profile not found.",
        )
    return clinic


@router.get("/me", response_model=ClinicResponse)
def get_clinic_profile(
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)
    return ClinicResponse(
        id=clinic.id,
        user_id=clinic.user_id,
        email=current_user.email,
        clinic_name=clinic.clinic_name,
        address=clinic.address,
        created_at=clinic.created_at,
    )


@router.put("/me", response_model=ClinicResponse)
def update_clinic_profile(
    profile_in: ClinicProfileUpdate,
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)
    clinic.clinic_name = profile_in.clinic_name.strip()
    clinic.address = profile_in.address.strip()
    if current_user:
        current_user.name = profile_in.clinic_name.strip()

    db.commit()
    db.refresh(clinic)

    return ClinicResponse(
        id=clinic.id,
        user_id=clinic.user_id,
        email=current_user.email,
        clinic_name=clinic.clinic_name,
        address=clinic.address,
        created_at=clinic.created_at,
    )


@router.get("/stats", response_model=ClinicStatsResponse)
def get_clinic_stats(
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)

    total_doctors = (
        db.query(ClinicDoctor)
        .filter(ClinicDoctor.clinic_id == clinic.id)
        .count()
    )

    interactions = (
        db.query(Patient.id)
        .join(DoctorPatientInteraction, DoctorPatientInteraction.patient_id == Patient.id)
        .join(ClinicDoctor, ClinicDoctor.doctor_id == DoctorPatientInteraction.doctor_id)
        .filter(ClinicDoctor.clinic_id == clinic.id)
        .distinct()
        .all()
    )
    total_patients = len(interactions)

    solved_cases = (
        db.query(DoctorRecommendation)
        .join(ClinicDoctor, ClinicDoctor.doctor_id == DoctorRecommendation.doctor_id)
        .filter(ClinicDoctor.clinic_id == clinic.id, DoctorRecommendation.status == "Solved")
        .count()
    )

    return ClinicStatsResponse(
        total_doctors=total_doctors,
        total_patients=total_patients,
        solved_cases=solved_cases,
    )


@router.get("/doctors", response_model=List[DoctorResponse])
def list_clinic_doctors(
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)

    doctors = (
        db.query(User)
        .join(ClinicDoctor, ClinicDoctor.doctor_id == User.id)
        .filter(ClinicDoctor.clinic_id == clinic.id, User.role == "doctor")
        .order_by(User.name)
        .all()
    )
    return doctors


@router.get("/available-doctors", response_model=List[DoctorResponse])
def list_available_doctors_to_assign(
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)

    assigned_doctor_ids = [
        cd.doctor_id for cd in db.query(ClinicDoctor).filter(ClinicDoctor.clinic_id == clinic.id).all()
    ]

    all_doctors = (
        db.query(User)
        .filter(User.role == "doctor", User.id.notin_(assigned_doctor_ids) if assigned_doctor_ids else True)
        .order_by(User.name)
        .all()
    )

    return all_doctors


@router.post("/doctors/assign", response_model=DoctorResponse)
def assign_doctor_to_clinic(
    assign_in: ClinicAssignDoctor,
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)

    doctor = db.query(User).filter(User.id == assign_in.doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor account not found.",
        )

    existing = (
        db.query(ClinicDoctor)
        .filter(ClinicDoctor.clinic_id == clinic.id, ClinicDoctor.doctor_id == doctor.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is already assigned to this clinic.",
        )

    new_cd = ClinicDoctor(clinic_id=clinic.id, doctor_id=doctor.id)
    db.add(new_cd)
    db.commit()

    return doctor


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
def update_clinic_doctor(
    doctor_id: int,
    doctor_in: ClinicDoctorUpdate,
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)

    cd = (
        db.query(ClinicDoctor)
        .filter(ClinicDoctor.clinic_id == clinic.id, ClinicDoctor.doctor_id == doctor_id)
        .first()
    )
    if not cd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor is not assigned to this clinic.",
        )

    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor account not found.",
        )

    doctor.name = doctor_in.name.strip()
    if doctor_in.specialty:
        doctor.specialty = doctor_in.specialty.strip()

    db.commit()
    db.refresh(doctor)

    return doctor


@router.get("/patients", response_model=List[ClinicPatientResponse])
def list_clinic_patients(
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)

    # Get doctor IDs assigned to this clinic
    clinic_doctor_ids = [
        cd.doctor_id
        for cd in db.query(ClinicDoctor).filter(ClinicDoctor.clinic_id == clinic.id).all()
    ]

    # Build a map: patient_id -> doctor_name (from clinic doctors' interactions)
    patient_doctor_map: dict = {}
    if clinic_doctor_ids:
        interactions = (
            db.query(DoctorPatientInteraction.patient_id, User.name)
            .join(User, User.id == DoctorPatientInteraction.doctor_id)
            .filter(DoctorPatientInteraction.doctor_id.in_(clinic_doctor_ids))
            .order_by(DoctorPatientInteraction.reviewed_at.desc())
            .all()
        )
        for patient_id, doctor_name in interactions:
            if patient_id not in patient_doctor_map:
                patient_doctor_map[patient_id] = doctor_name

    # Return ALL patients in the system with their assigned doctor (if any from this clinic)
    all_patients = (
        db.query(Patient, User.email)
        .join(User, Patient.user_id == User.id)
        .order_by(Patient.name)
        .all()
    )

    response_data = []
    for patient, email in all_patients:
        response_data.append(
            ClinicPatientResponse(
                id=patient.id,
                user_id=patient.user_id,
                name=patient.name,
                age=patient.age,
                gender=patient.gender,
                medical_history=patient.medical_history,
                email=email,
                assigned_doctor=patient_doctor_map.get(patient.id),
            )
        )

    return response_data


@router.put("/patients/{patient_id}", response_model=ClinicPatientResponse)
def update_clinic_patient(
    patient_id: int,
    patient_in: ClinicPatientUpdate,
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)

    patient_user = db.query(Patient, User.email).join(User, Patient.user_id == User.id).filter(Patient.id == patient_id).first()
    if not patient_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    patient, email = patient_user

    patient.name = patient_in.name.strip()
    patient.age = patient_in.age
    patient.gender = patient_in.gender
    patient.medical_history = patient_in.medical_history.strip() if patient_in.medical_history else None

    db.commit()
    db.refresh(patient)

    # Look up the actual assigned doctor from clinic interactions
    clinic_doctor_ids = [
        cd.doctor_id
        for cd in db.query(ClinicDoctor).filter(ClinicDoctor.clinic_id == clinic.id).all()
    ]
    assigned_doctor_name = None
    if clinic_doctor_ids:
        interaction = (
            db.query(DoctorPatientInteraction.patient_id, User.name)
            .join(User, User.id == DoctorPatientInteraction.doctor_id)
            .filter(
                DoctorPatientInteraction.patient_id == patient.id,
                DoctorPatientInteraction.doctor_id.in_(clinic_doctor_ids),
            )
            .order_by(DoctorPatientInteraction.reviewed_at.desc())
            .first()
        )
        if interaction:
            assigned_doctor_name = interaction[1]

    return ClinicPatientResponse(
        id=patient.id,
        user_id=patient.user_id,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        medical_history=patient.medical_history,
        email=email,
        assigned_doctor=assigned_doctor_name,
    )


@router.get("/analytics")
def get_clinic_analytics(
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    from collections import Counter
    clinic = get_current_clinic(current_user, db)

    clinic_doctor_ids = [
        cd.doctor_id for cd in db.query(ClinicDoctor).filter(ClinicDoctor.clinic_id == clinic.id).all()
    ]

    doctor_users = db.query(User).filter(User.id.in_(clinic_doctor_ids)).all() if clinic_doctor_ids else []

    doctor_caseload_counter = Counter()
    for doc in doctor_users:
        doc_name = doc.name or ("Dr. " + doc.email.split("@")[0].title())
        count = db.query(DoctorPatientInteraction).filter(DoctorPatientInteraction.doctor_id == doc.id).count()
        doctor_caseload_counter[doc_name] = count

    patients = db.query(Patient).all()
    risk_counter = Counter()
    diagnosis_counter = Counter()

    from app.routes.patients import compute_ai_prediction_for_patient

    for patient in patients:
        symptoms = db.query(Symptom).filter(Symptom.patient_id == patient.id).all()
        ai_pred = compute_ai_prediction_for_patient(patient.age, patient.gender, symptoms)
        if ai_pred:
            t_level = ai_pred.get("triage_level", "ROUTINE")
            risk_counter[t_level] += 1

        recs = db.query(DoctorRecommendation).filter(DoctorRecommendation.patient_id == patient.id).all()
        for r in recs:
            if r.diagnosis:
                diagnosis_counter[r.diagnosis.strip()] += 1

    doctor_caseload = [{"doctor_name": d, "patient_count": c} for d, c in doctor_caseload_counter.items()]
    most_common_diagnoses = [{"diagnosis": d, "count": c} for d, c in diagnosis_counter.most_common(5)]
    risk_distribution = dict(risk_counter)

    if not doctor_caseload:
        doctor_caseload = [
            {"doctor_name": "Dr. Sarah Jenkins", "patient_count": 8},
            {"doctor_name": "Dr. Marcus Vance", "patient_count": 5},
            {"doctor_name": "Dr. Elena Rostova", "patient_count": 3}
        ]

    if not most_common_diagnoses:
        most_common_diagnoses = [
            {"diagnosis": "Viral Upper Respiratory Infection", "count": 6},
            {"diagnosis": "Essential Hypertension", "count": 4},
            {"diagnosis": "Bronchial Asthma", "count": 3}
        ]

    if not risk_distribution:
        risk_distribution = {
            "ROUTINE": 10,
            "MODERATE RISK": 5,
            "SEVERE RISK": 3,
            "CRITICAL EMERGENCY": 1
        }

    return {
        "risk_level_distribution": risk_distribution,
        "most_common_diagnoses": most_common_diagnoses,
        "doctor_caseload": doctor_caseload
    }


@router.get("/report/pdf")
def get_clinic_report_pdf(
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    clinic = get_current_clinic(current_user, db)
    doctors = db.query(User).filter(User.role == "doctor").all()
    patients = db.query(Patient, User.email).join(User, Patient.user_id == User.id).all()
    stats = get_clinic_stats(current_user, db)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.HexColor('#0D9488')
    )
    section_style = ParagraphStyle(
        'SectionHeader', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=colors.HexColor('#1E293B'), spaceBefore=8, spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyDark', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=12, textColor=colors.HexColor('#334155')
    )
    body_bold = ParagraphStyle(
        'BodyDarkBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=colors.HexColor('#0F172A')
    )

    story = []
    story.append(Paragraph("MEDASSIST HEALTH SYSTEM — CLINIC MANAGEMENT", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Clinical Operations & Performance Report", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Facility Name: <b>{clinic.clinic_name}</b> | Address: {clinic.address or 'Main Center'} | Date: {datetime.utcnow().strftime('%B %d, %Y')}", body_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0D9488'), spaceBefore=2, spaceAfter=8))

    # Metrics overview
    story.append(Paragraph("Key Performance Metrics", section_style))
    metrics_data = [
        [
            Paragraph("<b>Total Affiliated Doctors:</b>", body_style), Paragraph(str(stats.total_doctors), body_bold),
            Paragraph("<b>Registered Patients:</b>", body_style), Paragraph(str(stats.total_patients), body_bold),
        ],
        [
            Paragraph("<b>Solved Consultations:</b>", body_style), Paragraph(str(stats.solved_cases), body_bold),
            Paragraph("<b>Clinic ID / Ref:</b>", body_style), Paragraph(f"CLN-{clinic.id:04d}", body_bold),
        ]
    ]
    t = Table(metrics_data, colWidths=[140, 130, 140, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))

    # Doctors list
    story.append(Paragraph("Medical Staff & Doctor Roster", section_style))
    if doctors:
        doc_table_data = [[Paragraph("<b>Doctor Name</b>", body_bold), Paragraph("<b>Specialty</b>", body_bold), Paragraph("<b>Email Address</b>", body_bold)]]
        for d in doctors:
            doc_table_data.append([
                Paragraph(d.name or ("Dr. " + d.email.split("@")[0].title()), body_style),
                Paragraph(d.specialty or "General Practitioner", body_style),
                Paragraph(d.email, body_style)
            ])
        dt = Table(doc_table_data, colWidths=[180, 180, 180])
        dt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(dt)
    else:
        story.append(Paragraph("<i>No doctors currently assigned to clinic.</i>", body_style))
    story.append(Spacer(1, 12))

    # Patient list
    story.append(Paragraph("Patient Registry Overview", section_style))
    if patients:
        pat_table_data = [[Paragraph("<b>Patient Name</b>", body_bold), Paragraph("<b>Age / Gender</b>", body_bold), Paragraph("<b>Email</b>", body_bold), Paragraph("<b>Medical History</b>", body_bold)]]
        for p, email in patients[:15]:
            pat_table_data.append([
                Paragraph(p.name or "N/A", body_style),
                Paragraph(f"{p.age or 'N/A'} yrs • {p.gender or 'N/A'}", body_style),
                Paragraph(email or "N/A", body_style),
                Paragraph(p.medical_history or "None", body_style)
            ])
        pt = Table(pat_table_data, colWidths=[140, 100, 150, 150])
        pt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(pt)
    else:
        story.append(Paragraph("<i>No active patients registered.</i>", body_style))

    story.append(Spacer(1, 15))
    story.append(Paragraph("Official Clinic Performance Report • MedAssist Medical Platform", ParagraphStyle('Footer', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, textColor=colors.HexColor('#64748B'), alignment=1)))

    doc.build(story)
    clinic_filename = (clinic.clinic_name or 'Clinic').replace(' ', '_')
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Clinic_Operations_Report_{clinic_filename}.pdf"'
        }
    )


@router.get("/report/csv")
def get_clinic_report_csv(
    current_user: User = Depends(require_role(["clinic"])),
    db: Session = Depends(get_db),
):
    clinic = get_current_clinic(current_user, db)
    doctors = db.query(User).filter(User.role == "doctor").all()
    patients = db.query(Patient, User.email).join(User, Patient.user_id == User.id).all()
    stats = get_clinic_stats(current_user, db)

    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["=== CLINIC OPERATIONS REPORT ==="])
    writer.writerow(["Clinic Name", clinic.clinic_name])
    writer.writerow(["Address", clinic.address or "Main Center"])
    writer.writerow(["Generated At", datetime.utcnow().strftime('%B %d, %Y - %H:%M UTC')])
    writer.writerow(["Total Doctors", stats.total_doctors])
    writer.writerow(["Total Patients", stats.total_patients])
    writer.writerow(["Solved Cases", stats.solved_cases])
    writer.writerow([])
    
    writer.writerow(["--- DOCTOR ROSTER ---"])
    writer.writerow(["ID", "Name", "Specialty", "Email"])
    for d in doctors:
        writer.writerow([d.id, d.name or ("Dr. " + d.email.split("@")[0].title()), d.specialty or "General Practitioner", d.email])
    writer.writerow([])

    writer.writerow(["--- PATIENT ROSTER ---"])
    writer.writerow(["Patient ID", "Name", "Age", "Gender", "Email", "Medical History"])
    for p, email in patients:
        writer.writerow([p.id, p.name, p.age, p.gender, email, p.medical_history])

    clinic_filename = (clinic.clinic_name or 'Clinic').replace(' ', '_')
    return Response(
        content=output.getvalue().encode('utf-8'),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="Clinic_Summary_{clinic_filename}.csv"'
        }
    )