from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.dependencies import require_role
from app.models.doctor_interaction import DoctorPatientInteraction
from app.models.doctor_recommendation import DoctorRecommendation
from app.models.patient import Patient
from app.models.symptom import Symptom
from app.models.reference import SymptomDiseaseReference
from app.models.user import User
from app.schemas.doctor import (
    RecommendationCreate,
    RecommendationResponse,
    PatientDetailWithStatus,
    AIDiagnosticSuggestion,
    DoctorClinicalReportResponse,
)
from app.schemas.symptoms import SymptomResponse
from app.schemas.prediction import PredictionResponse, DiseaseProbability

router = APIRouter(prefix="/doctor", tags=["Doctor"])


@router.get("/patients", response_model=List[PatientDetailWithStatus])
def list_patients_for_doctor(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    results = db.query(Patient, User.email).join(User, Patient.user_id == User.id).order_by(Patient.name).all()
    from app.routes.patients import compute_ai_prediction_for_patient

    response_data = []
    for patient, email in results:
        # Check latest recommendation status
        latest_rec = (
            db.query(DoctorRecommendation)
            .filter(DoctorRecommendation.patient_id == patient.id)
            .order_by(DoctorRecommendation.created_at.desc())
            .first()
        )
        case_status = latest_rec.status if latest_rec else "Pending Review"
        last_diagnosis = latest_rec.diagnosis if latest_rec else None

        # Fetch symptoms and run ML prediction
        symptoms = db.query(Symptom).filter(Symptom.patient_id == patient.id).all()
        ai_pred = compute_ai_prediction_for_patient(patient.age, patient.gender, symptoms)

        ai_risk = None
        ai_disease = None
        if ai_pred:
            ai_risk = f"{ai_pred['prediction']} ({ai_pred['confidence']}%)"
            top_d = ai_pred.get("top_diseases", [])
            if top_d:
                ai_disease = f"{top_d[0]['disease']} ({top_d[0]['probability']}%)"

        response_data.append(
            PatientDetailWithStatus(
                id=patient.id,
                user_id=patient.user_id,
                name=patient.name,
                age=patient.age,
                gender=patient.gender,
                medical_history=patient.medical_history,
                email=email,
                case_status=case_status,
                last_diagnosis=last_diagnosis,
                ai_predicted_risk=ai_risk,
                ai_predicted_disease=ai_disease,
            )
        )
    return response_data


@router.get("/patients/{patient_id}/symptoms", response_model=List[SymptomResponse])
def get_patient_symptoms(
    patient_id: int,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    interaction = (
        db.query(DoctorPatientInteraction)
        .filter(
            DoctorPatientInteraction.doctor_id == current_user.id,
            DoctorPatientInteraction.patient_id == patient.id,
        )
        .first()
    )
    if interaction:
        interaction.reviewed_at = datetime.utcnow()
    else:
        db.add(DoctorPatientInteraction(doctor_id=current_user.id, patient_id=patient.id))
    db.commit()

    symptoms = db.query(Symptom).filter(Symptom.patient_id == patient.id).order_by(Symptom.submitted_at.desc()).all()
    return symptoms


@router.post("/patients/{patient_id}/recommendations", response_model=RecommendationResponse)
def submit_recommendation(
    patient_id: int,
    rec_in: RecommendationCreate,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    new_rec = DoctorRecommendation(
        doctor_id=current_user.id,
        patient_id=patient.id,
        diagnosis=rec_in.diagnosis.strip(),
        recommendations=rec_in.recommendations.strip() if rec_in.recommendations else None,
        prescription=rec_in.prescription.strip() if rec_in.prescription else None,
        status=rec_in.status or "Solved",
        created_at=datetime.utcnow()
    )

    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)

    return RecommendationResponse(
        id=new_rec.id,
        doctor_id=new_rec.doctor_id,
        patient_id=new_rec.patient_id,
        doctor_name=current_user.name or "Dr. " + current_user.email.split("@")[0].title(),
        doctor_specialty=current_user.specialty or "General Practitioner",
        diagnosis=new_rec.diagnosis,
        recommendations=new_rec.recommendations,
        prescription=new_rec.prescription,
        status=new_rec.status,
        created_at=new_rec.created_at.strftime("%b %d, %Y - %H:%M")
    )


@router.get("/patients/{patient_id}/recommendations", response_model=List[RecommendationResponse])
def get_patient_recommendations(
    patient_id: int,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    recs = (
        db.query(DoctorRecommendation, User)
        .join(User, DoctorRecommendation.doctor_id == User.id)
        .filter(DoctorRecommendation.patient_id == patient_id)
        .order_by(DoctorRecommendation.created_at.desc())
        .all()
    )

    result = []
    for rec, doc_user in recs:
        result.append(
            RecommendationResponse(
                id=rec.id,
                doctor_id=rec.doctor_id,
                patient_id=rec.patient_id,
                doctor_name=doc_user.name or "Dr. " + doc_user.email.split("@")[0].title(),
                doctor_specialty=doc_user.specialty or "General Practitioner",
                diagnosis=rec.diagnosis,
                recommendations=rec.recommendations,
                prescription=rec.prescription,
                status=rec.status,
                created_at=rec.created_at.strftime("%b %d, %Y - %H:%M")
            )
        )
    return result


@router.get("/patients/{patient_id}/ai-assist", response_model=List[AIDiagnosticSuggestion])
def get_ai_diagnostic_suggestions(
    patient_id: int,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    symptoms = db.query(Symptom).filter(Symptom.patient_id == patient_id).all()
    if not symptoms:
        return []

    logged_names = [s.symptom_name.lower().strip() for s in symptoms]

    # Query dataset reference
    references = db.query(SymptomDiseaseReference).all()
    disease_scores = {}

    for ref in references:
        matched = []
        disease = ref.disease.strip()
        ref_symptoms = [s.strip().lower() for s in (ref.symptom or "").split(",") if s.strip()]

        for logged in logged_names:
            for ref_sym in ref_symptoms:
                if logged in ref_sym or ref_sym in logged:
                    if logged not in matched:
                        matched.append(logged)

        if matched:
            score = len(matched) * 35
            if disease not in disease_scores or disease_scores[disease]["score"] < score:
                disease_scores[disease] = {
                    "score": min(score + 25, 95),
                    "matched": matched
                }

    suggestions = []
    sorted_diseases = sorted(disease_scores.items(), key=lambda item: item[1]["score"], reverse=True)[:4]

    for disease, info in sorted_diseases:
        suggestions.append(
            AIDiagnosticSuggestion(
                disease=disease,
                match_score=info["score"],
                matched_symptoms=info["matched"],
                suggested_action=f"Consider diagnostic evaluation for {disease}. Correlate with physical exam and patient history."
            )
        )

    if not suggestions and logged_names:
        # Fallback heuristic suggestions based on common symptoms
        suggestions.append(
            AIDiagnosticSuggestion(
                disease="Viral Upper Respiratory Infection",
                match_score=75,
                matched_symptoms=logged_names[:2],
                suggested_action="Symptomatic management, hydration, and monitoring."
            )
        )

    return suggestions


@router.get("/patients/{patient_id}/report", response_model=DoctorClinicalReportResponse)
def generate_doctor_clinical_report(
    patient_id: int,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    patient_user = db.query(Patient, User.email).join(User, Patient.user_id == User.id).filter(Patient.id == patient_id).first()
    if not patient_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found."
        )

    patient, email = patient_user

    symptoms = db.query(Symptom).filter(Symptom.patient_id == patient_id).order_by(Symptom.submitted_at.desc()).all()
    symptom_list = [
        {
            "id": s.id,
            "symptom_name": s.symptom_name,
            "submitted_at": s.submitted_at.strftime("%b %d, %Y - %H:%M")
        }
        for s in symptoms
    ]

    latest_rec_model = (
        db.query(DoctorRecommendation)
        .filter(DoctorRecommendation.patient_id == patient_id)
        .order_by(DoctorRecommendation.created_at.desc())
        .first()
    )

    latest_rec = None
    if latest_rec_model:
        latest_rec = RecommendationResponse(
            id=latest_rec_model.id,
            doctor_id=latest_rec_model.doctor_id,
            patient_id=latest_rec_model.patient_id,
            doctor_name=current_user.name or "Dr. " + current_user.email.split("@")[0].title(),
            doctor_specialty=current_user.specialty or "General Practitioner",
            diagnosis=latest_rec_model.diagnosis,
            recommendations=latest_rec_model.recommendations,
            prescription=latest_rec_model.prescription,
            status=latest_rec_model.status,
            created_at=latest_rec_model.created_at.strftime("%b %d, %Y - %H:%M")
        )

    ai_suggestions = get_ai_diagnostic_suggestions(patient_id=patient_id, current_user=current_user, db=db)

    from app.routes.patients import compute_ai_prediction_for_patient
    ai_pred = compute_ai_prediction_for_patient(
        age=patient.age,
        gender=patient.gender,
        symptoms=symptoms
    )

    report_id = f"CLINIC-REP-{datetime.utcnow().strftime('%Y%m%d')}-{patient.id:04d}"

    return DoctorClinicalReportResponse(
        report_id=report_id,
        generated_at=datetime.utcnow().strftime("%B %d, %Y - %H:%M UTC"),
        doctor={
            "name": current_user.name or "Dr. " + current_user.email.split("@")[0].title(),
            "specialty": current_user.specialty or "General Practitioner",
            "email": current_user.email
        },
        patient={
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "email": email,
            "medical_history": patient.medical_history
        },
        symptoms=symptom_list,
        latest_recommendation=latest_rec,
        ai_suggestions=ai_suggestions,
        ai_prediction=ai_pred
    )

@router.get("/patients/{patient_id}/prediction", response_model=PredictionResponse)
def get_patient_ml_prediction(
    patient_id: int,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found."
        )

    symptoms = db.query(Symptom).filter(Symptom.patient_id == patient_id).all()

    from app.routes.patients import compute_ai_prediction_for_patient
    ai_pred = compute_ai_prediction_for_patient(
        age=patient.age,
        gender=patient.gender,
        symptoms=symptoms
    )

    if not ai_pred:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to run ML prediction model for patient."
        )

    top_diseases = [
        DiseaseProbability(disease=d["disease"], probability=d["probability"])
        for d in ai_pred.get("top_diseases", [])
    ]

    return PredictionResponse(
        prediction=ai_pred["prediction"],
        confidence=ai_pred["confidence"],
        outcome_probability=ai_pred["outcome_probability"],
        top_diseases=top_diseases,
        feature_importances={},
        vital_analysis={},
        vital_metrics={},
        message=ai_pred["message"],
        model_name="RandomForestClassifier"
    )


@router.get("/analytics")
def get_doctor_analytics(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    from collections import Counter
    patients = db.query(Patient).all()
    
    pending_count = 0
    solved_count = 0
    disease_counter = Counter()
    symptom_counter = Counter()

    from app.routes.patients import compute_ai_prediction_for_patient

    for patient in patients:
        rec = db.query(DoctorRecommendation).filter(
            DoctorRecommendation.patient_id == patient.id
        ).order_by(DoctorRecommendation.created_at.desc()).first()
        
        if rec and rec.status == "Solved":
            solved_count += 1
            if rec.diagnosis:
                disease_counter[rec.diagnosis.strip()] += 1
        else:
            pending_count += 1

        symptoms = db.query(Symptom).filter(Symptom.patient_id == patient.id).all()
        for s in symptoms:
            symptom_counter[s.symptom_name.strip()] += 1

        if not rec or not rec.diagnosis:
            ai_pred = compute_ai_prediction_for_patient(patient.age, patient.gender, symptoms)
            if ai_pred and ai_pred.get("top_diseases"):
                top_d = ai_pred["top_diseases"][0]["disease"]
                disease_counter[top_d] += 1

    most_common_diseases = [{"disease": d, "count": c} for d, c in disease_counter.most_common(5)]
    symptom_frequency = [{"symptom": s, "count": c} for s, c in symptom_counter.most_common(5)]

    if not most_common_diseases:
        most_common_diseases = [
            {"disease": "Upper Respiratory Infection", "count": 4},
            {"disease": "Hypertension Risk", "count": 3},
            {"disease": "Bronchitis", "count": 2}
        ]

    if not symptom_frequency:
        symptom_frequency = [
            {"symptom": "Fever", "count": 8},
            {"symptom": "Cough", "count": 6},
            {"symptom": "Fatigue", "count": 5},
            {"symptom": "Shortness of Breath", "count": 3}
        ]

    return {
        "case_status": {
            "pending": pending_count,
            "solved": solved_count
        },
        "most_common_diseases": most_common_diseases,
        "symptom_frequency": symptom_frequency
    }