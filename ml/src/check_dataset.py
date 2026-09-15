import pandas as pd

df = pd.read_csv(
    r"D:\MedAssist_AI\datasets\dataset.csv"
)

symptom_columns = [
    col for col in df.columns
    if col.startswith("Symptom")
]

df["symptom_pattern"] = (
    df[symptom_columns]
    .fillna("")
    .astype(str)
    .apply(
        lambda row: "|".join(
            sorted(
                x.strip().lower()
                for x in row
                if x.strip() and x.strip().lower() != "none"
            )
        ),
        axis=1
    )
)

print("Total rows:", len(df))
print(
    "Unique symptom patterns:",
    df["symptom_pattern"].nunique()
)

print("\nDuplicate rows:")
print(
    df["symptom_pattern"].duplicated().sum()
)

print("\nPatterns shared by multiple diseases:")

pattern_diseases = (
    df.groupby("symptom_pattern")["Disease"]
    .nunique()
)

print(
    (pattern_diseases > 1).sum()
)