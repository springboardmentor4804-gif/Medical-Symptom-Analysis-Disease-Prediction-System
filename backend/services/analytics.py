"""
Healthcare analytics aggregation.

ONE aggregation layer, two role-scoped views. The patient dashboard and the
provider dashboard call the same `build_analytics()` over the same stored
assessments; the only differences are the SCOPE the rows are filtered to and
which sections each frontend chooses to render. Nothing is computed twice and
no metric has two implementations that could drift apart.

    resolve_scope()    decides WHICH rows a caller may see, and is the
                       security boundary - it raises rather than silently
                       widening. Every endpoint goes through it.
    build_analytics()  computes every metric over whatever rows the scope
                       allows, with no knowledge of who asked.

No new models. This reads the outputs already stored on each Assessment row -
predictions, chronic risk, severity, symptoms, timestamps - and aggregates
them. A stored row that cannot be parsed is skipped and counted in
`meta.unreadable_records` rather than failing the request, because one bad
row from an older schema must not take out the whole dashboard.

Scoping convention follows the one already established by /all-assessments:
there is no provider->patient panel table in this schema, so clinical staff
see the full patient population. `AnalyticsScope.kind` records which rule was
applied, so the response always states its own scope.
"""

from __future__ import annotations

import json
import logging
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from database import Assessment, User
from roles import CLINICAL_STAFF_ROLES
# Vital normal ranges live in severity_config.json. Read from the artifact
# rather than restated here, so the chart's shaded band and the severity
# engine's abnormal-vital detection can never disagree.
from .artifacts import get_artifacts

logger = logging.getLogger(__name__)

# Triage vocabulary, ordered. Used for escalation counting and to keep chart
# categories stable even when a level has no assessments in the window.
SEVERITY_LEVELS = ("MILD", "MODERATE", "URGENT", "EMERGENCY")
ESCALATED_LEVELS = ("URGENT", "EMERGENCY")

# Risk bands as the risk model emits them.
RISK_BANDS = ("low", "moderate", "average", "elevated", "high")

# Age buckets, kept identical to main.py's AGE_BUCKETS so the demographic
# chart does not change shape when the legacy endpoint is served from here.
AGE_BUCKETS = [(0, 18), (19, 35), (36, 50), (51, 65), (66, 200)]
AGE_BUCKET_LABELS = ["0-18", "19-35", "36-50", "51-65", "66+"]


def age_bucket_label(age: int) -> str:
    for (low, high), label in zip(AGE_BUCKETS, AGE_BUCKET_LABELS):
        if low <= age <= high:
            return label
    return AGE_BUCKET_LABELS[-1]


@dataclass
class AnalyticsScope:
    """
    Which assessment rows a caller is permitted to aggregate over.

    `user_ids is None` means "every patient" and is only ever produced by
    resolve_scope() for a clinical role. A patient scope always carries
    exactly one id.
    """
    kind: str                                    # "patient" | "panel"
    label: str
    user_ids: Optional[List[int]] = None
    requested_by_role: Optional[str] = None
    subject_user_id: Optional[int] = None
    subject_email: Optional[str] = None

    def describe(self) -> Dict:
        return {
            "kind": self.kind,
            "label": self.label,
            "patient_count": (len(self.user_ids)
                              if self.user_ids is not None else None),
            "subject_user_id": self.subject_user_id,
            "subject_email": self.subject_email,
            "requested_by_role": self.requested_by_role,
        }


# ---------------------------------------------------------------------------
# Scope resolution - the security boundary
# ---------------------------------------------------------------------------

