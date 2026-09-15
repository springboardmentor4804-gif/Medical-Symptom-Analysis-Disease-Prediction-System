import pandas as pd
import joblib
import numpy as np

from pathlib import Path


# ============================================================
# Load Dataset
# ============================================================

DATASET_PATH = r"D:\MedAssist_AI\datasets\dataset.csv"

df = pd.read_csv(DATASET_PATH)

symptom_columns = [
    col for col in df.columns
    if col.startswith("Symptom")
]


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
# Prepare 3-Symptom Records
# ============================================================

three_symptom_cases = []

for _, row in df.iterrows():

    symptoms = []

    for column in symptom_columns:

        value = str(row[column]).strip().lower()

        if value in ["", "none", "nan"]:
            continue

        symptoms.append(value)

    if len(symptoms) == 3:

        three_symptom_cases.append({
            "disease": row["Disease"],
            "symptoms": symptoms
        })


# ============================================================
# Test
# ============================================================

print("=" * 60)
print("THREE-SYMPTOM BASELINE TEST")
print("=" * 60)

print(
    "Three-symptom records:",
    len(three_symptom_cases)
)


correct = 0
confidences = []

for case in three_symptom_cases:

    X = MLB.transform(
        [case["symptoms"]]
    )

    prediction = MODEL.predict(X)[0]

    probabilities = MODEL.predict_proba(X)[0]

    confidence = float(
        np.max(probabilities) * 100
    )

    disease = LABEL_ENCODER.inverse_transform(
        [prediction]
    )[0]

    if disease.strip().lower() == str(
        case["disease"]
    ).strip().lower():

        correct += 1

    confidences.append(confidence)


# ============================================================
# Results
# ============================================================

if three_symptom_cases:

    accuracy = (
        correct /
        len(three_symptom_cases)
    ) * 100

    average_confidence = np.mean(
        confidences
    )

    print("\nAccuracy on 3-symptom records:")
    print(f"{accuracy:.2f}%")

    print(
        "Average confidence:"
        f" {average_confidence:.2f}%"
    )

print("=" * 60)