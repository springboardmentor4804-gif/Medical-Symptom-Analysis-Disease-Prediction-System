"""
Severity / triage scoring.

Rule-weighted rather than learned, deliberately: none of the training datasets
carry labelled triage outcomes, so a learned severity model would be fitting
noise and presenting it with unearned authority. The weights, red-flag lists,
vital ranges and escalation overrides all live in model/artifacts/
severity_config.json, so a clinician can retune them without touching code and
the UI can explain every point of the score.

This replaces the previous severity_engine.py + unified_risk_engine.py, which
between them held ~1000 lines of hand-tuned logic with no held-out validation
and two disagreeing notions of "risk".

ONE DELIBERATE EXTENSION over the config file: MedAssist collects a per-symptom
intensity (low / moderate / high) that the training-time function did not have.
Rather than add a component and invalidate the config's weights, intensity
scales the existing symptom_burden term, and a serious red flag reported at
high intensity counts double toward escalation. Both behaviours are reported
in the output so they are never silent.
"""

from __future__ import annotations

from typing import Dict, Iterable, List, Optional

from .artifacts import get_artifacts

# Per-symptom intensity -> burden contribution. "moderate" is 0.75 so a form
# left at its default lands close to the unweighted behaviour the config was
# calibrated against.
INTENSITY_WEIGHT = {"low": 0.5, "moderate": 0.75, "high": 1.0}

# Denominator for symptom burden: 6+ weighted symptoms saturates the term.
BURDEN_SATURATION = 6.0


# ---------------------------------------------------------------------------
# Red-flag vocabulary bridge
# ---------------------------------------------------------------------------
# severity_config.json lists red flags in triage phrasing ("chest pain",
# "sudden weakness"). The disease model's 377-symptom vocabulary is anatomical
# ("sharp chest pain", "focal weakness"). Only ONE of the 20 critical flags -
# "vomiting blood" - matches verbatim, so on the raw config a patient reporting
# severe chest pain scored MODERATE / "book an appointment within a few days".
#
# These tables map the config's clinical intent onto the vocabulary the picker
# actually offers. Curated rather than substring-matched on purpose: blind
# containment would make "elbow weakness" a stroke flag (it contains
# "weakness") while still missing "sharp chest pain" (which does not contain
# "chest pain" as the config spells it).
#
# Anything the config lists that DOES match free-text input still applies - the
# resolved sets are the union of both.

# Any single one of these escalates straight to EMERGENCY.
CRITICAL_VOCAB = {
    "sharp chest pain",        # acute coronary syndrome until proven otherwise
    "burning chest pain",
    "chest tightness",
    "vomiting blood",          # upper GI bleed
    "seizures",
    "focal weakness",          # one-sided - stroke pattern
    "throat swelling",         # airway compromise
    "throat feels tight",
}

# Two or more escalate to EMERGENCY; one contributes weight.
SERIOUS_VOCAB = {
    # respiratory
    "shortness of breath", "difficulty breathing", "breathing fast",
    "abnormal breathing sounds", "hurts to breath", "wheezing",
    # cardiac
    "palpitations", "irregular heartbeat", "increased heart rate",
    "decreased heart rate",
    # neuro / perfusion
    "fainting", "dizziness", "diminished vision", "double vision",
    "spots or clouds in vision", "neck stiffness or tightness",
    # bleeding
    "blood in stool", "blood in urine", "rectal bleeding",
    "bleeding from eye", "bleeding from ear",
    "vaginal bleeding after menopause",
    # allergic / angioedema
    "allergic reaction", "lip swelling",
}

# Common symptoms that are only a red flag when the PATIENT rates them severe.
# This is the one place self-reported intensity changes the flag set rather
# than just the score. Fever and headache are far too common to flag by
# default - doing so would bury the real emergencies in noise - but "the worst
# headache of my life" is exactly the presentation the config meant to catch.
INTENSITY_GATED_SERIOUS = {
    "fever", "headache", "frontal headache",
    "sharp abdominal pain", "upper abdominal pain",
}


