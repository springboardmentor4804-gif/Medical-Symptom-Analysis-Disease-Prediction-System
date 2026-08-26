#!/usr/bin/env python3

"""
MedAssist AI - Dataset Audit

Audits all datasets currently present in the project.

Datasets:
1. Disease symptom prediction dataset
2. Disease symptom and patient profile dataset
3. Symptom severity dataset
4. Disease description dataset
5. Disease precaution dataset

This script only inspects datasets.
It does NOT modify, merge, train, or retrain any model.
"""

from pathlib import Path
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent

DATASETS_DIR = PROJECT_ROOT / "datasets"

DISEASE_DATASET = (
    DATASETS_DIR
    / "Disease_Symptom_Prediction"
    / "dataset.csv"
)

PATIENT_PROFILE_DATASET = (
    DATASETS_DIR
    / "Disease_symptom_and_patient_profile_dataset.csv"
)

SYMPTOM_SEVERITY_DATASET = (
    DATASETS_DIR
    / "Disease_Symptom_Prediction"
    / "Symptom-severity.csv"
)

SYMPTOM_DESCRIPTION_DATASET = (
    DATASETS_DIR
    / "Disease_Symptom_Prediction"
    / "symptom_Description.csv"
)

SYMPTOM_PRECAUTION_DATASET = (
    DATASETS_DIR
    / "Disease_Symptom_Prediction"
    / "symptom_precaution.csv"
)


def inspect_dataset(name, path):

    print("\n" + "=" * 60)
    print(name)
    print("=" * 60)

    print(f"Path: {path}")

    if not path.exists():

        print("STATUS: FILE NOT FOUND")

        return None

    try:

        df = pd.read_csv(
            path,
            encoding="latin1"
        )

    except Exception as error:

        print(f"ERROR LOADING DATASET: {error}")

        return None

    print(f"\nShape: {df.shape}")

    print(f"Rows: {len(df)}")

    print(f"Columns: {len(df.columns)}")

    print("\nColumns:")

    for index, column in enumerate(df.columns, start=1):

        print(f"  {index}. {column}")

    print("\nData Types:")

    print(df.dtypes.to_string())

    print("\nMissing Values:")

    missing = df.isnull().sum()

    missing = missing[missing > 0]

    if len(missing) == 0:

        print("  None")

    else:

        print(missing.to_string())

    print("\nDuplicate Rows:")

    print(f"  {df.duplicated().sum()}")

    print("\nFirst 5 Rows:")

    print(df.head().to_string())

    return df


def analyze_disease_dataset(df):

    if df is None:
        return

    print("\n" + "-" * 60)
    print("DISEASE DATASET ANALYSIS")
    print("-" * 60)

    if "Disease" in df.columns:

        disease_counts = df["Disease"].value_counts()

        print(f"\nUnique diseases: {df['Disease'].nunique()}")

        print("\nTop diseases:")

        print(disease_counts.head(10).to_string())

    symptom_columns = [
        column
        for column in df.columns
        if column.lower().startswith("symptom")
    ]

    print(f"\nSymptom columns: {len(symptom_columns)}")

    print("Symptom columns:")

    for column in symptom_columns:

        print(f"  - {column}")


def analyze_patient_profile(df):

    if df is None:
        return

    print("\n" + "-" * 60)
    print("PATIENT PROFILE ANALYSIS")
    print("-" * 60)

    print("\nPotential target columns:")

    for column in df.columns:

        print(f"  - {column}")

    print("\nUnique values for categorical columns:")

    for column in df.columns:

        if df[column].dtype == "object":

            unique_count = df[column].nunique()

            print(
                f"  {column}: "
                f"{unique_count} unique values"
            )

            if unique_count <= 20:

                values = df[column].dropna().unique()

                print(
                    f"      {list(values)}"
                )


def main():

    print("=" * 60)

    print("MEDASSIST AI DATASET AUDIT")

    print("=" * 60)

    print("\nProject root:")

    print(PROJECT_ROOT)

    print("\nDataset directory:")

    print(DATASETS_DIR)

    # --------------------------------------------------
    # Dataset 1
    # --------------------------------------------------

    disease_df = inspect_dataset(
        "DATASET 1 - DISEASE SYMPTOM PREDICTION",
        DISEASE_DATASET
    )

    analyze_disease_dataset(
        disease_df
    )

    # --------------------------------------------------
    # Dataset 2
    # --------------------------------------------------

    profile_df = inspect_dataset(
        "DATASET 2 - DISEASE SYMPTOM AND PATIENT PROFILE",
        PATIENT_PROFILE_DATASET
    )

    analyze_patient_profile(
        profile_df
    )

    # --------------------------------------------------
    # Supporting Dataset 1
    # --------------------------------------------------

    inspect_dataset(
        "DATASET 3 - SYMPTOM SEVERITY",
        SYMPTOM_SEVERITY_DATASET
    )

    # --------------------------------------------------
    # Supporting Dataset 2
    # --------------------------------------------------

    inspect_dataset(
        "DATASET 4 - SYMPTOM / DISEASE DESCRIPTION",
        SYMPTOM_DESCRIPTION_DATASET
    )

    # --------------------------------------------------
    # Supporting Dataset 3
    # --------------------------------------------------

    inspect_dataset(
        "DATASET 5 - DISEASE PRECAUTIONS",
        SYMPTOM_PRECAUTION_DATASET
    )

    # --------------------------------------------------

    print("\n" + "=" * 60)

    print("AUDIT COMPLETE")

    print("=" * 60)

    print("\nIMPORTANT:")

    print(
        "This audit only examines the datasets."
    )

    print(
        "No datasets were merged."
    )

    print(
        "No existing model was modified."
    )

    print(
        "No model was retrained."
    )


if __name__ == "__main__":

    main()