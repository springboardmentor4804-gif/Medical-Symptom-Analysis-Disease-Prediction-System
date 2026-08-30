import asyncio
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.symptom import Symptom
from app.schemas.patients import PatientUpdate, PatientResponse, PatientReportResponse, SymptomItem
from app.dependencies import get_current_user
from app.mongo_database import patients_collection, user_inputs_collection
from app.mongo_models import MongoPatient, MongoUserInput

router = APIRouter(prefix="/patients", tags=["Patients"])


async def _mirror_patient_to_mongo(patient, user_email: str) -> None:
    """Background task: upsert patient profile in MongoDB (fire-and-forget)."""
    try:
        mongo_patient = MongoPatient(
            user_email=user_email,
            name=patient.name,
            age=patient.age,
            gender=patient.gender,
            medical_history=patient.medical_history,
        )
        await patients_collection().update_one(
            {"user_email": user_email},
            {"$set": mongo_patient.model_dump()},
            upsert=True,
        )
        # Log to generic user_inputs collection
        mongo_input = MongoUserInput(
            input_type="patient_profile_update",
            user_email=user_email,
            payload={
                "name": patient.name,
                "age": patient.age,
                "gender": patient.gender,
                "medical_history": patient.medical_history,
            },
        )
        await user_inputs_collection().insert_one(mongo_input.model_dump())
    except Exception as exc:
        print(f"[MongoDB] ⚠️  Patient profile mirror failed: {exc}")

@router.get("/me", response_model=PatientResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )
    return PatientResponse(
        id=patient.id,
        user_id=patient.user_id,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        medical_history=patient.medical_history,
        email=current_user.email
    )

def compute_ai_prediction_for_patient(age: int, gender: str, symptoms: list):
    try:
        from app.routes.prediction import get_model_artifact
        import pandas as pd
        import numpy as np

        artifact = get_model_artifact()
        sym_names = [s.symptom_name.lower().strip() for s in symptoms]

        fever_val = 1 if any('fever' in s for s in sym_names) else 0
        cough_val = 1 if any('cough' in s for s in sym_names) else 0
        fatigue_val = 1 if any('fatigue' in s or 'tired' in s for s in sym_names) else 0
        breathing_val = 1 if any('breath' in s or 'shortness' in s for s in sym_names) else 0

        feature_cols = artifact.get("feature_cols", [
            'fever_num', 'cough_num', 'fatigue_num', 'breathing_num',
            'gender_num', 'bp_num', 'cholesterol_num', 'age_num'
        ])
        gender_val = 1 if (gender or "").lower() == "male" else 0

        feature_df = pd.DataFrame([{
            'fever_num': fever_val,
            'cough_num': cough_val,
            'fatigue_num': fatigue_val,
            'breathing_num': breathing_val,
            'gender_num': gender_val,
            'bp_num': 1,
            'cholesterol_num': 1,
            'age_num': int(age or 30)
        }])[feature_cols]

        outcome_model = artifact["outcome_model"]
        outcome_pred = outcome_model.predict(feature_df)[0]
        outcome_proba = outcome_model.predict_proba(feature_df)[0]

        pos_index = 1 if 1 in outcome_model.classes_ else (0 if len(outcome_model.classes_) == 1 else 1)
        prob_pos = float(outcome_proba[pos_index]) * 100.0 if len(outcome_proba) > 1 else float(outcome_pred) * 100.0

        prediction_label = "Positive" if outcome_pred == 1 else "Negative"
        confidence_score = round(prob_pos if outcome_pred == 1 else (100.0 - prob_pos), 2)

        disease_model = artifact["disease_model"]
        disease_probas = disease_model.predict_proba(feature_df)[0]
        disease_classes = disease_model.classes_

        top_indices = np.argsort(disease_probas)[::-1][:3]
        top_diseases = []
        for idx in top_indices:
            prob = round(float(disease_probas[idx]) * 100.0, 2)
            if prob > 0:
                top_diseases.append({"disease": str(disease_classes[idx]), "probability": prob})

        from app.routes.prediction import generate_rule_based_recommendation
        
        triage_level = "ROUTINE"
        triage_color = "green"
        if prob_pos >= 80.0 or breathing_val:
            triage_level = "CRITICAL EMERGENCY" if breathing_val and prob_pos >= 85.0 else "SEVERE RISK"
            triage_color = "red" if triage_level == "CRITICAL EMERGENCY" else "orange"
        elif prob_pos >= 40.0 or fever_val or cough_val:
            triage_level = "MODERATE RISK"
            triage_color = "amber"

        recommendation = generate_rule_based_recommendation(
            triage_level=triage_level,
            outcome_probability=round(prob_pos, 2),
            top_diseases=top_diseases,
            intense_symptom_flags=[]
        )

        return {
            "prediction": prediction_label,
            "confidence": confidence_score,
            "outcome_probability": round(prob_pos, 2),
            "top_diseases": top_diseases,
            "triage_level": triage_level,
            "triage_color": triage_color,
            "recommendation": recommendation,
            "message": f"RandomForest model indicates a {prediction_label.upper()} health outcome risk ({confidence_score}% confidence) based on patient profile and logged symptoms.",
            "model_name": "RandomForestClassifier",
        }
    except Exception as e:
        print(f"[AI Report Prediction Error]: {e}")
        return None

