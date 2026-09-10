import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report


#  Load dataset

raw = pd.read_csv(
    "CVD_cleaned.csv",
    header=None
)


#  Split the single column

df = raw[0].str.split(",", expand=True)


#  Remove extra empty column

df = df.iloc[:, :19]


#  First row contains column names

df.columns = df.iloc[0]

df = df.iloc[1:].reset_index(drop=True)


#  Remove duplicate rows

df = df.drop_duplicates()


#  Display dataset information

print("Dataset Shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())


#  Separate features and target

X = df.drop(
    "Heart_Disease",
    axis=1
)

y = df["Heart_Disease"]
# Define categorical columns
categorical_columns = [
    "General_Health",
    "Checkup",
    "Exercise",
    "Skin_Cancer",
    "Other_Cancer",
    "Depression",
    "Diabetes",
    "Arthritis",
    "Sex",
    "Age_Category",
    "Smoking_History"
]
# Define numerical columns
numerical_columns = [
    "Height_(cm)",
    "Weight_(kg)",
    "BMI",
    "Alcohol_Consumption",
    "Fruit_Consumption",
    "Green_Vegetables_Consumption",
    "FriedPotato_Consumption"
]
# Convert numerical columns to numeric
for column in numerical_columns:
    X[column] = pd.to_numeric(
        X[column],
        errors="coerce"
    )
# Check missing values AFTER conversion
print("\nMissing values after conversion:")
print(
    X.isnull().sum()
)
# Numerical preprocessing
numerical_transformer = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    )
])
# Categorical preprocessing
categorical_transformer = Pipeline([
    (
        "imputer",
        SimpleImputer(
            strategy="most_frequent"
        )
    ),
    (
        "encoder",
        OneHotEncoder(
            handle_unknown="ignore"
        )
    )
])
# Combine preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        (
            "numerical",
            numerical_transformer,
            numerical_columns
        ),
        (
            "categorical",
            categorical_transformer,
            categorical_columns
        )
    ]
)
# Create Random Forest model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,   
)
# Create pipeline
pipeline = Pipeline([
    (
        "preprocessor",
        preprocessor
    ),
    (
        "model",
        model
    )
])
# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)
print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))
# Train model
print("\nTraining model...")
pipeline.fit(
    X_train,
    y_train
)
# Test model
y_pred = pipeline.predict(
    X_test
)
# Calculate accuracy
accuracy = accuracy_score(
    y_test,
    y_pred
)
print("\nAccuracy:", accuracy)
print(
    "Accuracy Percentage:",
    accuracy * 100
)
# Classification report
print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)
#  Save model
joblib.dump(
    pipeline,
    "cvd_prediction_model.pkl"
)
print("\nModel saved successfully!")