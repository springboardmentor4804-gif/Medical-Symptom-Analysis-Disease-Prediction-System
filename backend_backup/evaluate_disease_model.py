import joblib
import pandas as pd
import numpy as np

from pathlib import Path

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = (
    BASE_DIR
    / "app"
    / "ai"
    / "models"
)

DATASET_PATH = (
    BASE_DIR
    / "D:\MedAssist_AI\datasets\dataset.csv"
)


# ============================================================
# LOAD MODEL COMPONENTS
# ============================================================

print("=" * 70)
print("MEDASSIST AI - DISEASE MODEL EVALUATION")
print("=" * 70)

print("\nLoading model components...")

MODEL = joblib.load(
    MODEL_DIR / "model.pkl"
)

MLB = joblib.load(
    MODEL_DIR / "mlb.pkl"
)

LABEL_ENCODER = joblib.load(
    MODEL_DIR / "label_encoder.pkl"
)

print("Model loaded successfully.")
print("Model:", MODEL.__class__.__name__)
print("Trees:", MODEL.n_estimators)
print("Features:", MODEL.n_features_in_)
print(
    "Disease Classes:",
    len(LABEL_ENCODER.classes_)
)


# ============================================================
# LOAD DATASET
# ============================================================

print("\nLoading dataset...")

if not DATASET_PATH.exists():

    raise FileNotFoundError(
        f"\nDataset not found:\n{DATASET_PATH}\n\n"
        "Copy your uploaded CSV into the backend folder "
        "and rename it to disease_dataset.csv"
    )


df = pd.read_csv(DATASET_PATH)

print(
    f"Dataset loaded successfully: "
    f"{len(df)} rows"
)

print(
    f"Columns: {len(df.columns)}"
)


# ============================================================
# FIND TARGET COLUMN
# ============================================================

target_candidates = [
    "Disease",
    "disease",
    "prognosis",
    "Prognosis",
    "target",
    "Target",
]

target_column = None

for column in target_candidates:

    if column in df.columns:

        target_column = column
        break


if target_column is None:

    raise ValueError(
        "\nCould not find the disease target column.\n"
        f"Available columns:\n{list(df.columns)}"
    )


print(
    f"\nTarget column: {target_column}"
)


# ============================================================
# FIND SYMPTOM COLUMNS
# ============================================================

symptom_columns = [
    column
    for column in df.columns
    if column.lower().startswith("symptom")
]


if not symptom_columns:

    raise ValueError(
        "\nNo symptom columns found."
    )


print(
    f"Symptom columns: {len(symptom_columns)}"
)

print(
    symptom_columns
)


# ============================================================
# CLEAN SYMPTOMS
# ============================================================

print("\nPreparing symptoms...")


def clean_symptoms(row):

    symptoms = []

    for column in symptom_columns:

        value = row[column]

        if pd.isna(value):
            continue

        value = str(value).strip().lower()

        if value:
            symptoms.append(value)

    return symptoms


X_symptoms = df.apply(
    clean_symptoms,
    axis=1
)


y_true = (
    df[target_column]
    .astype(str)
    .str.strip()
)


# ============================================================
# REMOVE EMPTY ROWS
# ============================================================

valid_rows = X_symptoms.apply(
    lambda x: len(x) > 0
)

X_symptoms = X_symptoms[
    valid_rows
].reset_index(drop=True)

y_true = y_true[
    valid_rows
].reset_index(drop=True)


print(
    f"Valid samples: {len(X_symptoms)}"
)


# ============================================================
# ENCODE SYMPTOMS
# ============================================================

print("\nEncoding symptoms using existing MLB...")

X = MLB.transform(
    X_symptoms
)

print(
    "Encoded feature shape:",
    X.shape
)


# ============================================================
# MODEL PREDICTION
# ============================================================

print("\nRunning model predictions...")

y_pred_encoded = MODEL.predict(X)


# ============================================================
# DECODE PREDICTIONS
# ============================================================

