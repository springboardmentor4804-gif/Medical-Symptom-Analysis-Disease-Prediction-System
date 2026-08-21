# =========================================================
# MedAssist AI - Risk Scoring Engine
# =========================================================

# Symptoms that may indicate increased clinical concern.
# These are NOT diagnoses. They are only used as indicators
# for the application's risk-scoring workflow.

HIGH_RISK_SYMPTOMS = {
    "difficulty_breathing",
    "breathlessness",
    "chest_pain",
    "loss_of_consciousness",
    "coma",
    "blood_in_sputum",
    "acute_liver_failure",
    "severe_bleeding",
    "bloody_stool",
    "vomiting_blood",
}

MODERATE_RISK_SYMPTOMS = {
    "high_fever",
    "persistent_fever",
    "severe_headache",
    "severe_abdominal_pain",
    "continuous_vomiting",
    "confusion",
    "dizziness",
    "weakness",
    "yellowing_of_eyes",
    "yellowish_skin",
}


def calculate_risk(
    symptoms: list[str],
    confidence: float,
) -> dict:
    """
    Calculate an application-level health risk score.

    This score is a decision-support indicator and is NOT
    a medical diagnosis.
    """

    # -----------------------------------------------------
    # Clean symptoms
    # -----------------------------------------------------

    cleaned_symptoms = {
        symptom.strip().lower()
        for symptom in symptoms
        if symptom and symptom.strip()
    }

    # -----------------------------------------------------
    # Confidence contribution
    #
    # Maximum contribution: 40 points
    # -----------------------------------------------------

    confidence = max(
        0.0,
        min(float(confidence), 100.0)
    )

    confidence_score = (
        confidence * 0.30
    )

    # -----------------------------------------------------
    # High-risk symptom contribution
    #
    # Maximum: 40 points
    # -----------------------------------------------------

    high_risk_matches = (
        cleaned_symptoms
        & HIGH_RISK_SYMPTOMS
    )

    high_risk_score = min(
        len(high_risk_matches) * 25,
        60
    )

    # -----------------------------------------------------
    # Moderate-risk symptom contribution
    #
    # Maximum: 20 points
    # -----------------------------------------------------

    moderate_risk_matches = (
        cleaned_symptoms
        & MODERATE_RISK_SYMPTOMS
    )

    moderate_risk_score = min(
        len(moderate_risk_matches) * 10,
        20
    )

    # -----------------------------------------------------
    # Calculate final score
    # -----------------------------------------------------

    total_score = (
        confidence_score
        + high_risk_score
        + moderate_risk_score
    )

    total_score = min(
        round(total_score),
        100
    )

    # -----------------------------------------------------
    # Risk level
    # -----------------------------------------------------

    # -----------------------------------------------------
# Critical escalation
#
# Multiple high-risk symptoms indicate a potentially
# serious situation regardless of model confidence.
# -----------------------------------------------------

    if len(high_risk_matches) >= 3:
        risk_level = "Critical"

    elif total_score >= 80:
        risk_level = "Critical"

    elif total_score >= 60:
        risk_level = "High"

    elif total_score >= 30:
        risk_level = "Moderate"

    else:
        risk_level = "Low"

    # -----------------------------------------------------
    # Risk factors
    # -----------------------------------------------------

    risk_factors = []

    for symptom in sorted(
        high_risk_matches
    ):
        risk_factors.append(
            symptom.replace("_", " ")
        )

    for symptom in sorted(
        moderate_risk_matches
    ):
        risk_factors.append(
            symptom.replace("_", " ")
        )

    # -----------------------------------------------------
    # Return result
    # -----------------------------------------------------

    return {
        "risk_score": total_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "high_risk_symptoms": sorted(
            high_risk_matches
        ),
        "moderate_risk_symptoms": sorted(
            moderate_risk_matches
        ),
    }