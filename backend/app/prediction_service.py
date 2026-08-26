from pathlib import Path

import joblib
import pandas as pd

from app.train_disease_model import normalize_symptom


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "backend"
    / "models"
    / "disease_prediction_model.pkl"
)

FEATURES_PATH = (
    PROJECT_ROOT
    / "backend"
    / "models"
    / "disease_features.pkl"
)

DESCRIPTION_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "Disease_Symptom_Prediction"
    / "symptom_Description.csv"
)

PRECAUTION_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "Disease_Symptom_Prediction"
    / "symptom_precaution.csv"
)


# --------------------------------------------------
# Load existing trained model
# --------------------------------------------------

model = joblib.load(MODEL_PATH)

feature_names = joblib.load(FEATURES_PATH)


# --------------------------------------------------
# Load supporting datasets
# --------------------------------------------------

description_df = pd.read_csv(
    DESCRIPTION_PATH,
    encoding="latin1"
)

precaution_df = pd.read_csv(
    PRECAUTION_PATH,
    encoding="latin1"
)


# --------------------------------------------------
# Build model input
# --------------------------------------------------

def _build_input_dataframe(
    symptoms: list[str]
) -> pd.DataFrame:

    input_data = {
        feature_name: 0
        for feature_name in feature_names
    }

    for symptom in symptoms:

        normalized = normalize_symptom(symptom)

        if normalized in input_data:

            input_data[normalized] = 1

    return pd.DataFrame(
        [input_data],
        columns=feature_names
    )


# --------------------------------------------------
# Existing single prediction
# --------------------------------------------------

def predict_disease(
    symptoms: list[str]
):

    input_df = _build_input_dataframe(
        symptoms
    )

    return model.predict(input_df)[0]


# --------------------------------------------------
# Get disease description
# --------------------------------------------------

def get_disease_description(
    disease: str
):

    matches = description_df[
        description_df["Disease"].astype(str).str.strip().str.lower()
        == str(disease).strip().lower()
    ]

    if matches.empty:

        return None

    return str(
        matches.iloc[0]["Description"]
    )


# --------------------------------------------------
# Get disease precautions
# --------------------------------------------------

def get_disease_precautions(
    disease: str
):

    matches = precaution_df[
        precaution_df["Disease"].astype(str).str.strip().str.lower()
        == str(disease).strip().lower()
    ]

    if matches.empty:

        return []

    row = matches.iloc[0]

    precautions = []

    for column in precaution_df.columns:

        if column.lower().startswith("precaution"):

            value = row[column]

            if pd.notna(value):

                value = str(value).strip()

                if value:

                    precautions.append(value)

    return precautions


# --------------------------------------------------
# Top 3 predictions
# --------------------------------------------------

def predict_top_conditions(
    symptoms: list[str],
    top_n: int = 3
):

    input_df = _build_input_dataframe(
        symptoms
    )

    probabilities = model.predict_proba(
        input_df
    )[0]

    classes = model.classes_

    ranked_indices = probabilities.argsort()[::-1][:top_n]

    predictions = []

    for index in ranked_indices:

        disease = str(classes[index])

        predictions.append(
            {
                "condition": disease,

                "model_score": round(
                    float(probabilities[index]) * 100,
                    2
                ),

                "description":
                    get_disease_description(
                        disease
                    ),

                "precautions":
                    get_disease_precautions(
                        disease
                    )
            }
        )

    return predictions