import io
from fastapi.responses import Response

def generate_pdf_report_bytes(patient, user_email: str, symptoms: list, ai_pred: dict, report_id: str) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

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
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0D9488')
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=8,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    body_bold = ParagraphStyle(
        'BodyDarkBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )

    story = []
    story.append(Paragraph("MEDASSIST AI — CLINICAL HEALTH REPORT", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Patient Health Assessment & AI Prediction Record", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Report Ref ID: <b>{report_id}</b> | Generated: {datetime.utcnow().strftime('%B %d, %Y - %H:%M UTC')}", body_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0D9488'), spaceBefore=2, spaceAfter=8))

    # Profile
    story.append(Paragraph("Patient Profile & Demographics", section_style))
    profile_data = [
        [
            Paragraph("<b>Full Name:</b>", body_style), Paragraph(patient.name or "N/A", body_bold),
            Paragraph("<b>Age / Gender:</b>", body_style), Paragraph(f"{patient.age or 'N/A'} yrs • {patient.gender or 'N/A'}", body_bold)
        ],
        [
            Paragraph("<b>Email Address:</b>", body_style), Paragraph(user_email or "N/A", body_bold),
            Paragraph("<b>Patient ID:</b>", body_style), Paragraph(f"PAT-{patient.id:04d}", body_bold)
        ]
    ]
    t_profile = Table(profile_data, colWidths=[90, 180, 90, 180])
    t_profile.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_profile)
    story.append(Spacer(1, 8))

    # Medical History
    story.append(Paragraph("Pre-Existing Medical History", section_style))
    med_hist_text = patient.medical_history if patient.medical_history else "No prior chronic conditions recorded."
    t_hist = Table([[Paragraph(med_hist_text, body_style)]], colWidths=[540])
    t_hist.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(t_hist)
    story.append(Spacer(1, 8))

    # Symptom Log
    story.append(Paragraph(f"Symptom History Log ({len(symptoms)} Entries)", section_style))
    if symptoms:
        sym_table_data = [[
            Paragraph("<b>#</b>", body_bold),
            Paragraph("<b>Symptom Description</b>", body_bold),
            Paragraph("<b>Occurrences</b>", body_bold),
            Paragraph("<b>Duration</b>", body_bold),
            Paragraph("<b>Submitted At</b>", body_bold)
        ]]
        for idx, s in enumerate(symptoms, 1):
            sub_at = s.submitted_at.strftime("%b %d, %Y - %H:%M") if isinstance(s.submitted_at, datetime) else str(s.submitted_at)
            occ = f"{getattr(s, 'occurrence_count', 1)} time(s)"
            dur = getattr(s, 'duration_onset', 'Just today')
            sym_table_data.append([
                Paragraph(str(idx), body_style),
                Paragraph(s.symptom_name, body_bold),
                Paragraph(occ, body_style),
                Paragraph(dur, body_style),
                Paragraph(sub_at, body_style)
            ])
        t_sym = Table(sym_table_data, colWidths=[25, 185, 100, 110, 120])
        t_sym.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        story.append(t_sym)
    else:
        story.append(Paragraph("No symptoms recorded.", body_style))
    story.append(Spacer(1, 8))

    # AI Prediction
    if ai_pred:
        story.append(Paragraph("RandomForest AI Disease Prediction & Risk Stratification", section_style))
        triage = ai_pred.get("triage_level", "ROUTINE")
        risk_score = ai_pred.get("outcome_probability", 0.0)
        prediction = ai_pred.get("prediction", "Negative")
        confidence = ai_pred.get("confidence", 0.0)

        top_d_list = ai_pred.get("top_diseases", [])
        top_d_str = ", ".join([f"{d['disease']} ({d['probability']}%)" for d in top_d_list]) if top_d_list else "None specified"

        rec = ai_pred.get("recommendation", {}) or {}
        urgency = rec.get("urgency", triage)
        action_msg = rec.get("action_message", "N/A")
        tips = rec.get("preventive_tips", [])
        follow_up = rec.get("follow_up_advice", "N/A")

        ai_summary_data = [
            [Paragraph("<b>Outcome Prediction:</b>", body_style), Paragraph(f"<b>{prediction} Risk</b> ({confidence}% confidence)", body_bold)],
            [Paragraph("<b>Risk Score:</b>", body_style), Paragraph(f"<b>{risk_score}%</b>", body_bold)],
            [Paragraph("<b>Triage Level:</b>", body_style), Paragraph(f"<b>{triage}</b> (Urgency: {urgency})", body_bold)],
            [Paragraph("<b>Probable Conditions:</b>", body_style), Paragraph(top_d_str, body_bold)],
            [Paragraph("<b>Action Directive:</b>", body_style), Paragraph(action_msg, body_style)],
            [Paragraph("<b>Follow-up Guidance:</b>", body_style), Paragraph(follow_up, body_style)]
        ]

        if tips:
            tips_formatted = "<br/>".join([f"• {t}" for t in tips])
            ai_summary_data.append([Paragraph("<b>Preventive Tips:</b>", body_style), Paragraph(tips_formatted, body_style)])

        t_ai = Table(ai_summary_data, colWidths=[120, 420])
        t_ai.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F3FF')),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#7C3AED')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(t_ai)

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceBefore=2, spaceAfter=6))
    story.append(Paragraph("<i>Notice: Generated automatically by MedAssist AI for patient record keeping. Consult a physician for formal clinical evaluation.</i>", ParagraphStyle('Foot', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#64748B'))))

    doc.build(story)
    return buffer.getvalue()


@router.get("/me/report")
def get_my_report(
    format: str = "pdf",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    symptoms = db.query(Symptom).filter(Symptom.patient_id == patient.id).order_by(Symptom.submitted_at.desc()).all()

    symptom_items = [
        SymptomItem(
            id=s.id,
            symptom_name=s.symptom_name,
            submitted_at=s.submitted_at.isoformat() if isinstance(s.submitted_at, datetime) else str(s.submitted_at)
        )
        for s in symptoms
    ]

    # Compute AI Prediction for report
    ai_pred = compute_ai_prediction_for_patient(
        age=patient.age,
        gender=patient.gender,
        symptoms=symptoms
    )

    count = len(symptoms)
    if count == 0:
        summary_text = "No symptoms recorded. Patient profile is active with regular baseline tracking."
    elif count <= 3:
        summary_text = f"Mild symptom tracking active. {count} symptom(s) logged. Low to moderate monitoring advised."
    else:
        summary_text = f"Active symptom history with {count} logged entries. Clinical review and doctor consultation recommended."

    report_id = f"REP-{datetime.utcnow().strftime('%Y%m%d')}-{patient.id:04d}"

    if format and format.lower() == "json":
        return PatientReportResponse(
            report_id=report_id,
            generated_at=datetime.utcnow().strftime("%B %d, %Y - %H:%M UTC"),
            patient=PatientResponse(
                id=patient.id,
                user_id=patient.user_id,
                name=patient.name,
                age=patient.age,
                gender=patient.gender,
                medical_history=patient.medical_history,
                email=current_user.email
            ),
            symptoms=symptom_items,
            total_symptoms=count,
            health_status_summary=summary_text,
            ai_prediction=ai_pred
        )

    # Default to PDF download
    pdf_bytes = generate_pdf_report_bytes(
        patient=patient,
        user_email=current_user.email,
        symptoms=symptoms,
        ai_pred=ai_pred,
        report_id=report_id
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Vitals_AI_Health_Report_{patient.id}.pdf"'
        }
    )


@router.put("/me", response_model=PatientResponse)
def update_me(
    profile_data: PatientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )
    
    patient.name = profile_data.name
    patient.age = profile_data.age
    patient.gender = profile_data.gender
    patient.medical_history = profile_data.medical_history
    
    db.commit()
    db.refresh(patient)

    # Mirror updated profile to MongoDB (non-blocking)
    asyncio.create_task(_mirror_patient_to_mongo(patient, current_user.email))

    return PatientResponse(
        id=patient.id,
        user_id=patient.user_id,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        medical_history=patient.medical_history,
        email=current_user.email
    )