def resolve_scope(db: Session, current_user: User,
                  patient_id: Optional[int] = None) -> AnalyticsScope:
    """
    Decide what this caller may see, server-side.

    Frontend route hiding is not access control: a patient who calls the
    provider endpoint directly must be refused here. The rules are:

      * no patient_id, clinical role   -> the whole patient population
      * no patient_id, any other role  -> that user's own rows only
      * patient_id == own id           -> allowed for anyone
      * patient_id != own id           -> clinical roles only (drill-down)

    A patient asking for another patient_id gets 403, not an empty result -
    an empty result would leak that the id exists.
    """
    is_clinical = current_user.role in CLINICAL_STAFF_ROLES

    # Drill-down, or a patient asking about themselves explicitly.
    if patient_id is not None:
        if patient_id != current_user.id and not is_clinical:
            logger.warning(
                "Blocked cross-patient analytics: user_id=%s role=%s "
                "requested patient_id=%s", current_user.id,
                current_user.role, patient_id)
            raise HTTPException(
                status_code=403,
                detail="You may only view your own analytics.")

        subject = db.query(User).filter(User.id == patient_id).first()
        if subject is None:
            raise HTTPException(status_code=404, detail="Patient not found")

        return AnalyticsScope(
            kind="patient",
            label=("Your analytics" if patient_id == current_user.id
                   else f"Patient: {subject.email}"),
            user_ids=[patient_id],
            requested_by_role=current_user.role,
            subject_user_id=patient_id,
            subject_email=subject.email,
        )

    # Panel / system-wide. Only clinical staff reach this branch; everyone
    # else is narrowed to themselves rather than refused, so that a patient
    # hitting the shared endpoint still gets their own dashboard.
    if is_clinical:
        ids = [row[0] for row in
               db.query(Assessment.user_id).distinct().all()]
        return AnalyticsScope(
            kind="panel",
            label="All patients",
            user_ids=ids,
            requested_by_role=current_user.role,
        )

    return AnalyticsScope(
        kind="patient",
        label="Your analytics",
        user_ids=[current_user.id],
        requested_by_role=current_user.role,
        subject_user_id=current_user.id,
        subject_email=current_user.email,
    )


# ---------------------------------------------------------------------------
# Row loading
# ---------------------------------------------------------------------------

@dataclass
class _Row:
    """One parsed assessment, reduced to the fields analytics needs."""
    user_id: int
    created_at: Optional[datetime]
    top_disease: Optional[str] = None
    top_confidence: Optional[float] = None
    severity_level: Optional[str] = None
    severity_score: Optional[float] = None
    composite_risk: Optional[float] = None
    risk_band: Optional[str] = None
    symptoms: List[str] = field(default_factory=list)
    flagged_conditions: List[str] = field(default_factory=list)
    assessment_id: Optional[int] = None
    # Demographics and the legacy triage flag, so panel demographic charts
    # and the pre-existing /analytics contract are served from this same row
    # set rather than from a second pass over the table.
    gender: Optional[str] = None
    age: Optional[int] = None
    risk_flag: Optional[str] = None
    all_diseases: List[str] = field(default_factory=list)
    # Per-condition chronic risk, so the risk trend can draw one line per
    # condition rather than only the composite.
    condition_scores: Dict[str, float] = field(default_factory=dict)
    condition_labels: Dict[str, str] = field(default_factory=dict)
    vitals: Dict[str, float] = field(default_factory=dict)


