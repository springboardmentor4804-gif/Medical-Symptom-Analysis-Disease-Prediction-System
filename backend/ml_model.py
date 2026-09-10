import os
import joblib
import pandas as pd
import numpy as np
from recommendations import generate_health_recommendations
from advisory_engine import generate_health_advisory

# Absolute file paths to pickle files


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASTORAGE_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "datastorage"))

def resolve_model_path(filename):
    backend_path = os.path.join(BASE_DIR, filename)
    if os.path.exists(backend_path):
        return backend_path
    datastorage_path = os.path.join(DATASTORAGE_DIR, filename)
    if os.path.exists(datastorage_path):
        return datastorage_path
    return backend_path

SYMPTOM_SEVERITY_PATH = resolve_model_path("symptom_severity.pkl")
DISEASE_MODEL_PATH = resolve_model_path("disease_prediction_model.pkl")
CVD_MODEL_PATH = resolve_model_path("cvd_prediction_model.pkl")

SYMPTOM_FEATURES = [
  'chest_pain', 'palpitations', 'sob_exertion', 'leg_swelling', 'dizziness', 'cold_sweats',
  'skin_rash', 'skin_itching', 'skin_mole', 'skin_blisters', 'skin_dryness', 'hives',
  'severe_headache', 'numbness', 'tremors', 'memory_loss', 'vision_change', 'migraine_aura',
  'chronic_cough', 'wheezing', 'cough_blood', 'chest_congestion', 'shortness_breath_rest',
  'severe_stomach_pain', 'nausea_vomiting', 'acid_reflux', 'bloating',
  'joint_stiffness', 'back_pain', 'muscle_weakness',
  'high_fever', 'fatigue', 'unexplained_weight_loss', 'chills_sweats'
]

DISEASE_PROFILES = [
  {
    "condition": "Coronary Artery Disease / Hypertensive Stress",
    "specialty": "Cardiologist",
    "symptoms": ['chest_pain', 'palpitations', 'sob_exertion', 'dizziness', 'cold_sweats'],
    "base_risk": 75
  },
  {
    "condition": "Acute Dermatitis / Allergic Eczema",
    "specialty": "Dermatologist",
    "symptoms": ['skin_rash', 'skin_itching', 'skin_blisters', 'hives'],
    "base_risk": 35
  },
  {
    "condition": "Migraine Syndrome / Neurovascular Vasospasm",
    "specialty": "Neurologist",
    "symptoms": ['severe_headache', 'vision_change', 'numbness', 'migraine_aura'],
    "base_risk": 45
  },
  {
    "condition": "Bronchial Asthma / Airway Obstruction",
    "specialty": "Pulmonologist",
    "symptoms": ['chronic_cough', 'wheezing', 'chest_congestion'],
    "base_risk": 55
  }
]

SPECIALTY_MAPPING = {
  'Cardiovascular': 'Cardiologist',
  'Dermatology': 'Dermatologist',
  'Neurology': 'Neurologist',
  'Pulmonology': 'Pulmonologist',
  'Orthopedics': 'Orthopedist',
  'Psychiatry': 'Psychiatrist',
  'General': 'General Physician'
}

