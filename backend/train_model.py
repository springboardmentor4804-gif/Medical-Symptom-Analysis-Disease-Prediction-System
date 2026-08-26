import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle

# Load dataset
df = pd.read_csv("data/Training.csv")

# Remove extra column if present
df = df.drop(columns=["Unnamed: 133"], errors="ignore")

# Features (Symptoms)
X = df.drop("prognosis", axis=1)

# Target (Disease)
y = df["prognosis"]

# Split data into training and testing (unseen data)
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Create model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# Train model only on training data
model.fit(X_train, y_train)

# Predict on unseen test data
y_pred = model.predict(X_test)

# Calculate accuracy
accuracy = accuracy_score(y_test, y_pred)

print(f"Training samples: {len(X_train)}")
print(f"Testing samples (unseen data): {len(X_test)}")
print(f"Test Accuracy: {accuracy * 100:.2f}%")

# Save trained model
pickle.dump(model, open("model.pkl", "wb"))

print("Model saved successfully!")