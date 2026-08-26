from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "Disease_symptom_and_patient_profile_dataset.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "backend"
    / "models"
    / "patient_risk"
    / "eda"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------

df = pd.read_csv(
    DATASET_PATH,
    encoding="latin1"
)

# Remove duplicate records for analysis
df = df.drop_duplicates().reset_index(drop=True)


# --------------------------------------------------
# 1. OUTCOME DISTRIBUTION
# --------------------------------------------------

plt.figure(figsize=(7, 5))

df["Outcome Variable"].value_counts().plot(
    kind="bar"
)

plt.title(
    "Patient Risk Outcome Distribution"
)

plt.xlabel(
    "Outcome"
)

plt.ylabel(
    "Number of Patients"
)

plt.xticks(
    rotation=0
)

plt.tight_layout()

plt.savefig(
    OUTPUT_DIR / "outcome_distribution.png",
    dpi=200
)

plt.close()


# --------------------------------------------------
# 2. AGE DISTRIBUTION
# --------------------------------------------------

plt.figure(figsize=(8, 5))

plt.hist(
    df["Age"],
    bins=10
)

plt.title(
    "Patient Age Distribution"
)

plt.xlabel(
    "Age"
)

plt.ylabel(
    "Number of Patients"
)

plt.tight_layout()

plt.savefig(
    OUTPUT_DIR / "age_distribution.png",
    dpi=200
)

plt.close()


# --------------------------------------------------
# 3. SYMPTOM DISTRIBUTION
# --------------------------------------------------

symptoms = [
    "Fever",
    "Cough",
    "Fatigue",
    "Difficulty Breathing"
]

yes_counts = [
    (df[column] == "Yes").sum()
    for column in symptoms
]

plt.figure(figsize=(8, 5))

plt.bar(
    symptoms,
    yes_counts
)

plt.title(
    "Symptom Distribution"
)

plt.xlabel(
    "Symptom"
)

plt.ylabel(
    "Patients Reporting Symptom"
)

plt.xticks(
    rotation=20
)

plt.tight_layout()

plt.savefig(
    OUTPUT_DIR / "symptom_distribution.png",
    dpi=200
)

plt.close()


# --------------------------------------------------
# 4. BLOOD PRESSURE + CHOLESTEROL
# --------------------------------------------------

fig, axes = plt.subplots(
    1,
    2,
    figsize=(10, 5)
)

df["Blood Pressure"].value_counts().plot(
    kind="bar",
    ax=axes[0]
)

axes[0].set_title(
    "Blood Pressure Distribution"
)

axes[0].set_xlabel(
    "Blood Pressure"
)

axes[0].set_ylabel(
    "Patients"
)

axes[0].tick_params(
    axis="x",
    rotation=0
)


df["Cholesterol Level"].value_counts().plot(
    kind="bar",
    ax=axes[1]
)

axes[1].set_title(
    "Cholesterol Level Distribution"
)

axes[1].set_xlabel(
    "Cholesterol Level"
)

axes[1].set_ylabel(
    "Patients"
)

axes[1].tick_params(
    axis="x",
    rotation=0
)


plt.tight_layout()

plt.savefig(
    OUTPUT_DIR / "health_indicators.png",
    dpi=200
)

plt.close()


print("=" * 60)
print("PATIENT PROFILE EDA COMPLETE")
print("=" * 60)

print(
    f"Unique records analyzed: {len(df)}"
)

print(
    f"Charts saved to: {OUTPUT_DIR}"
)

print("\nGenerated files:")

print(
    "1. outcome_distribution.png"
)

print(
    "2. age_distribution.png"
)

print(
    "3. symptom_distribution.png"
)

print(
    "4. health_indicators.png"
)