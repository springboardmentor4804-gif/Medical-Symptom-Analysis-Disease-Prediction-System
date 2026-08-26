import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report
)


# ==========================================
# 1. LOAD DATA
# ==========================================

train_df = pd.read_csv(
    "dataset/Training.csv"
)

test_df = pd.read_csv(
    "dataset/Testing.csv"
)

print("Training shape:", train_df.shape)
print("Testing shape :", test_df.shape)


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
# 3. SEPARATE FEATURES AND TARGET
# ==========================================

X_train = train_df.drop(
    columns=["prognosis"]
)

y_train = train_df["prognosis"]


X_test = test_df.drop(
    columns=["prognosis"]
)

y_test = test_df["prognosis"]


print("\nNumber of features:", X_train.shape[1])
print("Number of diseases:", y_train.nunique())


# ==========================================
# 4. TRAIN RANDOM FOREST
# ==========================================

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_leaf=2,
    random_state=42
)

print("\nTraining disease prediction model...")

model.fit(
    X_train,
    y_train
)

print("Training completed.")


# ==========================================
# 5. PREDICTIONS
# ==========================================

train_prediction = model.predict(X_train)

test_prediction = model.predict(X_test)


# ==========================================
# 6. PERFORMANCE
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


# ==========================================
# 7. DISPLAY RESULTS
# ==========================================

print("\n======================================")
print("DISEASE PREDICTION RESULTS")
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
# 8. CLASSIFICATION REPORT
# ==========================================

print("\n======================================")
print("CLASSIFICATION REPORT")
print("======================================")

print(
    classification_report(
        y_test,
        test_prediction,
        zero_division=0
    )
)