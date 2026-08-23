"""
MedAssist inference engine.

One entry point - `analyze()` - takes a patient payload and returns the whole
dashboard response. Nothing here trains, downloads or touches the network.

Response shape (v2):

    {
      "diagnosis": {predictions[], confidence{}, matched/unmatched symptoms},
      "risk":      {conditions{}, composite{}, profile_completeness},
      "severity":  {level, score, components{}, red flags, vitals},
      "treatment": {options[], reference{}, disclaimer},
      "meta":      {model_version, models{}, caveats[], flag}
    }

Every block carries `available: bool` plus a `reason` when false, so the UI can
render an honest empty state instead of a zero. The two model families take
DIFFERENT inputs and neither substitutes for the other: diagnosis needs
symptoms, chronic risk needs the lifestyle profile. Sending only symptoms
yields a full diagnosis block and an unavailable risk block, which is correct.
"""

from __future__ import annotations

import logging
import math
import re
from datetime import datetime, timezone
from typing import Dict, Iterable, List, Optional

import numpy as np
from scipy import sparse

from .artifacts import ArtifactsUnavailable, get_artifacts
from .severity import compute_severity, severity_to_flag

logger = logging.getLogger(__name__)

SCHEMA_VERSION = "2.0"

# Free-text aliases onto the trained symptom vocabulary. The picker serves the
# real 377-name vocabulary, so this only rescues typed or legacy input.
SYMPTOM_ALIASES = {
    "sob": "shortness of breath",
    "breathlessness": "shortness of breath",
    "difficulty breathing": "shortness of breath",
    "trouble breathing": "shortness of breath",
    "tiredness": "fatigue",
    "exhaustion": "fatigue",
    "temperature": "fever",
    "high temperature": "fever",
    "throwing up": "vomiting",
    "being sick": "vomiting",
    "stomach ache": "sharp abdominal pain",
    "stomach pain": "sharp abdominal pain",
    "belly pain": "sharp abdominal pain",
    "tummy pain": "sharp abdominal pain",
    "loose motion": "diarrhea",
    "loose motions": "diarrhea",
    "runny nose": "nasal congestion",
    "blocked nose": "nasal congestion",
    "sore throat": "sore throat",
    "chest pain": "sharp chest pain",
    "head ache": "headache",
    "giddiness": "dizziness",
    "light headed": "dizziness",
}

# UI profile field -> BRFSS feature name. Values must be supplied ALREADY
# DECODED, because the training pipeline decoded BRFSS's sentinel codes before
# fitting: _BMI5 is a real BMI (not BMI*100), yes/no fields are 1.0/0.0, and
# day counts are plain integers. Passing raw BRFSS codes here would be silently
# wrong rather than an error.
PROFILE_TO_FEATURE = {
    "bmi": "_BMI5",
    "sex": "SEX",
    "smoker_status": "_SMOKER3",
    "exercise": "EXERANY2",
    "high_blood_pressure": "BPHIGH4",
    "high_cholesterol": "TOLDHI2",
    "alcohol_days_per_month": "ALCDAY5",
    "general_health": "GENHLTH",
    "physical_unwell_days": "PHYSHLTH",
    "mental_unwell_days": "MENTHLTH",
    "sleep_hours": "SLEPTIM1",
    "meets_activity_guidance": "_TOTINDA",
}

CONDITION_LABELS = {
    "diabetes": "Diabetes",
    "heart_attack": "Heart attack",
    "coronary_hd": "Coronary heart disease",
    "stroke": "Stroke",
    "asthma": "Asthma",
    "skin_cancer": "Skin cancer",
    "other_cancer": "Other cancer",
    "arthritis": "Arthritis",
    "depression": "Depression",
    "kidney_disease": "Kidney disease",
}

# The most recent BRFSS year in training. Held constant so predictions are
# reproducible rather than drifting with the calendar.
SURVEY_YEAR = 2015.0


