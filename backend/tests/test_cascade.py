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

@pytest.mark.parametrize("query", ["pneumonia", "heart failure", "atrial fibrillation"])
def test_in_domain_queries_route_to_mimic(cascade, query):
    """
    Hospital-domain diagnoses with a real prescribing pattern clear the gates.

    "sepsis" was in this list while Layer A still fell back to stage 2's modal
    drug per class. It has only six heterogeneous neighbours in the corpus and
    no drug shared by even min_support of them, so it now correctly returns no
    pattern - see test_sepsis_has_no_prescribing_pattern.
    """
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

@pytest.mark.parametrize("query", ["pneumonia", "acne", "xyzzy nonsense"])
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
    mimic = cascade.recommend("pneumonia")["evidence"]["caveat"]
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


# ---------------------------------------------------------------------------
# Regressions: Layer A used to answer everything with ward-routine drugs
# ---------------------------------------------------------------------------

def test_sepsis_has_no_prescribing_pattern(cascade):
    """
    Honest emptiness beats a confident generic answer.

    Sepsis has six neighbours in the corpus, all with different underlying
    causes, and no drug appears in min_support of them. The drug-review corpus
    has no sepsis condition either - nobody reviews sepsis medication. Both
    layers therefore have nothing to say, and saying so is the correct output.
    """
    if not cascade.layer_a_enabled:
        pytest.skip("Layer A artifacts absent")
    result = cascade.recommend("sepsis")
    assert result["drugs"] == []
    assert result["layer"] == "none"


@pytest.mark.parametrize("query,banned", [
    ("migraine", {"docusate sodium", "aspirin"}),
    ("depression", {"ciprofloxacin", "docusate sodium"}),
    ("anxiety", {"metronidazole", "docusate sodium"}),
])
def test_no_ward_routine_drugs_for_outpatient_conditions(cascade, query, banned):
    """
    The regression this whole layer was rebuilt for.

    Stage 1's prior clears cat_threshold for all 13 drug classes, so taking it
    at face value named one drug per class and returned inpatient routine -
    docusate for migraine, ciprofloxacin for depression. Classes are now
    filtered by lift over that prior.
    """
    result = cascade.recommend(query)
    names = {d["drug"].lower() for d in result["drugs"]}
    assert not (names & banned), (
        f"{query!r} returned ward-routine drugs {names & banned} "
        f"from layer {result['layer']!r}")
    assert result["drugs"], f"{query!r} should still get an answer from Layer B"


def test_nonspecific_match_is_rejected(cascade):
    """
    "acute bronchiolitis" matched "acute cholecystitis" at 0.39 similarity on
    the word "acute" alone, cleared every gate and recommended metformin.
    """
    if not cascade.layer_a_enabled:
        pytest.skip("Layer A artifacts absent")
    result = cascade.recommend("acute bronchiolitis")
    assert result["layer"] != "mimic"
    assert "metformin" not in {d["drug"].lower() for d in result["drugs"]}


def test_substring_collision_links_are_dropped(cascade):
    """
    The artifact maps 27 unrelated diseases onto the two-letter fragment "ge",
    whose only drug is an antihypertensive. Those links must not be used.
    """
    link = get_artifacts().disease_condition_link
    assert "ge" not in link.values()
    assert "min" not in link.values()
    # ...while genuine short links from the same matcher survive.
    assert link.get("flu") == "influenza"
    assert link.get("allergy") == "allergies"


def test_dropped_links_are_reported(cascade):
    """A silent repair is a repair nobody fixes upstream."""
    dropped = get_artifacts().disease_link_dropped
    assert dropped, "expected the known substring collisions to be reported"
    assert any("ge" in v for v in dropped.values())


