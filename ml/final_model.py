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

df = pd.read_csv(
    "dataset/Disease_symptom_and_patient_profile_dataset.csv"
)

# Remove duplicate records
df = df.drop_duplicates()

print("Dataset shape:", df.shape)


# ==========================================
# 2. SELECT FEATURES
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

X = df[features].copy()


# ==========================================
# 3. ENCODE FEATURES
# ==========================================

categorical_columns = [
    "Fever",
    "Cough",
    "Fatigue",
    "Difficulty Breathing",
    "Gender",
    "Blood Pressure",
    "Cholesterol Level"
]

feature_encoders = {}

for column in categorical_columns:

    encoder = LabelEncoder()

    X[column] = encoder.fit_transform(
        X[column].astype(str)
    )

    feature_encoders[column] = encoder


# ==========================================
# 4. ENCODE TARGET
# ==========================================

target_encoder = LabelEncoder()

y = target_encoder.fit_transform(
    df["Outcome Variable"].astype(str)
)


# ==========================================
# 5. TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# ==========================================
# 6. FINAL RANDOM FOREST MODEL
# ==========================================

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_leaf=2,
    random_state=42
)


print("\nTraining final model...")

model.fit(X_train, y_train)

print("Training completed.")


# ==========================================
# 7. PREDICTIONS
# ==========================================

train_prediction = model.predict(X_train)
test_prediction = model.predict(X_test)


# ==========================================
# 8. MODEL PERFORMANCE
# ==========================================

training_accuracy = accuracy_score(
    y_train,
    train_prediction
)

testing_accuracy = accuracy_score(
    y_test,
    test_prediction
)

precision = precision_score(
    y_test,
    test_prediction,
    average="weighted",
    zero_division=0
)

recall = recall_score(
    y_test,
    test_prediction,
    average="weighted",
    zero_division=0
)

f1 = f1_score(
    y_test,
    test_prediction,
    average="weighted",
    zero_division=0
)


print("\n==========================================")
print("FINAL MODEL PERFORMANCE")
print("==========================================")

print(
    f"Training Accuracy : {training_accuracy * 100:.2f}%"
)

print(
    f"Testing Accuracy  : {testing_accuracy * 100:.2f}%"
)

print(
    f"Precision         : {precision * 100:.2f}%"
)

print(
    f"Recall            : {recall * 100:.2f}%"
)

print(
    f"F1 Score          : {f1 * 100:.2f}%"
)


# ==========================================
# 9. CLASSIFICATION REPORT
# ==========================================

print("\n==========================================")
print("CLASSIFICATION REPORT")
print("==========================================")

print(
    classification_report(
        y_test,
        test_prediction,
        target_names=target_encoder.classes_,
        zero_division=0
    )
)


# ==========================================
# 10. SAVE MODEL
# ==========================================

joblib.dump(
    model,
    "outcome_model.pkl"
)

joblib.dump(
    target_encoder,
    "outcome_encoder.pkl"
)

joblib.dump(
    feature_encoders,
    "feature_encoders.pkl"
)


print("\n==========================================")
print("MODEL FILES SAVED")
print("==========================================")

print("outcome_model.pkl")
print("outcome_encoder.pkl")
print("feature_encoders.pkl")

print("\nMilestone 2 ML model completed successfully.")