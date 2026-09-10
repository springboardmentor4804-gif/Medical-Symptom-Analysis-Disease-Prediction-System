import pandas as pd
import joblib

# 1. Load dataset

df = pd.read_csv(
    "Symptom-severity.csv"
)


# 2. Check dataset

print("Dataset Shape:", df.shape)

print("\nFirst 5 Rows:")
print(df.head())

print("\nMissing Values:")
print(df.isnull().sum())

print("\nDuplicate Rows:")
print(df.duplicated().sum())


# 3. Create symptom severity dictionary

symptom_severity = dict(
    zip(
        df["Symptom"],
        df["weight"]
    )
)


# 4. Save symptom severity data

joblib.dump(
    symptom_severity,
    "symptom_severity.pkl"
)

print("\nSymptom severity data saved successfully!")