@pytest.mark.parametrize("disease,wrong_condition", [
    # Every one of these was an accepted match under linear coverage scoring,
    # and every one would have prescribed for a different disease.
    ("interstitial lung", "interstitial cystitis"),       # lung -> bladder drugs
    ("amyotrophic lateral sclerosis", "multiple sclerosis"),
    ("acute respiratory distress syndrome", "acute coronary syndrome"),
    ("acute bronchospasm", "gout acute"),
    ("abscess of the lung", "dental abscess"),
    ("arthritis of the hip", "rheumatoid arthritis"),
    ("alcohol abuse", "alcohol withdrawal"),
    ("asperger syndrome", "tourette s syndrome"),
])
def test_half_word_overlap_is_not_a_condition_match(disease, wrong_condition):
    """
    Sharing one word out of two is usually a DIFFERENT disease, not a partial
    match. Linear coverage scored all of these at exactly 0.45 - the floor -
    and served the wrong drug list. Coverage is squared for that reason.
    """
    assert _match_score(disease, wrong_condition) < CONDITION_MATCH_FLOOR


@pytest.mark.parametrize("query,condition", [
    ("diabetes", "diabetes type 2"),      # narrowed, same disease
    ("herpes", "herpes simplex"),
])
def test_a_query_that_prefixes_a_condition_still_matches(query, condition):
    """The extra words specialise the condition; they do not relocate it."""
    assert _match_score(query, condition) >= CONDITION_MATCH_FLOOR


def test_interstitial_lung_returns_nothing_rather_than_bladder_drugs(cascade):
    """End-to-end guard on the worst observed failure."""
    result = cascade.recommend("interstitial lung", disease="interstitial lung")
    names = {d["drug"].lower() for d in result["drugs"]}
    assert not (names & {"elmiron", "pentosan polysulfate sodium",
                         "phenazopyridine"})


# ---------------------------------------------------------------------------
# Walking the differential
# ---------------------------------------------------------------------------

def test_treatment_falls_through_to_lower_ranked_conditions():
    """
    Only 219 of 684 diseases link to the drug-review corpus, so asking about
    the top prediction alone left the panel empty ~70% of the time even when a
    lower-ranked condition in the same differential had treatments.
    """
    from services import get_engine
    engine = get_engine()

    differential = [
        {"rank": 1, "disease": "xyzzy nonexistent condition"},
        {"rank": 2, "disease": "acne"},
    ]
    result = engine.recommend_treatment("xyzzy nonexistent condition",
                                        differential=differential)
    assert result["drugs"], "should have fallen through to acne"
    assert result["for_disease"] == "acne"
    assert result["for_rank"] == 2
    assert result["is_alternate"] is True
    assert "acne" in result["alternate_note"].lower()


def test_top_ranked_hit_is_not_flagged_as_alternate():
    from services import get_engine
    result = get_engine().recommend_treatment(
        "acne", differential=[{"rank": 1, "disease": "acne"}])
    assert result["drugs"]
    assert result["is_alternate"] is False
    assert result["for_rank"] == 1


def test_empty_differential_still_reports_against_the_top_condition():
    """When nothing in the differential has data, say so about rank 1."""
    from services import get_engine
    differential = [{"rank": 1, "disease": "xyzzy one"},
                    {"rank": 2, "disease": "xyzzy two"}]
    result = get_engine().recommend_treatment("xyzzy one",
                                              differential=differential)
    assert result["drugs"] == []
    assert result["layer"] == "none"
    assert result["for_disease"] == "xyzzy one"
    assert len(result["searched_conditions"]) == 2


def test_lfs_pointer_files_are_reported_clearly(tmp_path):
    """
    A clone made without git-lfs leaves 130-byte text stubs where the models
    should be. Unguarded, joblib fails with "KeyError: 118", which reads like a
    corrupt download rather than a missing tool.
    """
    from services.artifacts import Artifacts, ArtifactsUnavailable

    stub = tmp_path / "model1_classifier.joblib"
    stub.write_bytes(
        b"version https://git-lfs.github.com/spec/v1\n"
        b"oid sha256:0000000000000000000000000000000000000000000000000000000000000000\n"
        b"size 116802\n")

    with pytest.raises(ArtifactsUnavailable) as exc:
        Artifacts(tmp_path).path("model1_classifier.joblib")
    message = str(exc.value)
    assert "Git LFS pointer" in message
    assert "git lfs pull" in message