def _cfg():
    return get_artifacts().severity_config


def _resolved_flag_sets():
    """(critical, serious, intensity_gated) - config lists plus the bridge."""
    cfg = _cfg()
    critical = set(cfg.get("critical_red_flags", [])) | CRITICAL_VOCAB
    serious = (set(cfg.get("serious_red_flags", [])) | SERIOUS_VOCAB) - critical
    gated = INTENSITY_GATED_SERIOUS - critical - serious
    return critical, serious, gated


def _levels():
    """[(min_score, level, action)] sorted high to low."""
    rows = _cfg()["levels"]
    return sorted(
        ((float(r["min_score"]), r["level"], r["action"]) for r in rows),
        key=lambda t: -t[0],
    )


def _age_vulnerability(age: Optional[int]):
    if age is None:
        return 0.3, "age not provided"
    if age < 1:
        return 1.0, "infant (<1y)"
    if age < 5:
        return 0.9, "young child (<5y)"
    if age >= 80:
        return 1.0, "very elderly (80+)"
    if age >= 65:
        return 0.8, "elderly (65+)"
    if age >= 50:
        return 0.45, "middle-aged (50-64)"
    return 0.2, "low-risk age band"


def _vitals(vitals: Optional[Dict]):
    ranges = _cfg().get("vital_ranges", {})
    worst, breaches = 0.0, []
    for key, val in (vitals or {}).items():
        spec = ranges.get(key)
        if val is None or spec is None:
            continue
        lo, hi, unit = spec["low"], spec["high"], spec.get("unit", "")
        if val < lo or val > hi:
            span = max(hi - lo, 1e-6)
            dev = (lo - val) / span if val < lo else (val - hi) / span
            sev = min(float(dev), 1.0)
            worst = max(worst, sev)
            breaches.append({
                "vital": key, "value": val, "unit": unit,
                "normal_range": [lo, hi],
                "direction": "low" if val < lo else "high",
                "deviation": round(sev, 3),
            })
    return worst, breaches


