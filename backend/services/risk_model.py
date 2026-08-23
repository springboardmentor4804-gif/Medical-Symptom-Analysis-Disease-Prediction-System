"""
Model 2 - lifestyle profile -> 10 chronic-condition risk scores.

Ten INDEPENDENT binary models (HistGradientBoosting + isotonic calibration),
trained on CDC BRFSS 2011-2015. Inference only.

THE THRESHOLD CONTRACT: each condition carries its OWN tuned decision
threshold inside model2_risk_models.joblib. They range from 0.106
(kidney_disease) to 0.353 (arthritis) and none of them is 0.5 - the base rates
are far too low for that. Comparing every probability against 0.5 would flag
essentially nobody. Always read `bundle["threshold"]`; never hard-code.

Missing profile fields are passed through as NaN rather than imputed. The
gradient booster treats missing as a real branch it was fitted with, so a
partial profile yields a genuine (wider) estimate. Substituting a mean here
would fabricate an answer.
"""

from __future__ import annotations

import logging
from typing import Dict, Optional

import numpy as np

from .artifacts import get_artifacts

logger = logging.getLogger(__name__)

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


def age_to_brfss_band(age: Optional[int]) -> Optional[float]:
    """
    Age in years -> BRFSS _AGEG5YR band.

    1 = 18-24, 2 = 25-29, 3 = 30-34 ... 12 = 75-79, 13 = 80+.
    Under-18s clamp to band 1; BRFSS surveys adults only, so paediatric output
    is an extrapolation and is flagged as such in the response.
    """
    if age is None:
        return None
    if age < 25:
        return 1.0
    return float(min(2 + (int(age) - 25) // 5, 13))


class RiskModel:
    """Chronic-condition screening across ten independent calibrated models."""

    def __init__(self):
        self.art = get_artifacts()

    def _feature_values(self, profile: Dict) -> Dict[str, float]:
        values: Dict[str, float] = {"survey_year": SURVEY_YEAR}
        for key, feat in PROFILE_TO_FEATURE.items():
            if key not in profile:
                continue
            v = profile[key]
            if key == "sex":
                v = {"male": 1.0, "m": 1.0, "female": 2.0, "f": 2.0}.get(str(v).lower())
            elif isinstance(v, bool):
                v = 1.0 if v else 0.0
            values[feat] = None if v is None else float(v)

        band = age_to_brfss_band(profile.get("age"))
        if band is not None:
            values["_AGEG5YR"] = band
        return values

    def assess(self, profile: Optional[Dict]) -> Dict:
        profile = {k: v for k, v in (profile or {}).items() if v is not None}
        substantive = [k for k in profile if k not in ("age", "sex")]
        if not substantive:
            return {
                "available": False,
                "reason": "No health profile supplied. Chronic risk screening "
                          "uses lifestyle and demographic inputs, not symptoms — "
                          "complete the health profile step to enable it.",
                "conditions": {},
                "composite": None,
            }

        feature_values = self._feature_values(profile)
        drivers_all = self.art.risk_drivers
        conditions = {}

        for name, bundle in self.art.risk_models.items():
            feats = bundle["features"]
            # Missing -> NaN, which the booster handles natively.
            row = np.array([[feature_values.get(f, np.nan) for f in feats]],
                           dtype=np.float32)
            raw = float(bundle["model"].predict_proba(row)[0, 1])
            prob = float(np.clip(bundle["calibrator"].predict([raw])[0], 0.0, 1.0))

            # `percentiles` is a 101-point grid, so the insertion point IS the
            # 0-100 population percentile for this probability.
            score = int(np.clip(np.searchsorted(bundle["percentiles"], prob), 0, 100))

            band_label = ("high" if score >= 85 else
                          "elevated" if score >= 60 else
                          "average" if score >= 30 else "low")

            # This condition's OWN tuned threshold - never 0.5.
            threshold = float(bundle["threshold"])

            conditions[name] = {
                "label": CONDITION_LABELS.get(name, name.replace("_", " ").title()),
                "probability": round(prob, 4),
                "risk_score": score,
                "percentile": score,
                "band": band_label,
                "flagged": bool(prob >= threshold),
                "threshold": round(threshold, 4),
                "drivers": [
                    {"feature": d["feature"], "label": d["label"],
                     "importance": d["auc_drop"],
                     "patient_value": feature_values.get(d["feature"])}
                    for d in drivers_all.get(name, [])[:5]
                ],
            }

        ranked = sorted(conditions.items(), key=lambda kv: -kv[1]["risk_score"])
        # Composite from the two highest condition percentiles only. It
        # deliberately excludes the acute diagnosis: chronic risk should not
        # move because someone reported a cough today.
        top = [v["risk_score"] for _, v in ranked[:2]] or [0]
        composite = 0.6 * top[0] + 0.4 * (top[1] if len(top) > 1 else top[0])

        supplied = sum(1 for f in PROFILE_TO_FEATURE.values()
                       if feature_values.get(f) is not None)
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
                "flagged_conditions": [k for k, v in conditions.items() if v["flagged"]],
            },
            "profile_completeness": completeness,
            "paediatric_extrapolation": bool(
                profile.get("age") is not None and profile["age"] < 18),
            "note": "Screening likelihood from cross-sectional, self-reported "
                    "survey data (CDC BRFSS). This estimates how similar this "
                    "profile is to respondents who report the condition - not a "
                    "diagnosis, and not a forecast of future onset. Each "
                    "condition is flagged against its own tuned threshold, not "
                    "a shared 50% cut-off.",
        }


_MODEL: Optional[RiskModel] = None


def get_risk_model() -> RiskModel:
    global _MODEL
    if _MODEL is None:
        _MODEL = RiskModel()
    return _MODEL
