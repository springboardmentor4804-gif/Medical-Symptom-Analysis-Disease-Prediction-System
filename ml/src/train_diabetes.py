import pandas as pd
import joblib

from pathlib import Path
from sklearn.ensemble import GradientBoostingClassifier


# ============================================================
# Load Dataset
# ============================================================

DATASET_PATH = (
    r"D:\MedAssist_AI\datasets"
    r"\diabetes_binary_5050split_health_indicators_BRFSS2015.csv"
)

df = pd.read_csv(DATASET_PATH)


# ============================================================
# Dataset Information
# ============================================================

print("=" * 60)
print("FINAL DIABETES MODEL")
print("=" * 60)

print("Rows:", len(df))
print("Columns:", len(df.columns))


# ============================================================
# Target / Features
# ============================================================

TARGET = "Diabetes_binary"

X = df.drop(columns=[TARGET])
y = df[TARGET].astype(int)

print("Features:", X.shape[1])

print("\nTarget distribution:")
print(y.value_counts())


# ============================================================
# Train Final Gradient Boosting Model
# ============================================================

print("\n" + "=" * 60)
print("TRAINING GRADIENT BOOSTING")
print("=" * 60)

model = GradientBoostingClassifier(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=3,
    random_state=42,
)

model.fit(X, y)

print("Training completed successfully!")


# ============================================================
# Save Model
# ============================================================

MODEL_DIR = Path(
    r"D:\MedAssist_AI\ml\models\diabetes"
)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# Model file

model_path = MODEL_DIR / "diabetes_model.pkl"

joblib.dump(
    model,
    model_path
)


# Feature names

features_path = MODEL_DIR / "diabetes_features.pkl"

joblib.dump(
    list(X.columns),
    features_path
)


# ============================================================
# Final Output
# ============================================================

print("\n" + "=" * 60)
print("MODEL SAVED SUCCESSFULLY")
print("=" * 60)

print("Model:")
print(model_path)

print("\nFeatures:")
print(features_path)

print("\nNumber of features saved:", len(X.columns))

print("\nFinal Diabetes Model Ready! 🚀")