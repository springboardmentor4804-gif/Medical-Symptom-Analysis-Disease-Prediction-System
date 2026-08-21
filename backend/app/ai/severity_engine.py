# =========================================================
# MedAssist AI - Severity Analysis Engine
# =========================================================

# IMPORTANT:
# This is an application-level symptom severity indicator.
# It is NOT a clinically validated medical severity score.

# =========================================================
# HIGH SEVERITY SYMPTOMS
# =========================================================

SEVERE_SYMPTOMS = {
    "difficulty_breathing",
    "breathlessness",
    "chest_pain",
    "loss_of_consciousness",
    "coma",
    "blood_in_sputum",
    "severe_bleeding",
    "vomiting_blood",
    "bloody_stool",
}


# =========================================================
# MODERATE SEVERITY SYMPTOMS
# =========================================================

MODERATE_SYMPTOMS = {
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


# =========================================================
# MILD SYMPTOMS
# =========================================================

MILD_SYMPTOMS = {
    "cough",
    "fatigue",
    "headache",
    "nausea",
    "mild_fever",
    "itching",
    "sneezing",
    "runny_nose",
}


# =========================================================
# Severity Analysis
# =========================================================

def calculate_severity(
    symptoms: list[str],
) -> dict:
    """
    Calculate an application-level symptom severity score.

    This is NOT a medical diagnosis and should not be used
    as a replacement for professional clinical assessment.
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
    # Match symptom categories
    # -----------------------------------------------------

    severe_matches = (
        cleaned_symptoms
        & SEVERE_SYMPTOMS
    )

    moderate_matches = (
        cleaned_symptoms
        & MODERATE_SYMPTOMS
    )

    mild_matches = (
        cleaned_symptoms
        & MILD_SYMPTOMS
    )

    # -----------------------------------------------------
    # Calculate score
    #
    # Severe symptom    = 30 points
    # Moderate symptom  = 15 points
    # Mild symptom      = 5 points
    #
    # Maximum score = 100
    # -----------------------------------------------------

    severe_score = min(
        len(severe_matches) * 30,
        60,
    )

    moderate_score = min(
        len(moderate_matches) * 15,
        30,
    )

    mild_score = min(
        len(mild_matches) * 5,
        10,
    )

    severity_score = (
        severe_score
        + moderate_score
        + mild_score
    )

    severity_score = min(
        severity_score,
        100,
    )

    # -----------------------------------------------------
    # Severity Level
    # -----------------------------------------------------

    if severity_score >= 60:

        severity_level = "Severe"

    elif severity_score >= 30:

        severity_level = "Moderate"

    elif severity_score >= 10:

        severity_level = "Mild"

    else:

        severity_level = "Minimal"

    # -----------------------------------------------------
    # Severity Factors
    # -----------------------------------------------------

    severity_factors = []

    for symptom in sorted(
        severe_matches
    ):
        severity_factors.append(
            symptom.replace(
                "_",
                " ",
            )
        )

    for symptom in sorted(
        moderate_matches
    ):
        severity_factors.append(
            symptom.replace(
                "_",
                " ",
            )
        )

    # -----------------------------------------------------
    # Return Result
    # -----------------------------------------------------

    return {

        "severity_score":
            severity_score,

        "severity_level":
            severity_level,

        "severity_factors":
            severity_factors,

        "severe_symptoms":
            sorted(
                severe_matches
            ),

        "moderate_symptoms":
            sorted(
                moderate_matches
            ),

        "mild_symptoms":
            sorted(
                mild_matches
            ),
    }