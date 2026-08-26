"""
Mock integration test for recommendation engine.

Tests the integration without requiring actual model artifacts.
"""

import sys
from pathlib import Path
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).parent))


def test_engine_integration():
    """Test that the engine properly integrates the recommendation."""
    print("\n=== Mock Integration Test ===\n")
    
    # Mock the artifacts and models
    with patch('services.engine.get_artifacts'), \
         patch('services.engine.get_disease_model'), \
         patch('services.engine.get_risk_model'), \
         patch('services.engine.get_cascade'):
        
        from services.engine import MedAssistEngine
        
        engine = MedAssistEngine()
        
        # Mock the component methods
        engine.predict_diseases = Mock(return_value={
            "available": True,
            "predictions": [{
                "rank": 1,
                "disease": "migraine",
                "probability": 0.65,
                "reference": {
                    "doctor": "neurologist",
                    "symptoms": "headache, nausea",
                    "cures": "rest, over-the-counter pain relief"
                }
            }],
            "top_disease": "migraine",
            "confidence": {
                "raw": 0.65,
                "display": 0.65,
                "label": "Moderate"
            }
        })
        
        engine.assess_risk = Mock(return_value={
            "available": True,
            "conditions": {
                "heart_attack": {
                    "label": "Heart attack",
                    "risk_score": 35,
                    "band": "average",
                    "drivers": []
                }
            },
            "composite": {
                "score": 35
            }
        })
        
        # Patch compute_severity
        with patch('services.engine.compute_severity') as mock_severity:
            mock_severity.return_value = {
                "level": "MODERATE",
                "score": 0.32,
                "action": "Book an appointment within a few days",
                "critical_red_flags": [],
                "serious_red_flags": []
            }
            
            engine.recommend_treatment = Mock(return_value={
                "available": True,
                "drugs": [
                    {"drug": "Ibuprofen", "rank": 1},
                    {"drug": "Acetaminophen", "rank": 2}
                ],
                "reference": {
                    "doctor": "neurologist",
                    "cures": "rest, over-the-counter pain relief"
                }
            })
            
            # Call analyze
            result = engine.analyze(
                symptoms=["headache", "nausea"],
                age=35,
                sex="female"
            )
            
            print("✓ Analysis completed")
            
            # Verify structure
            assert "recommendation" in result, "Recommendation section missing"
            print("✓ Recommendation section present")
            
            recommendation = result["recommendation"]
            
            # Check all required fields
            required = [
                "primary_action", "urgency_timeline", "urgency_description",
                "recommended_specialist", "preventive_care_notes",
                "self_care_suggestions", "disclaimer", "metadata"
            ]
            
            for field in required:
                assert field in recommendation, f"Missing field: {field}"
            
            print("✓ All fields present")
            
            # Verify values make sense
            assert recommendation["urgency_timeline"] == "within a week"
            assert "neurologist" in recommendation["recommended_specialist"].lower()
            assert len(recommendation["self_care_suggestions"]) > 0  # Should have OTC suggestions
            assert len(recommendation["preventive_care_notes"]) == 0  # No elevated chronic risk
            
            print("✓ Field values correct")
            
            # Check metadata
            assert recommendation["metadata"]["severity_level"] == "MODERATE"
            assert recommendation["metadata"]["components_used"]["severity_engine"] == True
            assert recommendation["metadata"]["components_used"]["disease_prediction"] == True
            
            print("✓ Metadata correct")
            
            # Display output
            print("\n--- Output Sample ---")
            print(f"Action: {recommendation['primary_action']}")
            print(f"Urgency: {recommendation['urgency_timeline']}")
            print(f"Specialist: {recommendation['recommended_specialist']}")
            print(f"Self-care items: {len(recommendation['self_care_suggestions'])}")
            
            return True


def test_recommendation_in_response_schema():
    """Verify recommendation is properly positioned in response."""
    print("\n=== Response Schema Test ===\n")
    
    with patch('services.engine.get_artifacts'), \
         patch('services.engine.get_disease_model'), \
         patch('services.engine.get_risk_model'), \
         patch('services.engine.get_cascade'), \
         patch('services.engine.compute_severity'):
        
        from services.engine import MedAssistEngine
        
        engine = MedAssistEngine()
        
        # Mock minimal responses
        engine.predict_diseases = Mock(return_value={
            "available": True,
            "predictions": [],
            "top_disease": None,
            "confidence": {
                "raw": 0.0,
                "display": 0.0,
                "label": "Low"
            }
        })
        
        engine.assess_risk = Mock(return_value={
            "available": False,
            "conditions": {},
            "composite": None
        })
        
        from services.engine import compute_severity
        compute_severity.return_value = {
            "level": "MILD",
            "score": 0.1,
            "critical_red_flags": [],
            "serious_red_flags": []
        }
        
        engine.recommend_treatment = Mock(return_value={
            "available": False
        })
        
        result = engine.analyze(symptoms=["fatigue"])
        
        # Verify order of sections
        keys = list(result.keys())
        
        # Should have: schema_version, generated_at, input, diagnosis, risk, severity, treatment, recommendation, meta, disclaimer
        assert "recommendation" in keys, "Recommendation not in response"
        
        # Recommendation should come after treatment
        treatment_idx = keys.index("treatment")
        recommendation_idx = keys.index("recommendation")
        
        assert recommendation_idx > treatment_idx, "Recommendation should come after treatment"
        
        print("✓ Recommendation properly positioned in response")
        print(f"✓ Section order: {' → '.join([k for k in keys if k in ['diagnosis', 'risk', 'severity', 'treatment', 'recommendation']])}")
        
        return True


if __name__ == "__main__":
    print("=" * 60)
    print("Recommendation Engine - Mock Integration Tests")
    print("=" * 60)
    
    try:
        success1 = test_engine_integration()
        success2 = test_recommendation_in_response_schema()
        
        print("\n" + "=" * 60)
        if success1 and success2:
            print("✓ All mock integration tests passed!")
        else:
            print("✗ Some tests failed")
        print("=" * 60)
        
        sys.exit(0 if (success1 and success2) else 1)
        
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
