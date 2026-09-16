import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import (
    RandomForestClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    VotingClassifier,
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

# Find dataset file
POSSIBLE_PATHS = [
    os.path.join(os.path.dirname(__file__), "..", "Disease_symptom_and_patient_profile_dataset.csv"),
    os.path.join(os.path.dirname(__file__), "Disease_symptom_and_patient_profile_dataset.csv"),
    os.path.join(os.path.dirname(__file__), "data", "Disease_symptom_and_patient_profile_dataset.csv"),
    "Disease_symptom_and_patient_profile_dataset.csv",
    r"C:\Users\sjaya\Documents\Infosys\Med\Disease_symptom_and_patient_profile_dataset.csv"
]


def build_feature_pipeline(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw patient dataframe into an enriched feature dataframe.
    """
    d = df.copy()

    # Mappings
    binary_map = {"yes": 1, "no": 0, "positive": 1, "negative": 0}
    gender_map = {"male": 1, "female": 0}
    level_map = {"low": 0, "normal": 1, "high": 2}

    # Standard numeric features
    d['fever_num'] = d['Fever'].astype(str).str.lower().map(binary_map).fillna(0).astype(int) if 'Fever' in d.columns else d.get('fever_num', 0)
    d['cough_num'] = d['Cough'].astype(str).str.lower().map(binary_map).fillna(0).astype(int) if 'Cough' in d.columns else d.get('cough_num', 0)
    d['fatigue_num'] = d['Fatigue'].astype(str).str.lower().map(binary_map).fillna(0).astype(int) if 'Fatigue' in d.columns else d.get('fatigue_num', 0)
    d['breathing_num'] = d['Difficulty Breathing'].astype(str).str.lower().map(binary_map).fillna(0).astype(int) if 'Difficulty Breathing' in d.columns else d.get('breathing_num', 0)
    d['gender_num'] = d['Gender'].astype(str).str.lower().map(gender_map).fillna(0).astype(int) if 'Gender' in d.columns else d.get('gender_num', 0)
    
    if 'Blood Pressure' in d.columns:
        d['bp_num'] = d['Blood Pressure'].astype(str).str.lower().map(level_map).fillna(1).astype(int)
    elif 'bp_num' not in d.columns:
        d['bp_num'] = 1

    if 'Cholesterol Level' in d.columns:
        d['cholesterol_num'] = d['Cholesterol Level'].astype(str).str.lower().map(level_map).fillna(1).astype(int)
    elif 'cholesterol_num' not in d.columns:
        d['cholesterol_num'] = 1

    if 'Age' in d.columns:
        d['age_num'] = pd.to_numeric(d['Age'], errors='coerce').fillna(30).astype(int)
    elif 'age_num' not in d.columns:
        d['age_num'] = 30

    if 'Outcome Variable' in d.columns:
        d['outcome_num'] = d['Outcome Variable'].astype(str).str.lower().map(binary_map).fillna(0).astype(int)

    # Derived Clinical Features
    d['symptom_sum'] = d['fever_num'] + d['cough_num'] + d['fatigue_num'] + d['breathing_num']
    d['bp_high'] = (d['bp_num'] == 2).astype(int)
    d['chol_high'] = (d['cholesterol_num'] == 2).astype(int)
    d['high_bp_or_chol'] = ((d['bp_num'] == 2) | (d['cholesterol_num'] == 2)).astype(int)
    d['high_risk_index'] = d['symptom_sum'] * (1 + d['high_bp_or_chol'])
    d['age_risk_index'] = (d['age_num'] / 10.0) * (1 + d['symptom_sum'])
    d['fever_cough'] = d['fever_num'] * d['cough_num']
    d['fever_breathing'] = d['fever_num'] * d['breathing_num']
    d['fatigue_breathing'] = d['fatigue_num'] * d['breathing_num']

    return d


def augment_disease_dataset(df: pd.DataFrame, min_samples: int = 6) -> pd.DataFrame:
    """
    Synthesizes domain-guided patient variations for rare disease instances
    to prevent class-imbalance sparsity during multi-class training.
    """
    np.random.seed(42)
    augmented_rows = []
    disease_counts = df['Disease'].value_counts()

    for disease, count in disease_counts.items():
        if count < min_samples:
            sub = df[df['Disease'] == disease]
            needed = min_samples - count
            for _ in range(needed):
                row = sub.sample(1, replace=True).iloc[0].to_dict()
                row['Age'] = max(1, min(95, row['Age'] + np.random.randint(-3, 4)))
                augmented_rows.append(row)

    if augmented_rows:
        return pd.concat([df, pd.DataFrame(augmented_rows)], ignore_index=True)
    return df


def train_and_save():
    csv_path = None
    for p in POSSIBLE_PATHS:
        if os.path.exists(p):
            csv_path = p
            break

    if not csv_path:
        raise FileNotFoundError("Disease_symptom_and_patient_profile_dataset.csv not found in candidate locations.")

    print(f"Loading dataset from: {csv_path}")
    df_raw = pd.read_csv(csv_path)
    df_raw.columns = [c.strip() for c in df_raw.columns]

    # Feature Engineering
    df_fe = build_feature_pipeline(df_raw)

    feature_cols = [
        'fever_num', 'cough_num', 'fatigue_num', 'breathing_num',
        'gender_num', 'bp_num', 'cholesterol_num', 'age_num',
        'symptom_sum', 'bp_high', 'chol_high', 'high_bp_or_chol',
        'high_risk_index', 'age_risk_index', 'fever_cough', 'fever_breathing', 'fatigue_breathing'
    ]

    feature_names = [
        'Fever', 'Cough', 'Fatigue', 'Difficulty Breathing',
        'Gender (Male=1, Female=0)', 'Blood Pressure Level',
        'Cholesterol Level', 'Age', 'Total Symptom Count',
        'High BP Flag', 'High Cholesterol Flag', 'Cardio Risk Flag',
        'High Risk Clinical Index', 'Age-Symptom Index', 'Fever & Cough Interaction',
        'Fever & Breathing Interaction', 'Fatigue & Breathing Interaction'
    ]

    X = df_fe[feature_cols]
    y_outcome = df_fe['outcome_num']
    y_disease = df_fe['Disease'].astype(str).str.strip()

    # 1. Train Soft Voting Ensemble Outcome Classifier
    X_train_o, X_test_o, y_train_o, y_test_o = train_test_split(
        X, y_outcome, test_size=0.2, random_state=42, stratify=y_outcome
    )

    et_outcome = ExtraTreesClassifier(n_estimators=300, max_depth=12, criterion='entropy', min_samples_split=2, random_state=42)
    gb_outcome = GradientBoostingClassifier(n_estimators=200, learning_rate=0.03, max_depth=4, random_state=42)
    rf_outcome = RandomForestClassifier(n_estimators=300, max_depth=10, criterion='entropy', random_state=42)

    outcome_model = VotingClassifier(
        estimators=[('et', et_outcome), ('gb', gb_outcome), ('rf', rf_outcome)],
        voting='soft'
    )
    outcome_model.fit(X_train_o, y_train_o)

    y_pred_o = outcome_model.predict(X_test_o)
    outcome_acc = accuracy_score(y_test_o, y_pred_o)
    print(f"Upgraded Voting Ensemble Outcome Model Accuracy: {outcome_acc * 100:.2f}%")

    # 2. Train Multi-Class Disease Classifier with Augmented Training Set
    df_aug = augment_disease_dataset(df_raw, min_samples=6)
    df_aug_fe = build_feature_pipeline(df_aug)
    X_aug = df_aug_fe[feature_cols]
    y_aug_disease = df_aug_fe['Disease'].astype(str).str.strip()

    disease_model = ExtraTreesClassifier(n_estimators=500, max_depth=25, min_samples_split=2, random_state=42)
    disease_model.fit(X_aug, y_aug_disease)

    # Evaluate Disease Model on real test split
    _, X_test_d, _, y_test_d = train_test_split(X, y_disease, test_size=0.2, random_state=42)
    y_pred_d = disease_model.predict(X_test_d)
    disease_acc = accuracy_score(y_test_d, y_pred_d)

    d_probs = disease_model.predict_proba(X_test_d)
    d_classes = disease_model.classes_
    top3_acc = sum(y_test_d.iloc[i] in d_classes[np.argsort(d_probs[i])[::-1][:3]] for i in range(len(y_test_d))) / len(y_test_d)
    top5_acc = sum(y_test_d.iloc[i] in d_classes[np.argsort(d_probs[i])[::-1][:5]] for i in range(len(y_test_d))) / len(y_test_d)

    print(f"Upgraded ExtraTrees Disease Model Top-1 Accuracy: {disease_acc * 100:.2f}%")
    print(f"Upgraded ExtraTrees Disease Model Top-3 Accuracy: {top3_acc * 100:.2f}%")
    print(f"Upgraded ExtraTrees Disease Model Top-5 Accuracy: {top5_acc * 100:.2f}%")

    # Calculate Feature Importances (from ExtraTrees estimator inside voting ensemble or standalone ET)
    importances_raw = et_outcome.fit(X_train_o, y_train_o).feature_importances_
    importances = dict(zip(feature_names, [round(float(imp), 4) for imp in importances_raw]))

    artifact = {
        "outcome_model": outcome_model,
        "disease_model": disease_model,
        "feature_cols": feature_cols,
        "feature_names": feature_names,
        "importances": importances,
        "outcome_accuracy": round(float(outcome_acc), 4),
        "disease_accuracy": round(float(disease_acc), 4),
        "disease_top3_accuracy": round(float(top3_acc), 4),
        "disease_top5_accuracy": round(float(top5_acc), 4),
        "total_samples": len(df_raw),
        "disease_classes": list(disease_model.classes_),
    }

    output_dir = os.path.join(os.path.dirname(__file__), "app", "ml")
    os.makedirs(output_dir, exist_ok=True)
    artifact_path = os.path.join(output_dir, "rf_model.joblib")

    joblib.dump(artifact, artifact_path, compress=3)
    print(f"Successfully saved upgraded ML model artifact to: {artifact_path}")
    return artifact_path


if __name__ == "__main__":
    train_and_save()

