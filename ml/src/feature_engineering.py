import pandas as pd
from sklearn.preprocessing import MultiLabelBinarizer

# Load dataset
df = pd.read_csv("D:\MedAssist_AI\datasets\dataset.csv")

# Replace missing values
df = df.fillna("None")

# Get symptom columns
symptom_columns = [col for col in df.columns if col.startswith("Symptom")]

# Convert symptoms into a list for each patient
symptom_lists = df[symptom_columns].values.tolist()

# Remove "None" values
symptom_lists = [
    [
        symptom.strip().lower()
        for symptom in row
        if symptom != "None"
    ]
    for row in symptom_lists
]

# Convert symptoms into binary features
mlb = MultiLabelBinarizer()

X = mlb.fit_transform(symptom_lists)

# Create feature dataframe
X = pd.DataFrame(
    X,
    columns=mlb.classes_
)

print("=" * 60)
print("Feature Matrix Shape")
print(X.shape)

print("=" * 60)
print("First 5 Rows")
print(X.head())

print("=" * 60)
print("Total Symptoms Learned")
print(len(mlb.classes_))

print("=" * 60)
print("First 20 Symptoms")
print(mlb.classes_[:20])