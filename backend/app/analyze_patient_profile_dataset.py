from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "Disease_symptom_and_patient_profile_dataset.csv"
)


print("=" * 70)
print("MEDASSIST AI - PATIENT PROFILE DATASET ANALYSIS")
print("=" * 70)


# --------------------------------------------------
# LOAD DATASET
# --------------------------------------------------

df = pd.read_csv(
    DATASET_PATH,
    encoding="latin1"
)


# --------------------------------------------------
# BASIC INFORMATION
# --------------------------------------------------

print("\n1. DATASET OVERVIEW")
print("-" * 70)

print("Rows:", len(df))
print("Columns:", len(df))

print("\nColumn names:")

for column in df.columns:
    print(" -", column)


# --------------------------------------------------
# DATA TYPES
# --------------------------------------------------

print("\n2. DATA TYPES")
print("-" * 70)

print(
    df.dtypes.to_string()
)


# --------------------------------------------------
# MISSING VALUES
# --------------------------------------------------

print("\n3. MISSING VALUES")
print("-" * 70)

missing = df.isnull().sum()

print(
    missing.to_string()
)

print(
    "\nTotal missing values:",
    int(missing.sum())
)


# --------------------------------------------------
# DUPLICATES
# --------------------------------------------------

print("\n4. DUPLICATES")
print("-" * 70)

duplicates = df.duplicated().sum()

print(
    "Duplicate rows:",
    int(duplicates)
)

print(
    "Unique rows:",
    int(len(df) - duplicates)
)


# --------------------------------------------------
# UNIQUE VALUES
# --------------------------------------------------

print("\n5. UNIQUE VALUE COUNTS")
print("-" * 70)

for column in df.columns:

    print(
        f"\n{column}: "
        f"{df[column].nunique()} unique values"
    )


# --------------------------------------------------
# NUMERICAL SUMMARY
# --------------------------------------------------

print("\n6. NUMERICAL SUMMARY")
print("-" * 70)

print(
    df.describe(
        include="all"
    ).transpose().to_string()
)


# --------------------------------------------------
# CATEGORICAL DISTRIBUTIONS
# --------------------------------------------------

print("\n7. CATEGORICAL DISTRIBUTIONS")
print("-" * 70)

categorical_columns = [
    column
    for column in df.columns
    if df[column].dtype == "object"
]


for column in categorical_columns:

    print(
        f"\n--- {column} ---"
    )

    print(
        df[column]
        .value_counts(dropna=False)
        .head(20)
        .to_string()
    )


# --------------------------------------------------
# CORRELATION
# --------------------------------------------------

print("\n8. NUMERICAL CORRELATION")
print("-" * 70)

numeric_df = df.select_dtypes(
    include="number"
)

if not numeric_df.empty:

    print(
        numeric_df.corr().to_string()
    )

else:

    print(
        "No numerical columns available."
    )


# --------------------------------------------------
# DATASET SAMPLE
# --------------------------------------------------

print("\n9. FIRST 5 ROWS")
print("-" * 70)

print(
    df.head().to_string()
)


print("\n" + "=" * 70)
print("ANALYSIS COMPLETE")
print("=" * 70)