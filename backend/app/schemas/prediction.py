from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class PredictionRequest(BaseModel):
    disease_name: Optional[str] = Field(None, description="Optional suspected disease name")
    age: Optional[int] = Field(None, ge=0, le=150, description="Patient age (auto-filled from profile if omitted)")
    gender: Optional[str] = Field(None, description="Patient gender Male/Female (auto-filled from profile if omitted)")
    fever: str = Field("No", description="Yes or No")
    cough: str = Field("No", description="Yes or No")
    fatigue: str = Field("No", description="Yes or No")
    difficulty_breathing: str = Field("No", description="Yes or No")
    blood_pressure: str = Field("Normal", description="Low, Normal, or High")
    cholesterol_level: str = Field("Normal", description="Low, Normal, or High")

    # Intense / Severe Symptoms
    chest_pain: str = Field("No", description="Yes or No - Acute Chest Pain / Pressure")
    severe_dizziness: str = Field("No", description="Yes or No - Severe Vertigo / Dizziness")
    confusion_disorientation: str = Field("No", description="Yes or No - Sudden Confusion or Disorientation")
    coughing_blood: str = Field("No", description="Yes or No - Hemoptysis / Coughing Blood")
    numbness_paralysis: str = Field("No", description="Yes or No - Sudden Numbness or Weakness")
    symptom_severity_scale: Optional[int] = Field(1, ge=1, le=10, description="Overall symptom severity scale 1 to 10")

    # Optional quantitative readings
    fever_temperature: Optional[float] = Field(None, description="Optional fever temperature in Fahrenheit (e.g. 101.5)")
    systolic_bp: Optional[int] = Field(None, description="Optional Systolic Blood Pressure mmHg (e.g. 130)")
    diastolic_bp: Optional[int] = Field(None, description="Optional Diastolic Blood Pressure mmHg (e.g. 85)")
    heart_rate: Optional[int] = Field(None, description="Optional Heart Rate in BPM (e.g. 78)")
    oxygen_saturation: Optional[int] = Field(None, description="Optional Oxygen Saturation SpO2 % (e.g. 98)")

class DiseaseProbability(BaseModel):
    disease: str
    probability: float

class RecommendationDetails(BaseModel):
    urgency: str
    action_message: str
    preventive_tips: List[str]
    follow_up_advice: str

class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="Positive or Negative Outcome Risk")
    confidence: float = Field(..., description="Confidence score between 0 and 100")
    outcome_probability: float = Field(..., description="Positive risk probability (0-100%)")
    top_diseases: List[DiseaseProbability] = Field(default_factory=list, description="Top predicted diseases from RandomForest")
    feature_importances: Dict[str, float] = Field(default_factory=dict, description="Importance weight of key risk factors")
    vital_analysis: Optional[Dict[str, str]] = Field(default_factory=dict, description="Analysis of quantitative vital signs")
    vital_metrics: Optional[Dict[str, dict]] = Field(default_factory=dict, description="Structured vital metrics for chart visualization")
    
    # Clinical Triage & Intense Symptom Prediction Features
    triage_level: str = Field("ROUTINE", description="ROUTINE, MODERATE, SEVERE, or CRITICAL EMERGENCY")
    triage_color: str = Field("green", description="green, amber, orange, or red")
    emergency_action_directive: Optional[str] = Field(None, description="Immediate medical recommendation or emergency directive")
    urgency_timeframe: str = Field("Routine Consult (Within 48h)", description="Estimated timeframe for medical attention")
    organ_system_risks: Dict[str, float] = Field(default_factory=dict, description="Risk percentages across key organ systems")
    intense_symptom_flags: List[str] = Field(default_factory=list, description="List of active intense symptoms detected")
    recommendation: Optional[RecommendationDetails] = Field(None, description="Structured rule-based clinical recommendation")

    message: str = Field(..., description="Explanation of the prediction")
    model_name: str = Field("RandomForestClassifier", description="Algorithm used for prediction")

class ModelInfoResponse(BaseModel):
    model_name: str
    outcome_accuracy: float
    disease_accuracy: float
    total_samples: int
    feature_importances: Dict[str, float]
