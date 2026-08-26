"""
Advisory Features module.

A separate layer from the Healthcare Recommendation Workflow, and the
distinction is the whole point of the file:

    Preventive Care        "what should I do about THIS elevated risk score,
                           now"  - reactive, tied to one assessment.
    Advisory Features      "what should I generally know or watch for about my
                           health over time" - standing guidance, and the only
                           place that can see ACROSS assessments.

Five sub-features, each traceable to a named upstream data point:

    lifestyle_advisory     chronic-risk model feature importances
    screening_reminders    age + sex + which conditions the risk model flagged
    symptom_trend          the user's stored assessment history
    condition_education    disease_lookup fields already in the system
    behavioral_nudges      the same top risk drivers, as standing actions

Like severity_engine.py and recommendation_engine.py this is NOT a model. It
is deterministic rule logic, and every threshold and phrase lives in
advisory_config.json so it stays auditable and tunable without code changes.

Nothing here invents general health advice. If the upstream data point is
absent the item is omitted - an empty sub-section is a correct answer, and
`available: false` plus a reason is how it says so.
"""

from __future__ import annotations

import logging
from collections import Counter
from typing import Dict, List, Optional

from .artifacts import get_artifacts

logger = logging.getLogger(__name__)


def _cfg() -> Dict:
    """Advisory configuration, loaded from artifacts like the other engines."""
    return get_artifacts().advisory_config


def _unavailable(reason: str) -> Dict:
    """
    Uniform empty shape.

    Every sub-feature returns the same envelope whether or not it fired, so
    the UI and the report never have to branch on presence - they branch on
    `available`, and always have a reason to show.
    """
    return {"available": False, "reason": reason, "items": []}


def _driver_map(chronic_risks: Optional[Dict]) -> Dict[str, Dict]:
    """
    Collapse the per-condition drivers into one feature -> driver mapping.

    The risk model reports drivers separately for each of its ten conditions
    and the same feature usually drives several. Advisory items are about the
    FACTOR, not about one condition, so the highest-importance appearance of
    each feature wins, and the conditions it drives are kept for provenance.
    """
    out: Dict[str, Dict] = {}
    if not chronic_risks or not chronic_risks.get("available"):
        return out

    for condition, data in (chronic_risks.get("conditions") or {}).items():
        # Only conditions the model itself flagged - see the per-condition
        # threshold discussion in recommendation_engine.
        if not data.get("flagged"):
            continue
        for driver in (data.get("drivers") or []):
            feature = driver.get("feature")
            value = driver.get("patient_value")
            if not feature or value is None:
                continue
            importance = float(driver.get("importance") or 0.0)
            existing = out.get(feature)
            if existing is None:
                out[feature] = {
                    "feature": feature,
                    "label": driver.get("label", feature),
                    "value": value,
                    "importance": importance,
                    "conditions": [data.get("label", condition)],
                }
            else:
                existing["conditions"].append(data.get("label", condition))
                if importance > existing["importance"]:
                    existing["importance"] = importance
    return out


def _triggered(spec: Dict, value) -> bool:
    """
    Does this patient's value cross the config's trigger for this factor?

    Directions are explicit in the config rather than inferred, because the
    risk model's encodings run in both directions - GENHLTH 5 is worse than 1,
    but _SMOKER3 1 is worse than 4.
    """
    try:
        v = float(value)
    except (TypeError, ValueError):
        return False

    direction = spec.get("direction")
    trigger = spec.get("trigger_value")
    if trigger is None:
        return False
    trigger = float(trigger)

    if direction == "above":
        return v > trigger
    if direction == "at_or_above":
        return v >= trigger
    if direction == "below":
        return v < trigger
    if direction == "at_or_below":
        return v <= trigger
    if direction == "equals":
        return v == trigger
    return False


# ---------------------------------------------------------------------------
# 1. Lifestyle advisory
# ---------------------------------------------------------------------------

