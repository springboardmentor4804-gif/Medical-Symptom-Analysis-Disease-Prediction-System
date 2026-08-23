"""
MedAssist inference orchestrator.

One entry point - `analyze()` - takes a patient payload and returns the whole
dashboard response. Nothing here trains, downloads or touches the network.

Response shape (v3):

    {
      "diagnosis": {predictions[], confidence{}, matched/unmatched symptoms},
      "risk":      {conditions{}, composite{}, profile_completeness},
      "severity":  {level, score, components{}, red flags, vitals},
      "treatment": {layer, gate_reason, drugs[], evidence{}},
      "meta":      {model_version, models{}, caveats[], flag}
    }

Every block carries `available: bool` plus a `reason` when false, so the UI can
render an honest empty state instead of a zero. The model families take
DIFFERENT inputs and none substitutes for another: diagnosis needs symptoms,
chronic risk needs the lifestyle profile. Sending only symptoms yields a full
diagnosis block and an unavailable risk block, which is correct.

v3 changes the treatment block from a single drug-review table to the two-layer
cascade. `treatment.layer` distinguishes real hospital prescribing from
patient-reported satisfaction, and the UI must never label them the same way.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, Optional

from .artifacts import ArtifactsUnavailable, get_artifacts
from .disease_model import get_disease_model
from .risk_model import CONDITION_LABELS, get_risk_model
from .severity_engine import compute_severity, severity_to_flag
from .treatment_cascade import get_cascade

logger = logging.getLogger(__name__)

SCHEMA_VERSION = "3.0"


class MedAssistEngine:
    def __init__(self):
        self.art = get_artifacts()
        self.disease = get_disease_model()
        self.risk = get_risk_model()
        self.cascade = get_cascade()

    # ------------------------------------------------------------------
    # Delegating wrappers, kept so callers have one object to talk to.
    # ------------------------------------------------------------------
    def predict_diseases(self, symptoms, top_k: int = 5) -> Dict:
        return self.disease.predict(symptoms, top_k=top_k)

    def assess_risk(self, profile: Optional[Dict]) -> Dict:
        return self.risk.assess(profile)

    def recommend_treatment(self, disease: Optional[str],
                            query: Optional[str] = None,
                            top_n: int = 5) -> Dict:
        """
        Treatment cascade for a predicted disease.

        The disease name doubles as the free-text query: it is what Layer A
        matches against MIMIC-IV discharge diagnoses, and what Layer B falls
        back to when the structured link misses.
        """
        if not disease and not query:
            return {
                "available": False,
                "layer": "none",
                "layer_label": "No treatment data available for this condition",
                "gate_reason": "no_disease_predicted",
                "condition": None,
                "drugs": [],
                "evidence": {
                    "source": None,
                    "caveat": "No condition was predicted, so no treatment "
                              "source could be consulted.",
                },
            }
        result = self.cascade.recommend(query or disease or "",
                                        disease=disease, top_n=top_n)
        # Plain-language reference text, when the (partial) lookup has an entry.
        if disease:
            reference = self.art.disease_lookup.get(disease)
            if reference:
                result["reference"] = reference
        return result

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

        top_disease = diagnosis.get("top_disease") if diagnosis.get("available") else None
        treatment = self.recommend_treatment(top_disease)

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
                "profile_supplied": has_profile,
            },
            "diagnosis": diagnosis,
            "risk": risk,
            "severity": severity,
            "treatment": treatment,
            "meta": {
                "model_version": self.art.manifest.get(
                    "pipeline_version", self.art.manifest.get("created")),
                "flag": severity_to_flag(severity["level"]),
                "treatment_layer": treatment.get("layer"),
                "gate_reason": treatment.get("gate_reason"),
                "models": {
                    "diagnosis": "BernoulliNB over 377 binary symptoms, "
                                 "684 conditions",
                    "risk": "HistGradientBoosting + isotonic calibration, "
                            "10 conditions, CDC BRFSS 2011-2015",
                    "severity": "Rule-weighted, config-driven "
                                "(severity_config.json)",
                    "treatment": "Two-layer cascade: MIMIC-IV discharge "
                                 "prescriptions gated on similarity, falling "
                                 "back to Bayesian-shrunk drug-review rankings",
                },
                "caveats": [
                    "The disease model is trained on a synthetically augmented "
                    "symptom matrix; its held-out accuracy overstates real "
                    "clinical performance.",
                    "Chronic risk is prevalence-style screening from "
                    "self-reported survey data, not incidence.",
                    "Treatment output means different things per layer: "
                    "'mimic' is hospital co-prescription, 'drug_reviews' is "
                    "patient-reported satisfaction. Neither is efficacy data.",
                ],
            },
            "disclaimer": "MedAssist is an informational decision-support tool. "
                          "It is not a medical device and does not provide a "
                          "diagnosis or a prescription. Seek professional care "
                          "for any health concern, and emergency care for any "
                          "red-flag symptom.",
        }


_ENGINE: Optional[MedAssistEngine] = None


def get_engine() -> MedAssistEngine:
    """Process-wide singleton, so a web worker loads artifacts once."""
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = MedAssistEngine()
    return _ENGINE
