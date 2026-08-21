import os
import pickle
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

DATASETS_DIR = "DATASETS" if os.path.exists("DATASETS") else "."

def preprocess_disease_symptom_dataset():
    """Preprocesses the Disease Symptom and Patient Profile Dataset."""
    path = os.path.join(DATASETS_DIR, "Disease_symptom_and_patient_profile_dataset.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    
    df = pd.read_csv(path)
    # Strip whitespaces from string columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].str.strip()
    
    # Deduplicate
    df = df.drop_duplicates().reset_index(drop=True)
    
    # No longer grouping rare diseases into "Unidentified Condition" to allow direct close prediction.
    return df

def preprocess_disease_prediction_symptom_dataset():
    """Preprocesses the Disease Prediction Using Symptom Dataset."""
    path = os.path.join(DATASETS_DIR, "disease prediction using symptom.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
        
    df = pd.read_csv(path)
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].str.strip()
        
    df['cleaned risk level'] = df['risk level'].str.extract(r'(\d+\.?\d*%)')
    df['cleaned risk level'] = df['cleaned risk level'].fillna(df['risk level'])
    
    df = df.drop_duplicates().reset_index(drop=True)
    return df

def preprocess_mimic_summarization_dataset():
    """Preprocesses the MIMIC-IV Summarization Shortened Dataset."""
    path = os.path.join(DATASETS_DIR, "mimic_iv_summarization_test_dataset_shortened.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
        
    df = pd.read_csv(path)
    df['text'] = df['text'].str.strip()
    df['summary'] = df['summary'].str.strip()
    
    df = df.drop_duplicates().reset_index(drop=True)
    
    df['text_len'] = df['text'].str.len()
    df['summary_len'] = df['summary'].str.len()
    df['text_word_count'] = df['text'].apply(lambda x: len(str(x).split()))
    df['summary_word_count'] = df['summary'].apply(lambda x: len(str(x).split()))
    return df

def preprocess_cdc_surveillance_dataset():
    """Preprocesses the large CDC Behaviour Risk Factor Surveillance System Dataset."""
    path = os.path.join(DATASETS_DIR, "cdc behaviour risk factor suviellance system.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
        
    important_cols = [
        '_STATE', '_SEX', '_AGEG5YR', 'GENHLTH', 'PHYSHLTH', 'MENTHLTH', 
        '_BMI5', '_BMI5CAT', '_SMOKER3', 'DRNKANY6'
    ]
    df = pd.read_csv(path, usecols=important_cols)
    
    # Downcast to optimize memory
    for col in df.columns:
        if df[col].dtype == 'float64':
            df[col] = pd.to_numeric(df[col], downcast='float')
        elif df[col].dtype == 'int64':
            df[col] = pd.to_numeric(df[col], downcast='integer')
            
    df['GENHLTH'] = df['GENHLTH'].replace([7, 9], np.nan)
    df['PHYSHLTH'] = df['PHYSHLTH'].replace([77, 99], np.nan)
    df['MENTHLTH'] = df['MENTHLTH'].replace([77, 99], np.nan)
    
    df = df.drop_duplicates().reset_index(drop=True)
    
    column_mapping = {
        '_STATE': 'State_Code',
        '_SEX': 'Sex',
        '_AGEG5YR': 'Age_Group_5Yr',
        'GENHLTH': 'General_Health_Rating',
        'PHYSHLTH': 'Physical_Health_Bad_Days',
        'MENTHLTH': 'Mental_Health_Bad_Days',
        '_BMI5': 'BMI_x100',
        '_BMI5CAT': 'BMI_Category',
        '_SMOKER3': 'Smoker_Status',
        'DRNKANY6': 'Alcohol_Consumer'
    }
    df_clean = df.rename(columns=column_mapping)
    return df_clean

def prepare_model_training_data(df1):
    """Encodes features and labels, then splits dataset for model training."""
    model_df = df1.copy()
    
    binary = {"Yes": 1, "No": 0}
    for col in ["Fever", "Cough", "Fatigue", "Difficulty Breathing"]:
        model_df[col] = model_df[col].map(binary)
        
    model_df["Gender"] = model_df["Gender"].map({"Male": 1, "Female": 0})
    
    levels = {"Low": 0, "Normal": 1, "High": 2}
    model_df["Blood Pressure"] = model_df["Blood Pressure"].map(levels)
    model_df["Cholesterol Level"] = model_df["Cholesterol Level"].map(levels)
    
    label_encoder = LabelEncoder()
    model_df["Disease"] = label_encoder.fit_transform(model_df["Disease"])
    
    # Save the label encoder
    le_path = os.path.join(DATASETS_DIR, "label_encoder.pkl")
    with open(le_path, "wb") as f:
        pickle.dump(label_encoder, f)
    print(f"Saved label encoder to: {le_path}")
    
    X = model_df.drop(columns=["Disease", "Outcome Variable"])
    y = model_df["Disease"]
    
    stratify_y = y if y.value_counts().min() > 1 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=stratify_y
    )
    return X_train, X_test, y_train, y_test, label_encoder

def prepare_outcome_training_data(df1):
    """Encodes features and outcome variable, then splits dataset for outcome model training."""
    model_df = df1.copy()
    
    binary = {"Yes": 1, "No": 0}
    for col in ["Fever", "Cough", "Fatigue", "Difficulty Breathing"]:
        model_df[col] = model_df[col].map(binary)
        
    model_df["Gender"] = model_df["Gender"].map({"Male": 1, "Female": 0})
    
    levels = {"Low": 0, "Normal": 1, "High": 2}
    model_df["Blood Pressure"] = model_df["Blood Pressure"].map(levels)
    model_df["Cholesterol Level"] = model_df["Cholesterol Level"].map(levels)
    
    # Map Outcome Variable: Positive -> 1, Negative -> 0
    model_df["Outcome Variable"] = model_df["Outcome Variable"].map({"Positive": 1, "Negative": 0})
    
    X = model_df.drop(columns=["Disease", "Outcome Variable"])
    y = model_df["Outcome Variable"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    return X_train, X_test, y_train, y_test


if __name__ == "__main__":
    print("Running Preprocessing pipeline...")
    
    print("1. Preprocessing Disease Symptom Dataset...")
    df1 = preprocess_disease_symptom_dataset()
    print(f"   Shape: {df1.shape}")
    
    print("2. Preprocessing Disease Prediction Symptom Dataset...")
    df2 = preprocess_disease_prediction_symptom_dataset()
    print(f"   Shape: {df2.shape}")
    
    print("3. Preprocessing MIMIC Summarization Dataset...")
    df3 = preprocess_mimic_summarization_dataset()
    print(f"   Shape: {df3.shape}")
    
    print("4. Preprocessing CDC Surveillance Dataset...")
    df4 = preprocess_cdc_surveillance_dataset()
    print(f"   Shape: {df4.shape}")
    
    print("5. Preparing Model Data...")
    X_train, X_test, y_train, y_test, _ = prepare_model_training_data(df1)
    print(f"   Train set shape: {X_train.shape}, Test set shape: {X_test.shape}")
    print("Preprocessing completed successfully!")