def _lifestyle_advisory(chronic_risks: Optional[Dict]) -> Dict:
    """
    Standing behavioural guidance for the specific factors driving this
    patient's elevated risk - not a generic lifestyle checklist.
    """
    drivers = _driver_map(chronic_risks)
    if not drivers:
        return _unavailable(
            "No lifestyle advisory yet: this needs a completed lifestyle "
            "profile and at least one condition flagged by the risk model.")

    cfg = _cfg().get("lifestyle_advisory", {})
    factors = cfg.get("factors", {})
    min_importance = float(cfg.get("min_importance", 0.0))

    items: List[Dict] = []
    for feature, driver in sorted(drivers.items(),
                                  key=lambda kv: -kv[1]["importance"]):
        spec = factors.get(feature)
        if not spec or driver["importance"] < min_importance:
            continue
        if not _triggered(spec, driver["value"]):
            continue
        items.append({
            "factor": spec.get("label", driver["label"]),
            "feature": feature,
            "advisory": spec.get("advisory", ""),
            "standing_guidance": spec.get("standing_guidance", ""),
            "patient_value": driver["value"],
            "importance": round(driver["importance"], 5),
            # Which flagged conditions this factor is actually driving - the
            # audit trail back to the model output.
            "drives": sorted(set(driver["conditions"])),
            "source": "chronic_risk_model:feature_importance",
        })

    if not items:
        return _unavailable(
            "No lifestyle advisory applies: none of the modifiable factors "
            "in the configuration crossed their trigger for this profile.")
    return {"available": True, "reason": None, "items": items}


# ---------------------------------------------------------------------------
# 2. Preventive screening reminders
# ---------------------------------------------------------------------------

def _screening_reminders(user_profile: Optional[Dict],
                         chronic_risks: Optional[Dict]) -> Dict:
    """
    Age- and risk-profile-based standing screening suggestions, deliberately
    independent of the current symptom assessment.
    """
    profile = user_profile or {}
    age = profile.get("age")
    sex = str(profile.get("sex") or profile.get("gender") or "").lower() or None

    if age is None:
        return _unavailable("No screening reminders: age is required to "
                            "select age-based screening guidance.")
    try:
        age = int(age)
    except (TypeError, ValueError):
        return _unavailable("No screening reminders: age could not be read.")

    # Which conditions the risk model actually flagged. Reminders that name a
    # required risk factor stay silent unless one of theirs is in this set.
    flagged = {
        key for key, data in ((chronic_risks or {}).get("conditions") or {}).items()
        if data.get("flagged")
    }

    items: List[Dict] = []
    for rule in _cfg().get("screening_reminders", {}).get("reminders", []):
        if age < int(rule.get("min_age", 0)):
            continue
        if rule.get("max_age") is not None and age > int(rule["max_age"]):
            continue
        if rule.get("sex") and sex and rule["sex"].lower() != sex:
            continue
        # A sex-specific reminder with no recorded sex is withheld rather than
        # guessed - offering cervical screening to an unknown sex is worse
        # than offering nothing.
        if rule.get("sex") and not sex:
            continue

        required = rule.get("requires_risk_factor") or []
        matched = sorted(set(required) & flagged)
        if required and not matched:
            continue

        items.append({
            "key": rule.get("key"),
            "advisory": rule.get("advisory", ""),
            # Age window, so the UI can place this on a timeline against the
            # patient's own age instead of only printing the sentence.
            "from_age": int(rule.get("min_age", 0)),
            "to_age": (int(rule["max_age"]) if rule.get("max_age") is not None
                       else None),
            "patient_age": age,
            "applies_because": (
                f"age {age}"
                + (f", {sex}" if rule.get("sex") else "")
                + (f", risk flagged for: {', '.join(matched)}" if matched else "")
            ),
            "triggered_by_risk": matched,
            "source": ("chronic_risk_model:flagged" if matched
                       else "user_profile:age_sex"),
        })

    if not items:
        return _unavailable("No screening reminders apply to this age and "
                            "risk profile.")
    return {"available": True, "reason": None, "items": items}


# ---------------------------------------------------------------------------
# 3. Symptom trend advisory
# ---------------------------------------------------------------------------

