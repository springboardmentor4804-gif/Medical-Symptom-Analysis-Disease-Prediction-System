"""
Model 1 - symptoms -> ranked diseases.

BernoulliNB (wrapped in a SoftVoteEnsemble) over 377 binary symptom features,
684 disease classes. Inference only.

THE ORDERING CONTRACT: the feature vector must be built in the exact order of
model1_symptom_columns.json. A shuffled vector does not error - it produces a
confident, entirely wrong answer. `_symptom_index` is derived from that list
and nothing else, so the order cannot drift.

UNMATCHED SYMPTOMS ARE NEVER SILENTLY DROPPED. Anything that fails to resolve
comes back in `unmatched_symptoms` for the caller to surface.
"""

from __future__ import annotations

import difflib
import logging
import re
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
from scipy import sparse

from .artifacts import get_artifacts

logger = logging.getLogger(__name__)

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
    "chest pain": "sharp chest pain",
    "head ache": "headache",
    "giddiness": "dizziness",
    "light headed": "dizziness",
}

# Minimum similarity for the close-match fallback. Set high on purpose: a
# wrong symptom is worse than a reported-unmatched one, because it silently
# changes the differential instead of showing the user what was ignored.
FUZZY_CUTOFF = 0.86


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", str(s).lower().strip())


class DiseaseModel:
    """Ranked differential diagnosis from a set of reported symptoms."""

    def __init__(self):
        self.art = get_artifacts()
        self._idx: Optional[Dict[str, int]] = None

    # ------------------------------------------------------------------
    # Symptom resolution
    # ------------------------------------------------------------------
    @property
    def symptom_index(self) -> Dict[str, int]:
        """Lookup keys -> column position. Built from the ordered column list."""
        if self._idx is None:
            idx: Dict[str, int] = {}
            for i, col in enumerate(self.art.symptom_columns):
                key = _norm(col)
                idx[key] = i
                idx[key.replace("_", " ")] = i
            self._idx = idx
        return self._idx

    def resolve(self, raw: str) -> Optional[int]:
        """
        Resolve one reported symptom to a column index, or None.

        Order: exact -> alias -> unique substring -> close match. Ambiguous
        substring hits are rejected rather than guessed.
        """
        key = _norm(raw)
        idx = self.symptom_index
        if not key:
            return None
        if key in idx:
            return idx[key]

        alias = SYMPTOM_ALIASES.get(key)
        if alias and alias in idx:
            return idx[alias]

        hits = {v for k, v in idx.items() if key in k}
        if len(hits) == 1:
            return hits.pop()

        close = difflib.get_close_matches(key, idx.keys(), n=1, cutoff=FUZZY_CUTOFF)
        return idx[close[0]] if close else None

    def encode(self, symptoms: Iterable) -> Tuple[sparse.csr_matrix, List[str],
                                                  List[str], List[str]]:
        """
        Build the 1 x 377 sparse vector in trained column order.

        Returns (X, matched_column_names, unmatched_inputs, raw_inputs).
        """
        columns = self.art.symptom_columns
        vec = np.zeros((1, len(columns)), dtype=np.float32)
        matched: List[str] = []
        unmatched: List[str] = []
        raw_names: List[str] = []

        for s in symptoms or []:
            raw = s.get("name") if isinstance(s, dict) else s
            if not raw:
                continue
            raw_names.append(str(raw))
            j = self.resolve(raw)
            if j is None:
                unmatched.append(str(raw))
            else:
                vec[0, j] = 1.0
                matched.append(columns[j])

        return sparse.csr_matrix(vec), matched, unmatched, raw_names

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------
    def _calibrated_confidence(self, raw: float) -> Optional[float]:
        """
        Map a raw top-1 probability to the accuracy actually observed in that
        band on the held-out set. Showing the raw number would overstate
        certainty wherever the model is overconfident.
        """
        for b in self.art.confidence_calibration:
            if b["bin_low"] <= raw < b["bin_high"]:
                return float(b["empirical_accuracy"])
        return None

    def predict(self, symptoms: Iterable, top_k: int = 5) -> Dict:
        X, matched, unmatched, raw_names = self.encode(symptoms)

        if not matched:
            return {
                "available": False,
                "reason": "None of the reported symptoms matched the model's "
                          "377-symptom vocabulary.",
                "predictions": [],
                "matched_symptoms": [],
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
            typical = [e["symptom"] for e in evidence.get(disease, [])]
            predictions.append({
                "rank": rank,
                "disease": disease,
                "display_name": disease.title(),
                "probability": round(float(proba[i]), 4),
                "confidence_pct": round(float(proba[i]) * 100, 1),
                # The intersection is what the UI shows as "why this one".
                "matched_symptoms": [t for t in typical if t.lower() in matched_set],
                "typical_symptoms": typical[:8],
                "reference": lookup.get(disease),
            })

        top_p = float(proba[order[0]])
        second = float(proba[order[1]]) if len(order) > 1 else 0.0
        calibrated = self._calibrated_confidence(top_p)
        shown = calibrated if calibrated is not None else top_p

        label = "High" if shown >= 0.7 else "Moderate" if shown >= 0.4 else "Low"

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


_MODEL: Optional[DiseaseModel] = None


def get_disease_model() -> DiseaseModel:
    global _MODEL
    if _MODEL is None:
        _MODEL = DiseaseModel()
    return _MODEL
