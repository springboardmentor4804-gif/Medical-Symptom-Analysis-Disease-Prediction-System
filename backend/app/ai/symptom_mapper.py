# ============================================================
# Symptom Mapper
# Converts application symptom names/values
# into ML model vocabulary
# ============================================================


def normalize_symptoms(symptoms: list[str]) -> list[str]:
    """
    Convert application symptom names into
    the vocabulary used by the ML model.
    """

    normalized = []

    for symptom in symptoms:

        if not symptom:
            continue

        symptom = symptom.strip().lower()

        # Ignore empty values
        if symptom in ["", "none", "nan"]:
            continue

        # ---------------------------------------------
        # Application → ML vocabulary
        # ---------------------------------------------

        mapping = {

            # Respiratory
            "shortness_of_breath": "breathlessness",

            # Direct mappings
            "cough": "cough",
            "headache": "headache",
            "fatigue": "fatigue",
            "chest_pain": "chest_pain",

            # Fever
            "mild_fever": "mild_fever",
            "high_fever": "high_fever",

        }

        mapped = mapping.get(symptom)

        if mapped:
            normalized.append(mapped)

    return list(set(normalized))


# ============================================================
# Symptom Normalizer
# ============================================================

def normalize_symptoms(symptoms: list[str]) -> list[str]:
    """
    Convert application symptom names into the
    vocabulary understood by the trained ML model.
    """

    normalized = []

    mapping = {
        "cough": "cough",
        "headache": "headache",
        "fatigue": "fatigue",
        "chest_pain": "chest_pain",

        "shortness_of_breath": "breathlessness",

        "mild_fever": "mild_fever",
        "high_fever": "high_fever",

        "itching": "itching",
        "skin_rash": "skin_rash",
        "vomiting": "vomiting",
        "nausea": "nausea",
        "diarrhoea": "diarrhoea",
        "constipation": "constipation",
        "stomach_pain": "stomach_pain",
        "joint_pain": "joint_pain",
        "muscle_pain": "muscle_pain",
        "weakness": "weakness_in_limbs",
    }

    for symptom in symptoms:

        if not symptom:
            continue

        symptom = symptom.strip().lower()

        if symptom in ["", "none", "nan"]:
            continue

        mapped = mapping.get(symptom)

        if mapped:
            normalized.append(mapped)

    # Remove duplicates
    return list(set(normalized))