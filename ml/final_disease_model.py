import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)


# ==========================================
# 1. LOAD DATASET
# ==========================================

train_df = pd.read_csv(
    "dataset/Training.csv"
)

test_df = pd.read_csv(
    "dataset/Testing.csv"
)


# ==========================================
# 2. REMOVE UNNECESSARY COLUMN
# ==========================================

train_df = train_df.drop(
    columns=["Unnamed: 133"],
    errors="ignore"
)

test_df = test_df.drop(
    columns=["Unnamed: 133"],
    errors="ignore"
)


# ==========================================
# 3. FEATURES AND TARGET
# ==========================================

X_train = train_df.drop(
    columns=["prognosis"]
)

y_train = train_df["prognosis"]


X_test = test_df.drop(
    columns=["prognosis"]
)

y_test = test_df["prognosis"]


# ==========================================
# 4. TRAIN RANDOM FOREST
# ==========================================

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_leaf=2,
    random_state=42
)

print("Training final disease prediction model...")

model.fit(
    X_train,
    y_train
)


# ==========================================
# 5. EVALUATION
# ==========================================

train_prediction = model.predict(X_train)
test_prediction = model.predict(X_test)

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


print("\n======================================")
print("FINAL DISEASE MODEL")
print("======================================")

print(
    f"Training Accuracy: {training_accuracy * 100:.2f}%"
)

print(
    f"Testing Accuracy : {testing_accuracy * 100:.2f}%"
)

print(
    f"Precision        : {precision * 100:.2f}%"
)

print(
    f"Recall           : {recall * 100:.2f}%"
)

print(
    f"F1 Score         : {f1 * 100:.2f}%"
)

print(
    f"Accuracy Gap     : {(training_accuracy - testing_accuracy) * 100:.2f}%"
)


# ==========================================
# 6. SAVE MODEL
# ==========================================

joblib.dump(
    model,
    "disease_model.pkl"
)

# Save the exact feature order
joblib.dump(
    list(X_train.columns),
    "disease_features.pkl"
)

# Save disease names
joblib.dump(
    list(model.classes_),
    "disease_classes.pkl"
)


print("\n======================================")
print("FILES SAVED")
print("======================================")

print("disease_model.pkl")
print("disease_features.pkl")
print("disease_classes.pkl")

print("\nDisease prediction model ready for FastAPI.")