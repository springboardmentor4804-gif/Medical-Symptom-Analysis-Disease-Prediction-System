import pandas as pd
import joblib
from pathlib import Path

from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)


# ============================================================
# Paths
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR.parent.parent / "datasets" / "dataset.csv"
MODEL_DIR = BASE_DIR.parent / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# Load Dataset
# ============================================================

df = pd.read_csv(DATASET_PATH)

print("Dataset Shape:", df.shape)

# Clean disease names
df["Disease"] = (
    df["Disease"]
    .astype(str)
    .str.strip()
)

# ============================================================
# Find Symptom Columns
# ============================================================

symptom_columns = [
    col for col in df.columns
    if col.startswith("Symptom")
]

print("Number of symptom columns:", len(symptom_columns))


# ============================================================
# Clean Symptoms
# ============================================================

symptom_lists = []

for _, row in df.iterrows():

    symptoms = []

    for column in symptom_columns:

        value = str(row[column]).strip().lower()

        if value in ["", "none", "nan"]:
            continue

        symptoms.append(value)

    symptom_lists.append(symptoms)


# ============================================================
# Disease Labels
# ============================================================

label_encoder = LabelEncoder()

y = label_encoder.fit_transform(
    df["Disease"]
)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

symptoms_train, symptoms_test, y_train, y_test = train_test_split(
    symptom_lists,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining samples:", len(symptoms_train))
print("Testing samples:", len(symptoms_test))


# ============================================================
# Feature Engineering
# ============================================================

# IMPORTANT:
# Fit MLB ONLY on training data

mlb = MultiLabelBinarizer()

X_train = mlb.fit_transform(symptoms_train)

X_test = mlb.transform(symptoms_test)


print("\nNumber of features:", len(mlb.classes_))

print("\nFirst 20 symptoms:")
print(mlb.classes_[:20])


# ============================================================
# Train Random Forest
# ============================================================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    n_jobs=-1
)

model.fit(
    X_train,
    y_train
)


# ============================================================
# Test Model
# ============================================================

predictions = model.predict(X_test)


# ============================================================
# Accuracy
# ============================================================

accuracy = accuracy_score(
    y_test,
    predictions
)

print("\n" + "=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)


# ============================================================
# Classification Report
# ============================================================

print("\nClassification Report\n")

print(
    classification_report(
        y_test,
        predictions,
        target_names=label_encoder.classes_,
        zero_division=0
    )
)


# ============================================================
# Confusion Matrix
# ============================================================

print("\n" + "=" * 60)
print("Confusion Matrix")
print("=" * 60)

cm = confusion_matrix(
    y_test,
    predictions
)

print(cm)


# ============================================================
# Save Model
# ============================================================

joblib.dump(
    model,
    MODEL_DIR / "model.pkl"
)

joblib.dump(
    label_encoder,
    MODEL_DIR / "label_encoder.pkl"
)

joblib.dump(
    mlb,
    MODEL_DIR / "mlb.pkl"
)


print("\n" + "=" * 60)
print("MODEL SAVED SUCCESSFULLY")
print("=" * 60)

print("Model:", MODEL_DIR / "model.pkl")
print("Label Encoder:", MODEL_DIR / "label_encoder.pkl")
print("MLB:", MODEL_DIR / "mlb.pkl")