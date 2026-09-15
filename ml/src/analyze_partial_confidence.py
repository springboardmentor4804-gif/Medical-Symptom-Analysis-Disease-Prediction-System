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
# Extract Symptom Pattern
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
# Unique Patterns
# ============================================================

patterns = (
    df[
        ["Disease", "symptom_pattern"]
    ]
    .drop_duplicates()
)


# ============================================================
# Grouped Test Split
# ============================================================

train_patterns, test_patterns = train_test_split(
    patterns,
    test_size=0.20,
    random_state=RANDOM_STATE,
)


# ============================================================
# Load Model
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
# Evaluate
# ============================================================

results = []


for index, (_, row) in enumerate(
    test_patterns.iterrows()
):

    disease = row["Disease"]

    full_symptoms = list(
        row["symptom_pattern"]
    )

    if len(full_symptoms) < 3:
        continue

    random.seed(
        RANDOM_STATE + index
    )

    keep_count = max(
        3,
        int(len(full_symptoms) * 0.6)
    )

    partial_symptoms = random.sample(
        full_symptoms,
        keep_count
    )

    X = MLB.transform(
        [partial_symptoms]
    )

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

    correct = (
        predicted_disease.strip().lower()
        ==
        str(disease).strip().lower()
    )

    results.append({
        "actual": disease,
        "predicted": predicted_disease,
        "confidence": confidence,
        "correct": correct,
        "symptom_count": len(partial_symptoms),
    })


# ============================================================
# DataFrame
# ============================================================

results_df = pd.DataFrame(results)


# ============================================================
# Confidence Groups
# ============================================================

results_df["confidence_group"] = pd.cut(
    results_df["confidence"],
    bins=[
        0,
        40,
        60,
        70,
        80,
        90,
        100
    ],
    labels=[
        "<40%",
        "40-60%",
        "60-70%",
        "70-80%",
        "80-90%",
        "90-100%"
    ],
    include_lowest=True
)


# ============================================================
# Results
# ============================================================

print("=" * 60)
print("PARTIAL-SYMPTOM CONFIDENCE ANALYSIS")
print("=" * 60)

print(
    "\nTotal cases:",
    len(results_df)
)


print("\nConfidence distribution:")

print(
    results_df[
        "confidence_group"
    ].value_counts(
        sort=False
    )
)


print("\nAccuracy by confidence:")

accuracy_by_confidence = (
    results_df
    .groupby(
        "confidence_group",
        observed=False
    )["correct"]
    .agg(
        ["count", "mean"]
    )
)

accuracy_by_confidence["accuracy"] = (
    accuracy_by_confidence["mean"] * 100
)

print(
    accuracy_by_confidence[
        ["count", "accuracy"]
    ]
)


print("\nAverage confidence:")
print(
    f"{results_df['confidence'].mean():.2f}%"
)


print("\nOverall accuracy:")

print(
    f"{results_df['correct'].mean() * 100:.2f}%"
)


print("=" * 60)