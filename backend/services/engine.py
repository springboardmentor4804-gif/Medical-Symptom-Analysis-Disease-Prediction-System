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

from config import settings
from .artifacts import ArtifactsUnavailable, get_artifacts
from .disease_model import get_disease_model
from .risk_model import CONDITION_LABELS, get_risk_model
from .severity_engine import compute_severity, severity_to_flag
from .treatment_cascade import classify_non_drug, get_cascade
from .advisory_engine import generate_advisory_features
from .recommendation_engine import generate_healthcare_recommendation

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
    def predict_diseases(self, symptoms, top_k: int = 5, sex=None, age=None) -> Dict:
        return self.disease.predict(symptoms, top_k=top_k, sex=sex, age=age)

    def assess_risk(self, profile: Optional[Dict]) -> Dict:
        return self.risk.assess(profile)

    def recommend_treatment(self, disease: Optional[str],
                            query: Optional[str] = None,
                            top_n: int = 5,
                            differential: Optional[list] = None) -> Dict:
        """
        Treatment cascade for a predicted disease.

        The disease name doubles as the free-text query: it is what Layer A
        matches against MIMIC-IV discharge diagnoses, and what Layer B falls
        back to when the structured link misses.

        WALKING THE DIFFERENTIAL. Only 219 of 684 diseases link to the
        drug-review corpus, so querying the top-1 prediction alone left the
        panel empty about 70% of the time - even when a lower-ranked condition
        in the same differential had treatments. Asking down the ranked list
        raises that to roughly 88%.

        A hit below rank 1 is flagged, never disguised: `for_disease`,
        `for_rank` and `is_alternate` say which condition the drugs belong to,
        and the UI must show it. Silently captioning rank-3's drugs with
        rank-1's diagnosis would be worse than the empty panel it replaces.
        """
        candidates = []
        if disease:
            candidates.append((1, disease))
        # Lower-ranked conditions are only consulted when explicitly enabled -
        # see Settings.treatment_allow_alternates for why the default is off.
        if settings.treatment_allow_alternates:
            entries = list(differential or [])
            # Probability of the top prediction, to judge how close a rival is.
            top_p = 0.0
            for entry in entries:
                if isinstance(entry, dict) and (entry.get("rank") or 0) == 1:
                    top_p = float(entry.get("probability") or 0.0)
                    break
            floor = top_p * settings.treatment_alternate_min_ratio

            for entry in entries:
                name = entry.get("disease") if isinstance(entry, dict) else entry
                rank = entry.get("rank") if isinstance(entry, dict) else None
                if not name or name == disease:
                    continue
                # A distant rival's drugs are not this patient's treatment.
                p = float(entry.get("probability") or 0.0) if isinstance(entry, dict) else 0.0
                if top_p > 0 and p < floor:
                    continue
                candidates.append((rank or len(candidates) + 1, name))

        if not candidates and not query:
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

        if not candidates:
            candidates = [(1, query)]

        first_result = None
        for rank, name in candidates:
            result = self.cascade.recommend(query or name, disease=name,
                                            top_n=top_n)
            result["for_disease"] = name
            result["for_rank"] = rank
            result["is_alternate"] = bool(result.get("drugs")) and rank != 1
            if first_result is None:
                first_result = result
            if result.get("drugs"):
                self._attach_reference(result, name)
                if rank != 1:
                    result["alternate_note"] = (
                        f"No treatment data exists for the top-ranked "
                        f"condition. These are for {str(name).title()}, "
                        f"ranked #{rank} in the differential.")
                return result

        # Nothing had data. Report against the top-ranked condition, which is
        # the one the rest of the page is about.
        top_name = candidates[0][1]
        self._attach_reference(first_result, top_name)
        first_result["searched_conditions"] = [n for _, n in candidates]

        # Distinguish "no drug applies to this condition" from "we hold no
        # data on it". Both render empty, but only one is a data gap.
        non_drug = classify_non_drug(top_name)
        if non_drug:
            category, note = non_drug
            first_result["gate_reason"] = "no_pharmacological_treatment"
            first_result["management_category"] = category
            first_result["management_note"] = note
            evidence = first_result.setdefault("evidence", {})
            evidence["caveat"] = note
            return first_result

        # GUARANTEED FLOOR. Past this point the drug corpora hold nothing and
        # no management category matched, but "no treatment" is never a useful
        # answer to give a patient. Fall back to the care PATHWAY, which is
        # always derivable: which clinician handles this, and what the
        # reference text says about it.
        #
        # This deliberately does NOT invent a drug. Inventing one is how a
        # suspected ileus ended up showing IBD immunosuppressants. What it
        # guarantees is a next step, not a prescription.
        first_result["gate_reason"] = "clinician_referral"
        first_result["management_category"] = "referral"
        reference = first_result.get("reference") or {}
        specialist = (reference.get("doctor") or "").strip()
        cures = (reference.get("cures") or "").strip()

        parts = [
            f"No drug-treatment data is held for {str(top_name).title()} in "
            f"either source, and it is not one of the conditions managed "
            f"without medication."
        ]
        if cures:
            parts.append(f"Reference guidance for this condition: {cures}.")
        if specialist:
            parts.append(f"The recommended next step is assessment by: "
                         f"{specialist}.")
        else:
            parts.append("The recommended next step is assessment by a "
                         "primary care clinician, who can direct treatment.")
        note = " ".join(parts)

        first_result["management_note"] = note
        first_result["referral_specialist"] = specialist or "primary care clinician"
        evidence = first_result.setdefault("evidence", {})
        evidence["caveat"] = note
        return first_result

    def _attach_reference(self, result: Dict, disease: Optional[str]) -> None:
        """Plain-language text, when the (partial) lookup has an entry."""
        if not disease:
            return
        reference = self.art.disease_lookup.get(disease)
        if reference:
            result["reference"] = reference

    # ------------------------------------------------------------------
    # Full assessment
    # ------------------------------------------------------------------
    def analyze(self, symptoms=None, age=None, sex=None, profile=None,
                vitals=None, top_k: int = 5,
                historical_assessments=None) -> Dict:
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

        # Sex is passed so anatomically impossible conditions are excluded -
        # the classifier has no sex feature and will otherwise rank
        # "hypertension of pregnancy" first for a male patient.
        diagnosis = self.predict_diseases(symptoms or [], top_k=top_k,
                                          sex=profile.get("sex"),
                                          age=profile.get("age"))
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
        # The whole differential is offered, not just the top hit - see
        # recommend_treatment. Coverage goes from ~30% to ~88% of assessments.
        treatment = self.recommend_treatment(
            top_disease, differential=diagnosis.get("predictions") or [])

        # Generate consolidated healthcare recommendation
        recommendation = generate_healthcare_recommendation(
            severity_result=severity,
            disease_predictions=diagnosis,
            chronic_risks=risk,
            treatment_options=treatment
        )

        advisory = generate_advisory_features(
            user_profile=profile,
            chronic_risks=risk,
            disease_predictions=diagnosis,
            historical_assessments=historical_assessments,
        )

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
            "recommendation": recommendation,
            # Advisory Features sits directly below Preventive Care (which is
            # part of `recommendation`) in the response, the UI and the report.
            # Distinct layer: standing guidance and cross-session patterns,
            # not this assessment's reactive advice. History is optional and
            # each sub-feature degrades on its own.
            "advisory": advisory,
            "meta": {
                "model_version": self.art.manifest.get(
                    "pipeline_version", self.art.manifest.get("created")),
                "flag": severity_to_flag(severity["level"]),
                "treatment_layer": treatment.get("layer"),
                "gate_reason": treatment.get("gate_reason"),
                "treatment_for_disease": treatment.get("for_disease"),
                "treatment_is_alternate": bool(treatment.get("is_alternate")),
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