def _symptom_trend(historical_assessments: Optional[List[Dict]]) -> Dict:
    """
    Cross-session patterns - the one thing a single assessment cannot see.

    `historical_assessments` is a list of prior records, newest first, each
    shaped {symptoms: [...], top_disease: str|None, severity_level: str|None}.
    Below `min_sessions` of history the section reports itself unavailable
    rather than making a trend claim from one or two data points.
    """
    cfg = _cfg().get("symptom_trend", {})
    min_sessions = int(cfg.get("min_sessions", 3))

    history = [h for h in (historical_assessments or []) if h]
    if len(history) < min_sessions:
        return _unavailable(
            f"Symptom trends need at least {min_sessions} previous "
            f"assessments; {len(history)} on record so far.")

    window = history[:int(cfg.get("lookback_sessions", 6))]
    total = len(window)

    items: List[Dict] = []

    # -- recurring symptoms -------------------------------------------------
    counts: Counter = Counter()
    for record in window:
        # A symptom reported twice in one session is still one session.
        for symptom in {s for s in (record.get("symptoms") or []) if s}:
            counts[symptom] += 1

    threshold = int(cfg.get("recurring_symptom_min_count", 3))
    template = cfg.get("escalation_advisory", "")
    for symptom, count in counts.most_common():
        if count < threshold:
            continue
        items.append({
            "type": "recurring_symptom",
            "subject": symptom,
            "count": count,
            "of_sessions": total,
            "advisory": template.format(symptom=symptom, count=count,
                                       total=total),
            "source": "assessment_history:symptoms",
        })

    # -- recurring top prediction -------------------------------------------
    disease_counts = Counter(
        r["top_disease"] for r in window if r.get("top_disease"))
    d_threshold = int(cfg.get("recurring_disease_min_count", 2))
    d_template = cfg.get("recurring_disease_advisory", "")
    for disease, count in disease_counts.most_common():
        if count < d_threshold:
            continue
        items.append({
            "type": "recurring_prediction",
            "subject": str(disease).title(),
            "count": count,
            "of_sessions": total,
            "advisory": d_template.format(disease=str(disease).title(),
                                          count=count, total=total),
            "source": "assessment_history:top_disease",
        })

    # -- severity direction -------------------------------------------------
    # `window` is newest-first, so reversing gives chronological order.
    ranks = {"MILD": 1, "MODERATE": 2, "URGENT": 3, "EMERGENCY": 4}
    series = [ranks.get(r.get("severity_level")) for r in reversed(window)]
    series = [x for x in series if x]
    if len(series) >= min_sessions and series[-1] > series[0]:
        rising = all(b >= a for a, b in zip(series, series[1:]))
        if rising:
            labels = [r.get("severity_level") for r in reversed(window)
                      if r.get("severity_level")]
            items.append({
                "type": "severity_trend",
                "subject": "Triage severity",
                "count": len(series),
                "of_sessions": total,
                "advisory": cfg.get("severity_trend_advisory", "").format(
                    trend=" → ".join(labels)),
                "source": "assessment_history:severity_level",
            })

    if not items:
        return _unavailable(
            f"No recurring pattern found across your last {total} "
            f"assessments.")
    return {"available": True, "reason": None, "items": items,
            "sessions_examined": total}


# ---------------------------------------------------------------------------
# 4. Condition education snippets
# ---------------------------------------------------------------------------

def _condition_education(disease_predictions: Optional[Dict]) -> Dict:
    """
    Educational reframing of the disease_lookup entry for the top prediction.

    Explicitly NOT prescriptive: the lookup's `cures` field is presented as
    what care for the condition typically involves, in general terms. The
    difference between "care typically involves X" and "take X" is the whole
    reason this lives in an education section and not in the treatment panel.
    """
    preds = (disease_predictions or {}).get("predictions") or []
    if not (disease_predictions or {}).get("available") or not preds:
        return _unavailable("No condition education: no disease was predicted.")

    disease = preds[0].get("disease")
    if not disease:
        return _unavailable("No condition education: prediction carried no "
                            "condition name.")

    cfg = _cfg().get("condition_education", {})
    label = str(disease).title()
    snippets: List[Dict] = []

    lookup = get_artifacts().disease_lookup or {}
    info = lookup.get(disease) or lookup.get(str(disease).lower())
    if not isinstance(info, dict):
        info = {}

    # Only 159 of the 684 predictable conditions have a disease_lookup entry,
    # so relying on it alone left education unavailable for most predictions.
    # The disease model's own typical-symptom profile is present for every
    # condition it can predict, and describing that profile is a legitimate
    # educational statement traceable to a real model output.
    #
    # The test is "does the entry hold anything EDUCATIONAL", not "does an
    # entry exist" - many entries carry only demographic columns (acne holds
    # gender/blood_pressure and nothing else), which would otherwise suppress
    # the fallback and leave the section empty for no good reason.
    educational_fields = ("symptoms", "cures", "doctor", "risk_level")
    if not any(info.get(f) for f in educational_fields):
        top = preds[0]
        typical = top.get("typical_symptoms") or []
        matched = top.get("matched_symptoms") or []
        template = cfg.get("typical_profile_template")
        if typical and template:
            snippets.append({
                "field": "typical_symptoms",
                "text": template.format(
                    symptoms=", ".join(str(s) for s in typical[:8]),
                    matched=len(matched)),
                "matched_count": len(matched),
                "typical_count": len(typical),
                "source": "disease_model:symptom_evidence",
            })

    def _add(field: str, template_key: str, **fmt):
        template = cfg.get(template_key)
        if template:
            snippets.append({
                "field": field,
                "text": template.format(**fmt),
                "source": f"disease_lookup:{field}",
            })

    if info.get("symptoms"):
        _add("symptoms", "symptom_template", symptoms=info["symptoms"])
    if info.get("cures"):
        _add("cures", "typical_care_template", cures=info["cures"])
    if info.get("doctor"):
        _add("doctor", "specialist_template",
             doctor=str(info["doctor"]).strip())
    if info.get("risk_level"):
        _add("risk_level", "risk_template", risk_level=info["risk_level"])

    if not snippets:
        return _unavailable(
            f"The lookup entry for {label} holds no educational fields.")

    return {
        "available": True,
        "reason": None,
        "condition": disease,
        "condition_label": label,
        "heading": (cfg.get("intro_template") or "About {condition}").format(
            condition=label),
        "items": snippets,
        "closing_note": cfg.get("closing_note", ""),
    }


