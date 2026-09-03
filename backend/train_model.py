import pandas as pd
import pickle

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

print("=" * 50)
print("MODEL TRAINING")
print("=" * 50)

# --------------------------------------------------------
# Load dataset
# --------------------------------------------------------

df = pd.read_csv("data/Training.csv")

# Remove unwanted extra column if present
df = df.drop(
    columns=["Unnamed: 133"],
    errors="ignore"
)

print("Total samples:", len(df))

# --------------------------------------------------------
# Features and target
# --------------------------------------------------------

X = df.drop("prognosis", axis=1)
y = df["prognosis"].str.strip()

print("Number of symptoms/features:", X.shape[1])
print("Number of diseases:", y.nunique())

# --------------------------------------------------------
# Split into training and unseen testing data
# --------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("Training samples:", len(X_train))
print("Testing samples (unseen):", len(X_test))

# --------------------------------------------------------
# Create Random Forest
# --------------------------------------------------------

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    n_jobs=-1
)

# --------------------------------------------------------
# Train
# --------------------------------------------------------

model.fit(X_train, y_train)

# --------------------------------------------------------
# Test on unseen data
# --------------------------------------------------------

y_pred = model.predict(X_test)

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

print("\n" + "=" * 50)
print("MODEL PERFORMANCE")
print("=" * 50)

print(f"Accuracy  : {accuracy * 100:.2f}%")
print(f"Precision : {precision * 100:.2f}%")
print(f"Recall    : {recall * 100:.2f}%")
print(f"F1-Score  : {f1 * 100:.2f}%")

# --------------------------------------------------------
# Classification report
# --------------------------------------------------------

print("\n" + "=" * 50)
print("CLASSIFICATION REPORT")
print("=" * 50)

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)

# --------------------------------------------------------
# Confusion matrix
# --------------------------------------------------------

print("\n" + "=" * 50)
print("CONFUSION MATRIX")
print("=" * 50)

print(
    confusion_matrix(
        y_test,
        y_pred
    )
)

# --------------------------------------------------------
# Save model AND symptom list
# --------------------------------------------------------

model_data = {
    "model": model,
    "symptoms": list(X.columns)
}

with open("model.pkl", "wb") as file:
    pickle.dump(model_data, file)

print("\n" + "=" * 50)
print("MODEL SAVED SUCCESSFULLY")
print("=" * 50)