def _load_rows(db: Session, scope: AnalyticsScope):
    """
    Fetch and parse the assessments this scope permits.

    Returns (rows, unreadable). The scope filter is applied in SQL, not after
    loading, so an over-broad scope cannot leak rows through a later bug.
    """
    query = db.query(Assessment)
    if scope.user_ids is not None:
        if not scope.user_ids:
            return [], 0
        query = query.filter(Assessment.user_id.in_(scope.user_ids))

    rows: List[_Row] = []
    unreadable = 0

    for record in query.order_by(Assessment.created_at.asc()).all():
        try:
            result = json.loads(record.result_json or "{}")
            stored_input = json.loads(record.input_json or "{}")
        except (ValueError, TypeError):
            unreadable += 1
            continue

        try:
            diagnosis = result.get("diagnosis") or {}
            predictions = diagnosis.get("predictions") or []
            severity = result.get("severity") or {}
            risk = result.get("risk") or {}
            composite = risk.get("composite") or {}
            conditions = risk.get("conditions") or {}

            symptoms = [s.get("name") if isinstance(s, dict) else s
                        for s in (stored_input.get("symptoms") or [])]

            rows.append(_Row(
                user_id=record.user_id,
                created_at=record.created_at,
                assessment_id=record.id,
                top_disease=(predictions[0].get("disease")
                             if predictions else None),
                top_confidence=(predictions[0].get("confidence_pct")
                                if predictions else None),
                severity_level=severity.get("level"),
                severity_score=severity.get("score"),
                composite_risk=composite.get("score"),
                risk_band=composite.get("band"),
                symptoms=[s for s in symptoms if s],
                gender=stored_input.get("gender"),
                age=(stored_input.get("age")
                     if isinstance(stored_input.get("age"), int) else None),
                risk_flag=record.risk_flag,
                # Every rank in the differential, not just the top one. The
                # two are genuinely different metrics and both are reported.
                all_diseases=[p.get("disease") for p in predictions
                              if p.get("disease")],
                condition_scores={
                    key: data["risk_score"]
                    for key, data in conditions.items()
                    if isinstance(data, dict) and data.get("risk_score") is not None
                },
                condition_labels={
                    key: data.get("label", key)
                    for key, data in conditions.items()
                    if isinstance(data, dict)
                },
                vitals={k: v for k, v in (stored_input.get("vitals") or {}).items()
                        if isinstance(v, (int, float))},
                flagged_conditions=[
                    data.get("label", key)
                    for key, data in conditions.items()
                    if isinstance(data, dict) and data.get("flagged")
                ],
            ))
        except (AttributeError, IndexError, TypeError):
            # Shape drift in an older stored record.
            unreadable += 1

    return rows, unreadable


# ---------------------------------------------------------------------------
# Aggregations - each returns a chart-ready structure
# ---------------------------------------------------------------------------

def _risk_trend(rows: List[_Row]) -> List[Dict]:
    """Composite chronic-risk score over time (line chart)."""
    return [
        {
            "assessment_id": r.assessment_id,
            "date": r.created_at.isoformat() if r.created_at else None,
            "composite_risk": r.composite_risk,
            "severity_score": r.severity_score,
            "severity_level": r.severity_level,
        }
        for r in rows if r.composite_risk is not None
    ]


def _assessment_history(rows: List[_Row], limit: int = 50) -> List[Dict]:
    """Prediction/assessment timeline, newest first."""
    return [
        {
            "assessment_id": r.assessment_id,
            "user_id": r.user_id,
            "date": r.created_at.isoformat() if r.created_at else None,
            "top_disease": r.top_disease,
            "confidence_pct": r.top_confidence,
            "severity_level": r.severity_level,
            "symptom_count": len(r.symptoms),
            "symptoms": r.symptoms[:6],
        }
        for r in reversed(rows[-limit:])
    ]


def _symptom_frequency(rows: List[_Row], top_n: int = 12) -> List[Dict]:
    """
    Most frequently reported symptoms.

    A symptom repeated inside one assessment counts once for that assessment,
    so this measures how many CHECK-INS mentioned it rather than how many
    times it was typed.
    """
    counter: Counter = Counter()
    for r in rows:
        counter.update(set(r.symptoms))
    total = len(rows) or 1
    return [
        {"symptom": name, "count": count,
         "pct_of_assessments": round(100 * count / total, 1)}
        for name, count in counter.most_common(top_n)
    ]


def _severity_history(rows: List[_Row]) -> List[Dict]:
    """Counts by triage level, with every level present even at zero."""
    counter = Counter(r.severity_level for r in rows if r.severity_level)
    total = sum(counter.values()) or 1
    return [
        {"level": level, "count": counter.get(level, 0),
         "pct": round(100 * counter.get(level, 0) / total, 1)}
        for level in SEVERITY_LEVELS
    ]


