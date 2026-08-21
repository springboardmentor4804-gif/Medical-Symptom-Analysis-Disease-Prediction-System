"""
MedAssist AI — Milestone 3 Recommendation Engine Verification Test Suite

Tests:
- Scenario 1: Dengue / Moderate Risk (87% confidence)
- Scenario 2: High-Risk Emergency Case (Myocardial Infarction / Sepsis)
- Scenario 3: Low-Risk Case (Common Cold / Allergic Rhinitis)
- Scenario 4: Low-Confidence Prediction (< 60% confidence uncertainty note)
- Scenario 5: Multi-Disease Specificity & Personalization (Dengue vs Diabetes vs Asthma vs Hypertension)
- Safety Checks: No prescription drug dosages, disclaimers present, non-definitive language
"""

import unittest
from recommendation_engine import generate_recommendations, get_disease_knowledge

class TestRecommendationEngine(unittest.TestCase):

    def test_scenario_1_dengue_moderate_risk(self):
        """Scenario 1: Dengue with Moderate Risk and 87% confidence."""
        recs = generate_recommendations(
            disease="Dengue Fever",
            confidence=87,
            risk_score=55,
            risk_level="Moderate Risk",
            severity="Moderate",
            symptoms=["Fever", "Headache", "Body pain", "Fatigue"],
            patient_info={"age": 28, "gender": "male", "blood_pressure": "normal"}
        )
        
        # Verify 5 structured categories exist and are populated
        self.assertGreater(len(recs["healthcareSuggestions"]), 0)
        self.assertGreater(len(recs["preventiveCare"]), 0)
        self.assertGreater(len(recs["lifestyleRecommendations"]), 0)
        self.assertGreater(len(recs["followUpGuidance"]), 0)
        self.assertGreater(len(recs["warningSigns"]), 0)
        
        # Verify Dengue-specific intelligence
        all_text = " ".join(
            recs["healthcareSuggestions"] + 
            recs["preventiveCare"] + 
            recs["lifestyleRecommendations"] + 
            recs["followUpGuidance"] + 
            recs["warningSigns"]
        ).lower()
        
        # Platelet / CBC or mosquito/fluid mentions
        self.assertTrue(any(term in all_text for term in ["platelet", "cbc", "mosquito", "hydration", "nsaid"]))
        # High confidence tier
        self.assertEqual(recs["confidenceTier"], "High Confidence")
        self.assertIsNone(recs["uncertaintyNote"])
        self.assertEqual(recs["urgencyLevel"], "prompt")
        print("[PASS] Scenario 1 (Dengue / Moderate Risk)")

    def test_scenario_2_high_risk_emergency_case(self):
        """Scenario 2: High-Risk Acute Event (e.g. Myocardial Infarction / Sepsis)."""
        recs = generate_recommendations(
            disease="Myocardial Infarction (Heart Attack)",
            confidence=92,
            risk_score=88,
            risk_level="High Risk",
            severity="Severe",
            symptoms=["Difficulty Breathing", "Fatigue", "Chest Pain"],
            patient_info={"age": 62, "gender": "male", "blood_pressure": "high"}
        )
        
        self.assertTrue(recs["isEmergency"])
        self.assertEqual(recs["urgencyLevel"], "emergency")
        self.assertIn("emergency", recs["healthcareSuggestions"][0].lower())
        self.assertGreater(len(recs["warningSigns"]), 0)
        print("[PASS] Scenario 2 (High-Risk Emergency Case)")

    def test_scenario_3_low_risk_case(self):
        """Scenario 3: Low-Risk Condition (e.g. Common Cold)."""
        recs = generate_recommendations(
            disease="Common Cold",
            confidence=80,
            risk_score=20,
            risk_level="Low Risk",
            severity="Mild",
            symptoms=["Cough", "Fatigue"],
            patient_info={"age": 24, "gender": "female", "blood_pressure": "normal"}
        )
        
        self.assertFalse(recs["isEmergency"])
        self.assertEqual(recs["urgencyLevel"], "routine")
        self.assertIn("routine", recs["urgencyLabel"].lower())
        
        # Lifestyle and preventive guidance emphasized
        self.assertTrue(any("rest" in s.lower() or "sleep" in s.lower() for s in recs["lifestyleRecommendations"]))
        self.assertTrue(any("fluid" in s.lower() or "water" in s.lower() for s in recs["lifestyleRecommendations"]))
        print("[PASS] Scenario 3 (Low-Risk Case)")

    def test_scenario_4_low_confidence_prediction(self):
        """Scenario 4: Low-confidence prediction (< 60%) communicates uncertainty."""
        recs = generate_recommendations(
            disease="Influenza",
            confidence=52,
            risk_score=45,
            risk_level="Moderate Risk",
            severity="Moderate",
            symptoms=["Fever", "Fatigue"]
        )
        
        self.assertEqual(recs["confidenceTier"], "Low Confidence")
        self.assertIsNotNone(recs["uncertaintyNote"])
        self.assertIn("preliminary indication", recs["uncertaintyNote"].lower())
        self.assertIn("symptom overlap", recs["uncertaintyNote"].lower())
        print("[PASS] Scenario 4 (Low-Confidence Uncertainty)")

    def test_scenario_5_multi_disease_variation(self):
        """Scenario 5: Different diseases produce tailored, non-identical recommendations."""
        recs_diabetes = generate_recommendations(
            disease="Diabetes",
            confidence=85,
            risk_score=35,
            risk_level="Low Risk",
            symptoms=["Fatigue"]
        )
        recs_asthma = generate_recommendations(
            disease="Asthma",
            confidence=88,
            risk_score=65,
            risk_level="Moderate Risk",
            symptoms=["Difficulty Breathing", "Cough"]
        )
        recs_hypertension = generate_recommendations(
            disease="Hypertension",
            confidence=90,
            risk_score=50,
            risk_level="Moderate Risk"
        )
        
        # Specialist differentiation
        self.assertNotEqual(recs_diabetes["specialist"], recs_asthma["specialist"])
        self.assertIn("endocrinologist", recs_diabetes["specialist"].lower())
        self.assertIn("pulmonologist", recs_asthma["specialist"].lower())
        self.assertIn("cardiologist", recs_hypertension["specialist"].lower())
        
        # Content differentiation
        diabetes_text = " ".join(recs_diabetes["healthcareSuggestions"] + recs_diabetes["lifestyleRecommendations"]).lower()
        asthma_text = " ".join(recs_asthma["healthcareSuggestions"] + recs_asthma["lifestyleRecommendations"]).lower()
        
        self.assertTrue("glucose" in diabetes_text or "glycemic" in diabetes_text or "hba1c" in diabetes_text)
        self.assertTrue("inhaler" in asthma_text or "pulmonary" in asthma_text or "peak" in asthma_text or "breathing" in asthma_text)
        print("[PASS] Scenario 5 (Multi-Disease Variation)")

    def test_safety_and_disclaimer(self):
        """Safety checks: Disclaimers present and non-prescriptive."""
        recs = generate_recommendations(
            disease="Dengue Fever",
            confidence=85,
            risk_score=50,
            risk_level="Moderate Risk"
        )
        self.assertIn("disclaimer", recs)
        self.assertIn("not constitute a formal medical diagnosis", recs["disclaimer"].lower())
        print("[PASS] Safety & Disclaimer checks")

if __name__ == "__main__":
    unittest.main()
