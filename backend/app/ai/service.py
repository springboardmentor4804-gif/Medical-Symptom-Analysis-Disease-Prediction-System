import numpy as np

from .predictor import (
    MODEL,
    LABEL_ENCODER,
    MLB,
)


def predict_disease(symptoms: list[str]):
    cleaned = [
        symptom.strip().lower()
        for symptom in symptoms
        if symptom.strip()
    ]

    X = MLB.transform([cleaned])

    prediction = MODEL.predict(X)[0]

    probabilities = MODEL.predict_proba(X)[0]

    confidence = float(np.max(probabilities) * 100)

    disease = LABEL_ENCODER.inverse_transform(
        [prediction]
    )[0]

    return disease, confidence