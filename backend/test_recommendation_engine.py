"""
Test script for the recommendation engine integration.

Validates that the recommendation engine correctly processes outputs from
all four model components and generates appropriate recommendations.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from services.recommendation_engine import generate_healthcare_recommendation


def test_emergency_case():
    """Test emergency severity case with cardiac red flags."""
    print("\n=== TEST 1: Emergency Case with Cardiac Red Flags ===")
    
    severity_result = {
        "level": "EMERGENCY",
        "score": 0.85,
        "action": "Seek emergency care now",
        "critical_red_flags": ["sharp chest pain"],
        "serious_red_flags": ["palpitations"],
        "escalation_override": "critical red flag reported: sharp chest pain"
    }
    
    disease_predictions = {
        "available": True,
        "predictions": [
            {
                "rank": 1,
                "disease": "coronary heart disease",
                "probability": 0.72,
                "reference": {
                    "doctor": "cardiologist",
                    "symptoms": "chest pain, shortness of breath",
                    "cures": "lifestyle changes, medication"
                }
            }
        ],
        "top_disease": "coronary heart disease"
    }
    
    chronic_risks = {
        "available": True,
        "conditions": {
            "heart_attack": {
                "label": "Heart attack",
                "risk_score": 78,
                "band": "elevated",
                "drivers": [
                    {"feature": "_BMI5", "label": "BMI", "auc_drop": 0.15, "patient_value": 32.5},
                    {"feature": "BPHIGH4", "label": "High blood pressure", "auc_drop": 0.12, "patient_value": 1.0}
                ]
            }
        }
    }
    
    treatment_options = {
        "available": True,
        "drugs": [
            {"drug": "Aspirin", "rank": 1},
            {"drug": "Nitroglycerin", "rank": 2}
        ],
        "reference": {
            "doctor": "cardiologist"
        }
    }
    
    recommendation = generate_healthcare_recommendation(
        severity_result, disease_predictions, chronic_risks, treatment_options
    )
    
    print(f"Primary Action: {recommendation['primary_action']}")
    print(f"Urgency: {recommendation['urgency_timeline']}")
    print(f"Specialist: {recommendation['recommended_specialist']}")
    print(f"Preventive Care Notes: {len(recommendation['preventive_care_notes'])} items")
    print(f"Self-Care: {len(recommendation['self_care_suggestions'])} items")
    print(f"Metadata - Components Used: {recommendation['metadata']['components_used']}")
    
    assert recommendation["urgency_timeline"] == "immediate"
    assert "cardiologist" in recommendation["recommended_specialist"].lower() or "emergency" in recommendation["recommended_specialist"].lower()
    assert len(recommendation["preventive_care_notes"]) > 0  # Should have heart attack prevention
    assert len(recommendation["self_care_suggestions"]) == 0  # No self-care for emergency
    print("✓ Emergency case test passed")


def test_mild_case():
    """Test mild severity case with self-care eligible."""
    print("\n=== TEST 2: Mild Case with Self-Care ===")
    
    severity_result = {
        "level": "MILD",
        "score": 0.15,
        "action": "Self-care; monitor and review if it worsens",
        "critical_red_flags": [],
        "serious_red_flags": []
    }
    
    disease_predictions = {
        "available": True,
        "predictions": [
            {
                "rank": 1,
                "disease": "common cold",
                "probability": 0.65,
                "reference": {
                    "doctor": "family doctor",
                    "symptoms": "runny nose, cough, fatigue",
                    "cures": "rest, fluids, over-the-counter medications"
                }
            }
        ],
        "top_disease": "common cold"
    }
    
    chronic_risks = {
        "available": True,
        "conditions": {
            "diabetes": {
                "label": "Diabetes",
                "risk_score": 45,
                "band": "average",
                "drivers": []
            }
        }
    }
    
    treatment_options = {
        "available": True,
        "drugs": [
            {"drug": "Acetaminophen", "rank": 1},
            {"drug": "Ibuprofen", "rank": 2}
        ],
        "reference": {
            "doctor": "family doctor",
            "cures": "rest, fluids, over-the-counter medications"
        }
    }
    
    recommendation = generate_healthcare_recommendation(
        severity_result, disease_predictions, chronic_risks, treatment_options
    )
    
    print(f"Primary Action: {recommendation['primary_action']}")
    print(f"Urgency: {recommendation['urgency_timeline']}")
    print(f"Specialist: {recommendation['recommended_specialist']}")
    print(f"Self-Care: {len(recommendation['self_care_suggestions'])} items")
    
    assert recommendation["urgency_timeline"] == "2-4 weeks"
    assert len(recommendation["self_care_suggestions"]) > 0  # Should have self-care suggestions
    # Preventive care is now present for EVERY assessment: with no chronic
    # risk flagged it comes from the predicted disease instead.
    notes = recommendation["preventive_care_notes"]
    assert len(notes) >= 1
    assert all(n["source"] == "disease_prediction" for n in notes), (
        "no profile was supplied, so no chronic-risk note should appear")
    print("✓ Mild case test passed")


def test_moderate_with_chronic_risk():
    """Test moderate case with elevated chronic risk."""
    print("\n=== TEST 3: Moderate Case with Chronic Risk ===")
    
    severity_result = {
        "level": "MODERATE",
        "score": 0.35,
        "action": "Book an appointment within a few days",
        "critical_red_flags": [],
        "serious_red_flags": []
    }
    
    disease_predictions = {
        "available": True,
        "predictions": [
            {
                "rank": 1,
                "disease": "type 2 diabetes",
                "probability": 0.58,
                "reference": {
                    "doctor": "endocrinologist",
                    "symptoms": "increased thirst, frequent urination"
                }
            }
        ],
        "top_disease": "type 2 diabetes"
    }
    
    chronic_risks = {
        "available": True,
        "conditions": {
            "diabetes": {
                "label": "Diabetes",
                "risk_score": 82,
                "band": "high",
                "drivers": [
                    {"feature": "_BMI5", "label": "BMI", "auc_drop": 0.18, "patient_value": 35.2},
                    {"feature": "EXERANY2", "label": "Exercise", "auc_drop": 0.10, "patient_value": 0.0},
                    {"feature": "_SMOKER3", "label": "Smoking status", "auc_drop": 0.08, "patient_value": 1.0}
                ]
            },
            "heart_attack": {
                "label": "Heart attack",
                "risk_score": 68,
                "band": "elevated",
                "drivers": [
                    {"feature": "_BMI5", "label": "BMI", "auc_drop": 0.15, "patient_value": 35.2}
                ]
            }
        }
    }
    
    treatment_options = {
        "available": True,
        "drugs": [],
        "reference": {
            "doctor": "endocrinologist"
        }
    }
    
    recommendation = generate_healthcare_recommendation(
        severity_result, disease_predictions, chronic_risks, treatment_options
    )
    
    print(f"Primary Action: {recommendation['primary_action']}")
    print(f"Urgency: {recommendation['urgency_timeline']}")
    print(f"Specialist: {recommendation['recommended_specialist']}")
    print(f"Preventive Care Notes: {len(recommendation['preventive_care_notes'])} items")
    
    assert recommendation["urgency_timeline"] == "within a week"
    assert len(recommendation["preventive_care_notes"]) >= 2  # Both diabetes and heart attack
    assert "endocrinologist" in recommendation["recommended_specialist"].lower() or "primary care" in recommendation["recommended_specialist"].lower()
    
    # Check that preventive care mentions actual risk factors
    for note in recommendation["preventive_care_notes"]:
        print(f"  - {note['condition_label']}: {note['message'][:100]}...")
        # Only chronic-risk notes quote the patient's own measurements.
        # Disease-directed notes carry a prevention focus and actions instead.
        if note["source"] == "chronic_risk_model":
            assert len(note["contributing_factors"]) > 0
        else:
            assert note["recommended_actions"]
    
    print("✓ Moderate case with chronic risk test passed")


def test_unavailable_components():
    """Test handling when some components are unavailable."""
    print("\n=== TEST 4: Unavailable Components ===")
    
    severity_result = {
        "level": "URGENT",
        "score": 0.62,
        "action": "Seek same-day medical attention",
        "critical_red_flags": [],
        "serious_red_flags": ["shortness of breath"]
    }
    
    disease_predictions = {
        "available": False,
        "reason": "No symptoms matched"
    }
    
    chronic_risks = {
        "available": False,
        "reason": "No health profile supplied"
    }
    
    treatment_options = {
        "available": False,
        "reason": "No disease predicted"
    }
    
    recommendation = generate_healthcare_recommendation(
        severity_result, disease_predictions, chronic_risks, treatment_options
    )
    
    print(f"Primary Action: {recommendation['primary_action']}")
    print(f"Urgency: {recommendation['urgency_timeline']}")
    print(f"Specialist: {recommendation['recommended_specialist']}")
    print(f"Components Used: {recommendation['metadata']['components_used']}")
    
    assert recommendation["urgency_timeline"] == "same-day"
    assert recommendation["recommended_specialist"] is not None
    assert len(recommendation["preventive_care_notes"]) == 0
    print("✓ Unavailable components test passed")


if __name__ == "__main__":
    print("Testing Recommendation Engine")
    print("=" * 60)
    
    try:
        test_emergency_case()
        test_mild_case()
        test_moderate_with_chronic_risk()
        test_unavailable_components()
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
