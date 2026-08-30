import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Find dataset file
POSSIBLE_PATHS = [
    os.path.join(os.path.dirname(__file__), "..", "Disease_symptom_and_patient_profile_dataset.csv"),
    os.path.join(os.path.dirname(__file__), "Disease_symptom_and_patient_profile_dataset.csv"),
    os.path.join(os.path.dirname(__file__), "data", "Disease_symptom_and_patient_profile_dataset.csv"),
    "Disease_symptom_and_patient_profile_dataset.csv",
    r"C:\Users\sjaya\Documents\Infosys\Med\Disease_symptom_and_patient_profile_dataset.csv"
]

def train_and_save():
    csv_path = None
    for p in POSSIBLE_PATHS:
        if os.path.exists(p):
            csv_path = p
            break
            
    if not csv_path:
        raise FileNotFoundError("Disease_symptom_and_patient_profile_dataset.csv not found in candidate locations.")

    print(f"Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path)

    # Clean column names
    df.columns = [c.strip() for c in df.columns]

    # Encoding mappings
    binary_map = {"yes": 1, "no": 0, "positive": 1, "negative": 0}
    gender_map = {"male": 1, "female": 0}
    level_map = {"low": 0, "normal": 1, "high": 2}

    # Preprocessing
    df['fever_num'] = df['Fever'].astype(str).str.lower().map(binary_map).fillna(0).astype(int)
    df['cough_num'] = df['Cough'].astype(str).str.lower().map(binary_map).fillna(0).astype(int)
    df['fatigue_num'] = df['Fatigue'].astype(str).str.lower().map(binary_map).fillna(0).astype(int)
    df['breathing_num'] = df['Difficulty Breathing'].astype(str).str.lower().map(binary_map).fillna(0).astype(int)
    df['gender_num'] = df['Gender'].astype(str).str.lower().map(gender_map).fillna(0).astype(int)
    df['bp_num'] = df['Blood Pressure'].astype(str).str.lower().map(level_map).fillna(1).astype(int)
    df['cholesterol_num'] = df['Cholesterol Level'].astype(str).str.lower().map(level_map).fillna(1).astype(int)
    df['age_num'] = pd.to_numeric(df['Age'], errors='coerce').fillna(30).astype(int)
    df['outcome_num'] = df['Outcome Variable'].astype(str).str.lower().map(binary_map).fillna(0).astype(int)

    feature_cols = [
        'fever_num', 'cough_num', 'fatigue_num', 'breathing_num',
        'gender_num', 'bp_num', 'cholesterol_num', 'age_num'
    ]

    feature_names = [
        'Fever', 'Cough', 'Fatigue', 'Difficulty Breathing',
        'Gender (Male=1, Female=0)', 'Blood Pressure (0=Low, 1=Normal, 2=High)',
        'Cholesterol (0=Low, 1=Normal, 2=High)', 'Age'
    ]

    X = df[feature_cols]
    y_outcome = df['outcome_num']
    y_disease = df['Disease'].astype(str).str.strip()

    # 1. Train Outcome Classifier (RandomForest)
    X_train_o, X_test_o, y_train_o, y_test_o = train_test_split(
        X, y_outcome, test_size=0.2, random_state=42, stratify=y_outcome
    )
    outcome_rf = RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42)
    outcome_rf.fit(X_train_o, y_train_o)

    y_pred_o = outcome_rf.predict(X_test_o)
    outcome_acc = accuracy_score(y_test_o, y_pred_o)
    print(f"RandomForest Outcome Model Accuracy: {outcome_acc * 100:.2f}%")

    # 2. Train Disease Classifier (RandomForest)
    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(
        X, y_disease, test_size=0.2, random_state=42
    )
    disease_rf = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42)
    disease_rf.fit(X_train_d, y_train_d)

    y_pred_d = disease_rf.predict(X_test_d)
    disease_acc = accuracy_score(y_test_d, y_pred_d)
    print(f"RandomForest Disease Model Accuracy: {disease_acc * 100:.2f}%")

    # Calculate Feature Importances for Outcome Model
    importances = dict(zip(feature_names, [round(float(imp), 4) for imp in outcome_rf.feature_importances_]))

    artifact = {
        "outcome_model": outcome_rf,
        "disease_model": disease_rf,
        "feature_cols": feature_cols,
        "feature_names": feature_names,
        "importances": importances,
        "outcome_accuracy": round(float(outcome_acc), 4),
        "disease_accuracy": round(float(disease_acc), 4),
        "total_samples": len(df),
        "disease_classes": list(disease_rf.classes_),
    }

    output_dir = os.path.join(os.path.dirname(__file__), "app", "ml")
    os.makedirs(output_dir, exist_ok=True)
    artifact_path = os.path.join(output_dir, "rf_model.joblib")

    joblib.dump(artifact, artifact_path)
    print(f"Successfully saved RandomForest artifact to: {artifact_path}")
    return artifact_path

if __name__ == "__main__":
    train_and_save()