def _predictions_by_condition(rows: List[_Row], top_n: int = 12) -> List[Dict]:
    """Most frequently predicted conditions across the scope (bar chart)."""
    counter = Counter(r.top_disease for r in rows if r.top_disease)
    total = sum(counter.values()) or 1
    return [
        {"condition": name, "label": str(name).title(), "count": count,
         "pct": round(100 * count / total, 1)}
        for name, count in counter.most_common(top_n)
    ]


def _risk_distribution(rows: List[_Row]) -> List[Dict]:
    """
    Composite risk band distribution (pie/bar).

    Counted per ASSESSMENT, not per patient - a patient assessed five times
    contributes five rows, which is what a volume-based distribution means.
    """
    counter = Counter(r.risk_band for r in rows if r.risk_band)
    total = sum(counter.values()) or 1
    ordered = [b for b in RISK_BANDS if b in counter]
    ordered += [b for b in counter if b not in RISK_BANDS]
    return [
        {"band": band, "count": counter[band],
         "pct": round(100 * counter[band] / total, 1)}
        for band in ordered
    ]


def _volume_trend(rows: List[_Row]) -> List[Dict]:
    """Assessments per calendar day, with escalations broken out."""
    per_day: Dict[str, Dict] = defaultdict(
        lambda: {"count": 0, "escalated": 0})
    for r in rows:
        if not r.created_at:
            continue
        key = r.created_at.date().isoformat()
        per_day[key]["count"] += 1
        if r.severity_level in ESCALATED_LEVELS:
            per_day[key]["escalated"] += 1
    return [
        {"date": day, "count": v["count"], "escalated": v["escalated"]}
        for day, v in sorted(per_day.items())
    ]


def _escalation_rate(rows: List[_Row]) -> Dict:
    """
    How often assessments land in URGENT/EMERGENCY.

    A signal about the panel AND about the model's escalation behaviour, which
    is why the numerator and denominator are both returned - a rate alone
    hides whether it came from 2 assessments or 200.
    """
    graded = [r for r in rows if r.severity_level]
    escalated = [r for r in graded if r.severity_level in ESCALATED_LEVELS]
    total = len(graded)
    return {
        "escalated": len(escalated),
        "non_escalated": total - len(escalated),
        "total_graded": total,
        "rate_pct": round(100 * len(escalated) / total, 1) if total else 0.0,
        "by_level": {
            level: sum(1 for r in graded if r.severity_level == level)
            for level in SEVERITY_LEVELS
        },
    }


def _predictions_all_ranks(rows: List[_Row], top_n: int = 10) -> List[Dict]:
    """
    Conditions counted across the WHOLE differential, not only rank 1.

    Distinct from _predictions_by_condition: that answers "what was this
    patient most likely to have", this answers "what did the model consider".
    A condition can dominate one and be absent from the other.
    """
    counter: Counter = Counter()
    for r in rows:
        counter.update(r.all_diseases)
    return [{"disease": name, "count": count}
            for name, count in counter.most_common(top_n)]


def _demographics(rows: List[_Row]) -> Dict:
    """Gender and age-band spread of the assessments in scope."""
    gender = Counter(r.gender or "unknown" for r in rows)
    ages = Counter(age_bucket_label(r.age) for r in rows if r.age is not None)
    return {
        "gender_distribution": dict(gender),
        "age_distribution": {label: ages.get(label, 0)
                             for label in AGE_BUCKET_LABELS},
    }


def _risk_flag_distribution(rows: List[_Row]) -> Dict:
    """The stored legacy triage flag (HIGH PRIORITY / REVIEW / LOW)."""
    return dict(Counter(r.risk_flag for r in rows if r.risk_flag))


