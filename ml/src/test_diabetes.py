import joblib
import pandas as pd
from pathlib import Path


# ============================================================
# Load Model
# ============================================================

MODEL_DIR = Path(
    r"D:\MedAssist_AI\ml\models\diabetes"
)

model = joblib.load(
    MODEL_DIR / "diabetes_model.pkl"
)

features = joblib.load(
    MODEL_DIR / "diabetes_features.pkl"
)


# ============================================================
# Test Patient
# ============================================================

test_patient = {
    "HighBP": 1,
    "HighChol": 1,
    "CholCheck": 1,
    "BMI": 32,
    "Smoker": 1,
    "Stroke": 0,
    "HeartDiseaseorAttack": 0,
    "PhysActivity": 0,
    "Fruits": 0,
    "Veggies": 0,
    "HvyAlcoholConsump": 0,
    "AnyHealthcare": 1,
    "NoDocbcCost": 0,
    "GenHlth": 4,
    "MentHlth": 5,
    "PhysHlth": 10,
    "DiffWalk": 1,
    "Sex": 1,
    "Age": 9,
    "Education": 4,
    "Income": 5,
}


# ============================================================
# Create DataFrame
# ============================================================

X = pd.DataFrame(
    [test_patient]
)

# Ensure exact training feature order
X = X[features]


# ============================================================
# Prediction
# ============================================================

prediction = model.predict(X)[0]

probability = model.predict_proba(X)[0]

diabetes_probability = probability[1] * 100


# ============================================================
# Result
# ============================================================

print("=" * 60)
print("DIABETES MODEL TEST")
print("=" * 60)

print("Prediction:")

if prediction == 1:
    print("Diabetes")
else:
    print("No Diabetes")

print(
    f"Diabetes Probability: "
    f"{diabetes_probability:.2f}%"
)

print("=" * 60)