import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, classification_report
import joblib

def evaluate_medassist_model():
    print("Loading trained model and features for Milestone 4 validation...")
    
    # 1. Load saved model and features from training
    model = joblib.load('medassist_disease_model.pkl')
    model_features = joblib.load('model_features.pkl')
    
    # 2. Create a test dataset (similar to your training data distribution)
    test_data = {
        'Fever': ['Yes', 'No', 'Yes', 'No'],
        'Cough': ['Yes', 'Yes', 'No', 'No'],
        'Fatigue': ['Yes', 'No', 'Yes', 'Yes'],
        'Difficulty Breathing': ['No', 'Yes', 'No', 'Yes'],
        'Blood Pressure': ['Normal', 'High', 'High', 'Low'],
        'Cholesterol Level': ['Normal', 'High', 'Normal', 'High'],
        'Disease': ['Influenza', 'Bronchial Asthma', 'Dengue Fever', 'Hypertension']
    }
    
    test_df = pd.DataFrame(test_data)
    
    # 3. Preprocess test features
    X_test_raw = test_df.drop(columns=['Disease'])
    y_test = test_df['Disease']
    
    # Encode using get_dummies
    X_test_encoded = pd.get_dummies(X_test_raw)
    
    # Align test columns with training features (handles missing or extra dummy columns)
    X_test_aligned = X_test_encoded.reindex(columns=model_features, fill_value=0)
    
    # 4. Make predictions
    y_pred = model.predict(X_test_aligned)
    
    # 5. Evaluate and Print Metrics for Milestone 4 Report
    print("\n--- MEDASSIST AI - MODEL VALIDATION METRICS ---")
    
    # Note: Using zero_division=0 to handle cases where test classes have limited samples
    report = classification_report(y_test, y_pred, zero_division=0)
    
    print(f"Predictions successfully generated for {len(y_test)} test samples.")
    print("\nClassification Report:\n")
    print(report)

if __name__ == "__main__":
    evaluate_medassist_model()