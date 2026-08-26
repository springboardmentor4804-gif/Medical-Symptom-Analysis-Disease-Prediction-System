import joblib

from pathlib import Path
import pandas as pd


# --------------------------------------------------
# MODEL PATH
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "backend"
    / "models"
    / "patient_risk_model.pkl"
)


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

print("=" * 60)
print("MEDASSIST AI - PATIENT RISK MODEL TEST")
print("=" * 60)

print("\nLoading saved model...")

model = joblib.load(MODEL_PATH)

print("Model loaded successfully.")


# --------------------------------------------------
# SAMPLE PATIENT
# --------------------------------------------------

patient = {
    "Fever": "Yes",
    "Cough": "Yes",
    "Fatigue": "Yes",
    "Difficulty Breathing": "No",
    "Age": 45,
    "Gender": "Male",
    "Blood Pressure": "High",
    "Cholesterol Level": "High",
}


# --------------------------------------------------
# CREATE DATAFRAME
# --------------------------------------------------

patient_df = pd.DataFrame(
    [patient]
)


# --------------------------------------------------
# PREDICTION
# --------------------------------------------------

prediction = model.predict(
    patient_df
)[0]


# --------------------------------------------------
# MODEL SCORE
# --------------------------------------------------

probabilities = model.predict_proba(
    patient_df
)[0]

classes = model.classes_

positive_index = list(classes).index(
    "Positive"
)

positive_score = (
    probabilities[positive_index] * 100
)


# --------------------------------------------------
# OUTPUT
# --------------------------------------------------

print("\n" + "=" * 60)
print("PATIENT PROFILE")
print("=" * 60)

for key, value in patient.items():

    print(
        f"{key}: {value}"
    )


print("\n" + "=" * 60)
print("RISK ASSESSMENT")
print("=" * 60)

print(
    f"\nPredicted Outcome: {prediction}"
)

print(
    f"Positive Model Score: "
    f"{positive_score:.2f}%"
)

print(
    "\nNote: This is a model-generated "
    "risk estimate and is not a medical diagnosis."
)