"""
MedAssist AI — 4-Tier Severity Triage & Red Flag Evaluation Engine
Evaluates clinical urgency across 4 tiers: EMERGENCY, URGENT, MODERATE, MILD.
Evaluates Red Flag symptoms, vital sign boundaries, and recommends specialist care.
"""

from typing import Any, Dict, List, Optional


# Critical red flag symptoms triggering immediate EMERGENCY escalation
CRITICAL_RED_FLAGS = {
    "chest_pain": "Acute Chest Pain / Cardiovascular Discomfort",
    "breathlessness": "Severe Shortness of Breath / Respiratory Distress",
    "difficulty_breathing": "Difficulty Breathing / Airway Compromise",
    "coughing_blood": "Hemoptysis / Coughing Blood",
    "vomiting_blood": "Hematemesis / Vomiting Blood",
    "loss_of_consciousness": "Syncope / Sudden Unresponsiveness",
    "coma": "Altered Mental Status / Stupor",
    "blister": "Severe Acute Bullous Eruption",
}

# Serious red flag symptoms triggering URGENT or escalating with multiples
SERIOUS_RED_FLAGS = {
    "high_fever": "Persistent High Fever (>39°C / 102.2°F)",
    "dizziness": "Acute Vertigo / Severe Dizziness",
    "syncope": "Fainting Episodes",
    "blurred_and_distorted_vision": "Acute Visual Disturbance",
    "swelling_joints": "Severe Inflammatory Joint Effusion",
    "swollen_legs": "Peripheral Edema",
    "slurred_speech": "Neurological / Articulation Impairment",
    "paralysis_of_bowel_movements": "Severe Abdominal Distension",
}

# Specialist mapping based on clinical symptom categories & disease keywords
SPECIALIST_MAPPING = {
    "Cardiologist": ["chest_pain", "high_blood_pressure", "palpitations", "hypertension", "heart", "cardio"],
    "Pulmonologist": ["cough", "breathlessness", "difficulty_breathing", "asthma", "bronchial", "pneumonia"],
    "Gastroenterologist": ["stomach_pain", "abdominal_pain", "vomiting", "nausea", "acidity", "ulcer", "gerd", "jaundice", "hepatitis"],
    "Dermatologist": ["skin_rash", "itching", "skin_peeling", "nodal_skin_eruptions", "fungal", "acne", "psoriasis", "impetigo"],
    "Neurologist": ["headache", "migraine", "dizziness", "slurred_speech", "paralysis", "altered_sensorium"],
    "Rheumatologist": ["joint_pain", "knee_pain", "arthritis", "osteoarthritis", "swelling_joints"],
    "Endocrinologist": ["excessive_hunger", "polyuria", "increased_appetite", "diabetes", "hypothyroidism", "hyperthyroidism"],
    "Infectious Disease Specialist": ["high_fever", "chills", "malaria", "dengue", "typhoid", "chicken_pox"],
    "Ophthalmologist": ["blurred_and_distorted_vision", "visual_disturbances", "eye"],
    "General Physician": [],  # Default fallback
}


