from pathlib import Path
import json

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


# --------------------------------------------------
# PATHS
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "Disease_symptom_and_patient_profile_dataset.csv"
)

MODELS_DIR = PROJECT_ROOT / "backend" / "models"

MODEL_PATH = MODELS_DIR / "patient_risk_model.pkl"
METADATA_PATH = MODELS_DIR / "patient_risk_model_metadata.json"


# --------------------------------------------------
# LOAD DATASET
# --------------------------------------------------

df = pd.read_csv(
    DATASET_PATH,
    encoding="latin1"
)

print("=" * 60)
print("MEDASSIST AI - PATIENT RISK MODEL")
print("=" * 60)

print("\nOriginal dataset:")
print("Rows:", len(df))


# --------------------------------------------------
# REMOVE EXACT DUPLICATES
# --------------------------------------------------

duplicate_count = df.duplicated().sum()

print("\nDuplicate rows:", duplicate_count)

df = df.drop_duplicates().reset_index(drop=True)

print("Rows after removing duplicates:", len(df))


# --------------------------------------------------
# FEATURES AND TARGET
# --------------------------------------------------

target = "Outcome Variable"

feature_columns = [
    "Fever",
    "Cough",
    "Fatigue",
    "Difficulty Breathing",
    "Age",
    "Gender",
    "Blood Pressure",
    "Cholesterol Level",
]

X = df[feature_columns]
y = df[target]


# --------------------------------------------------
# DATA DISTRIBUTION
# --------------------------------------------------

print("\nTarget distribution:")
print(y.value_counts())


# --------------------------------------------------
# COLUMN TYPES
# --------------------------------------------------

categorical_features = [
    "Fever",
    "Cough",
    "Fatigue",
    "Difficulty Breathing",
    "Gender",
    "Blood Pressure",
    "Cholesterol Level",
]

numerical_features = [
    "Age"
]


# --------------------------------------------------
# PREPROCESSING
# --------------------------------------------------

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            categorical_features,
        ),
        (
            "numerical",
            "passthrough",
            numerical_features,
        ),
    ]
)


# --------------------------------------------------
# MODEL
# --------------------------------------------------

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1,
)


pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ]
)


# --------------------------------------------------
# TRAIN / TEST SPLIT
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)


print("\nTraining rows:", len(X_train))
print("Testing rows:", len(X_test))


# --------------------------------------------------
# TRAIN
# --------------------------------------------------

print("\nTraining patient risk model...")

pipeline.fit(
    X_train,
    y_train
)


# --------------------------------------------------
# PREDICTION
# --------------------------------------------------

predictions = pipeline.predict(X_test)


# --------------------------------------------------
# PROBABILITIES
# --------------------------------------------------

probabilities = pipeline.predict_proba(X_test)

classes = pipeline.classes_

print("\nClasses:", list(classes))


# --------------------------------------------------
# METRICS
# --------------------------------------------------

accuracy = accuracy_score(
    y_test,
    predictions
)

precision = precision_score(
    y_test,
    predictions,
    pos_label="Positive"
)

recall = recall_score(
    y_test,
    predictions,
    pos_label="Positive"
)

f1 = f1_score(
    y_test,
    predictions,
    pos_label="Positive"
)

balanced_accuracy = balanced_accuracy_score(
    y_test,
    predictions
)


print("\n" + "=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(
    f"\nAccuracy:           {accuracy:.4f}"
)

print(
    f"Precision:          {precision:.4f}"
)

print(
    f"Recall:             {recall:.4f}"
)

print(
    f"F1 Score:           {f1:.4f}"
)

print(
    f"Balanced Accuracy:  {balanced_accuracy:.4f}"
)


# --------------------------------------------------
# CLASSIFICATION REPORT
# --------------------------------------------------

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions
    )
)


# --------------------------------------------------
# CONFUSION MATRIX
# --------------------------------------------------

cm = confusion_matrix(
    y_test,
    predictions,
    labels=classes
)

print("\nConfusion Matrix:")
print(cm)


# --------------------------------------------------
# SAVE MODEL
# --------------------------------------------------

MODELS_DIR.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(
    pipeline,
    MODEL_PATH
)


# --------------------------------------------------
# SAVE METADATA
# --------------------------------------------------

metadata = {
    "dataset": str(
        DATASET_PATH.relative_to(PROJECT_ROOT)
    ),
    "original_rows": int(
        len(df) + duplicate_count
    ),
    "duplicate_rows_removed": int(
        duplicate_count
    ),
    "unique_rows": int(
        len(df)
    ),
    "train_rows": int(
        len(X_train)
    ),
    "test_rows": int(
        len(X_test)
    ),
    "target": target,
    "features": feature_columns,
    "excluded_column": "Disease",
    "model": "RandomForestClassifier",
    "n_estimators": 200,
    "random_state": 42,
    "metrics": {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "balanced_accuracy": float(
            balanced_accuracy
        ),
    },
    "confusion_matrix": cm.tolist(),
}

METADATA_PATH.write_text(
    json.dumps(
        metadata,
        indent=2
    ),
    encoding="utf-8"
)


# --------------------------------------------------
# FINAL OUTPUT
# --------------------------------------------------

print("\n" + "=" * 60)
print("MODEL SAVED")
print("=" * 60)

print(
    "\nModel:",
    MODEL_PATH
)

print(
    "Metadata:",
    METADATA_PATH
)

print("\nTraining complete.")