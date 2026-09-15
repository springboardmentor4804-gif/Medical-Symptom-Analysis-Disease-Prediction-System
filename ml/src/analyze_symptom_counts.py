import pandas as pd


DATASET_PATH = r"D:\MedAssist_AI\datasets\dataset.csv"

df = pd.read_csv(DATASET_PATH)

symptom_columns = [
    col for col in df.columns
    if col.startswith("Symptom")
]


def clean_symptoms(row):

    symptoms = []

    for column in symptom_columns:

        value = str(row[column]).strip().lower()

        if value in ["", "none", "nan"]:
            continue

        symptoms.append(value)

    return symptoms


df["symptom_count"] = df.apply(
    lambda row: len(clean_symptoms(row)),
    axis=1
)


print("=" * 60)
print("SYMPTOM COUNT ANALYSIS")
print("=" * 60)

print("\nOverall symptom count:")
print(
    df["symptom_count"]
    .value_counts()
    .sort_index()
)


print("\nAverage symptoms per record:")

print(
    df["symptom_count"].mean()
)


print("\nMinimum symptoms:", df["symptom_count"].min())
print("Maximum symptoms:", df["symptom_count"].max())


print("\nSymptoms by disease:")

print(
    df.groupby("Disease")["symptom_count"]
    .agg(["count", "mean", "min", "max"])
    .sort_values("mean")
)