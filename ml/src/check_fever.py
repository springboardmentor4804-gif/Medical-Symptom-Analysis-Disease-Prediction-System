import pandas as pd

df = pd.read_csv(
    r"D:\MedAssist_AI\datasets\dataset.csv"
)

symptom_columns = [
    col for col in df.columns
    if col.startswith("Symptom")
]

print("=" * 60)
print("FEVER VALUES IN DATASET")
print("=" * 60)

fever_rows = []

for _, row in df.iterrows():

    for column in symptom_columns:

        value = str(row[column]).strip().lower()

        if "fever" in value:
            fever_rows.append(value)

print("Fever-related symptom values:")

for value in sorted(set(fever_rows)):
    print(repr(value))

print("\nCounts:")

print(
    pd.Series(fever_rows).value_counts()
)