def _age_to_brfss_band(age: Optional[int]) -> Optional[float]:
    """
    Age in years -> BRFSS _AGEG5YR band.

    1 = 18-24, 2 = 25-29, 3 = 30-34 ... 12 = 75-79, 13 = 80+.
    Under-18s are clamped to band 1; BRFSS surveys adults only, so paediatric
    chronic-risk output is an extrapolation and flagged as such by the caller.
    """
    if age is None:
        return None
    if age < 25:
        return 1.0
    return float(min(2 + (int(age) - 25) // 5, 13))


class MedAssistEngine:
    def __init__(self):
        self.art = get_artifacts()

    # ------------------------------------------------------------------
    # Symptom encoding
    # ------------------------------------------------------------------
    @property
    def _symptom_index(self) -> Dict[str, int]:
        if not hasattr(self, "_sym_idx"):
            idx = {}
            for i, col in enumerate(self.art.symptom_columns):
                key = col.lower().strip()
                idx[key] = i
                idx[key.replace("_", " ")] = i
                idx[re.sub(r"\s+", " ", key)] = i
            self._sym_idx = idx
        return self._sym_idx

    def resolve_symptom(self, raw: str) -> Optional[int]:
        key = re.sub(r"\s+", " ", str(raw).lower().strip())
        idx = self._symptom_index
        if key in idx:
            return idx[key]
        alias = SYMPTOM_ALIASES.get(key)
        if alias and alias in idx:
            return idx[alias]
        # Unique substring match, last resort. Ambiguous matches are rejected
        # rather than guessed - a wrong symptom is worse than a missing one.
        hits = {v for k, v in idx.items() if key and key in k}
        return hits.pop() if len(hits) == 1 else None

    def encode_symptoms(self, symptoms: Iterable):
        names, matched, unmatched = [], [], []
        n = len(self.art.symptom_columns)
        vec = np.zeros((1, n), dtype=np.float32)
        for s in symptoms or []:
            raw = s.get("name") if isinstance(s, dict) else s
            if not raw:
                continue
            names.append(str(raw))
            j = self.resolve_symptom(raw)
            if j is None:
                unmatched.append(str(raw))
            else:
                vec[0, j] = 1.0
                matched.append(self.art.symptom_columns[j])
        return sparse.csr_matrix(vec), matched, unmatched, names

    # ------------------------------------------------------------------
    # Diagnosis
    # ------------------------------------------------------------------
    def _calibrated_confidence(self, raw: float) -> Optional[float]:
        """
        Map a raw top-1 probability to the accuracy actually observed in that
        confidence band on the held-out set. Showing the raw number would
        overstate certainty wherever the model is overconfident.
        """
        for b in self.art.confidence_calibration:
            if b["bin_low"] <= raw < b["bin_high"]:
                return float(b["empirical_accuracy"])
        return None

    def predict_diseases(self, symptoms, top_k: int = 5) -> Dict:
        X, matched, unmatched, raw_names = self.encode_symptoms(symptoms)
        if not matched:
            return {
                "available": False,
                "reason": "None of the reported symptoms matched the model's "
                          "symptom vocabulary.",
                "predictions": [], "matched_symptoms": [],
                "unmatched_symptoms": unmatched,
            }

        proba = self.art.disease_model.predict_proba(X)[0]
        order = np.argsort(proba)[::-1][:top_k]
        names = self.art.disease_names
        evidence = self.art.symptom_evidence
        lookup = self.art.disease_lookup
        matched_set = {m.lower() for m in matched}

        predictions = []
        for rank, i in enumerate(order, start=1):
            disease = names[int(i)]
            typical = evidence.get(disease, [])
            typical_names = [e["symptom"] for e in typical]
            predictions.append({
                "rank": rank,
                "disease": disease,
                "display_name": disease.title(),
                "probability": round(float(proba[i]), 4),
                "confidence_pct": round(float(proba[i]) * 100, 1),
                # The intersection is what the UI shows as "why this one".
                "matched_symptoms": [t for t in typical_names
                                     if t.lower() in matched_set],
                "typical_symptoms": typical_names[:8],
                "reference": lookup.get(disease),
            })

        top_p = float(proba[order[0]])
        second = float(proba[order[1]]) if len(order) > 1 else 0.0
        calibrated = self._calibrated_confidence(top_p)
        shown = calibrated if calibrated is not None else top_p

        if shown >= 0.7:
            label = "High"
        elif shown >= 0.4:
            label = "Moderate"
        else:
            label = "Low"

        return {
            "available": True,
            "predictions": predictions,
            "top_disease": predictions[0]["disease"],
            "confidence": {
                "raw": round(top_p, 4),
                "calibrated": round(calibrated, 4) if calibrated is not None else None,
                "display": round(shown, 4),
                "label": label,
                "margin": round(top_p - second, 4),
                "explanation": (
                    f"The model's raw confidence is {top_p:.0%}. On held-out data, "
                    f"predictions in that confidence band were correct "
                    f"{calibrated:.0%} of the time."
                    if calibrated is not None else
                    f"Raw model confidence {top_p:.0%}; no calibration bin covers "
                    f"this range, so treat it as indicative only."
                ),
            },
            "matched_symptoms": matched,
            "unmatched_symptoms": unmatched,
            "symptom_coverage": round(len(matched) / max(len(raw_names), 1), 3),
        }

    # ------------------------------------------------------------------
    # Chronic risk
    # ------------------------------------------------------------------
    def assess_risk(self, profile: Optional[Dict]) -> Dict:
        profile = {k: v for k, v in (profile or {}).items() if v is not None}
        substantive = [k for k in profile if k not in ("age", "sex")]
        if not substantive:
            return {
                "available": False,
                "reason": "No health profile supplied. Chronic risk screening "
                          "uses lifestyle and demographic inputs, not symptoms — "
                          "complete the health profile step to enable it.",
                "conditions": {}, "composite": None,
            }

        feature_values: Dict[str, float] = {"survey_year": SURVEY_YEAR}
        for key, feat in PROFILE_TO_FEATURE.items():
            if key not in profile:
                continue
            v = profile[key]
            if key == "sex":
                v = {"male": 1.0, "m": 1.0, "female": 2.0, "f": 2.0}.get(
                    str(v).lower())
            elif isinstance(v, bool):
                v = 1.0 if v else 0.0
            feature_values[feat] = None if v is None else float(v)

        band = _age_to_brfss_band(profile.get("age"))
        if band is not None:
            feature_values["_AGEG5YR"] = band

        models = self.art.risk_models
        drivers_all = self.art.risk_drivers
        conditions = {}
        for name, bundle in models.items():
            feats = bundle["features"]
            row = np.array([[feature_values.get(f, np.nan) for f in feats]],
                           dtype=np.float32)
            raw = float(bundle["model"].predict_proba(row)[0, 1])
            prob = float(np.clip(bundle["calibrator"].predict([raw])[0], 0.0, 1.0))
            # percentiles is a 101-point grid, so the insertion point IS the
            # 0-100 population percentile for this probability.
            score = int(np.clip(
                np.searchsorted(bundle["percentiles"], prob), 0, 100))

            if score >= 85:
                band_label = "high"
            elif score >= 60:
                band_label = "elevated"
            elif score >= 30:
                band_label = "average"
            else:
                band_label = "low"

            drivers = [
                {"feature": d["feature"], "label": d["label"],
                 "importance": d["auc_drop"],
                 "patient_value": feature_values.get(d["feature"])}
                for d in drivers_all.get(name, [])[:5]
            ]

            conditions[name] = {
                "label": CONDITION_LABELS.get(name, name.replace("_", " ").title()),
                "probability": round(prob, 4),
                "risk_score": score,
                "band": band_label,
                "flagged": bool(prob >= bundle["threshold"]),
                "threshold": bundle["threshold"],
                "drivers": drivers,
            }

        ranked = sorted(conditions.items(), key=lambda kv: -kv[1]["risk_score"])
        # Composite from the two highest condition percentiles only. It
        # deliberately excludes the acute diagnosis: chronic risk should not
        # move because someone reported a cough today.
        top = [v["risk_score"] for _, v in ranked[:2]] or [0]
        composite = 0.6 * top[0] + 0.4 * (top[1] if len(top) > 1 else top[0])

        supplied = sum(1 for f in PROFILE_TO_FEATURE.values()
                       if f in feature_values and feature_values[f] is not None)
        completeness = round(supplied / len(PROFILE_TO_FEATURE), 3)

        return {
            "available": True,
            "conditions": conditions,
            "composite": {
                "score": round(float(composite), 1),
                "band": ("high" if composite >= 75 else
                         "elevated" if composite >= 50 else
                         "moderate" if composite >= 25 else "low"),
                "top_conditions": [
                    {"condition": k, "label": v["label"],
                     "risk_score": v["risk_score"], "band": v["band"]}
                    for k, v in ranked[:3]
                ],
                "flagged_conditions": [k for k, v in conditions.items()
                                       if v["flagged"]],
            },
            "profile_completeness": completeness,
            "paediatric_extrapolation": bool(
                profile.get("age") is not None and profile["age"] < 18),
            "note": "Screening likelihood from cross-sectional, self-reported "
                    "survey data (CDC BRFSS). This estimates how similar this "
                    "profile is to respondents who report the condition - not "
                    "a diagnosis, and not a forecast of future onset.",
        }

    # ------------------------------------------------------------------
    # Treatment
    # ------------------------------------------------------------------
    def recommend_treatment(self, disease: Optional[str], top_k: int = 8) -> Dict:
        if not disease:
            return {"available": False, "reason": "No disease predicted.",
                    "options": []}

        key = self.art.disease_condition_link.get(disease)
        if key is None:
            return {
                "available": False,
                "reason": f"No treatment data is available for "
                          f"'{disease.title()}'. Only 219 of 684 predictable "
                          f"conditions appear in the drug-review corpus.",
                "options": [], "matched_condition": None,
                "reference": self.art.disease_lookup.get(disease),
            }

        rows = self.art.treatment_table.get(key)
        if rows is None or rows.empty:
            return {"available": False,
                    "reason": f"Condition '{key}' has no ranked treatments.",
                    "options": [], "matched_condition": key}

        options = [{
            "drug": r["drug"],
            "rank": int(r["rank"]),
            "rank_by_rating": int(r["rank_by_rating"]),
            "adjusted_rating": round(float(r["shrunk_rating"]), 2),
            "mean_rating": round(float(r["mean_rating"]), 2),
            "satisfaction_rate": round(float(r["positive_rate"]), 3),
            "n_reviews": int(r["n_reviews"]),
        } for _, r in rows.head(top_k).iterrows()]

        return {
            "available": True,
            "matched_condition": key,
            "options": options,
            "reference": self.art.disease_lookup.get(disease),
            "ranking_note": "`rank` blends patient-reported outcome with how "
                            "commonly the drug is used for this condition; "
                            "`rank_by_rating` is the pure-quality order. They "
                            "disagree, and the disagreement is informative.",
            "disclaimer": "Aggregated patient-reported satisfaction, NOT "
                          "clinical efficacy or safety data. Decision support "
                          "for a clinician - never a prescription.",
        }

    # ------------------------------------------------------------------
    # Full assessment
    # ------------------------------------------------------------------
    def analyze(self, symptoms=None, age=None, sex=None, profile=None,
                vitals=None, top_k: int = 5) -> Dict:
        # Whether a health profile was actually supplied, decided BEFORE age
        # and sex are merged in. Without this guard, every symptoms-only
        # request produced a full ten-condition risk panel inferred from age
        # and sex alone, presented identically to a complete assessment - a
        # 60-year-old man would see "98th percentile heart-attack risk" having
        # answered nothing about his health.
        has_profile = bool({k: v for k, v in (profile or {}).items()
                            if k not in ("age", "sex") and v is not None})

        profile = dict(profile or {})
        if age is not None:
            profile.setdefault("age", age)
        if sex is not None:
            profile.setdefault("sex", sex)

        diagnosis = self.predict_diseases(symptoms or [], top_k=top_k)
        risk = self.assess_risk(profile if has_profile else None)

        chronic = 0.0
        if risk.get("available") and risk.get("composite"):
            chronic = risk["composite"]["score"] / 100.0

        confidence = 0.0
        if diagnosis.get("available"):
            confidence = diagnosis["confidence"]["display"]

        severity = compute_severity(
            symptoms=symptoms or [],
            age=profile.get("age"),
            diagnosis_confidence=confidence,
            chronic_risk=chronic,
            vitals=vitals,
        )

        treatment = self.recommend_treatment(
            diagnosis.get("top_disease") if diagnosis.get("available") else None)

        return {
            "schema_version": SCHEMA_VERSION,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "input": {
                "symptoms": [
                    s if isinstance(s, dict) else {"name": s, "severity": "moderate"}
                    for s in (symptoms or [])
                ],
                "age": profile.get("age"),
                "sex": profile.get("sex"),
                "vitals": vitals or {},
                "profile_supplied": bool(
                    {k: v for k, v in profile.items()
                     if k not in ("age", "sex") and v is not None}),
            },
            "diagnosis": diagnosis,
            "risk": risk,
            "severity": severity,
            "treatment": treatment,
            "meta": {
                "model_version": self.art.manifest.get("pipeline_version"),
                "flag": severity_to_flag(severity["level"]),
                "models": {
                    "diagnosis": "BernoulliNB over 377 binary symptoms, "
                                 "684 conditions",
                    "risk": "HistGradientBoosting + isotonic calibration, "
                            "10 conditions, CDC BRFSS 2011-2015",
                    "severity": "Rule-weighted, config-driven (severity_config.json)",
                    "treatment": "Bayesian-shrunk ranking over 215k drug reviews",
                },
                "caveats": [
                    "The disease model is trained on a synthetically augmented "
                    "symptom matrix; its held-out accuracy overstates real "
                    "clinical performance.",
                    "Chronic risk is prevalence-style screening from "
                    "self-reported survey data, not incidence.",
                    "Treatment rankings reflect patient satisfaction, not "
                    "clinical efficacy or safety.",
                ],
            },
            "disclaimer": "MedAssist is an informational decision-support tool. "
                          "It is not a medical device and does not provide a "
                          "diagnosis. Seek professional care for any health "
                          "concern, and emergency care for any red-flag symptom.",
        }


_ENGINE: Optional[MedAssistEngine] = None


def get_engine() -> MedAssistEngine:
    """Process-wide singleton, so a web worker loads artifacts once."""
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = MedAssistEngine()
    return _ENGINE
