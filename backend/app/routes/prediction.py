import os
import joblib
import pandas as pd
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.dependencies import RoleChecker
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    DiseaseProbability,
    ModelInfoResponse,
)

router = APIRouter(prefix="/prediction", tags=["Prediction"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "rf_model.joblib")
_MODEL_ARTIFACT = None


def get_model_artifact():
    global _MODEL_ARTIFACT
    if _MODEL_ARTIFACT is None:
        if not os.path.exists(MODEL_PATH):
            # Attempt to auto-train if missing
            try:
                from train_model import train_and_save
                train_and_save()
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"RandomForest model artifact not available and auto-train failed: {str(e)}"
                )
        _MODEL_ARTIFACT = joblib.load(MODEL_PATH)
    return _MODEL_ARTIFACT


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    artifact = get_model_artifact()
    return ModelInfoResponse(
        model_name="RandomForestClassifier (scikit-learn)",
        outcome_accuracy=artifact.get("outcome_accuracy", 0.0),
        disease_accuracy=artifact.get("disease_accuracy", 0.0),
        total_samples=artifact.get("total_samples", 0),
        feature_importances=artifact.get("importances", {}),
    )


def generate_rule_based_recommendation(
    triage_level: str,
    outcome_probability: float,
    top_diseases: list = None,
    intense_symptom_flags: list = None,
) -> dict:
    """
    Generates rule-based clinical recommendation object:
    { urgency, action_message, preventive_tips[], follow_up_advice }
    """
    triage_upper = (triage_level or "").upper()
    top_d = "general health concern"
    if top_diseases and len(top_diseases) > 0:
        item = top_diseases[0]
        if isinstance(item, dict):
            top_d = item.get("disease", top_d)
        elif hasattr(item, "disease"):
            top_d = getattr(item, "disease", top_d)

    if "CRITICAL" in triage_upper:
        urgency = "Critical Emergency"
        action_message = (
            "🚨 CRITICAL EMERGENCY: Immediate emergency care is strongly advised! "
            f"Severe risk indicators detected ({', '.join(intense_symptom_flags) if intense_symptom_flags else 'vital instability'}). "
            "Go to the nearest Emergency Department or call emergency medical services immediately."
        )
        preventive_tips = [
            "Do not delay seeking emergency medical attention or attempt self-medication.",
            "Avoid physical exertion and stay in a safe, comfortable position.",
            "Have someone remain with you to monitor consciousness and breathing status.",
            "Bring your current medication list and vital sign logs to the emergency room."
        ]
        follow_up_advice = "Immediate ER clinical evaluation required (< 1 hour). Require physician clearance before returning to normal activity."
    elif "SEVERE" in triage_upper or outcome_probability >= 70.0:
        urgency = "High risk"
        action_message = (
            "⚠️ HIGH RISK DIRECTIVE: Urgent medical consultation recommended within 24-48 hours. "
            f"Clinical assessment indicates elevated risk associated with potential {top_d}."
        )
        preventive_tips = [
            "Schedule an urgent doctor or telemedicine consultation within 24-48 hours.",
            "Monitor body temperature and SpO2 levels every 4 hours; log any changes.",
            "Ensure complete bed rest and maintain strict fluid intake (water, electrolytes).",
            "Avoid crowded areas and wear a mask if experiencing respiratory symptoms."
        ]
        follow_up_advice = "Consult a licensed healthcare provider within 24-48 hours for diagnostic evaluation and prescription management."
    elif "MODERATE" in triage_upper or outcome_probability >= 40.0:
        urgency = "Medium risk"
        action_message = (
            "ℹ️ MODERATE RISK DIRECTIVE: Schedule a primary care consultation within 48-72 hours. "
            "Monitor symptoms closely for any worsening trends."
        )
        preventive_tips = [
            "Maintain consistent hydration and get 7-8 hours of restful sleep daily.",
            "Use OTC symptomatic relief only as directed by a healthcare professional.",
            "Track daily symptom progression and note any new symptoms.",
            "Avoid strenuous physical exercise until symptoms resolve."
        ]
        follow_up_advice = "Book a routine check-up with your doctor within 2 to 3 days if symptoms do not improve."
    else:
        urgency = "Low risk"
        action_message = (
            "✅ LOW RISK DIRECTIVE: No immediate critical indicators detected. "
            "Continue self-care, healthy lifestyle habits, and general wellness monitoring."
        )
        preventive_tips = [
            "Maintain balanced nutrition rich in vitamins, fresh fruits, and vegetables.",
            "Stay adequately hydrated with 2-3 liters of water per day.",
            "Practice regular hand hygiene and routine physical exercise.",
            "Ensure regular sleep schedules and stress management practices."
        ]
        follow_up_advice = "Continue general health self-monitoring. Seek medical care if new or worsening symptoms develop."

    return {
        "urgency": urgency,
        "action_message": action_message,
        "preventive_tips": preventive_tips,
        "follow_up_advice": follow_up_advice
    }


