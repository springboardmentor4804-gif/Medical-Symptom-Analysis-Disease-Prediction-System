"""
Advisory Features tests.

The contract these guard is provenance and graceful degradation, not wording:

  * every emitted item names the upstream data point it came from, because an
    advisory that cannot be traced back to a computed output must not appear;
  * a missing input yields `available: false` plus a reason, never an
    exception and never a fabricated advisory;
  * the trend sub-feature refuses to make a claim below its configured
    minimum history, since two data points are not a pattern.

Phrasing lives in advisory_config.json and is deliberately NOT asserted here -
the config is meant to be tunable without breaking tests.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.advisory_engine import (                     # noqa: E402
    generate_advisory_features,
)

SUB_FEATURES = ("lifestyle_advisory", "screening_reminders", "symptom_trend",
                "condition_education", "behavioral_nudges")


def _risks(flagged=True, drivers=None):
    """Minimal chronic-risk payload in the shape risk_model.assess returns."""
    return {
        "available": True,
        "conditions": {
            "diabetes": {
                "label": "Diabetes",
                "risk_score": 86,
                "percentile": 86,
                "band": "high",
                "flagged": flagged,
                "drivers": drivers if drivers is not None else [
                    {"feature": "_BMI5", "label": "Body mass index",
                     "importance": 0.041, "patient_value": 33.5},
                    {"feature": "_SMOKER3", "label": "Smoking status",
                     "importance": 0.008, "patient_value": 1.0},
                ],
            }
        },
    }


def _predictions(disease="acne"):
    return {
        "available": True,
        "predictions": [{
            "rank": 1, "disease": disease, "confidence_pct": 40.0,
            "matched_symptoms": ["skin lesion"],
            "typical_symptoms": ["skin lesion", "acne", "skin growth"],
        }],
    }


# ---------------------------------------------------------------------------
# Shape and graceful degradation
# ---------------------------------------------------------------------------

def test_every_sub_feature_is_always_present():
    """The block is uniform: callers branch on `available`, never on presence."""
    result = generate_advisory_features(None, None, None, None)
    for key in SUB_FEATURES:
        assert key in result, f"{key} missing from advisory block"
        assert result[key]["available"] is False
        assert result[key]["reason"], f"{key} must explain why it is empty"


def test_no_inputs_does_not_raise_and_reports_unavailable():
    result = generate_advisory_features(None, None, None, None)
    assert result["available"] is False
    assert result["disclaimer"]


def test_history_below_minimum_is_omitted_not_errored():
    """Two sessions is not a pattern - the sub-section must say so."""
    history = [{"symptoms": ["cough"], "top_disease": "flu",
                "severity_level": "MILD"}] * 2
    result = generate_advisory_features({"age": 40, "sex": "female"},
                                        None, None, history)
    trend = result["symptom_trend"]
    assert trend["available"] is False
    assert trend["items"] == []
    assert "at least" in trend["reason"]


def test_malformed_history_rows_are_survived():
    """One bad row must not cost the whole advisory block."""
    history = [None, {}, {"symptoms": None},
               {"symptoms": ["x"]}, {"symptoms": ["x"]}, {"symptoms": ["x"]}]
    result = generate_advisory_features({"age": 40, "sex": "female"},
                                        None, None, history)
    assert result["symptom_trend"]["available"] is True


# ---------------------------------------------------------------------------
# Provenance - the rule that matters most
# ---------------------------------------------------------------------------

def test_every_item_carries_a_source():
    result = generate_advisory_features(
        {"age": 52, "sex": "male"}, _risks(), _predictions(),
        [{"symptoms": ["cough"], "top_disease": "flu",
          "severity_level": "MILD"}] * 4)
    for key in SUB_FEATURES:
        for item in result[key].get("items") or []:
            assert item.get("source"), f"{key} item has no source: {item}"


def test_lifestyle_items_name_the_flagged_conditions_they_drive():
    result = generate_advisory_features({"age": 52, "sex": "male"},
                                        _risks(), None, None)
    items = result["lifestyle_advisory"]["items"]
    assert items
    for item in items:
        assert item["drives"], "must name which flagged conditions it drives"
        assert item["feature"], "must name the model feature it came from"


def test_unflagged_conditions_do_not_generate_advisories():
    """Drivers of a condition the model did not flag are not findings."""
    result = generate_advisory_features({"age": 52, "sex": "male"},
                                        _risks(flagged=False), None, None)
    assert result["lifestyle_advisory"]["available"] is False
    assert result["behavioral_nudges"]["available"] is False


def test_drivers_with_no_recorded_value_are_skipped():
    """A missing answer is not a risk factor - see _format_driver."""
    risks = _risks(drivers=[
        {"feature": "BPHIGH4", "label": "Told high blood pressure",
         "importance": 0.03, "patient_value": None},
    ])
    result = generate_advisory_features({"age": 52, "sex": "male"},
                                        risks, None, None)
    assert result["lifestyle_advisory"]["available"] is False


# ---------------------------------------------------------------------------
# Screening reminders
# ---------------------------------------------------------------------------

def test_screening_requires_age():
    result = generate_advisory_features({"sex": "female"}, None, None, None)
    assert result["screening_reminders"]["available"] is False
    assert "age" in result["screening_reminders"]["reason"].lower()


def test_sex_specific_reminders_are_withheld_when_sex_is_unknown():
    """Guessing is worse than omitting for sex-specific screening."""
    result = generate_advisory_features({"age": 50}, None, None, None)
    keys = {i["key"] for i in result["screening_reminders"]["items"]}
    assert "cervical" not in keys
    assert "breast" not in keys


def test_risk_gated_reminders_need_the_named_condition_flagged():
    """The diabetes reminder only appears when diabetes is actually flagged."""
    without = generate_advisory_features({"age": 50, "sex": "male"},
                                         None, None, None)
    assert "diabetes" not in {i["key"] for i in
                              without["screening_reminders"]["items"]}

    with_risk = generate_advisory_features({"age": 50, "sex": "male"},
                                           _risks(), None, None)
    diabetes = [i for i in with_risk["screening_reminders"]["items"]
                if i["key"] == "diabetes"]
    assert diabetes, "flagged diabetes should surface its screening reminder"
    assert diabetes[0]["triggered_by_risk"] == ["diabetes"]


@pytest.mark.parametrize("age,expected", [(20, False), (50, True)])
def test_age_gating(age, expected):
    result = generate_advisory_features({"age": age, "sex": "male"},
                                        None, None, None)
    keys = {i["key"] for i in result["screening_reminders"]["items"]}
    assert ("colorectal" in keys) is expected


# ---------------------------------------------------------------------------
# Trend detection
# ---------------------------------------------------------------------------

def test_recurring_symptom_is_detected_across_sessions():
    history = [
        {"symptoms": ["chest pain", "cough"], "top_disease": "a",
         "severity_level": "MILD"},
        {"symptoms": ["chest pain"], "top_disease": "b",
         "severity_level": "MILD"},
        {"symptoms": ["chest pain", "fatigue"], "top_disease": "c",
         "severity_level": "MILD"},
        {"symptoms": ["headache"], "top_disease": "d", "severity_level": "MILD"},
    ]
    result = generate_advisory_features({"age": 40, "sex": "male"},
                                        None, None, history)
    recurring = [i for i in result["symptom_trend"]["items"]
                 if i["type"] == "recurring_symptom"]
    assert recurring
    assert recurring[0]["subject"] == "chest pain"
    assert recurring[0]["count"] == 3
    # The symptom must be named in the text, not left as "this symptom".
    assert "chest pain" in recurring[0]["advisory"]


def test_a_symptom_repeated_within_one_session_counts_once():
    history = [{"symptoms": ["cough", "cough", "cough"], "top_disease": "a",
                "severity_level": "MILD"}] * 3
    result = generate_advisory_features({"age": 40, "sex": "male"},
                                        None, None, history)
    recurring = [i for i in result["symptom_trend"]["items"]
                 if i["type"] == "recurring_symptom"]
    assert recurring[0]["count"] == 3, "3 sessions, not 9 mentions"


def test_rising_severity_is_surfaced():
    """History is newest-first, so this is MILD -> MODERATE -> URGENT."""
    history = [
        {"symptoms": ["x"], "top_disease": "a", "severity_level": "URGENT"},
        {"symptoms": ["y"], "top_disease": "b", "severity_level": "MODERATE"},
        {"symptoms": ["z"], "top_disease": "c", "severity_level": "MILD"},
    ]
    result = generate_advisory_features({"age": 40, "sex": "male"},
                                        None, None, history)
    assert any(i["type"] == "severity_trend"
               for i in result["symptom_trend"]["items"])


def test_falling_severity_is_not_reported_as_rising():
    history = [
        {"symptoms": ["x"], "top_disease": "a", "severity_level": "MILD"},
        {"symptoms": ["y"], "top_disease": "b", "severity_level": "MODERATE"},
        {"symptoms": ["z"], "top_disease": "c", "severity_level": "URGENT"},
    ]
    result = generate_advisory_features({"age": 40, "sex": "male"},
                                        None, None, history)
    assert not any(i["type"] == "severity_trend"
                   for i in result["symptom_trend"]["items"])


# ---------------------------------------------------------------------------
# Condition education
# ---------------------------------------------------------------------------

def test_education_is_educational_not_prescriptive():
    """
    The lookup's `cures` field is real treatment data. Presented here it must
    describe what care generally involves, never instruct the patient.
    """
    # Must be a condition whose lookup entry actually HOLDS `cures`, since
    # that is the field whose framing this test is about. Conditions without
    # it take the symptom-profile fallback and never render the care wording.
    result = generate_advisory_features(
        None, None, _predictions("ulcerative colitis"), None)
    education = result["condition_education"]
    assert education["available"] is True

    care = [i for i in education["items"] if i["field"] == "cures"]
    assert care, "ulcerative colitis holds a cures field in disease_lookup"
    text = care[0]["text"].lower()
    assert "typically involves" in text
    assert "not a treatment instruction" in text
    assert education["closing_note"]


def test_education_falls_back_to_the_model_symptom_profile():
    """
    Only 159 of 684 conditions have a disease_lookup entry, so the fallback
    is what keeps this sub-feature available for the rest.
    """
    result = generate_advisory_features(
        None, None, _predictions("xyzzy nonexistent condition"), None)
    education = result["condition_education"]
    assert education["available"] is True
    assert any(i["source"] == "disease_model:symptom_evidence"
               for i in education["items"])


def test_no_prediction_means_no_education():
    result = generate_advisory_features(None, None,
                                        {"available": False}, None)
    assert result["condition_education"]["available"] is False


# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------

def test_metadata_records_which_components_were_used():
    result = generate_advisory_features({"age": 52, "sex": "male"}, _risks(),
                                        _predictions(), None)
    used = result["metadata"]["components_used"]
    assert used["chronic_risk_model"] is True
    assert used["disease_prediction"] is True
    assert used["assessment_history"] is False
    assert result["metadata"]["history_sessions"] == 0
    assert "lifestyle_advisory" in result["metadata"]["sections_available"]
