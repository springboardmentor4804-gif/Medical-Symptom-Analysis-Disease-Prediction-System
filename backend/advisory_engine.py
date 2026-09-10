"""
Advisory Engine Module for MedAssist AI Platform (Milestone 3 - Task 4)
Generates structured, non-diagnostic Health Advisory Dossiers based on:
- Patient Information (Age, Symptoms, Chronic Conditions)
- AI Disease Predictions (disease_prediction_model.pkl)
- Symptom Severity & CVD Risk Assessments (symptom_severity.pkl & cvd_prediction_model.pkl)
- Task 1 Treatment/Health Recommendations (recommendations.py)

Strictly non-prescriptive, informational guidance tagged with explicit medical disclaimers.
"""

def generate_health_advisory(disease_name, risk_level, severity_level, symptoms=None, risk_score=75, specialty="Cardiologist"):
    symptoms = symptoms or []
    
    # 1. Determine Triage Pathway
    if risk_level == "Critical" or risk_score >= 85:
        triage_category = "🚨 Immediate Emergency Evaluation Needed"
        action_step = "Proceed to an Emergency Medical Center or Urgent Care facility without delay. Monitor vital signs closely."
        triage_urgency = "Critical (Priority Level 1)"
    elif risk_level == "High" or risk_score >= 65:
        triage_category = "⚡ Prompt Specialist Consultation Recommended"
        action_step = f"Schedule an urgent clinical evaluation with a specialist doctor (Dr. {specialty}) within 24-48 hours."
        triage_urgency = "High Priority (Level 2)"
    elif risk_level == "Moderate" or risk_score >= 40:
        triage_category = "📅 Outpatient Doctor Consultation Advised"
        action_step = f"Schedule a routine medical consultation with a primary physician or Dr. {specialty} for clinical assessment."
        triage_urgency = "Moderate Priority (Level 3)"
    else:
        triage_category = "🟢 Primary Self-Care & Routine Check-up"
        action_step = "Maintain supportive self-care, monitor symptoms, and seek medical consultation if symptoms persist or worsen."
        triage_urgency = "Low Priority (Level 4)"

    # 2. Vital Parameters Monitoring Plan
    monitoring_parameters = [
        "Body Temperature & Fever Log (3-4 times daily)",
        "Resting Heart Rate & Pulse Saturation",
        "Blood Pressure Readings (Morning & Evening)",
        "Symptom Progression & Severity Tracker"
    ]
    if any(s in str(symptoms).lower() for s in ["chest pain", "palpitations", "shortness of breath"]):
        monitoring_parameters.append("Oxygen Saturation (SpO2 %) & Respiratory Rate")

    # 3. Advisory Summary for Doctor Review
    doctor_review_summary = (
        f"Patient presented with {len(symptoms)} reported symptoms. AI predicted condition '{disease_name}' "
        f"with a calculated Risk Score of {risk_score}% ({risk_level} Risk, {severity_level} Severity). "
        f"Recommended Target Specialist: Dr. {specialty}. Pre-evaluation advisory dossier prepared for clinical review."
    )

    # 4. Structured Health Advisory Dossier Payload
    return {
        "advisoryTitle": f"AI Health Advisory Dossier — {disease_name}",
        "disclaimer": "⚠️ AI-Generated Supportive Health Advisory (Informational Guidance — Not an Official Clinical Prescription). Please consult a qualified doctor for official clinical diagnosis.",
        "triageCategory": triage_category,
        "triageUrgency": triage_urgency,
        "recommendedActionStep": action_step,
        "targetSpecialty": f"Dr. {specialty}",
        "riskAssessmentSummary": f"Calculated Risk Index: {risk_score}% ({risk_level} Risk Level, {severity_level} Symptom Severity)",
        "monitoringParameters": monitoring_parameters,
        "doctorReviewSummary": doctor_review_summary,
        "isModular": True,
        "version": "Milestone3_Task4_v1.0"
    }
