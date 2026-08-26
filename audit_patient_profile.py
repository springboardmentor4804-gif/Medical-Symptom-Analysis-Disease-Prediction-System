import pandas as pd

PATH = "datasets/Disease_symptom_and_patient_profile_dataset.csv"


print("=" * 60)
print("MEDASSIST AI - PATIENT PROFILE DATASET AUDIT")
print("=" * 60)


# --------------------------------------------------
# 1. Load
# --------------------------------------------------

df = pd.read_csv(
    PATH,
    encoding="latin1"
)

print("\n1. DATASET SHAPE")
print("----------------")
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])


# --------------------------------------------------
# 2. Columns
# --------------------------------------------------

print("\n2. COLUMNS")
print("----------")

for column in df.columns:
    print("-", column)


# --------------------------------------------------
# 3. Data types
# --------------------------------------------------

print("\n3. DATA TYPES")
print("-------------")

print(df.dtypes)


# --------------------------------------------------
# 4. Missing values
# --------------------------------------------------

print("\n4. MISSING VALUES")
print("-----------------")

missing = df.isnull().sum()

print(missing)

print(
    "\nTotal missing values:",
    missing.sum()
)


# --------------------------------------------------
# 5. Duplicate rows
# --------------------------------------------------

print("\n5. DUPLICATES")
print("-------------")

duplicates = df.duplicated().sum()

print("Duplicate rows:", duplicates)


# --------------------------------------------------
# 6. Unique values
# --------------------------------------------------

print("\n6. UNIQUE VALUES")
print("----------------")

for column in df.columns:

    print(
        f"\n{column}:"
    )

    print(
        df[column]
        .value_counts(dropna=False)
        .head(20)
    )


# --------------------------------------------------
# 7. Numerical statistics
# --------------------------------------------------

print("\n7. NUMERICAL STATISTICS")
print("-----------------------")

print(
    df.describe(include="all")
)


# --------------------------------------------------
# 8. Disease distribution
# --------------------------------------------------

if "Disease" in df.columns:

    print("\n8. DISEASE DISTRIBUTION")
    print("----------------------")

    print(
        df["Disease"]
        .value_counts()
    )


# --------------------------------------------------
# 9. Outcome distribution
# --------------------------------------------------

if "Outcome Variable" in df.columns:

    print("\n9. OUTCOME VARIABLE")
    print("------------------")

    print(
        df["Outcome Variable"]
        .value_counts(dropna=False)
    )


# --------------------------------------------------
# 10. Basic relationships
# --------------------------------------------------

print("\n10. BASIC RELATIONSHIPS")
print("----------------------")


if (
    "Disease" in df.columns
    and "Outcome Variable" in df.columns
):

    print("\nDisease vs Outcome:")

    print(
        pd.crosstab(
            df["Disease"],
            df["Outcome Variable"]
        )
    )


if "Gender" in df.columns:

    print("\nGender distribution:")

    print(
        df["Gender"]
        .value_counts(dropna=False)
    )


if "Blood Pressure" in df.columns:

    print("\nBlood Pressure distribution:")

    print(
        df["Blood Pressure"]
        .value_counts(dropna=False)
    )


if "Cholesterol Level" in df.columns:

    print("\nCholesterol distribution:")

    print(
        df["Cholesterol Level"]
        .value_counts(dropna=False)
    )


print("\n" + "=" * 60)
print("AUDIT COMPLETE")
print("=" * 60)