def compute_severity(
    symptoms: Iterable,
    age: Optional[int] = None,
    diagnosis_confidence: float = 0.0,
    chronic_risk: float = 0.0,
    vitals: Optional[Dict] = None,
) -> Dict:
    """
    Score a case 0-1 and bucket it MILD / MODERATE / URGENT / EMERGENCY.

    `symptoms` accepts either plain strings or {"name", "severity"} dicts. The
    return value carries the full component breakdown so the UI can show why a
    case scored the way it did rather than a bare number.
    """
    cfg = _cfg()
    weights = cfg["weights"]
    critical_set, serious_set, gated_set = _resolved_flag_sets()

    # -- normalise input ---------------------------------------------------
    intensity: Dict[str, str] = {}
    for s in symptoms or []:
        if isinstance(s, dict):
            name = str(s.get("name", "")).lower().strip()
            level = str(s.get("severity", "moderate")).lower().strip()
        else:
            name, level = str(s).lower().strip(), "moderate"
        if name:
            intensity[name] = level if level in INTENSITY_WEIGHT else "moderate"

    names = set(intensity)
    critical = sorted(names & critical_set)
    # A gated symptom joins the serious list only when rated severe.
    gated_hits = sorted(n for n in names & gated_set if intensity[n] == "high")
    serious = sorted((names & serious_set) | set(gated_hits))

    # Escalation weight per serious flag:
    #   genuine serious flag           1.0   (2.0 when rated severe)
    #   intensity-gated common symptom 0.5
    # The config escalates at a total of 2.0. Gating at 0.5 means two severe
    # but common symptoms (severe fever + severe headache) raise the score
    # without firing a blanket "go to the emergency room now", while a real
    # pair (fainting + palpitations) still does. Under-triage is the costlier
    # error, but an over-triaging tool gets ignored, which is also under-triage.
    escalating_flags = [s for s in serious
                        if s not in gated_hits and intensity.get(s) == "high"]
    serious_weighted = 0.0
    for s in serious:
        if s in gated_hits:
            serious_weighted += 0.5
        else:
            serious_weighted += 2.0 if intensity.get(s) == "high" else 1.0

    # -- components --------------------------------------------------------
    weighted_burden = sum(INTENSITY_WEIGHT[intensity[n]] for n in names)
    burden = min(weighted_burden / BURDEN_SATURATION, 1.0)
    age_v, age_note = _age_vulnerability(age)
    vital_worst, breaches = _vitals(vitals)

    parts = {
        "symptom_burden": burden,
        "age_vulnerability": age_v,
        "diagnosis_confidence": float(min(max(diagnosis_confidence, 0.0), 1.0)),
        "chronic_risk": float(min(max(chronic_risk, 0.0), 1.0)),
        "red_flags": 1.0 if critical else min(serious_weighted * 0.5, 1.0),
        "vitals": vital_worst,
    }
    contributions = {k: round(weights.get(k, 0.0) * v, 4) for k, v in parts.items()}
    score = sum(contributions.values())

    # -- escalation overrides ---------------------------------------------
    # A single critical flag must never be averaged away by low scores
    # elsewhere. These mirror severity_config.json["overrides"].
    override = None
    level = action = None
    if critical:
        level, action = "EMERGENCY", "Seek emergency care now"
        override = f"critical red flag reported: {critical[0]}"
    elif serious_weighted >= 2:
        real = [s for s in serious if s not in gated_hits]
        bits = []
        if escalating_flags:
            bits.append(f"{len(escalating_flags)} rated severe "
                        f"({', '.join(escalating_flags)})")
        elif real:
            bits.append(", ".join(real))
        if gated_hits:
            bits.append(f"plus severe {', '.join(gated_hits)}")
        level, action = "EMERGENCY", "Seek emergency care now"
        override = "serious red flags: " + "; ".join(bits)
    elif vital_worst >= 0.75:
        level, action = "EMERGENCY", "Seek emergency care now"
        override = "vital sign critically out of range"
    else:
        for threshold, lvl, act in _levels():
            if score >= threshold:
                level, action = lvl, act
                break

    return {
        "score": round(float(score), 4),
        "level": level,
        "action": action,
        "escalation_override": override,
        "components": {
            k: {
                "raw": round(v, 4),
                "weight": weights.get(k, 0.0),
                "contribution": contributions[k],
                "label": _COMPONENT_LABELS.get(k, k),
            }
            for k, v in parts.items()
        },
        "critical_red_flags": critical,
        "serious_red_flags": serious,
        "high_intensity_red_flags": escalating_flags,
        "severity_gated_flags": gated_hits,
        "abnormal_vitals": breaches,
        "age_band": age_note,
        "weighted_symptom_burden": round(weighted_burden, 2),
    }


_COMPONENT_LABELS = {
    "symptom_burden": "Number and intensity of symptoms",
    "age_vulnerability": "Age-related vulnerability",
    "diagnosis_confidence": "Confidence in the predicted condition",
    "chronic_risk": "Underlying chronic risk",
    "red_flags": "Red-flag symptoms",
    "vitals": "Vital signs outside normal range",
}

# Legacy triage vocabulary. The database's Assessment.risk_flag column and the
# provider triage queue both filter on these exact strings, so the new severity
# levels are mapped rather than replacing them at the persistence layer.
LEVEL_TO_FLAG = {
    "EMERGENCY": "HIGH PRIORITY",
    "URGENT": "HIGH PRIORITY",
    "MODERATE": "REVIEW",
    "MILD": "LOW",
}


def severity_to_flag(level: str) -> str:
    return LEVEL_TO_FLAG.get(str(level).upper(), "REVIEW")


def red_flag_vocabulary() -> Dict[str, List[str]]:
    """
    Resolved red-flag lists for the frontend, so the picker can pin them to
    the top and warn as they are selected. Returns the bridged sets, not the
    raw config, so what the UI highlights is exactly what escalates.
    """
    critical, serious, gated = _resolved_flag_sets()
    return {
        "critical": sorted(critical),
        "serious": sorted(serious),
        "severity_gated": sorted(gated),
    }