class LoadedPKLPredictor:
    def __init__(self):
        self.symptom_severity = {}
        self.disease_model = None
        self.cvd_model = None
        self.is_loaded = False
        self._load_pkl_files()

    def _load_pkl_files(self):
        try:
            print("[PKL ENGINE] Loading symptom_severity.pkl...")
            if os.path.exists(SYMPTOM_SEVERITY_PATH):
                self.symptom_severity = joblib.load(SYMPTOM_SEVERITY_PATH)
                print(f"[PKL ENGINE] Loaded {len(self.symptom_severity)} symptom weights from symptom_severity.pkl.")

            print("[PKL ENGINE] Loading disease_prediction_model.pkl...")
            if os.path.exists(DISEASE_MODEL_PATH):
                self.disease_model = joblib.load(DISEASE_MODEL_PATH)
                print("[PKL ENGINE] Loaded Disease Prediction Pipeline from disease_prediction_model.pkl.")

            print("[PKL ENGINE] Loading cvd_prediction_model.pkl...")
            if os.path.exists(CVD_MODEL_PATH):
                self.cvd_model = joblib.load(CVD_MODEL_PATH)
                print("[PKL ENGINE] Loaded CVD Prediction Pipeline from cvd_prediction_model.pkl.")

            self.is_loaded = True
        except Exception as e:
            print(f"[PKL ENGINE ERROR] Exception loading pkl files: {e}")

    def predict_risk(self, selected_symptom_ids, severity='Moderate', duration='1-3 days', age=30):
        if not selected_symptom_ids or len(selected_symptom_ids) == 0:
            return {
                "predictedDisease": "No Symptoms Selected",
                "predictionProbability": 0,
                "symptomSeverity": {
                    "score": 0.0,
                    "level": "Mild",
                    "totalSymptoms": 0
                },
                "cvdAssessment": {
                    "prediction": "No Risk Evaluated",
                    "probability": 0
                },
                "riskScore": 0,
                "riskLevel": "Low",
                "primaryCondition": "No Symptoms Selected",
                "recommendedSpecialty": "General Physician",
                "matchedConditions": [],
                "warnings": [],
                "disclaimer": "Disclaimer: This AI prediction is an informational risk assessment and not an official medical diagnosis. Please consult a doctor for official clinical diagnosis.",
                "summary": "Please select or type your symptoms to generate a prediction using loaded PKL models."
            }

        # ---------------------------------------------------------------------
        # 1. SYMPTOM SEVERITY ASSESSMENT (From symptom_severity.pkl)
        # ---------------------------------------------------------------------
        total_weight = 0
        symptom_count = len(selected_symptom_ids)
        symptom_details = []

        for s_id in selected_symptom_ids:
            clean_name = s_id.replace('_', ' ').title()
            weight = self.symptom_severity.get(s_id, self.symptom_severity.get(clean_name.lower(), 4))
            total_weight += weight
            symptom_details.append({"symptom": clean_name, "weight": weight})

        avg_severity_weight = round((total_weight / symptom_count), 2) if symptom_count > 0 else 3.0
        
        if avg_severity_weight >= 5.5 or severity == 'Severe':
            severity_level = "Severe Severity"
        elif avg_severity_weight >= 3.5 or severity == 'High':
            severity_level = "Moderate Severity"
        else:
            severity_level = "Mild Severity"

        symptom_severity_res = {
            "score": avg_severity_weight,
            "level": severity_level,
            "totalSymptoms": symptom_count,
            "details": symptom_details
        }

        # ---------------------------------------------------------------------
        # 2. MAIN DISEASE PREDICTION (From disease_prediction_model.pkl)
        # Supports ALL 100+ trained disease classes!
        # ---------------------------------------------------------------------
        has_fever = "Yes" if any(s in selected_symptom_ids for s in ['high_fever', 'chills_sweats', 'fever', 'mild_fever', 'shivering']) else "No"
        has_cough = "Yes" if any(s in selected_symptom_ids for s in ['chronic_cough', 'cough_blood', 'cough', 'phlegm']) else "No"
        has_fatigue = "Yes" if any(s in selected_symptom_ids for s in ['fatigue', 'muscle_weakness', 'lethargy', 'malaise']) else "No"
        has_diff_breath = "Yes" if any(s in selected_symptom_ids for s in ['sob_exertion', 'shortness_breath_rest', 'wheezing', 'breathlessness']) else "No"
        gender_val = "Male"
        bp_val = "High" if severity in ['High', 'Severe'] or 'chest_pain' in selected_symptom_ids else "Normal"
        cholesterol_val = "High" if age > 50 or 'chest_pain' in selected_symptom_ids else "Normal"

        sample_df = pd.DataFrame([{
            "Fever": has_fever,
            "Cough": has_cough,
            "Fatigue": has_fatigue,
            "Difficulty Breathing": has_diff_breath,
            "Age": age,
            "Gender": gender_val,
            "Blood Pressure": bp_val,
            "Cholesterol Level": cholesterol_val,
            "Outcome Variable": "Positive"
        }])

        predicted_disease = "General Acute Condition"
        prediction_probability = 75
        matched_conditions = []

        if self.disease_model:
            try:
                pred = self.disease_model.predict(sample_df)[0]
                predicted_disease = str(pred)

                if hasattr(self.disease_model, "predict_proba"):
                    probs = self.disease_model.predict_proba(sample_df)[0]
                    classes = list(getattr(self.disease_model, 'classes_', self.disease_model.named_steps['model'].classes_))
                    ranked_indices = np.argsort(probs)[::-1]

                    prediction_probability = int(round(probs[ranked_indices[0]] * 100))

                    for idx in ranked_indices[:5]:
                        match_pct = int(round(probs[idx] * 100))
                        if match_pct > 2:
                            c_name = str(classes[idx])
                            spec = self._map_specialty(c_name)
                            matched_conditions.append({
                                "condition": c_name,
                                "specialty": spec,
                                "matchPercentage": match_pct,
                                "summary": f"disease_prediction_model.pkl Confidence: {match_pct}%"
                            })
                else:
                    prediction_probability = 80
                    matched_conditions.append({
                        "condition": predicted_disease,
                        "specialty": self._map_specialty(predicted_disease),
                        "matchPercentage": 80,
                        "summary": "Predicted by disease_prediction_model.pkl"
                    })
            except Exception as ex:
                print(f"[Disease Model Inference Notice]: {ex}")

        if not matched_conditions:
            matched_conditions = [{
                "condition": predicted_disease,
                "specialty": self._map_specialty(predicted_disease),
                "matchPercentage": prediction_probability,
                "summary": "Disease Classification"
            }]

        target_specialty = matched_conditions[0]["specialty"]

        # ---------------------------------------------------------------------
        # 3. CVD HEART DISEASE ASSESSMENT (From cvd_prediction_model.pkl)
        # Kept separate as an additional cardiovascular assessment module
        # ---------------------------------------------------------------------
        cvd_prediction_result = "Low Heart Disease Risk"
        cvd_probability_pct = 12

        if self.cvd_model:
            try:
                gen_health = "Fair" if severity in ['High', 'Severe'] else "Good"
                age_cat = "60-64" if age > 60 else ("50-54" if age > 50 else ("40-44" if age > 40 else "30-34"))
                cvd_df = pd.DataFrame([{
                    "General_Health": gen_health,
                    "Checkup": "Within past year",
                    "Exercise": "Yes",
                    "Skin_Cancer": "No",
                    "Other_Cancer": "No",
                    "Depression": "No",
                    "Diabetes": "No",
                    "Arthritis": "No",
                    "Sex": "Male",
                    "Age_Category": age_cat,
                    "Height_(cm)": 170.0,
                    "Weight_(kg)": 70.0,
                    "BMI": 24.2,
                    "Smoking_History": "No",
                    "Alcohol_Consumption": 0.0,
                    "Fruit_Consumption": 30.0,
                    "Green_Vegetables_Consumption": 30.0,
                    "FriedPotato_Consumption": 4.0
                }])

                cvd_pred = self.cvd_model.predict(cvd_df)[0]
                if hasattr(self.cvd_model, "predict_proba"):
                    cvd_proba = self.cvd_model.predict_proba(cvd_df)[0]
                    classes = list(getattr(self.cvd_model, 'classes_', self.cvd_model.named_steps['model'].classes_))
                    yes_idx = classes.index('Yes') if 'Yes' in classes else 1
                    cvd_probability_pct = int(round(cvd_proba[yes_idx] * 100))

                if cvd_pred == "Yes" or cvd_probability_pct > 35 or 'chest_pain' in selected_symptom_ids:
                    cvd_prediction_result = "Elevated Heart Disease Risk"
                    cvd_probability_pct = max(cvd_probability_pct, 45)
            except Exception as ex:
                print(f"[CVD Model Inference Notice]: {ex}")

        cvd_assessment_res = {
            "prediction": cvd_prediction_result,
            "probability": cvd_probability_pct
        }

        # ---------------------------------------------------------------------
        # 4. OVERALL RISK INDEX & LEVEL CALCULATION
        # ---------------------------------------------------------------------
        has_cardiac_symptoms = any(s in selected_symptom_ids for s in ['chest_pain', 'palpitations', 'sob_exertion', 'dizziness'])
        cvd_risk_bonus = 25 if has_cardiac_symptoms else 0

        severity_multipliers = {'Low': 0.8, 'Moderate': 1.0, 'High': 1.25, 'Severe': 1.5}
        sev_mult = severity_multipliers.get(severity, 1.0)
        age_mult = 1.2 if age > 60 else (1.1 if age > 45 else 1.0)

        raw_risk = (symptom_count * 10) + (avg_severity_weight * 5) + cvd_risk_bonus
        final_risk_score = min(int(round(raw_risk * sev_mult * age_mult)), 98)
        if final_risk_score < 15:
            final_risk_score = 15

        if final_risk_score >= 75:
            risk_level = "Critical"
            urgency = "Immediate Emergency Care"
        elif final_risk_score >= 55:
            risk_level = "High"
            urgency = "Prompt Specialist Consultation"
        elif final_risk_score >= 35:
            risk_level = "Moderate"
            urgency = "Schedule Doctor Appointment"
        else:
            risk_level = "Low"
            urgency = "Routine Care & Observation"

        warnings = []
        if any(s in selected_symptom_ids for s in ['chest_pain', 'cough_blood', 'blood_in_sputum', 'slurred_speech', 'shortness_breath_rest', 'breathlessness']):
            warnings.append("[WARNING] Emergency Alert: Chest pain, slurred speech, coughing blood, or breathlessness requires immediate emergency medical evaluation.")

        disclaimer = "Disclaimer: This AI prediction is an informational risk assessment and not an official medical diagnosis. Please consult a doctor for official clinical diagnosis."

        # Generate Health & Treatment Recommendations
        health_recs = generate_health_recommendations(
            disease_name=predicted_disease,
            risk_level=risk_level,
            severity_level=severity_level,
            symptoms=selected_symptom_ids
        )

        # Generate Health Advisory Dossier
        health_advisory = generate_health_advisory(
            disease_name=predicted_disease,
            risk_level=risk_level,
            severity_level=severity_level,
            symptoms=selected_symptom_ids,
            risk_score=final_risk_score,
            specialty=target_specialty
        )


        return {
            "predictedDisease": predicted_disease,
            "predictionProbability": prediction_probability,
            "symptomSeverity": symptom_severity_res,
            "cvdAssessment": cvd_assessment_res,
            "riskScore": final_risk_score,
            "riskLevel": risk_level,
            "severity": severity,
            "primaryCondition": predicted_disease,
            "recommendedSpecialty": target_specialty,
            "modelProbability": prediction_probability,
            "cvdPrediction": cvd_prediction_result,
            "cvdProbability": cvd_probability_pct,
            "matchedConditions": matched_conditions,
            "urgency": urgency,
            "warnings": warnings,
            "disclaimer": disclaimer,
            "recommendations": health_recs,
            "healthAdvisory": health_advisory,
            "summary": f"Main Prediction: {predicted_disease} ({prediction_probability}% Probability). Severity: {severity_level}. CVD Status: {cvd_prediction_result} ({cvd_probability_pct}% Probability)."
        }



    def _map_specialty(self, condition_name):
        c_lower = condition_name.lower()
        if any(w in c_lower for w in ['heart', 'cardio', 'coronary', 'angina', 'hypertension', 'atherosclerosis', 'arrhythmia']):
            return 'Cardiologist'
        if any(w in c_lower for w in ['skin', 'dermatitis', 'eczema', 'psoriasis', 'rash', 'acne', 'melanoma']):
            return 'Dermatologist'
        if any(w in c_lower for w in ['migraine', 'neuro', 'headache', 'stroke', 'epilepsy', 'parkinson', 'dementia', 'neuropathy', 'alzheimer']):
            return 'Neurologist'
        if any(w in c_lower for w in ['asthma', 'cough', 'lung', 'pneumonia', 'bronchitis', 'respiratory', 'copd', 'tuberculosis', 'sinusitis']):
            return 'Pulmonologist'
        if any(w in c_lower for w in ['arthritis', 'joint', 'spine', 'fracture', 'bone', 'ortho', 'osteo']):
            return 'Orthopedist'
        if any(w in c_lower for w in ['anxiety', 'depression', 'bipolar', 'psych', 'schizophrenia']):
            return 'Psychiatrist'
        return 'General Physician'

# Global Singleton ML Instance loading the 3 PKL files
ml_engine = LoadedPKLPredictor()
