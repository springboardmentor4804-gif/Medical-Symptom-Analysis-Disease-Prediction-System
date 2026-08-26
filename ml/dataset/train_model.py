import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report
)


# ==========================================
# 1. LOAD DATASET
# ==========================================

file_path = "dataset/Disease_symptom_and_patient_profile_dataset.csv"

df = pd.read_csv(file_path)

print("\n========== DATASET INFORMATION ==========")
print("Original shape:", df.shape)
print("\nColumns:")
print(df.columns.tolist())


# ==========================================
# 2. REMOVE DUPLICATES
# ==========================================

duplicate_count = df.duplicated().sum()

print("\nDuplicate rows found:", duplicate_count)

df = df.drop_duplicates()

print("Shape after removing duplicates:", df.shape)


# ==========================================
# 3. CHECK MISSING VALUES
# ==========================================

print("\n========== MISSING VALUES ==========")
print(df.isnull().sum())


# ==========================================
# 4. DISPLAY DISEASE DISTRIBUTION
# ==========================================

print("\n========== DISEASE DISTRIBUTION ==========")
print(df["Disease"].value_counts())


# ==========================================
# 5. ENCODE CATEGORICAL DATA
# ==========================================

label_encoders = {}

categorical_columns = [
    "Fever",
    "Cough",
    "Fatigue",
    "Difficulty Breathing",
    "Gender",
    "Blood Pressure",
    "Cholesterol Level"
]

for column in categorical_columns:

    encoder = LabelEncoder()

    df[column] = encoder.fit_transform(df[column].astype(str))

    label_encoders[column] = encoder


# ==========================================
# 6. ENCODE TARGET
# ==========================================

disease_encoder = LabelEncoder()

df["Disease"] = disease_encoder.fit_transform(
    df["Disease"].astype(str)
)


# ==========================================
# 7. SELECT FEATURES
# ==========================================

features = [
    "Fever",
    "Cough",
    "Fatigue",
    "Difficulty Breathing",
    "Age",
    "Gender",
    "Blood Pressure",
    "Cholesterol Level"
]

X = df[features]

y = df["Disease"]


# ==========================================
# 8. TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)


print("\n========== DATA SPLIT ==========")

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# 9. TRAIN MODEL
# ==========================================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

print("\nTraining Random Forest model...")

model.fit(X_train, y_train)

print("Training completed.")


# ==========================================
# 10. MAKE PREDICTIONS
# ==========================================

y_pred = model.predict(X_test)


# ==========================================
# 11. MODEL EVALUATION
# ==========================================

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    average="weighted",
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    average="weighted",
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    average="weighted",
    zero_division=0
)


print("\n========== MODEL PERFORMANCE ==========")

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")


# ==========================================
# 12. CLASSIFICATION REPORT
# ==========================================

print("\n========== CLASSIFICATION REPORT ==========")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ==========================================
# 13. SAVE MODEL
# ==========================================

joblib.dump(
    model,
    "disease_model.pkl"
)

joblib.dump(
    disease_encoder,
    "disease_encoder.pkl"
)

joblib.dump(
    label_encoders,
    "feature_encoders.pkl"
)

print("\n========== FILES SAVED ==========")

print("disease_model.pkl")
print("disease_encoder.pkl")
print("feature_encoders.pkl")

print("\nMilestone 2 disease prediction model completed.")