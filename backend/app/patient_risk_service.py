from pathlib import Path

import joblib
import pandas as pd


# --------------------------------------------------
# PATH
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "backend"
    / "models"
    / "patient_risk_model.pkl"
)


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

model = joblib.load(MODEL_PATH)


# --------------------------------------------------
# REQUIRED FEATURES
# --------------------------------------------------

REQUIRED_FEATURES = [
    "Fever",
    "Cough",
    "Fatigue",
    "Difficulty Breathing",
    "Age",
    "Gender",
    "Blood Pressure",
    "Cholesterol Level",
]


# --------------------------------------------------
# PATIENT RISK ASSESSMENT
# --------------------------------------------------

def assess_patient_risk(
    patient_data: dict
) -> dict:

    # Validate required fields
    missing_fields = [
        field
        for field in REQUIRED_FEATURES
        if field not in patient_data
    ]

    if missing_fields:

        raise ValueError(
            "Missing required fields: "
            + ", ".join(missing_fields)
        )

    # Keep only the features used during training
    input_data = {
        field: patient_data[field]
        for field in REQUIRED_FEATURES
    }

    # Convert to DataFrame
    input_df = pd.DataFrame(
        [input_data]
    )

    # Prediction
    prediction = model.predict(
        input_df
    )[0]

    # Prediction probabilities
    probabilities = model.predict_proba(
        input_df
    )[0]

    classes = list(
        model.classes_
    )

    # Get Positive score
    positive_index = classes.index(
        "Positive"
    )

    positive_score = (
        probabilities[positive_index]
        * 100
    )

    negative_index = classes.index(
        "Negative"
    )

    negative_score = (
        probabilities[negative_index]
        * 100
    )

    return {

        "predicted_outcome": str(
            prediction
        ),

        "positive_model_score": round(
            float(positive_score),
            2
        ),

        "negative_model_score": round(
            float(negative_score),
            2
        ),

        "disclaimer": (
            "This is an AI-generated risk estimate "
            "based on the provided patient profile. "
            "It is not a medical diagnosis."
        )
    }