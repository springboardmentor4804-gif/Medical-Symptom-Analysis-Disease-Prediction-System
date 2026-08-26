"""Train the disease classifier from the canonical long-format dataset.

The source dataset stores one disease per row and up to 17 symptoms across
separate columns. Repeated symptom combinations are removed before splitting;
otherwise the evaluation would be artificially optimistic.
"""

import json
import re
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)
from sklearn.model_selection import train_test_split


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_PATH = PROJECT_ROOT / "datasets" / "Disease_Symptom_Prediction" / "dataset.csv"
MODELS_DIR = PROJECT_ROOT / "backend" / "models"
MODEL_PATH = MODELS_DIR / "disease_prediction_model.pkl"
FEATURES_PATH = MODELS_DIR / "disease_features.pkl"
METADATA_PATH = MODELS_DIR / "disease_model_metadata.json"


def normalize_symptom(value: object) -> str:
    """Canonicalize the source spelling used by both training and inference."""

    text = str(value).strip().lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def normalize_disease(value: object) -> str:
    text = re.sub(r"\s+", " ", str(value).strip())
    return text


def load_prepared_dataset() -> tuple[pd.DataFrame, list[str]]:
    raw = pd.read_csv(DATASET_PATH, encoding="latin1")
    symptom_columns = [column for column in raw.columns if column.startswith("Symptom_")]

    rows: list[tuple[str, tuple[str, ...]]] = []
    for _, record in raw.iterrows():
        symptoms = sorted(
            {
                normalize_symptom(value)
                for value in record[symptom_columns]
                if pd.notna(value) and normalize_symptom(value)
            }
        )
        if symptoms:
            rows.append((normalize_disease(record["Disease"]), tuple(symptoms)))

    prepared = pd.DataFrame(rows, columns=["Disease", "Symptoms"])
    prepared = prepared.drop_duplicates().reset_index(drop=True)
    feature_names = sorted({symptom for symptoms in prepared["Symptoms"] for symptom in symptoms})

    features = pd.DataFrame(0, index=prepared.index, columns=feature_names, dtype="int8")
    for row_index, symptoms in prepared["Symptoms"].items():
        features.loc[row_index, list(symptoms)] = 1

    features["Disease"] = prepared["Disease"]
    return features, feature_names


def train_and_evaluate() -> dict:
    prepared, feature_names = load_prepared_dataset()
    X = prepared[feature_names]
    y = prepared["Disease"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=500,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    precision = precision_score(
    y_test,
    predictions,
    average="macro",
    zero_division=0,
)

    recall = recall_score(
        y_test,
        predictions,
        average="macro",
        zero_division=0,
    )

    conf_matrix = confusion_matrix(
        y_test,
        predictions,
    )

    class_report = classification_report(
        y_test,
        predictions,
        zero_division=0,
    )

    metrics = {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision": float(precision),
        "recall": float(recall),
        "macro_f1": float(f1_score(y_test, predictions, average="macro")),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "unique_rows": int(len(prepared)),
        "disease_classes": int(y.nunique()),
        "symptom_features": int(len(feature_names)),
        "random_state": 42,
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(feature_names, FEATURES_PATH)
    METADATA_PATH.write_text(
        json.dumps(
            {
                "source_dataset": str(DATASET_PATH.relative_to(PROJECT_ROOT)),
                "preprocessing": [
                    "trim and lowercase symptom values",
                    "replace non-alphanumeric runs with underscores",
                    "deduplicate disease and symptom-set pairs",
                    "stratified 80/20 train/test split",
                ],
                "metrics": metrics,
                "classification_report": class_report,
                "confusion_matrix": conf_matrix.tolist(),
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(json.dumps(metrics, indent=2))

    print("\nClassification Report")
    print("=" * 60)
    print(class_report)

    print("\nConfusion Matrix")
    print("=" * 60)
    print(conf_matrix)

    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved features: {FEATURES_PATH}")
    print(f"Saved metadata: {METADATA_PATH}")
    return metrics


if __name__ == "__main__":
    train_and_evaluate()
