import numpy as np
from pathlib import Path
import joblib


# ============================================================
# Model Directory
# ============================================================

BASE_DIR = Path(__file__).resolve().parent


# ============================================================
# Load Model
# ============================================================

MODEL = joblib.load(
    BASE_DIR / "models" / "model.pkl"
)

LABEL_ENCODER = joblib.load(
    BASE_DIR / "models" / "label_encoder.pkl"
)

MLB = joblib.load(
    BASE_DIR / "models" / "mlb.pkl"
)


# ============================================================
# Disease Prediction
# ============================================================

def predict_disease(symptoms: list[str]):

    # --------------------------------------------------------
    # Clean symptoms
    # --------------------------------------------------------

    cleaned = [
        symptom.strip().lower()
        for symptom in symptoms
        if symptom and symptom.strip()
    ]


    # --------------------------------------------------------
    # Convert symptoms into ML features
    # --------------------------------------------------------

    X = MLB.transform(
        [cleaned]
    )


    # --------------------------------------------------------
    # Prediction probabilities
    # --------------------------------------------------------

    probabilities = MODEL.predict_proba(X)[0]


    # --------------------------------------------------------
    # Top 3 predictions
    # --------------------------------------------------------

    top_indices = np.argsort(
        probabilities
    )[::-1][:3]


    top_predictions = []

    for index in top_indices:

        disease = LABEL_ENCODER.inverse_transform(
            [index]
        )[0]

        probability = float(
            probabilities[index] * 100
        )

        top_predictions.append({
            "disease": disease,
            "probability": round(
                probability,
                2
            ),
        })


    # --------------------------------------------------------
    # Main prediction
    # --------------------------------------------------------

    prediction = MODEL.predict(X)[0]

    disease = LABEL_ENCODER.inverse_transform(
        [prediction]
    )[0]


    confidence = float(
        probabilities[prediction] * 100
    )


    # --------------------------------------------------------
    # Return
    # --------------------------------------------------------

    return {
        "disease": disease,
        "confidence": round(
            confidence,
            2
        ),
        "top_predictions": top_predictions,
    }