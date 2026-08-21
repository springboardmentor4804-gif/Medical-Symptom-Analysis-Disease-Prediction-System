import joblib
import pandas as pd

from pathlib import Path


# ============================================================
# Model Directory
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = (
    BASE_DIR
    / "models"
    / "diabetes"
)


# ============================================================
# Load Model
# ============================================================

MODEL = joblib.load(
    MODEL_DIR / "diabetes_model.pkl"
)

FEATURES = joblib.load(
    MODEL_DIR / "diabetes_features.pkl"
)


# ============================================================
# Diabetes Prediction
# ============================================================

def predict_diabetes(data: dict):

    # Create DataFrame
    X = pd.DataFrame([data])

    # Ensure correct feature order
    X = X[FEATURES]

    # Prediction
    prediction = MODEL.predict(X)[0]

    # Probability
    probabilities = MODEL.predict_proba(X)[0]

    diabetes_probability = (
        float(probabilities[1]) * 100
    )

    # Risk level
    if diabetes_probability >= 70:
        risk_level = "High"

    elif diabetes_probability >= 40:
        risk_level = "Medium"

    else:
        risk_level = "Low"

    return {
        "prediction": int(prediction),
        "diabetes_probability": round(
            diabetes_probability,
            2
        ),
        "risk_level": risk_level,
    }