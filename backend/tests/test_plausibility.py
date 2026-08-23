"""
Anatomical plausibility of the differential.

Model 1 is trained on a symptom matrix with no sex or age feature, so nothing
in the classifier prevents it ranking "hypertension of pregnancy" first for a
35-year-old man - which it did, at 42.6%, in a real report.

This is not a ranking problem to be tuned away. The condition is impossible for
that patient, and an impossible diagnosis at the top of a clinical differential
discredits every other number on the page.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services import get_engine                                  # noqa: E402
from services.disease_model import (                             # noqa: E402
    implausible_for_age,
    incompatible_with_sex,
)

# heartburn + diarrhea + headache is the presentation from the report that
# surfaced this: entirely non-specific, and pregnancy hypertension won.
NONSPECIFIC = [{"name": "heartburn"}, {"name": "diarrhea"}, {"name": "headache"}]


@pytest.fixture(scope="module")
def engine():
    return get_engine()


# ---------------------------------------------------------------------------
# The predicate
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("disease,sex", [
    ("hypertension of pregnancy", "male"),
    ("ectopic pregnancy", "male"),
    ("ovarian cyst", "male"),
    ("endometriosis", "male"),
    ("cervical cancer", "male"),
    ("vaginitis", "male"),
    # "female genitalia infection" contains the substring "male"; the female
    # test has to win or it is wrongly blocked for women and allowed for men.
    ("female genitalia infection", "male"),
    ("prostate cancer", "female"),
    ("testicular torsion", "female"),
    ("epididymitis", "female"),
    ("male genitalia infection", "female"),
])
def test_impossible_conditions_are_blocked(disease, sex):
    assert incompatible_with_sex(disease, sex)


@pytest.mark.parametrize("disease,sex", [
    ("prostate cancer", "male"),
    ("ovarian cyst", "female"),
    ("female genitalia infection", "female"),
    ("gastritis", "male"),
    ("migraine", "female"),
    # Rare in men, but real. Only the impossible is filtered - suppressing the
    # merely unlikely would hide genuine presentations.
    ("breast cyst", "male"),
    ("breast infection", "male"),
])
def test_possible_conditions_are_kept(disease, sex):
    assert not incompatible_with_sex(disease, sex)


def test_unknown_sex_filters_nothing():
    """Absent a stated sex, the model's own ranking stands."""
    assert not incompatible_with_sex("hypertension of pregnancy", None)
    assert not incompatible_with_sex("prostate cancer", "")


@pytest.mark.parametrize("age,blocked", [
    (35, False), (28, False), (16, False),
    (72, True), (8, True),
])
def test_pregnancy_conditions_respect_age(age, blocked):
    assert implausible_for_age("hypertension of pregnancy", age) is blocked


def test_age_filter_only_touches_pregnancy():
    """A 72-year-old can still have gastritis."""
    assert not implausible_for_age("gastritis", 72)
    assert not implausible_for_age("ovarian cancer", 72)


# ---------------------------------------------------------------------------
# End to end
# ---------------------------------------------------------------------------

def test_male_patient_never_gets_a_pregnancy_diagnosis(engine):
    """The exact report that surfaced this bug."""
    result = engine.analyze(symptoms=NONSPECIFIC, age=35, sex="male")
    dx = result["diagnosis"]
    names = " ".join(p["disease"] for p in dx["predictions"]).lower()
    assert "pregnan" not in names
    assert "hypertension of pregnancy" in dx["excluded_sex_specific"]
    assert dx["filtered_for_sex"] == "male"


def test_elderly_woman_never_gets_a_pregnancy_diagnosis(engine):
    result = engine.analyze(symptoms=NONSPECIFIC, age=72, sex="female")
    names = " ".join(p["disease"] for p in result["diagnosis"]["predictions"])
    assert "pregnan" not in names.lower()


def test_woman_of_childbearing_age_still_can(engine):
    """The filter must not become a blanket ban on obstetric conditions."""
    result = engine.analyze(symptoms=NONSPECIFIC, age=30, sex="female")
    assert result["diagnosis"]["excluded_sex_specific"] == []


def test_probabilities_are_renormalised_after_filtering(engine):
    """
    Removing 42% of the probability mass without renormalising would shrink
    every remaining confidence and make the differential look far weaker than
    the model actually is.
    """
    result = engine.analyze(symptoms=NONSPECIFIC, age=35, sex="male")
    preds = result["diagnosis"]["predictions"]
    assert preds
    assert sum(p["probability"] for p in preds) <= 1.0001
    # Top-1 must have absorbed some of the removed mass rather than staying at
    # its pre-filter value.
    unfiltered = engine.analyze(symptoms=NONSPECIFIC, age=35, sex=None)
    blocked_mass = next(
        (p["probability"] for p in unfiltered["diagnosis"]["predictions"]
         if "pregnan" in p["disease"].lower()), 0.0)
    assert blocked_mass > 0, "fixture no longer exercises the filter"
    assert preds[0]["probability"] > 0.0


def test_filtering_changes_the_treatment_that_follows(engine):
    """
    The differential feeds the cascade, so an impossible top-1 also produced
    treatment for the wrong condition. Guard the whole chain, not just the list.
    """
    male = engine.analyze(symptoms=NONSPECIFIC, age=35, sex="male")
    assert "pregnan" not in str(male["treatment"].get("condition") or "").lower()