@router.post("/predict", response_model=PredictionResponse)
def make_prediction(
    payload: PredictionRequest,
    current_user: User = Depends(RoleChecker(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db),
):
    artifact = get_model_artifact()

    # Determine age and gender from payload or fallback to patient profile
    age = payload.age
    gender = payload.gender

    if (age is None or gender is None) and current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            if age is None and patient.age is not None:
                age = patient.age
            if gender is None and patient.gender is not None:
                gender = patient.gender

    # Defaults if still missing
    if age is None:
        age = 30
    if gender is None:
        gender = "Female"

    # Encoding mappings
    binary_map = {"yes": 1, "no": 0}
    gender_map = {"male": 1, "female": 0}
    level_map = {"low": 0, "normal": 1, "high": 2}

    fever_val = binary_map.get(str(payload.fever).strip().lower(), 0)
    cough_val = binary_map.get(str(payload.cough).strip().lower(), 0)
    fatigue_val = binary_map.get(str(payload.fatigue).strip().lower(), 0)
    breathing_val = binary_map.get(str(payload.difficulty_breathing).strip().lower(), 0)
    gender_val = gender_map.get(str(gender).strip().lower(), 0)
    bp_val = level_map.get(str(payload.blood_pressure).strip().lower(), 1)
    cholesterol_val = level_map.get(str(payload.cholesterol_level).strip().lower(), 1)

    feature_cols = artifact.get("feature_cols", [
        'fever_num', 'cough_num', 'fatigue_num', 'breathing_num',
        'gender_num', 'bp_num', 'cholesterol_num', 'age_num'
    ])

    feature_df = pd.DataFrame([{
        'fever_num': fever_val,
        'cough_num': cough_val,
        'fatigue_num': fatigue_val,
        'breathing_num': breathing_val,
        'gender_num': gender_val,
        'bp_num': bp_val,
        'cholesterol_num': cholesterol_val,
        'age_num': int(age)
    }])[feature_cols]

    # 1. Predict Outcome Risk (RandomForest Outcome Classifier)
    outcome_model = artifact["outcome_model"]
    outcome_pred = outcome_model.predict(feature_df)[0]
    outcome_proba = outcome_model.predict_proba(feature_df)[0]

    # Outcome prediction: 1 = Positive, 0 = Negative
    pos_index = 1 if 1 in outcome_model.classes_ else (0 if len(outcome_model.classes_) == 1 else 1)
    prob_pos = float(outcome_proba[pos_index]) * 100.0 if len(outcome_proba) > 1 else float(outcome_pred) * 100.0
    
    prediction_label = "Positive" if outcome_pred == 1 else "Negative"
    confidence_score = round(prob_pos if outcome_pred == 1 else (100.0 - prob_pos), 2)

    # 2. Predict Disease Probabilities (RandomForest Multi-class Classifier)
    disease_model = artifact["disease_model"]
    disease_probas = disease_model.predict_proba(feature_df)[0]
    disease_classes = disease_model.classes_

    # Get top 3 predicted diseases
    top_indices = np.argsort(disease_probas)[::-1][:3]
    top_diseases = []
    for idx in top_indices:
        prob = round(float(disease_probas[idx]) * 100.0, 2)
        if prob > 0:
            top_diseases.append(DiseaseProbability(disease=str(disease_classes[idx]), probability=prob))

    # Evaluate Intense & Severe Symptoms
    intense_symptom_flags = []
    is_chest_pain = str(payload.chest_pain).strip().lower() == "yes"
    is_dizziness = str(payload.severe_dizziness).strip().lower() == "yes"
    is_confusion = str(payload.confusion_disorientation).strip().lower() == "yes"
    is_hemoptysis = str(payload.coughing_blood).strip().lower() == "yes"
    is_numbness = str(payload.numbness_paralysis).strip().lower() == "yes"
    severity_scale = payload.symptom_severity_scale or 1

    if is_chest_pain: intense_symptom_flags.append("Acute Chest Pain / Pressure")
    if is_dizziness: intense_symptom_flags.append("Severe Vertigo / Dizziness")
    if is_confusion: intense_symptom_flags.append("Sudden Confusion / Disorientation")
    if is_hemoptysis: intense_symptom_flags.append("Hemoptysis / Coughing Blood")
    if is_numbness: intense_symptom_flags.append("Numbness / Focal Weakness")

    # Construct explanation message
    symptom_list = []
    if fever_val: symptom_list.append("Fever")
    if cough_val: symptom_list.append("Cough")
    if fatigue_val: symptom_list.append("Fatigue")
    if breathing_val: symptom_list.append("Difficulty Breathing")
    symptom_list.extend(intense_symptom_flags)

    symptom_str = ", ".join(symptom_list) if symptom_list else "no primary acute symptoms"

    # Quantitative Vital Signs Analysis & Chart Metrics
    vital_analysis = {}
    vital_metrics = {}

    spo2_val = payload.oxygen_saturation
    temp_val = payload.fever_temperature
    sys_bp_val = payload.systolic_bp
    dia_bp_val = payload.diastolic_bp
    hr_val = payload.heart_rate

    if temp_val is not None:
        if temp_val < 99.0:
            status = "Normal Body Temp"
            cat = "normal"
        elif temp_val <= 100.4:
            status = "Low-grade Fever"
            cat = "warning"
        elif temp_val <= 103.0:
            status = "Moderate Fever"
            cat = "danger"
        else:
            status = "High Fever Risk"
            cat = "critical"
            
        vital_analysis["fever_status"] = f"{status} ({temp_val}°F)"
        vital_metrics["temperature"] = {
            "value": temp_val,
            "unit": "°F",
            "status": status,
            "category": cat,
            "min_normal": 97.0,
            "max_normal": 98.6,
            "max_scale": 106.0,
            "min_scale": 95.0,
        }
        if temp_val >= 99.5:
            fever_val = 1
            feature_df['fever_num'] = 1

    if sys_bp_val is not None or dia_bp_val is not None:
        sys_bp = sys_bp_val or 120
        dia_bp = dia_bp_val or 80
        if sys_bp < 90 or dia_bp < 60:
            status = "Hypotension"
            cat = "warning"
            bp_val = 0
        elif sys_bp <= 120 and dia_bp <= 80:
            status = "Normal Blood Pressure"
            cat = "normal"
            bp_val = 1
        elif sys_bp <= 139 or dia_bp <= 89:
            status = "Elevated / Prehypertension"
            cat = "warning"
            bp_val = 2
        else:
            status = "Hypertension Stage 2"
            cat = "danger"
            bp_val = 2
            
        vital_analysis["bp_status"] = f"{status} ({sys_bp}/{dia_bp} mmHg)"
        vital_metrics["blood_pressure"] = {
            "systolic": sys_bp,
            "diastolic": dia_bp,
            "unit": "mmHg",
            "status": status,
            "category": cat,
            "target_sys": [90, 120],
            "target_dia": [60, 80],
        }
        feature_df['bp_num'] = bp_val

    if spo2_val is not None:
        if spo2_val >= 95:
            status = "Normal SpO2"
            cat = "normal"
        elif spo2_val >= 90:
            status = "Mild Hypoxia"
            cat = "warning"
        else:
            status = "Severe Hypoxia Warning"
            cat = "critical"
            
        vital_analysis["oxygen_status"] = f"{status} ({spo2_val}%)"
        vital_metrics["oxygen_saturation"] = {
            "value": spo2_val,
            "unit": "%",
            "status": status,
            "category": cat,
            "min_normal": 95,
            "max_normal": 100,
            "min_scale": 80,
            "max_scale": 100,
        }

    if hr_val is not None:
        if hr_val < 60:
            status = "Bradycardia"
            cat = "warning"
        elif hr_val <= 100:
            status = "Normal Heart Rate"
            cat = "normal"
        else:
            status = "Tachycardia"
            cat = "danger"
            
        vital_analysis["pulse_status"] = f"{status} ({hr_val} bpm)"
        vital_metrics["heart_rate"] = {
            "value": hr_val,
            "unit": "bpm",
            "status": status,
            "category": cat,
            "min_normal": 60,
            "max_normal": 100,
            "min_scale": 40,
            "max_scale": 160,
        }

    # ------------------------------------------------------------------
    # CLINICAL TRIAGE DETERMINATION & EMERGENCY DIRECTIVES
    # ------------------------------------------------------------------
    is_critical_vitals = (
        (spo2_val is not None and spo2_val < 90) or
        (temp_val is not None and temp_val >= 103.5) or
        (sys_bp_val is not None and (sys_bp_val >= 180 or sys_bp_val < 85))
    )
    is_critical_symptoms = is_chest_pain or is_confusion or is_hemoptysis or is_numbness or severity_scale >= 9

    if is_critical_vitals or is_critical_symptoms:
        triage_level = "CRITICAL EMERGENCY"
        triage_color = "red"
        urgency_timeframe = "IMMEDIATE ER EMERGENCY CARE (< 1 Hour)"
        emergency_action_directive = (
            "🚨 CRITICAL HEALTH ALERT: Immediate emergency medical attention (Call 911 / Go to nearest ER) is recommended! "
            f"Active critical indicators: {', '.join(intense_symptom_flags) if intense_symptom_flags else 'Severe vital instability'}."
        )
        prediction_label = "Positive"
        prob_pos = max(prob_pos, 88.0)
    elif breathing_val or is_dizziness or (temp_val and temp_val > 101.5) or (spo2_val and spo2_val < 95) or severity_scale >= 6:
        triage_level = "SEVERE RISK"
        triage_color = "orange"
        urgency_timeframe = "URGENT CLINICAL EVALUATION (Within 6-12 Hours)"
        emergency_action_directive = (
            "⚠️ URGENT CLINICAL DIRECTIVE: Schedule an urgent medical visit or telemedicine consultation within 6-12 hours. "
            "Monitor oxygen saturation and body temperature closely."
        )
    elif fever_val or cough_val or fatigue_val or payload.blood_pressure == "High" or payload.cholesterol_level == "High" or severity_scale >= 4:
        triage_level = "MODERATE RISK"
        triage_color = "amber"
        urgency_timeframe = "ROUTINE DOCTOR CONSULT (Within 24-48 Hours)"
        emergency_action_directive = (
            "ℹ️ MODERATE RISK DIRECTIVE: Book a primary care physician consultation within 24-48 hours. "
            "Ensure adequate hydration and symptomatic monitoring."
        )
    else:
        triage_level = "ROUTINE"
        triage_color = "green"
        urgency_timeframe = "ROUTINE WELLNESS / SELF-MONITORING"
        emergency_action_directive = (
            "✅ ROUTINE DIRECTIVE: Low overall disease risk detected. Continue healthy lifestyle habits and standard wellness tracking."
        )

    # ------------------------------------------------------------------
    # MULTI-ORGAN SYSTEM RISK SCORING (%)
    # ------------------------------------------------------------------
    cardio_risk = min(100.0, round(
        (35.0 if is_chest_pain else 0.0) +
        (25.0 if payload.blood_pressure == "High" or (sys_bp_val and sys_bp_val > 140) else 5.0) +
        (20.0 if payload.cholesterol_level == "High" else 5.0) +
        (15.0 if hr_val and (hr_val > 100 or hr_val < 50) else 0.0) +
        (float(prob_pos) * 0.2), 1
    ))

    resp_risk = min(100.0, round(
        (40.0 if breathing_val else 0.0) +
        (35.0 if is_hemoptysis else 0.0) +
        (30.0 if spo2_val and spo2_val < 95 else 0.0) +
        (15.0 if cough_val else 5.0) +
        (float(prob_pos) * 0.2), 1
    ))

    neuro_risk = min(100.0, round(
        (40.0 if is_confusion else 0.0) +
        (35.0 if is_numbness else 0.0) +
        (25.0 if is_dizziness else 0.0) +
        (10.0 if fatigue_val else 5.0), 1
    ))

    systemic_risk = min(100.0, round(
        (35.0 if temp_val and temp_val > 101.0 else (15.0 if fever_val else 5.0)) +
        (25.0 if fatigue_val else 5.0) +
        (severity_scale * 4.0) +
        (float(prob_pos) * 0.25), 1
    ))

    organ_system_risks = {
        "Cardiovascular System": cardio_risk,
        "Respiratory System": resp_risk,
        "Neurological System": neuro_risk,
        "Systemic / Immune System": systemic_risk
    }

    if prediction_label == "Positive":
        message = (
            f"RandomForest model & Triage Analysis indicates a POSITIVE health risk ({confidence_score}% confidence, Triage: {triage_level}) "
            f"based on profile (Age {age}, {gender}, BP {payload.blood_pressure}, Cholesterol {payload.cholesterol_level}) "
            f"and clinical features ({symptom_str})."
        )
    else:
        message = (
            f"RandomForest model indicates a NEGATIVE (Low Risk) health outcome ({confidence_score}% confidence, Triage: {triage_level}) "
            f"based on current clinical indicators and profile (Age {age}, {gender})."
        )

    recommendation_obj = generate_rule_based_recommendation(
        triage_level=triage_level,
        outcome_probability=round(prob_pos, 2),
        top_diseases=top_diseases,
        intense_symptom_flags=intense_symptom_flags
    )

    pred_id = f"PRED-{int(pd.Timestamp.now().timestamp())}"
    _RECOMMENDATION_CACHE[pred_id] = recommendation_obj

    return PredictionResponse(
        prediction=prediction_label,
        confidence=confidence_score,
        outcome_probability=round(prob_pos, 2),
        top_diseases=top_diseases,
        feature_importances=artifact.get("importances", {}),
        vital_analysis=vital_analysis,
        vital_metrics=vital_metrics,
        triage_level=triage_level,
        triage_color=triage_color,
        emergency_action_directive=emergency_action_directive,
        urgency_timeframe=urgency_timeframe,
        organ_system_risks=organ_system_risks,
        intense_symptom_flags=intense_symptom_flags,
        recommendation=recommendation_obj,
        message=message,
        model_name="RandomForestClassifier",
    )


_RECOMMENDATION_CACHE = {}


@router.get("/recommendations/{prediction_id}", response_model=dict)
def get_recommendation_by_id(prediction_id: str):
    if prediction_id in _RECOMMENDATION_CACHE:
        return _RECOMMENDATION_CACHE[prediction_id]
    # Fallback default if not cached
    return generate_rule_based_recommendation(
        triage_level="ROUTINE",
        outcome_probability=15.0,
        top_diseases=[],
        intense_symptom_flags=[]
    )

