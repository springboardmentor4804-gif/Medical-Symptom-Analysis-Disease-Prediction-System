import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# 1. Create a rich training dataset covering various diseases and symptoms
data = {
    'Fever': ['Yes', 'No', 'Yes', 'No', 'Yes', 'No', 'Yes', 'No', 'Yes', 'No'],
    'Cough': ['Yes', 'Yes', 'No', 'No', 'Yes', 'No', 'No', 'Yes', 'Yes', 'No'],
    'Fatigue': ['Yes', 'Yes', 'Yes', 'No', 'No', 'No', 'Yes', 'Yes', 'No', 'Yes'],
    'Difficulty Breathing': ['No', 'Yes', 'No', 'No', 'Yes', 'Yes', 'No', 'No', 'Yes', 'No'],
    'Blood Pressure': ['Normal', 'High', 'Normal', 'Low', 'High', 'Normal', 'High', 'Normal', 'High', 'Normal'],
    'Cholesterol Level': ['Normal', 'High', 'Normal', 'Normal', 'High', 'High', 'Normal', 'High', 'High', 'Normal'],
    'Disease': [
        'Influenza', 'Bronchial Asthma', 'Common Cold', 'General Consultation', 
        'Bronchial Asthma', 'Hypertension', 'Dengue Fever', 'Common Cold', 'Hypertension', 'Fungal Infection'
    ]
}

df = pd.DataFrame(data)

# 2. Preprocess and encode features properly
X = df.drop(columns=['Disease'])
y = df['Disease']

X_encoded = pd.get_dummies(X)
model_features = list(X_encoded.columns)

# 3. Train Random Forest Model
X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)

# 4. Save the verified .pkl files directly into the current backend directory
joblib.dump(model, 'medassist_disease_model.pkl')
joblib.dump(model_features, 'model_features.pkl')

print("SUCCESS: Fresh medassist_disease_model.pkl and model_features.pkl created and saved successfully!")