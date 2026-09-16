import pytest
from app.triage_service import evaluate_triage, CRITICAL_RED_FLAGS, SERIOUS_RED_FLAGS


def test_triage_emergency_critical_red_flag():
    """Verify that critical red flags immediately trigger EMERGENCY triage."""
    result = evaluate_triage(symptoms=["chest_pain", "mild_fever"])
    assert result["triage_level"] == "EMERGENCY"
    assert result["priority_rank"] == 1
    assert result["color_code"] == "#EF4444"
    assert len(result["critical_red_flags"]) >= 1
    assert "chest_pain" in [rf["symptom"] for rf in result["critical_red_flags"]]
    assert result["recommended_specialist"] == "Cardiologist"


def test_triage_emergency_severe_breathlessness():
    """Verify that breathing difficulty triggers emergency triage and Pulmonologist referral."""
    result = evaluate_triage(symptoms=["difficulty_breathing", "cough"])
    assert result["triage_level"] == "EMERGENCY"
    assert result["recommended_specialist"] == "Pulmonologist"


def test_triage_urgent_multiple_serious_flags():
    """Verify that multiple serious flags trigger URGENT triage."""
    result = evaluate_triage(symptoms=["high_fever", "dizziness", "swollen_legs"])
    assert result["triage_level"] == "URGENT"
    assert result["priority_rank"] == 2
    assert result["color_code"] == "#F59E0B"
    assert len(result["serious_red_flags"]) >= 2


def test_triage_urgent_high_risk_score():
    """Verify that high risk score (>=70%) escalates to URGENT."""
    result = evaluate_triage(
        symptoms=["cough", "fatigue"],
        risk_score_percentage=75.0
    )
    assert result["triage_level"] == "URGENT"


def test_triage_moderate():
    """Verify that moderate symptom count without red flags triggers MODERATE triage."""
    result = evaluate_triage(symptoms=["skin_rash", "itching", "skin_peeling", "nodal_skin_eruptions"])
    assert result["triage_level"] == "MODERATE"
    assert result["priority_rank"] == 3
    assert result["recommended_specialist"] == "Dermatologist"


def test_triage_mild():
    """Verify that mild isolated symptoms trigger MILD triage."""
    result = evaluate_triage(symptoms=["mild_fever"])
    assert result["triage_level"] == "MILD"
    assert result["priority_rank"] == 4
    assert result["color_code"] == "#10B981"
