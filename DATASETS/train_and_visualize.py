import os
import pickle
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Import preprocessing helpers
from preprocessing import preprocess_disease_symptom_dataset, prepare_model_training_data, prepare_outcome_training_data

DATASETS_DIR = "DATASETS" if os.path.exists("DATASETS") else "."

def train_and_visualize():
    print("Loading data...")
    df1 = preprocess_disease_symptom_dataset()
    X_train, X_test, y_train, y_test, label_encoder = prepare_model_training_data(df1)
    
    print("\nTraining RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=6,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Evaluate model
    train_predictions = model.predict(X_train)
    test_predictions = model.predict(X_test)
    
    train_acc = accuracy_score(y_train, train_predictions)
    test_acc = accuracy_score(y_test, test_predictions)
    
    print(f"   Training Accuracy: {train_acc:.4f}")
    print(f"   Testing Accuracy: {test_acc:.4f}")
    
    # 1. Save model and label encoder
    model_path = os.path.join(DATASETS_DIR, "disease_model.pkl")
    label_encoder_path = os.path.join(DATASETS_DIR, "label_encoder.pkl")
    print("Retraining disease model on 100% of dataset for production...")
    production_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=6,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42
    )
    production_model.fit(pd.concat([X_train, X_test]), pd.concat([y_train, y_test]))
    with open(model_path, "wb") as f:
        pickle.dump(production_model, f)
    with open(label_encoder_path, "wb") as f:
        pickle.dump(label_encoder, f)
    print(f"Model saved successfully to: {model_path}")
    print(f"Label encoder saved successfully to: {label_encoder_path}")
    
    # Train and save the Outcome Model
    print("\nTraining RandomForestClassifier for Outcome Prediction (Risk)...")
    X_train_out, X_test_out, y_train_out, y_test_out = prepare_outcome_training_data(df1)
    outcome_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=5,
        min_samples_split=4,
        random_state=42
    )
    outcome_model.fit(X_train_out, y_train_out)
    
    train_out_acc = accuracy_score(y_train_out, outcome_model.predict(X_train_out))
    test_out_acc = accuracy_score(y_test_out, outcome_model.predict(X_test_out))
    print(f"   Outcome Training Accuracy: {train_out_acc:.4f}")
    print(f"   Outcome Testing Accuracy: {test_out_acc:.4f}")
    
    outcome_model_path = os.path.join(DATASETS_DIR, "outcome_model.pkl")
    print("Retraining outcome model on 100% of dataset for production...")
    production_outcome_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=5,
        min_samples_split=4,
        random_state=42
    )
    production_outcome_model.fit(pd.concat([X_train_out, X_test_out]), pd.concat([y_train_out, y_test_out]))
    with open(outcome_model_path, "wb") as f:
        pickle.dump(production_outcome_model, f)
    print(f"Outcome model saved successfully to: {outcome_model_path}")
    
    # Generate and save disease lookup details from `disease prediction using symptom.csv`
    print("\nGenerating disease lookup details dictionary...")
    disease_info = {}
    csv_path = os.path.join(DATASETS_DIR, "disease prediction using symptom.csv")
    if os.path.exists(csv_path):
        disease_df = pd.read_csv(csv_path)
        for _, row in disease_df.iterrows():
            d_name = str(row["disease"]).strip().lower()
            disease_info[d_name] = {
                "cures": str(row.get("cures", "")).strip(),
                "doctor": str(row.get("doctor", "")).strip(),
                "risk_level": str(row.get("risk level", "")).strip()
            }
        print(f"   Parsed {len(disease_info)} disease definitions.")
    else:
        print("   WARNING: disease prediction using symptom.csv not found!")
        
    disease_info_path = os.path.join(DATASETS_DIR, "disease_info.pkl")
    with open(disease_info_path, "wb") as f:
        pickle.dump(disease_info, f)
    print(f"Disease info saved successfully to: {disease_info_path}")
    
    # 2. Visualize Feature Importances
    importances = model.feature_importances_
    features = X_train.columns
    indices = np.argsort(importances)[::-1]
    
    plt.figure(figsize=(10, 6))
    plt.title("Feature Importance for Disease Prediction Model")
    plt.bar(range(X_train.shape[1]), importances[indices], align="center", color="skyblue", edgecolor="blue")
    plt.xticks(range(X_train.shape[1]), features[indices], rotation=45, ha='right')
    plt.xlim([-1, X_train.shape[1]])
    plt.ylabel("Importance Score")
    plt.tight_layout()
    
    chart_path = os.path.join(DATASETS_DIR, "feature_importance.png")
    plt.savefig(chart_path)
    plt.close()
    print(f"Saved feature importance chart to: {chart_path}")
    
    # 3. Visualize Accuracy (Train vs Test Comparison)
    plt.figure(figsize=(6, 4))
    plt.bar(["Train Accuracy", "Test Accuracy"], [train_acc, test_acc], color=["navy", "orange"], width=0.4)
    plt.ylabel("Accuracy Score")
    plt.ylim([0, 1.1])
    plt.title("Model Accuracy Performance Comparison")
    
    # Add text labels on top of the bars
    for i, acc in enumerate([train_acc, test_acc]):
        plt.text(i, acc + 0.02, f"{acc:.4f}", ha='center', fontweight='bold')
        
    plt.tight_layout()
    comparison_chart_path = os.path.join(DATASETS_DIR, "accuracy_comparison.png")
    plt.savefig(comparison_chart_path)
    plt.close()
    print(f"Saved accuracy comparison chart to: {comparison_chart_path}")
    
    # 4. Verify Inference
    print("\nRunning verification inference using saved pickle artifacts...")
    # Load model and label encoder from files
    loaded_model = pickle.load(open(model_path, "rb"))
    label_encoder_path = os.path.join(DATASETS_DIR, "label_encoder.pkl")
    loaded_le = pickle.load(open(label_encoder_path, "rb"))
    
    # Test prediction
    sample = pd.DataFrame({
        "Fever": [1],
        "Cough": [1],
        "Fatigue": [1],
        "Difficulty Breathing": [0],
        "Age": [30],
        "Gender": [1],
        "Blood Pressure": [1],
        "Cholesterol Level": [1]
    })
    
    pred_class = loaded_model.predict(sample)
    disease_name = loaded_le.inverse_transform(pred_class)
    print(f"Verification sample prediction output: {disease_name[0]}")

if __name__ == "__main__":
    train_and_visualize()
