# ============================================================
# MEDASSIST AI - RECOMMENDATION ENGINE
# ============================================================

def generate_recommendations(
    disease: str,
    symptoms: list[str],
    risk_level: str,
    severity_level: str,
):
    """
    Generate general healthcare recommendations.

    This engine provides educational guidance only.
    It does not prescribe medicines or replace a doctor.
    """

    # --------------------------------------------------------
    # Clean inputs
    # --------------------------------------------------------

    disease = (
        disease.strip()
        if disease
        else "Unknown condition"
    )

    cleaned_symptoms = [
        symptom.strip().lower()
        for symptom in symptoms
        if symptom and symptom.strip()
    ]

    risk_level = (
        risk_level.strip().capitalize()
        if risk_level
        else "Unknown"
    )

    severity_level = (
        severity_level.strip().capitalize()
        if severity_level
        else "Unknown"
    )

    # --------------------------------------------------------
    # Base recommendations
    # --------------------------------------------------------

    treatment_suggestions = [
        f"Consult a qualified healthcare professional regarding {disease}.",
        "Follow the treatment plan provided by your healthcare professional.",
        "Monitor your symptoms and note any changes over time.",
    ]

    preventive_advice = [
        "Maintain good personal hygiene.",
        "Maintain a balanced and nutritious diet.",
        "Stay adequately hydrated unless your healthcare professional advises otherwise.",
        "Maintain regular sleep and rest.",
    ]

    lifestyle_advice = [
        "Maintain a healthy daily routine.",
        "Avoid known personal triggers that may worsen symptoms.",
        "Keep track of recurring or worsening symptoms.",
    ]

    warning_signs = []

    # --------------------------------------------------------
    # Risk-based recommendations
    # --------------------------------------------------------

    if risk_level == "Low":

        preventive_advice.append(
            "Continue monitoring your symptoms and maintain healthy habits."
        )

    elif risk_level == "Moderate":

        treatment_suggestions.append(
            "Consider arranging a medical consultation if symptoms persist or worsen."
        )

        preventive_advice.append(
            "Monitor your symptoms more closely and seek professional advice if they do not improve."
        )

    elif risk_level == "High":

        treatment_suggestions.append(
            "Seek medical evaluation promptly, especially if symptoms are worsening."
        )

        warning_signs.extend([
            "Rapid worsening of symptoms",
            "Difficulty breathing",
            "Severe or persistent pain",
            "Fainting or significant weakness",
        ])

    elif risk_level == "Critical":

        treatment_suggestions.append(
            "Seek urgent medical attention."
        )

        warning_signs.extend([
            "Difficulty breathing",
            "Chest pain",
            "Loss of consciousness",
            "Severe or rapidly worsening symptoms",
        ])

    # --------------------------------------------------------
    # Severity-based recommendations
    # --------------------------------------------------------

    if severity_level == "Minimal":

        lifestyle_advice.append(
            "Continue monitoring symptoms and maintain your normal healthy routine."
        )

    elif severity_level == "Mild":

        lifestyle_advice.append(
            "Allow adequate rest and monitor whether symptoms improve."
        )

    elif severity_level == "Moderate":

        lifestyle_advice.append(
            "Monitor symptoms closely and consider professional medical evaluation."
        )

    elif severity_level == "Severe":

        warning_signs.extend([
            "Symptoms becoming significantly worse",
            "Difficulty breathing",
            "Severe chest pain",
            "Loss of consciousness",
        ])

        treatment_suggestions.append(
            "Prompt medical evaluation is recommended for severe symptoms."
        )

    # --------------------------------------------------------
    # Symptom-specific advisory
    # --------------------------------------------------------

    if "difficulty_breathing" in cleaned_symptoms:

        warning_signs.append(
            "Breathing difficulty that is severe or worsening requires urgent medical attention."
        )

    if "chest_pain" in cleaned_symptoms:

        warning_signs.append(
            "Severe, persistent, or worsening chest pain requires urgent medical evaluation."
        )

    if "loss_of_consciousness" in cleaned_symptoms:

        warning_signs.append(
            "Loss of consciousness requires urgent medical evaluation."
        )

    if "high_fever" in cleaned_symptoms:

        preventive_advice.append(
            "Monitor temperature and maintain adequate hydration when appropriate."
        )

    # --------------------------------------------------------
    # Remove duplicates
    # --------------------------------------------------------

    treatment_suggestions = list(
        dict.fromkeys(
            treatment_suggestions
        )
    )

    preventive_advice = list(
        dict.fromkeys(
            preventive_advice
        )
    )

    lifestyle_advice = list(
        dict.fromkeys(
            lifestyle_advice
        )
    )

    warning_signs = list(
        dict.fromkeys(
            warning_signs
        )
    )

    # --------------------------------------------------------
    # Final advisory
    # --------------------------------------------------------

    if (
        risk_level in ["High", "Critical"]
        or severity_level == "Severe"
    ):

        advisory = (
            "The assessment indicates elevated health "
            "concerns. Seek professional medical evaluation "
            "and do not rely on this AI assessment alone."
        )

    else:

        advisory = (
            "This AI-generated guidance is for educational "
            "and informational purposes only. Consult a "
            "qualified healthcare professional for diagnosis "
            "and treatment decisions."
        )

    # --------------------------------------------------------
    # Return
    # --------------------------------------------------------

    return {
        "disease": disease,
        "risk_level": risk_level,
        "severity_level": severity_level,
        "treatment_suggestions": treatment_suggestions,
        "preventive_advice": preventive_advice,
        "lifestyle_advice": lifestyle_advice,
        "warning_signs": warning_signs,
        "advisory": advisory,
    }