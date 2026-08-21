import os
import pickle
from datetime import datetime
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from routes.auth import get_current_user
from recommendation_engine import generate_recommendations

router = APIRouter(prefix="/api/prediction", tags=["prediction"])

# Paths to the serialized model and label encoder
DATASETS_DIR = "DATASETS" if os.path.exists("DATASETS") else "../DATASETS"
MODEL_PATH = os.path.join(DATASETS_DIR, "disease_model.pkl")
LABEL_ENCODER_PATH = os.path.join(DATASETS_DIR, "label_encoder.pkl")
OUTCOME_MODEL_PATH = os.path.join(DATASETS_DIR, "outcome_model.pkl")
DISEASE_INFO_PATH = os.path.join(DATASETS_DIR, "disease_info.pkl")

# Cache model and label encoder loading
_model = None
_label_encoder = None
_outcome_model = None
_disease_info = None

def load_prediction_artifacts():
    global _model, _label_encoder, _outcome_model, _disease_info
    if _model is None or _label_encoder is None or _outcome_model is None or _disease_info is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(LABEL_ENCODER_PATH) or not os.path.exists(OUTCOME_MODEL_PATH) or not os.path.exists(DISEASE_INFO_PATH):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ML prediction models are not serialized yet. Please run training pipeline first."
            )
        try:
            with open(MODEL_PATH, "rb") as f:
                _model = pickle.load(f)
            with open(LABEL_ENCODER_PATH, "rb") as f:
                _label_encoder = pickle.load(f)
            with open(OUTCOME_MODEL_PATH, "rb") as f:
                _outcome_model = pickle.load(f)
            with open(DISEASE_INFO_PATH, "rb") as f:
                _disease_info = pickle.load(f)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error loading model artifacts: {str(e)}"
            )
    return _model, _label_encoder, _outcome_model, _disease_info

class PredictionRequest(BaseModel):
    # Support structured binary symptoms or plain text
    symptoms: Optional[List[str]] = Field(default_factory=list)
    text_input: Optional[str] = None
    
    # Demographics and physiological baseline metrics
    age: int
    gender: str  # "male" or "female"
    blood_pressure: str = "normal"  # "low", "normal", "high"
    cholesterol_level: str = "normal"  # "low", "normal", "high"
    
    # Context attributes
    duration: str = "1-3 days"
    severity: str = "Moderate"  # "Mild", "Moderate", "Severe"
    factors: str = "Rest"

class RecommendationRequest(BaseModel):
    disease: str
    confidence: int = 80
    risk_score: int = 50
    risk_level: str = "Moderate Risk"
    severity: str = "Moderate"
    symptoms: Optional[List[str]] = Field(default_factory=list)
    patient_info: Optional[Dict[str, Any]] = Field(default_factory=dict)

