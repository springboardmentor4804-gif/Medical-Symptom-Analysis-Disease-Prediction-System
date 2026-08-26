from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = PROJECT_ROOT / "datasets"
PREDICTION_DIR = DATASET_DIR / "Disease_Symptom_Prediction"

PATIENT_PROFILE_PATH = DATASET_DIR / "Disease_symptom_and_patient_profile_dataset.csv"
DISEASE_DATASET_PATH = PREDICTION_DIR / "dataset.csv"
SYMPTOM_SEVERITY_PATH = PREDICTION_DIR / "Symptom-severity.csv"
SYMPTOM_DESCRIPTION_PATH = PREDICTION_DIR / "symptom_Description.csv"
SYMPTOM_PRECAUTION_PATH = PREDICTION_DIR / "symptom_precaution.csv"


def load_patient_profile_dataset():
    return pd.read_csv(PATIENT_PROFILE_PATH, encoding="latin1")


def load_disease_dataset():
    return pd.read_csv(DISEASE_DATASET_PATH, encoding="latin1")


def load_symptom_severity_dataset():
    return pd.read_csv(SYMPTOM_SEVERITY_PATH, encoding="latin1")


def load_symptom_description_dataset():
    return pd.read_csv(SYMPTOM_DESCRIPTION_PATH, encoding="latin1")


def load_symptom_precaution_dataset():
    return pd.read_csv(SYMPTOM_PRECAUTION_PATH, encoding="latin1")


def load_all_datasets():
    """Return the profile dataset, disease dataset, and symptom weights."""

    return (
        load_patient_profile_dataset(),
        load_disease_dataset(),
        load_symptom_severity_dataset(),
    )
