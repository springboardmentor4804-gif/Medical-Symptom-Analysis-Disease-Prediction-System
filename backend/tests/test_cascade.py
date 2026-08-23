"""
Treatment cascade routing tests.

These are the guard rail on the two-layer gate. The cascade is allowed to be
wrong about WHICH drug it suggests - it is not allowed to be wrong about WHICH
SOURCE it is speaking from, because the two layers carry incompatible caveats.

If `acne` starts routing to the mimic layer, the gate has gone too loose. Fix
that by retuning in the training notebook and re-exporting
model3_mimic_layer.joblib - NOT by editing thresholds in application code. The
gate lives in the artifact precisely so this test measures the notebook.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services import get_cascade, get_artifacts             # noqa: E402
from services.treatment_cascade import (                    # noqa: E402
    CONDITION_MATCH_FLOOR,
    _match_score,
)


@pytest.fixture(scope="module")
def cascade():
    return get_cascade()


# ---------------------------------------------------------------------------
# Routing - the contract from the integration spec
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("query", ["sepsis", "pneumonia"])
def test_in_domain_queries_route_to_mimic(cascade, query):
    """Hospital-domain diagnoses should clear all three gates."""
    if not cascade.layer_a_enabled:
        pytest.skip("Layer A artifacts absent; cascade is Layer B only")
    result = cascade.recommend(query)
    assert result["layer"] == "mimic", (
        f"{query!r} routed to {result['layer']} "
        f"(gate_reason={result['gate_reason']}). Layer A should cover this.")
    assert result["gate_reason"] == "passed"
    assert result["drugs"]


@pytest.mark.parametrize("query", ["acne", "birth control"])
def test_out_of_domain_queries_route_to_drug_reviews(cascade, query):
    """
    Outpatient conditions must NOT come back as hospital prescriptions.

    A failure here means the similarity gate is too loose. Retune it in the
    notebook; do not adjust thresholds in application code.
    """
    result = cascade.recommend(query)
    assert result["layer"] == "drug_reviews", (
        f"{query!r} routed to {result['layer']!r}. If this is 'mimic', the "
        f"gate is too loose - retune sim_floor/min_support in the training "
        f"notebook and re-export model3_mimic_layer.joblib.")
    assert result["drugs"]
    assert result["condition"] is not None


@pytest.mark.parametrize("query", ["xyzzy nonsense", "asdfgh qwerty zxcvb"])
def test_nonsense_returns_empty_panel(cascade, query):
    """An empty drug list is the correct answer, not a bug."""
    result = cascade.recommend(query)
    assert result["layer"] == "none"
    assert result["gate_reason"] == "no_condition_match"
    assert result["drugs"] == []
    assert result["evidence"]["best_condition_match_score"] < CONDITION_MATCH_FLOOR


# ---------------------------------------------------------------------------
# Response contract
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("query", ["sepsis", "acne", "xyzzy nonsense"])
def test_every_response_carries_the_required_fields(cascade, query):
    result = cascade.recommend(query)
    for field in ("layer", "gate_reason", "drugs", "evidence"):
        assert field in result, f"{field} missing for {query!r}"
    assert result["layer"] in ("mimic", "drug_reviews", "none")
    assert isinstance(result["drugs"], list)
    assert result["evidence"].get("caveat"), "every layer needs its own caveat"


def test_layers_carry_different_caveats(cascade):
    """The whole point of the cascade: the sources must not read alike."""
    if not cascade.layer_a_enabled:
        pytest.skip("Layer A artifacts absent")
    mimic = cascade.recommend("sepsis")["evidence"]["caveat"]
    reviews = cascade.recommend("acne")["evidence"]["caveat"]
    assert mimic != reviews
    assert "co-occurrence" in mimic
    assert "satisfaction" in reviews


def test_mimic_responses_expose_support_and_similarity(cascade):
    if not cascade.layer_a_enabled:
        pytest.skip("Layer A artifacts absent")
    ev = cascade.recommend("pneumonia")["evidence"]
    assert ev["supporting_notes"] >= ev["thresholds"]["min_support"]
    assert ev["best_similarity"] >= ev["thresholds"]["sim_floor"]


# ---------------------------------------------------------------------------
# Gate configuration
# ---------------------------------------------------------------------------

def test_gate_is_read_from_the_artifact_not_hardcoded(cascade):
    """
    The thresholds must come out of model3_mimic_layer.joblib.

    This asserts the wiring, not the values: whatever the notebook tuned is
    what the cascade must enforce.
    """
    if not cascade.layer_a_enabled:
        pytest.skip("Layer A artifacts absent")
    artifact_gate = get_artifacts().mimic_layer["gate"]
    live = cascade.status()["gate"]
    for key in ("sim_floor", "min_support", "cat_threshold"):
        assert live[key] == artifact_gate[key]


def test_disease_link_is_preferred_over_fuzzy_matching(cascade):
    """A supplied disease resolves through the audited link table first."""
    link = get_artifacts().disease_condition_link
    disease = next(d for d, c in link.items()
                   if c in get_artifacts().treatment_table)
    result = cascade.recommend(disease, disease=disease)
    if result["layer"] == "drug_reviews":
        assert result["evidence"]["match_method"] == "disease_link"
        assert result["evidence"]["match_score"] == 1.0


def test_layer_b_only_when_layer_a_absent(monkeypatch, cascade):
    """Missing Layer A degrades to Layer B rather than crashing."""
    monkeypatch.setattr(type(cascade), "layer_a_enabled",
                        property(lambda self: False))
    result = cascade.recommend("acne")
    assert result["layer"] == "drug_reviews"
    assert result["gate_reason"] == "layer_a_unavailable"
    assert result["drugs"]


# ---------------------------------------------------------------------------
# Condition matching
# ---------------------------------------------------------------------------

def test_match_score_rejects_character_level_coincidence():
    """
    The regression this scorer exists for.

    A plain difflib ratio scores these two strings at ~0.5 on shared letters
    alone, which clears the 0.45 floor and served incontinence drugs for a
    nonsense query.
    """
    assert _match_score("xyzzy nonsense", "urinary incontinence") < CONDITION_MATCH_FLOOR


def test_match_score_finds_condition_inside_longer_text():
    assert _match_score("severe cystic acne on the face", "acne") >= CONDITION_MATCH_FLOOR


def test_match_score_tolerates_a_typo():
    assert _match_score("diabetis", "diabetes") >= CONDITION_MATCH_FLOOR