@router.post("/predict-symptom")
async def predict_symptom(req: PredictionRequest, current_user: dict = Depends(get_current_user)):
    # 1. Load artifacts
    model, label_encoder, outcome_model, disease_info = load_prediction_artifacts()
    
    # 2. Parse symptoms
    fever = 0
    cough = 0
    fatigue = 0
    difficulty_breathing = 0
    
    symptoms_list = [s.lower() for s in req.symptoms]
    
    # Parse structured symptoms list
    if any(s in symptoms_list for s in ["fever", "high fever"]):
        fever = 1
    if any(s in symptoms_list for s in ["cough", "chronic cough"]):
        cough = 1
    if any(s in symptoms_list for s in ["fatigue", "chronic fatigue"]):
        fatigue = 1
    if any(s in symptoms_list for s in ["difficulty breathing", "shortness of breath", "shortness_of_breath", "difficulty_breathing"]):
        difficulty_breathing = 1
        
    # Also parse from text description (for doctor dashboard free text)
    if req.text_input:
        text_lower = req.text_input.lower()
        if "fever" in text_lower or "temp" in text_lower or "hot" in text_lower:
            fever = 1
        if "cough" in text_lower or "cold" in text_lower:
            cough = 1
        if "fatigue" in text_lower or "tired" in text_lower or "weakness" in text_lower:
            fatigue = 1
        if "breath" in text_lower or "shortness" in text_lower or "dyspnea" in text_lower or "suffocat" in text_lower:
            difficulty_breathing = 1
            
    # 3. Format mappings
    gender_val = 1 if req.gender.lower() == "male" else 0
    
    bp_map = {"low": 0, "normal": 1, "high": 2}
    chol_map = {"low": 0, "normal": 1, "high": 2}
    
    bp_val = bp_map.get(req.blood_pressure.lower(), 1)
    chol_val = chol_map.get(req.cholesterol_level.lower(), 1)
    
    # 4. Construct feature vector and predict
    # Model features: Fever, Cough, Fatigue, Difficulty Breathing, Age, Gender, Blood Pressure, Cholesterol Level
    input_df = pd.DataFrame([{
        "Fever": fever,
        "Cough": cough,
        "Fatigue": fatigue,
        "Difficulty Breathing": difficulty_breathing,
        "Age": req.age,
        "Gender": gender_val,
        "Blood Pressure": bp_val,
        "Cholesterol Level": chol_val
    }])
    
    try:
        # Predict class
        pred_class = model.predict(input_df)[0]
        primary_disease = label_encoder.inverse_transform([pred_class])[0]
        
        # Predict probabilities
        prob_array = model.predict_proba(input_df)[0]
        primary_prob = int(round(prob_array[pred_class] * 100))
        
        # Get alternative classifications (top 3 alternatives with prob >= 1%)
        alt_indices = np.argsort(prob_array)[::-1]
        secondary_predictions = []
        for idx in alt_indices:
            if idx == pred_class:
                continue
            prob = int(round(prob_array[idx] * 100))
            if prob >= 1 and len(secondary_predictions) < 3:
                disease_name = label_encoder.inverse_transform([idx])[0]
                secondary_predictions.append({
                    "name": disease_name,
                    "probability": prob
                })
                
        # Predict risk_score directly using the outcome model
        outcome_probs = outcome_model.predict_proba(input_df)[0]
        if len(outcome_probs) > 1:
            risk_score = int(round(outcome_probs[1] * 100))
        else:
            # Fallback to class label prediction if prob is binary but degenerate
            risk_score = 99 if outcome_model.predict(input_df)[0] == 1 else 10
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )
        
    # 5. Risk Assessment Categorization
    risk_score = max(10, min(99, risk_score))
    
    risk_cat = "Low Risk"
    if risk_score > 70:
        risk_cat = "High Risk"
    elif risk_score > 40:
        risk_cat = "Moderate Risk"
        
    # 6. Patient Profile and Context
    extracted_symptoms = req.symptoms if req.symptoms else [
        s for s, val in [("Fever", fever), ("Cough", cough), ("Fatigue", fatigue), ("Difficulty Breathing", difficulty_breathing)] if val
    ]
    
    patient_context = {
        "age": req.age,
        "gender": req.gender,
        "blood_pressure": req.blood_pressure,
        "cholesterol_level": req.cholesterol_level,
        "chronicConditions": current_user.get("chronicConditions", []),
        "allergies": current_user.get("allergies", []),
        "medications": current_user.get("medications", []),
    }
    
    # 7. Generate Comprehensive Healthcare Advisory via Centralized Recommendation Engine
    recs = generate_recommendations(
        disease=primary_disease,
        confidence=primary_prob,
        risk_score=risk_score,
        risk_level=risk_cat,
        severity=req.severity,
        symptoms=extracted_symptoms,
        patient_info=patient_context,
        medical_history=current_user.get("medicalHistory", [])
    )
    
    # Check emergency state
    is_emergency = recs.get("isEmergency", False) or risk_score > 75
    
    # Return unified, structured assessment response
    return {
        "date": datetime.now().strftime("%m/%d/%Y"),
        "type": "Health Report",
        "condition": primary_disease,
        "notes": f"AI Diagnostic Report: Primary indication is {primary_disease} (Confidence: {primary_prob}%). Evaluated as {risk_cat} (Risk Index: {risk_score}%).",
        "details": {
            "symptoms": extracted_symptoms,
            "duration": req.duration,
            "severity": req.severity,
            "factors": req.factors,
            "correlations": recs.get("correlations", []),
            "primaryProb": primary_prob,
            "confidenceTier": recs.get("confidenceTier", "Moderate Confidence"),
            "uncertaintyNote": recs.get("uncertaintyNote"),
            "secondaryPredictions": secondary_predictions,
            "isEmergency": is_emergency,
            "riskScore": risk_score,
            "riskCat": risk_cat,
            "urgencyLevel": recs.get("urgencyLevel", "routine"),
            "urgencyLabel": recs.get("urgencyLabel", "Routine Care"),
            "specialist": recs.get("specialist", "General Physician"),
            "diagnosticTests": recs.get("diagnosticTests", []),
            "disclaimer": recs.get("disclaimer"),
            "recommendations": recs
        }
    }

@router.post("/generate-recommendations")
async def get_recommendations_endpoint(
    req: RecommendationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Dedicated endpoint to generate or recalculate recommendations on-demand
    for any given disease, risk, confidence, severity, and patient context.
    """
    patient_context = req.patient_info or {
        "age": current_user.get("age", 30),
        "gender": current_user.get("sex", "male"),
        "blood_pressure": "normal",
        "cholesterol_level": "normal",
        "chronicConditions": current_user.get("chronicConditions", []),
        "allergies": current_user.get("allergies", []),
        "medications": current_user.get("medications", []),
    }
    
    recs = generate_recommendations(
        disease=req.disease,
        confidence=req.confidence,
        risk_score=req.risk_score,
        risk_level=req.risk_level,
        severity=req.severity,
        symptoms=req.symptoms,
        patient_info=patient_context,
        medical_history=current_user.get("medicalHistory", [])
    )
    return recs
