"""
Integration test for the full recommendation engine workflow.

Tests the complete flow from the engine.analyze() method through to
the recommendation output.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from services.engine import get_engine


def test_full_workflow():
    """Test the full analyze workflow with recommendation."""
    print("\n=== Full Integration Test ===\n")
    
    try:
        engine = get_engine()
        print("✓ Engine loaded successfully")
    except Exception as e:
        print(f"✗ Failed to load engine: {e}")
        return False
    
    # Test case: moderate symptoms with some health profile
    symptoms = [
        {"name": "headache", "severity": "moderate"},
        {"name": "fatigue", "severity": "high"},
        {"name": "fever", "severity": "low"}
    ]
    
    profile = {
        "bmi": 28.5,
        "sex": "female",
        "smoker_status": 0.0,
        "exercise": 1.0,
        "high_blood_pressure": 0.0,
        "high_cholesterol": 0.0,
        "general_health": 3,
        "physical_unwell_days": 5,
        "mental_unwell_days": 2,
        "sleep_hours": 7
    }
    
    try:
        result = engine.analyze(
            symptoms=symptoms,
            age=45,
            sex="female",
            profile=profile,
            top_k=5
        )
        print("✓ Analysis completed successfully")
    except Exception as e:
        print(f"✗ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Check that all expected sections are present
    required_sections = ["diagnosis", "risk", "severity", "treatment", "recommendation", "meta"]
    for section in required_sections:
        if section not in result:
            print(f"✗ Missing section: {section}")
            return False
    
    print("✓ All sections present")
    
    # Check recommendation structure
    recommendation = result["recommendation"]
    required_fields = [
        "primary_action",
        "urgency_timeline",
        "urgency_description",
        "recommended_specialist",
        "preventive_care_notes",
        "self_care_suggestions",
        "disclaimer",
        "metadata"
    ]
    
    for field in required_fields:
        if field not in recommendation:
            print(f"✗ Missing recommendation field: {field}")
            return False
    
    print("✓ Recommendation structure valid")
    
    # Display recommendation details
    print("\n--- Recommendation Output ---")
    print(f"Primary Action: {recommendation['primary_action']}")
    print(f"Urgency: {recommendation['urgency_timeline']}")
    print(f"Specialist: {recommendation['recommended_specialist']}")
    print(f"Preventive Care Notes: {len(recommendation['preventive_care_notes'])} items")
    print(f"Self-Care Suggestions: {len(recommendation['self_care_suggestions'])} items")
    
    if recommendation['preventive_care_notes']:
        print("\nPreventive Care:")
        for note in recommendation['preventive_care_notes']:
            print(f"  - {note['condition_label']} (risk: {note['risk_score']})")
            print(f"    Factors: {', '.join(note['contributing_factors'][:3])}")
    
    if recommendation['self_care_suggestions']:
        print("\nSelf-Care Suggestions:")
        for sugg in recommendation['self_care_suggestions'][:3]:
            print(f"  - {sugg['suggestion']}")
    
    # Check metadata
    metadata = recommendation['metadata']
    print(f"\nComponents Used:")
    for component, used in metadata['components_used'].items():
        status = "✓" if used else "○"
        print(f"  {status} {component}")
    
    print(f"\nSelection Reason: {metadata['specialist_selection_reason']}")
    
    # Verify the recommendation integrates with existing outputs
    severity_level = result['severity']['level']
    if metadata['severity_level'] != severity_level:
        print(f"✗ Severity mismatch: {metadata['severity_level']} vs {severity_level}")
        return False
    
    print("✓ Severity consistency verified")
    
    # Check schema version
    if "schema_version" in result:
        print(f"\nSchema Version: {result['schema_version']}")
    
    print("\n✓ Full integration test passed!")
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("MedAssist Recommendation Engine - Full Integration Test")
    print("=" * 60)
    
    success = test_full_workflow()
    
    print("\n" + "=" * 60)
    if success:
        print("SUCCESS: All integration tests passed")
    else:
        print("FAILURE: Integration test failed")
    print("=" * 60)
    
    sys.exit(0 if success else 1)