def _risk_trend_by_condition(rows: List[_Row], top_n: int = 6) -> Dict:
    """
    One series per chronic condition, for the multi-line risk trend.

    Only the conditions with the highest LATEST score are returned - ten lines
    on one axis is unreadable, and the clinically interesting ones are the
    conditions currently scoring highest, not those with the longest history.
    """
    scored = [r for r in rows if r.condition_scores]
    if not scored:
        return {"conditions": [], "points": []}

    latest = scored[-1].condition_scores
    ranked = sorted(latest, key=lambda k: -latest[k])[:top_n]
    labels = {}
    for r in scored:
        labels.update(r.condition_labels)

    points = []
    for r in scored:
        entry = {"date": r.created_at.isoformat() if r.created_at else None,
                 "assessment_id": r.assessment_id}
        for key in ranked:
            entry[key] = r.condition_scores.get(key)
        points.append(entry)

    return {
        "conditions": [{"key": k, "label": labels.get(k, k)} for k in ranked],
        "points": points,
    }


def _prediction_trend(rows: List[_Row], top_n: int = 5) -> Dict:
    """
    Which conditions were predicted over time, per calendar day.

    Series are the most frequently predicted conditions in scope; a day where
    a condition was not predicted is an explicit 0 rather than a gap, so the
    line does not imply data was missing.
    """
    dated = [r for r in rows if r.created_at and r.top_disease]
    if not dated:
        return {"conditions": [], "points": []}

    top = [name for name, _ in Counter(
        r.top_disease for r in dated).most_common(top_n)]

    per_day: Dict[str, Counter] = defaultdict(Counter)
    for r in dated:
        per_day[r.created_at.date().isoformat()][r.top_disease] += 1

    points = []
    for day in sorted(per_day):
        entry = {"date": day}
        for name in top:
            entry[name] = per_day[day].get(name, 0)
        points.append(entry)

    return {
        "conditions": [{"key": n, "label": str(n).title()} for n in top],
        "points": points,
    }


def _vitals_trend(rows: List[_Row]) -> Dict:
    """
    Reported vitals over time against the normal ranges in severity_config.

    Each point carries an `_out` flag per vital so the chart can mark the
    periods that breached range without re-deriving the thresholds in the
    frontend - the ranges live in the artifact and must not be duplicated.
    """
    ranges = get_artifacts().severity_config.get("vital_ranges", {}) or {}
    with_vitals = [r for r in rows if r.vitals]
    if not with_vitals:
        return {"vitals": [], "points": [], "ranges": ranges}

    present = sorted({k for r in with_vitals for k in r.vitals})
    points = []
    for r in with_vitals:
        entry = {"date": r.created_at.isoformat() if r.created_at else None,
                 "assessment_id": r.assessment_id}
        for key in present:
            value = r.vitals.get(key)
            entry[key] = value
            bounds = ranges.get(key) or {}
            low, high = bounds.get("low"), bounds.get("high")
            entry[f"{key}_out"] = bool(
                value is not None and low is not None and high is not None
                and (value < low or value > high))
        points.append(entry)

    return {
        "vitals": [{"key": k,
                    "label": k.replace("_", " "),
                    "unit": (ranges.get(k) or {}).get("unit"),
                    "low": (ranges.get(k) or {}).get("low"),
                    "high": (ranges.get(k) or {}).get("high")}
                   for k in present],
        "points": points,
        "ranges": ranges,
    }


def _flagged_conditions(rows: List[_Row], top_n: int = 10) -> List[Dict]:
    """Which chronic conditions the risk model flags most often in scope."""
    counter: Counter = Counter()
    for r in rows:
        counter.update(set(r.flagged_conditions))
    return [{"condition": name, "count": count}
            for name, count in counter.most_common(top_n)]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def panel_baseline(db: Session) -> Dict:
    """
    Panel-wide daily average composite risk, for the comparative module.

    Computed over EVERY patient, so it is aggregate data a patient must never
    receive. build_analytics() therefore only attaches it when the caller
    explicitly asks, and only the clinical-gated endpoints ask - see
    `include_panel_baseline`. Keeping the decision at the call site means a
    patient response cannot pick it up by accident.
    """
    rows, _ = _load_rows(db, AnalyticsScope(kind="panel", label="All patients",
                                            user_ids=None))
    per_day: Dict[str, List[float]] = defaultdict(list)
    for r in rows:
        if r.created_at and r.composite_risk is not None:
            per_day[r.created_at.date().isoformat()].append(r.composite_risk)

    points = [
        {"date": day, "panel_avg_risk": round(sum(v) / len(v), 1),
         "sample_size": len(v)}
        for day, v in sorted(per_day.items()) if v
    ]
    all_scores = [x for v in per_day.values() for x in v]
    return {
        "points": points,
        "overall_avg_risk": (round(sum(all_scores) / len(all_scores), 1)
                             if all_scores else None),
        "patients_in_baseline": len({r.user_id for r in rows}),
        "assessments_in_baseline": len(all_scores),
    }