y_pred = LABEL_ENCODER.inverse_transform(
    y_pred_encoded
)


# ============================================================
# BASIC METRICS
# ============================================================

accuracy = accuracy_score(
    y_true,
    y_pred
)

precision = precision_score(
    y_true,
    y_pred,
    average="weighted",
    zero_division=0
)

recall = recall_score(
    y_true,
    y_pred,
    average="weighted",
    zero_division=0
)

f1 = f1_score(
    y_true,
    y_pred,
    average="weighted",
    zero_division=0
)


# ============================================================
# TOP-3 ACCURACY
# ============================================================

print("\nCalculating Top-3 accuracy...")

probabilities = MODEL.predict_proba(X)

top_3_encoded = np.argsort(
    probabilities,
    axis=1
)[:, -3:]

top_3_predictions = LABEL_ENCODER.inverse_transform(
    top_3_encoded.flatten()
).reshape(
    top_3_encoded.shape
)

top_3_correct = np.array([
    true_label in predictions
    for true_label, predictions
    in zip(
        y_true,
        top_3_predictions
    )
])

top_3_accuracy = (
    top_3_correct.mean()
)


# ============================================================
# RESULTS
# ============================================================

print("\n")
print("=" * 70)
print("MODEL PERFORMANCE")
print("=" * 70)

print(
    f"\nAlgorithm          : "
    f"{MODEL.__class__.__name__}"
)

print(
    f"Number of Trees    : "
    f"{MODEL.n_estimators}"
)

print(
    f"Number of Features : "
    f"{MODEL.n_features_in_}"
)

print(
    f"Number of Diseases : "
    f"{len(LABEL_ENCODER.classes_)}"
)

print(
    f"Evaluation Samples : "
    f"{len(y_true)}"
)

print("\n----------------------------------------")

print(
    f"Accuracy           : "
    f"{accuracy * 100:.2f}%"
)

print(
    f"Precision          : "
    f"{precision * 100:.2f}%"
)

print(
    f"Recall             : "
    f"{recall * 100:.2f}%"
)

print(
    f"F1 Score           : "
    f"{f1 * 100:.2f}%"
)

print(
    f"Top-3 Accuracy     : "
    f"{top_3_accuracy * 100:.2f}%"
)

print("----------------------------------------")


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n")
print("=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

print(
    classification_report(
        y_true,
        y_pred,
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\n")
print("=" * 70)
print("CONFUSION MATRIX")
print("=" * 70)

labels = LABEL_ENCODER.classes_

cm = confusion_matrix(
    y_true,
    y_pred,
    labels=labels
)

cm_df = pd.DataFrame(
    cm,
    index=labels,
    columns=labels
)

print(cm_df)


# ============================================================
# SAVE RESULTS
# ============================================================

results = {
    "model": MODEL.__class__.__name__,
    "n_estimators": MODEL.n_estimators,
    "features": MODEL.n_features_in_,
    "diseases": len(LABEL_ENCODER.classes_),
    "samples": len(y_true),
    "accuracy": round(
        accuracy * 100,
        2
    ),
    "precision": round(
        precision * 100,
        2
    ),
    "recall": round(
        recall * 100,
        2
    ),
    "f1_score": round(
        f1 * 100,
        2
    ),
    "top_3_accuracy": round(
        top_3_accuracy * 100,
        2
    ),
}


results_df = pd.DataFrame(
    [results]
)

results_df.to_csv(
    BASE_DIR
    / "disease_model_metrics.csv",
    index=False
)

cm_df.to_csv(
    BASE_DIR
    / "disease_confusion_matrix.csv"
)


print("\n")
print("=" * 70)
print("RESULT FILES CREATED")
print("=" * 70)

print(
    "\nMetrics:"
)

print(
    BASE_DIR
    / "disease_model_metrics.csv"
)

print(
    "\nConfusion Matrix:"
)

print(
    BASE_DIR
    / "disease_confusion_matrix.csv"
)

print("\nEvaluation complete! 🔥")