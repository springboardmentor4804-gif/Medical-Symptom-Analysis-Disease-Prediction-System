import pandas as pd
import joblib
import random
import numpy as np

from pathlib import Path
from sklearn.model_selection import train_test_split


# ============================================================
# Configuration
# ============================================================

DATASET_PATH = r"D:\MedAssist_AI\datasets\dataset.csv"

MODEL_DIR = Path(
    r"D:\MedAssist_AI\ml\models"
)

RANDOM_STATE = 42


# ============================================================
# Load Dataset
# ============================================================

df = pd.read_csv(DATASET_PATH)

symptom_columns = [
    col for col in df.columns
    if col.startswith("Symptom")
]


# ============================================================
# Clean Symptoms
# ============================================================

def get_symptoms(row):

    symptoms = []

    for column in symptom_columns:

        value = str(row[column]).strip().lower()

        if value in ["", "none", "nan"]:
            continue

        symptoms.append(value)

    return tuple(sorted(set(symptoms)))


df["symptom_pattern"] = df.apply(
    get_symptoms,
    axis=1
)


# ============================================================
# Group by Symptom Pattern
# ============================================================

patterns = (
    df[
        [
            "Disease",
            "symptom_pattern"
        ]
    ]
    .drop_duplicates()
)


print("=" * 60)
print("GROUPED PARTIAL-SYMPTOM EVALUATION")
print("=" * 60)

print(
    "Unique patterns:",
    len(patterns)
)


# ============================================================
# Split Patterns
# ============================================================

train_patterns, test_patterns = train_test_split(
    patterns,
    test_size=0.20,
    random_state=RANDOM_STATE,
)


print(
    "Training patterns:",
    len(train_patterns)
)

print(
    "Testing patterns:",
    len(test_patterns)
)


# ============================================================
# Load Existing Model
# ============================================================

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
# Evaluate Partial Symptoms
# ============================================================

correct = 0
total = 0

confidences = []

results = []


for _, row in test_patterns.iterrows():

    disease = row["Disease"]

    full_symptoms = list(
        row["symptom_pattern"]
    )

    # Need at least 3 symptoms
    if len(full_symptoms) < 3:
        continue

    # Randomly keep about 60% of symptoms
    random.seed(
        RANDOM_STATE + total
    )

    keep_count = max(
        3,
        int(len(full_symptoms) * 0.6)
    )

    partial_symptoms = random.sample(
        full_symptoms,
        keep_count
    )

    # Transform
    X = MLB.transform(
        [partial_symptoms]
    )

    # Predict
    prediction = MODEL.predict(X)[0]

    probabilities = MODEL.predict_proba(X)[0]

    confidence = float(
        np.max(probabilities) * 100
    )

    predicted_disease = (
        LABEL_ENCODER
        .inverse_transform(
            [prediction]
        )[0]
    )

    # Check
    is_correct = (
        predicted_disease.strip().lower()
        ==
        str(disease).strip().lower()
    )

    if is_correct:
        correct += 1

    total += 1

    confidences.append(
        confidence
    )

    results.append({
        "actual": disease,
        "predicted": predicted_disease,
        "symptoms": partial_symptoms,
        "confidence": confidence,
        "correct": is_correct,
    })


# ============================================================
# Results
# ============================================================

print("\n" + "=" * 60)
print("RESULTS")
print("=" * 60)

if total > 0:

    accuracy = (
        correct / total
    ) * 100

    average_confidence = np.mean(
        confidences
    )

    print(
        "Partial-symptom cases:",
        total
    )

    print(
        f"Accuracy: {accuracy:.2f}%"
    )

    print(
        f"Average confidence: "
        f"{average_confidence:.2f}%"
    )


# ============================================================
# Show Sample Predictions
# ============================================================

print("\n" + "=" * 60)
print("SAMPLE PREDICTIONS")
print("=" * 60)

for result in results[:20]:

    print("\nSymptoms:")
    print(result["symptoms"])

    print(
        "Actual:",
        result["actual"]
    )

    print(
        "Predicted:",
        result["predicted"]
    )

    print(
        f"Confidence: "
        f"{result['confidence']:.2f}%"
    )

    print(
        "Correct:",
        result["correct"]
    )