def evaluate_triage(
    symptoms: List[str],
    symptom_severities: Optional[Dict[str, str]] = None,
    vitals: Optional[Dict[str, Any]] = None,
    predicted_disease: Optional[str] = None,
    risk_score_percentage: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Evaluates clinical urgency into a 4-tier triage structure:
    EMERGENCY, URGENT, MODERATE, MILD.
    """
    symptom_severities = symptom_severities or {}
    vitals = vitals or {}
    symptoms_clean = [s.strip().lower().replace(" ", "_") for s in symptoms]

    detected_critical_red_flags: List[Dict[str, str]] = []
    detected_serious_red_flags: List[Dict[str, str]] = []

    # 1. Evaluate Symptom Red Flags
    for sym in symptoms_clean:
        if sym in CRITICAL_RED_FLAGS:
            detected_critical_red_flags.append({
                "symptom": sym,
                "label": CRITICAL_RED_FLAGS[sym],
                "severity_type": "CRITICAL"
            })
        elif sym in SERIOUS_RED_FLAGS:
            detected_serious_red_flags.append({
                "symptom": sym,
                "label": SERIOUS_RED_FLAGS[sym],
                "severity_type": "SERIOUS"
            })

    # Check for severe user-indicated intensity on red flags
    for sym, sev in symptom_severities.items():
        sym_clean = sym.strip().lower().replace(" ", "_")
        if sev.lower() == "severe" and sym_clean not in [r["symptom"] for r in detected_critical_red_flags]:
            if sym_clean in ["high_fever", "chest_pain", "abdominal_pain", "breathlessness", "difficulty_breathing"]:
                detected_critical_red_flags.append({
                    "symptom": sym_clean,
                    "label": f"Severe User-Reported {sym.replace('_', ' ').title()}",
                    "severity_type": "CRITICAL"
                })

    # 2. Evaluate Vital Signs Boundaries
    vital_warnings: List[str] = []
    bp = str(vitals.get("Blood Pressure", "")).strip().lower()
    age = vitals.get("Age")
    hr = vitals.get("Heart Rate")
    spo2 = vitals.get("SpO2")
    temp = vitals.get("Temperature")

    if bp == "high" and ("chest_pain" in symptoms_clean or "breathlessness" in symptoms_clean):
        detected_critical_red_flags.append({
            "symptom": "hypertensive_crisis_risk",
            "label": "Elevated Blood Pressure with Acute Cardiopulmonary Symptoms",
            "severity_type": "CRITICAL"
        })
        vital_warnings.append("High blood pressure co-occurring with cardiopulmonary symptoms.")

    if hr and isinstance(hr, (int, float)):
        if hr > 130 or hr < 45:
            detected_critical_red_flags.append({
                "symptom": "critical_heart_rate",
                "label": f"Extreme Heart Rate Discrepancy ({hr} bpm)",
                "severity_type": "CRITICAL"
            })
            vital_warnings.append(f"Heart rate outside safe range: {hr} bpm.")

    if spo2 and isinstance(spo2, (int, float)) and spo2 < 90:
        detected_critical_red_flags.append({
            "symptom": "hypoxemia",
            "label": f"Severe Low Oxygen Saturation ({spo2}%)",
            "severity_type": "CRITICAL"
        })
        vital_warnings.append(f"Hypoxemia: Oxygen saturation is {spo2}%.")

    # 3. Determine 4-Tier Triage Level
    if len(detected_critical_red_flags) > 0:
        triage_level = "EMERGENCY"
        urgency_timeline = "Immediate Emergency Care"
        color_code = "#EF4444"  # Red
        action_message = "Seek immediate emergency medical care (call emergency services or proceed to the nearest emergency department)."
        priority_rank = 1
    elif len(detected_serious_red_flags) >= 2 or (risk_score_percentage and risk_score_percentage >= 70.0):
        triage_level = "URGENT"
        urgency_timeline = "Same-Day Evaluation (Within 12-24 Hours)"
        color_code = "#F59E0B"  # Amber
        action_message = "Prompt medical evaluation recommended. Consult a physician or visit an urgent care facility today."
        priority_rank = 2
    elif len(symptoms_clean) >= 4 or len(detected_serious_red_flags) == 1 or (risk_score_percentage and risk_score_percentage >= 40.0):
        triage_level = "MODERATE"
        urgency_timeline = "Consultation Within 2-4 Days"
        color_code = "#3B82F6"  # Blue
        action_message = "Schedule an appointment with a primary care clinician to assess symptoms and manage care."
        priority_rank = 3
    else:
        triage_level = "MILD"
        urgency_timeline = "Self-Care & Observation (1-2 Weeks)"
        color_code = "#10B981"  # Green
        action_message = "Supportive self-care, hydration, and rest. Monitor symptoms and seek medical advice if condition worsens or persists."
        priority_rank = 4

    # 4. Determine Recommended Specialist
    recommended_specialist = "General Physician"
    search_terms = symptoms_clean.copy()
    if predicted_disease:
        search_terms.append(predicted_disease.lower())

    for specialist, keywords in SPECIALIST_MAPPING.items():
        if any(kw in term for term in search_terms for kw in keywords):
            recommended_specialist = specialist
            break

    # Age vulnerability context
    age_vulnerability = None
    if age and isinstance(age, (int, float)):
        if age >= 65:
            age_vulnerability = "Elderly Population (Age >= 65) - Heightened Clinical Monitoring Advised"
        elif age <= 5:
            age_vulnerability = "Pediatric Population (Age <= 5) - Specialized Pediatric Attention Advised"

    return {
        "triage_level": triage_level,
        "priority_rank": priority_rank,
        "color_code": color_code,
        "urgency_timeline": urgency_timeline,
        "action_message": action_message,
        "recommended_specialist": recommended_specialist,
        "critical_red_flags": detected_critical_red_flags,
        "serious_red_flags": detected_serious_red_flags,
        "vital_warnings": vital_warnings,
        "age_vulnerability": age_vulnerability,
        "disclaimer": "Triage stratification is rule-assisted decision support and does not replace formal emergency triage."
    }
