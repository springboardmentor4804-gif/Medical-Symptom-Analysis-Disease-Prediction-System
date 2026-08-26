import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


# ==========================================
# LOAD DATASET
# ==========================================

df = pd.read_csv(
    "dataset/Disease_symptom_and_patient_profile_dataset.csv"
)

df = df.drop_duplicates()

print("Dataset shape:", df.shape)


# ==========================================
# FEATURES
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
# ENCODE FEATURES
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

for column in categorical_columns:

    encoder = LabelEncoder()

    X[column] = encoder.fit_transform(
        X[column].astype(str)
    )


# ==========================================
# ENCODE TARGET
# ==========================================

target_encoder = LabelEncoder()

y = target_encoder.fit_transform(
    df["Outcome Variable"].astype(str)
)


# ==========================================
# TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# ==========================================
# TEST DIFFERENT MODELS
# ==========================================

models = {

    "Model 1": RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        min_samples_leaf=3,
        random_state=42
    ),

    "Model 2": RandomForestClassifier(
        n_estimators=150,
        max_depth=7,
        min_samples_leaf=3,
        random_state=42
    ),

    "Model 3": RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=2,
        random_state=42
    ),

    "Model 4": RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_leaf=2,
        random_state=42
    ),

    "Model 5": RandomForestClassifier(
        n_estimators=250,
        max_depth=12,
        min_samples_leaf=2,
        random_state=42
    )
}


# ==========================================
# TRAIN AND COMPARE
# ==========================================

print("\n======================================")
print("MODEL COMPARISON")
print("======================================")

for name, model in models.items():

    model.fit(X_train, y_train)

    train_prediction = model.predict(X_train)

    test_prediction = model.predict(X_test)

    train_accuracy = accuracy_score(
        y_train,
        train_prediction
    )

    test_accuracy = accuracy_score(
        y_test,
        test_prediction
    )

    gap = train_accuracy - test_accuracy

    print("\n", name)

    print(
        f"Training Accuracy: {train_accuracy * 100:.2f}%"
    )

    print(
        f"Testing Accuracy : {test_accuracy * 100:.2f}%"
    )

    print(
        f"Accuracy Gap     : {gap * 100:.2f}%"
    )