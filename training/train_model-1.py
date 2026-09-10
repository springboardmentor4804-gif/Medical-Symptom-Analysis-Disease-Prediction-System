import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report

#  Load dataset
df = pd.read_csv("Disease_symptom_and_patient_profile_ds.csv")

#  Separate features and target
X = df.drop("Disease", axis=1)
y = df["Disease"]

#  Define categorical columns
categorical_columns = ["Fever","Cough","Fatigue","Difficulty Breathing","Gender","Blood Pressure","Cholesterol Level","Outcome Variable"]

#  Create preprocessor
preprocessor = ColumnTransformer(
transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_columns
        )
    ],
    remainder="passthrough"
)

#  Create Random Forest model
model = RandomForestClassifier(n_estimators=100,random_state=42)

#  Create pipeline
pipeline = Pipeline([("preprocessor", preprocessor),("model", model)])

# Split data into training and testing
X_train, X_test, y_train, y_test = train_test_split(X,y,test_size=0.20,random_state=42)

# Train the model
print("Training the model...")
pipeline.fit(X_train, y_train)
print("Training completed!")

# Test the model
y_pred = pipeline.predict(X_test)

# Evaluate the model
accuracy = accuracy_score(y_test, y_pred)
print("\nMODEL RESULTS")
print("Accuracy:", accuracy)
print("Accuracy Percentage:", accuracy * 100, "%")
print("\n CLASSIFICATION REPORT ")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)

# Save the trained model
joblib.dump(
    pipeline,
    "disease_prediction_model.pkl"
)

print("\nModel saved successfully!")
print("File: disease_prediction_model.pkl")