# ---------------------------------------------------------------------------
# 5. Risk-factor behavioural nudges
# ---------------------------------------------------------------------------

def _behavioral_nudges(chronic_risks: Optional[Dict]) -> Dict:
    """
    Standing nudges for the specific top risk-driving factors the model
    computed - never a generic checklist of healthy habits.
    """
    drivers = _driver_map(chronic_risks)
    if not drivers:
        return _unavailable(
            "No behavioural nudges yet: these are tied to the risk model's "
            "own top factors, which need a completed lifestyle profile.")

    cfg = _cfg().get("behavioral_nudges", {})
    specs = cfg.get("nudges", {})
    max_nudges = int(cfg.get("max_nudges", 4))

    items: List[Dict] = []
    for feature, driver in sorted(drivers.items(),
                                  key=lambda kv: -kv[1]["importance"]):
        spec = specs.get(feature)
        if not spec:
            continue
        try:
            value = float(driver["value"])
        except (TypeError, ValueError):
            continue

        fires = False
        if "trigger_values" in spec:
            fires = value in [float(v) for v in spec["trigger_values"]]
        elif "trigger_above" in spec:
            fires = value > float(spec["trigger_above"])
        if not fires:
            continue

        items.append({
            "title": spec.get("title", driver["label"]),
            "nudge": spec.get("nudge", ""),
            "factor": driver["label"],
            "feature": feature,
            "patient_value": driver["value"],
            "drives": sorted(set(driver["conditions"])),
            "source": "chronic_risk_model:top_drivers",
        })
        if len(items) >= max_nudges:
            break

    if not items:
        return _unavailable("No behavioural nudges apply: no modifiable "
                            "factor with a configured nudge is driving this "
                            "profile's risk.")
    return {"available": True, "reason": None, "items": items}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def generate_advisory_features(user_profile: Optional[Dict],
                               chronic_risks: Optional[Dict],
                               disease_predictions: Optional[Dict],
                               historical_assessments: Optional[List[Dict]] = None
                               ) -> Dict:
    """
    Build the Advisory Features block.

    Args:
        user_profile:           lifestyle/demographic input (needs age, sex)
        chronic_risks:          risk model output, for drivers and flags
        disease_predictions:    diagnosis output, for the education snippet
        historical_assessments: prior records, newest first, each shaped
                                {symptoms, top_disease, severity_level}.
                                Optional - omit for a first-time user.

    Every sub-feature degrades to {"available": false, "reason": ...} rather
    than raising, so a partial payload still returns a complete block.
    """
    sections = {
        "lifestyle_advisory": lambda: _lifestyle_advisory(chronic_risks),
        "screening_reminders": lambda: _screening_reminders(user_profile,
                                                            chronic_risks),
        "symptom_trend": lambda: _symptom_trend(historical_assessments),
        "condition_education": lambda: _condition_education(disease_predictions),
        "behavioral_nudges": lambda: _behavioral_nudges(chronic_risks),
    }

    out: Dict = {}
    for name, build in sections.items():
        try:
            out[name] = build()
        except Exception as e:                                   # noqa: BLE001
            # One malformed sub-feature must not cost the whole advisory
            # block, and silently dropping it would hide the failure.
            logger.exception("Advisory sub-feature %s failed", name)
            out[name] = _unavailable(
                f"This advisory could not be generated ({type(e).__name__}).")

    out["available"] = any(s.get("available") for s in out.values()
                           if isinstance(s, dict))
    out["disclaimer"] = _cfg().get("disclaimer", "")
    out["metadata"] = {
        "sections_available": sorted(
            name for name, s in out.items()
            if isinstance(s, dict) and s.get("available")),
        "history_supplied": bool(historical_assessments),
        "history_sessions": len(historical_assessments or []),
        "components_used": {
            "chronic_risk_model": bool((chronic_risks or {}).get("available")),
            "disease_prediction": bool((disease_predictions or {}).get("available")),
            "assessment_history": bool(historical_assessments),
            "user_profile": bool(user_profile),
        },
    }
    return out
