import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


# ==========================================
# 1. LOAD DATASET
# ==========================================

df = pd.read_csv(
    "dataset/Disease_symptom_and_patient_profile_dataset.csv"
)

df = df.drop_duplicates()

print("Dataset shape:", df.shape)


# ==========================================
# 2. FEATURES
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
# 3. ENCODE CATEGORICAL FEATURES
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

encoders = {}

for column in categorical_columns:

    encoder = LabelEncoder()

    X[column] = encoder.fit_transform(
        X[column].astype(str)
    )

    encoders[column] = encoder


# ==========================================
# 4. ENCODE TARGET
# ==========================================

target_encoder = LabelEncoder()

y = target_encoder.fit_transform(
    df["Outcome Variable"].astype(str)
)


# ==========================================
# 5. CHECK DATA TYPES
# ==========================================

print("\nData types after encoding:")
print(X.dtypes)

print("\nSample encoded data:")
print(X.head())


# ==========================================
# 6. TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# 7. TRAIN RANDOM FOREST
# ==========================================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

print("\nTraining model...")

model.fit(X_train, y_train)


# ==========================================
# 8. PREDICTIONS
# ==========================================

train_prediction = model.predict(X_train)

test_prediction = model.predict(X_test)


# ==========================================
# 9. ACCURACY
# ==========================================

training_accuracy = accuracy_score(
    y_train,
    train_prediction
)

testing_accuracy = accuracy_score(
    y_test,
    test_prediction
)


# ==========================================
# 10. RESULTS
# ==========================================

print("\n==============================")
print("MODEL RESULTS")
print("==============================")

print(
    f"Training Accuracy: {training_accuracy * 100:.2f}%"
)

print(
    f"Testing Accuracy : {testing_accuracy * 100:.2f}%"
)