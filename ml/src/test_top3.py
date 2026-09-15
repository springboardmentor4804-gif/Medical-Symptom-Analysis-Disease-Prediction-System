import joblib
import numpy as np

from pathlib import Path


# ============================================================
# Load Model
# ============================================================

MODEL_DIR = Path(
    r"D:\MedAssist_AI\ml\models"
)

MODEL = joblib.load(
    MODEL_DIR / "model.pkl"
)

MLB = joblib.load(
    MODEL_DIR / "mlb.pkl"
)

LABEL_ENCODER = joblib.load(
    MODEL_DIR / "label_encoder.pkl"
)


# ============================================================
# Test Symptoms
# ============================================================

symptoms = [
    "yellowing_of_eyes",
    "acute_liver_failure",
    "abdominal_pain",
    "fatigue",
    "dark_urine",
    "yellowish_skin",
    "joint_pain",
]


# ============================================================
# Transform
# ============================================================

X = MLB.transform(
    [symptoms]
)


# ============================================================
# Probabilities
# ============================================================

probabilities = MODEL.predict_proba(X)[0]

top_indices = np.argsort(
    probabilities
)[::-1][:3]


# ============================================================
# Results
# ============================================================

print("=" * 60)
print("TOP 3 DISEASE PREDICTIONS")
print("=" * 60)

for rank, index in enumerate(
    top_indices,
    start=1
):

    disease = LABEL_ENCODER.inverse_transform(
        [index]
    )[0]

    probability = (
        probabilities[index] * 100
    )

    print(
        f"{rank}. {disease}"
    )

    print(
        f"   Probability: {probability:.2f}%"
    )