def build_analytics(db: Session, scope: AnalyticsScope,
                    include_panel_baseline: bool = False) -> Dict:
    """
    Every metric, over whatever rows `scope` permits.

    Deliberately scope-agnostic: it does not know whether it is serving a
    patient or a provider. Both frontends receive the same shape and choose
    which sections to render, which is what keeps the two views from growing
    separate implementations of the same chart.
    """
    rows, unreadable = _load_rows(db, scope)

    dates = [r.created_at for r in rows if r.created_at]
    patients_seen = {r.user_id for r in rows}

    result = {
        "scope": scope.describe(),
        "summary": {
            "assessment_count": len(rows),
            "patients_with_assessments": len(patients_seen),
            "first_assessment": min(dates).isoformat() if dates else None,
            "latest_assessment": max(dates).isoformat() if dates else None,
            "escalation_rate_pct": _escalation_rate(rows)["rate_pct"],
        },
        # Patient-scoped view renders these four.
        "risk_trend": _risk_trend(rows),
        "assessment_history": _assessment_history(rows),
        "symptom_frequency": _symptom_frequency(rows),
        "severity_history": _severity_history(rows),
        # Provider-scoped view adds these four.
        "predictions_by_condition": _predictions_by_condition(rows),
        "risk_distribution": _risk_distribution(rows),
        "volume_trend": _volume_trend(rows),
        "escalation": _escalation_rate(rows),
        "flagged_conditions": _flagged_conditions(rows),
        "predictions_all_ranks": _predictions_all_ranks(rows),
        "risk_flag_distribution": _risk_flag_distribution(rows),
        "demographics": _demographics(rows),
        # Trend-module series.
        "risk_trend_by_condition": _risk_trend_by_condition(rows),
        "prediction_trend": _prediction_trend(rows),
        "vitals_trend": _vitals_trend(rows),
        "meta": {
            "unreadable_records": unreadable,
            "severity_levels": list(SEVERITY_LEVELS),
            "note": ("Aggregated from stored assessment outputs. No new model "
                     "is involved; these are counts over predictions this "
                     "system already made."),
        },
    }

    # Attached only for callers that have already passed a clinical role
    # check. Absent from every patient-scoped response, which is what lets
    # the comparative module hide itself rather than needing to be trusted.
    if include_panel_baseline:
        result["panel_baseline"] = panel_baseline(db)

    return result


def list_panel_patients(db: Session, scope: AnalyticsScope) -> List[Dict]:
    """
    Patients in scope, for the provider drill-down selector.

    Only meaningful for a panel scope; a patient scope returns just its own
    subject so the endpoint cannot be used to enumerate other users.
    """
    query = (db.query(User, Assessment)
               .join(Assessment, Assessment.user_id == User.id))
    if scope.user_ids is not None:
        if not scope.user_ids:
            return []
        query = query.filter(User.id.in_(scope.user_ids))

    per_user: Dict[int, Dict] = {}
    for user, assessment in query.all():
        entry = per_user.setdefault(user.id, {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "assessment_count": 0,
            "latest_assessment": None,
        })
        entry["assessment_count"] += 1
        stamp = assessment.created_at.isoformat() if assessment.created_at else None
        if stamp and (entry["latest_assessment"] is None
                      or stamp > entry["latest_assessment"]):
            entry["latest_assessment"] = stamp

    return sorted(per_user.values(),
                  key=lambda e: (e["latest_assessment"] or ""), reverse=True)
