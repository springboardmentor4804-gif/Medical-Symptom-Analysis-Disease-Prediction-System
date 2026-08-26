from pathlib import Path

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "backend"
    / "models"
    / "patient_risk_model.pkl"
)


print("=" * 60)
print("MEDASSIST AI - PATIENT RISK MODEL ANALYSIS")
print("=" * 60)


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

pipeline = joblib.load(
    MODEL_PATH
)

print("\nSaved model loaded successfully.")


# --------------------------------------------------
# GET PREPROCESSOR
# --------------------------------------------------

preprocessor = pipeline.named_steps[
    "preprocessor"
]


# --------------------------------------------------
# GET RANDOM FOREST
# --------------------------------------------------

model = pipeline.named_steps[
    "model"
]


# --------------------------------------------------
# GET TRANSFORMED FEATURE NAMES
# --------------------------------------------------

feature_names = (
    preprocessor
    .get_feature_names_out()
)


# --------------------------------------------------
# FEATURE IMPORTANCE
# --------------------------------------------------

importances = model.feature_importances_


importance_df = pd.DataFrame(
    {
        "feature": feature_names,
        "importance": importances,
    }
)


importance_df = (
    importance_df
    .sort_values(
        "importance",
        ascending=False
    )
    .reset_index(drop=True)
)


# --------------------------------------------------
# OUTPUT
# --------------------------------------------------

print("\n" + "=" * 60)
print("FEATURE IMPORTANCE")
print("=" * 60)

print(
    importance_df.to_string(
        index=False
    )
)


# --------------------------------------------------
# TOP 10
# --------------------------------------------------

print("\n" + "=" * 60)
print("TOP 10 FEATURES")
print("=" * 60)

for index, row in (
    importance_df.head(10)
    .iterrows()
):

    print(
        f"{index + 1}. "
        f"{row['feature']} "
        f"-> "
        f"{row['importance']:.4f}"
    )