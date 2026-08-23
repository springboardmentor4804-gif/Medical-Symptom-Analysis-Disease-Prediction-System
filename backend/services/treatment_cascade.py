"""
Model 3 - treatment recommendation, TWO-LAYER CASCADE.

    Layer A  MIMIC-IV discharge prescriptions   preferred, optional
    Layer B  UCI drug-review rankings           fallback, required

Single entry point:

    TreatmentCascade().recommend(query, disease=None, top_n=5)

The two layers are epistemically different and the response never blurs them.
Layer A says "clinicians treating similar admissions prescribed these" - real
hospital behaviour, but co-occurrence, not attribution: a discharge note lists
every drug for a patient who often has several problems at once. Layer B says
"patients reviewing drugs for this condition rated these highly" - self-
reported satisfaction, not efficacy or safety. Presenting them under one label
would be the single most misleading thing this module could do, so every
response carries `layer`, `gate_reason` and a source-specific caveat.

THE GATE IS NOT HARD-CODED. sim_floor, min_support and cat_threshold are read
from model3_mimic_layer.joblib["gate"], where the notebook tuned them. Copying
the numbers into constants here would let the notebook and the app drift apart
on the next retrain, and the drift would be invisible - the app would keep
serving confident output against stale thresholds.

An EMPTY drug list is a correct answer. When nothing matches well enough, that
is what gets returned - never the drugs for the nearest-spelled condition.
"""

from __future__ import annotations

import difflib
import logging
import re
from typing import Dict, List, Optional, Tuple

import numpy as np

from .artifacts import get_artifacts

logger = logging.getLogger(__name__)

# Layer B condition-match floor. Below this the panel comes back empty rather
# than showing treatments for a condition the query only vaguely resembles.
CONDITION_MATCH_FLOOR = 0.45

# Stage-2 label buckets that are placeholders, not prescribable drugs. The
# notebook emits `other_<category>` for the long tail it would not name.
_PLACEHOLDER_LABEL = re.compile(r"^other[_ ]", re.IGNORECASE)

# Stage-1 catch-all class. It has no stage-2 model by construction, so it can
# never yield a named drug and must not count towards "a class was predicted".
_CATCHALL_CATEGORY = "other"

LAYER_CAVEATS = {
    "mimic": (
        "Drugs co-prescribed during real MIMIC-IV hospital admissions with a "
        "similar discharge diagnosis. A discharge list covers every problem a "
        "patient had, so this is co-occurrence, not attribution to this "
        "diagnosis."
    ),
    "drug_reviews": (
        "Ranked from aggregated patient-reported satisfaction in the UCI drug "
        "review corpus. This reflects how patients rated their experience, NOT "
        "clinical efficacy, safety, or suitability for this patient."
    ),
    "none": (
        "No treatment data is available for this condition in either source. "
        "This is an absence of data, not evidence that no treatment exists."
    ),
}

LAYER_LABELS = {
    "mimic": "Real hospital prescriptions",
    "drug_reviews": "Patient-reported experience",
    "none": "No treatment data available for this condition",
}


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", str(s or "").lower())


def _tokens(s: str) -> set:
    return {t for t in _norm(s).split() if len(t) > 2}


# A condition word counts as "present in the query" only above this
# per-token similarity. It rescues typos ("diabetis" -> "diabetes") without
# letting unrelated words align.
_TOKEN_MATCH_CUTOFF = 0.85

# Whole-string similarity is only trusted when the two strings are nearly the
# same. Character-level difflib over long strings is dangerously permissive:
# "xyzzy nonsense" vs "urinary incontinence" scores ~0.5 on shared letters
# alone, which would clear the 0.45 condition floor and serve incontinence
# drugs for a nonsense query.
_WHOLE_STRING_CUTOFF = 0.85


def _match_score(query: str, candidate: str) -> float:
    """
    How well a free-text query names a drug-review condition, in 0..1.

    Token-based rather than character-based, so "severe cystic acne on face"
    resolves to "acne" (a plain difflib ratio scores that pair at ~0.3 and
    would discard a perfect match) while "xyzzy nonsense" resolves to nothing
    (a plain difflib ratio scores it ~0.5 against several real conditions).
    """
    q, c = _norm(query).strip(), _norm(candidate).strip()
    if not q or not c:
        return 0.0
    if q == c:
        return 1.0

    qt, ct = _tokens(query), _tokens(candidate)
    if not qt or not ct:
        return 0.0

    # How many of the CONDITION's words are evidenced in the query. Anchoring
    # on the condition means a long query is not penalised for its extra words,
    # but every word of the condition still has to be accounted for.
    present = 0
    for word in ct:
        if word in qt:
            present += 1
            continue
        if any(difflib.SequenceMatcher(None, word, qw).ratio() >= _TOKEN_MATCH_CUTOFF
               for qw in qt):
            present += 1
    coverage = present / len(ct)
    token_score = 0.95 * coverage if coverage == 1.0 else 0.9 * coverage

    # Near-identical whole strings (typo of a full condition name).
    ratio = difflib.SequenceMatcher(None, q, c).ratio()
    whole = ratio if ratio >= _WHOLE_STRING_CUTOFF else 0.0

    return float(max(token_score, whole))


class TreatmentCascade:
    """Layer A over MIMIC-IV, falling back to Layer B over drug reviews."""

    def __init__(self):
        self.art = get_artifacts()

    # ------------------------------------------------------------------
    # Gate configuration - read from the artifact, never hard-coded
    # ------------------------------------------------------------------
    @property
    def layer_a_enabled(self) -> bool:
        return self.art.layer_a_available

    @property
    def gate(self) -> Dict:
        """
        {sim_floor, min_support, cat_threshold, ...} as tuned in the notebook.

        Absent Layer A there is no gate to read; callers must check
        `layer_a_enabled` first.
        """
        cfg = self.art.mimic_layer.get("gate")
        if not cfg:
            raise KeyError(
                "model3_mimic_layer.joblib has no 'gate' key. The thresholds "
                "travel with the model by design and are not defaulted here - "
                "re-export the artifact from the training notebook.")
        return cfg

    # ------------------------------------------------------------------
    # Layer A - MIMIC-IV discharge prescriptions
    # ------------------------------------------------------------------
    def _layer_a(self, query: str, top_n: int) -> Dict:
        """
        Returns {passed, gate_reason, drugs, evidence}. `passed` False means the
        caller must fall through to Layer B.
        """
        layer = self.art.mimic_layer
        gate = self.gate
        sim_floor = float(gate["sim_floor"])
        min_support = int(gate["min_support"])
        cat_threshold = float(gate["cat_threshold"])

        vec = layer["vec"]
        Q = vec.transform([query])

        # Both the query and the stored matrix are L2-normalised TF-IDF rows,
        # so the dot product IS cosine similarity.
        sims = np.asarray((Q @ self.art.mimic_matrix.T).todense()).ravel()
        best_sim = float(sims.max()) if sims.size else 0.0
        supporting = int((sims >= sim_floor).sum())

        base = {
            "best_similarity": round(best_sim, 4),
            "supporting_notes": supporting,
            "thresholds": {"sim_floor": sim_floor,
                           "min_support": min_support,
                           "cat_threshold": cat_threshold},
        }

        # -- gate 1: is anything in the corpus actually similar? -----------
        if best_sim < sim_floor:
            return {"passed": False, "gate_reason": "similarity_below_floor",
                    "diagnostics": base}

        # -- gate 2: is the similarity backed by enough admissions? --------
        if supporting < min_support:
            return {"passed": False, "gate_reason": "insufficient_support",
                    "diagnostics": base}

        # -- gate 3: does stage 1 commit to any drug class? ----------------
        classes = list(layer["mlb"].classes_)
        cat_proba = layer["stage1"].predict_proba(Q)[0]
        predicted = [
            (classes[i], float(cat_proba[i]))
            for i in range(len(classes))
            if cat_proba[i] >= cat_threshold and classes[i] != _CATCHALL_CATEGORY
        ]
        if not predicted:
            return {"passed": False, "gate_reason": "no_class_predicted",
                    "diagnostics": base}

        # -- stage 2: a named drug per predicted class ---------------------
        stage2, stage2_lab = layer["stage2"], layer["stage2_lab"]
        stage2_fb = layer.get("stage2_fb", {})

        drugs: List[Dict] = []
        for category, cat_p in predicted:
            model, binarizer = stage2.get(category), stage2_lab.get(category)
            drug, drug_p = None, None

            if model is not None and binarizer is not None:
                labels = np.asarray(binarizer.classes_)
                probs = model.predict_proba(Q)[0]
                for i in np.argsort(probs)[::-1]:
                    if not _PLACEHOLDER_LABEL.match(str(labels[i])):
                        drug, drug_p = str(labels[i]), float(probs[i])
                        break

            if drug is None:
                # The class fired but stage 2 named nothing usable. The
                # notebook's per-class modal drug is the documented stand-in.
                drug = stage2_fb.get(category)
                drug_p = None
                if not drug:
                    continue

            drugs.append({
                "drug": drug.title(),
                "drug_class": category.replace("_", " "),
                "class_confidence": round(cat_p, 4),
                "drug_confidence": round(drug_p, 4) if drug_p is not None else None,
                # Ranking across classes: how sure we are of the class times how
                # sure we are of the drug within it.
                "_rank_score": cat_p * (drug_p if drug_p is not None else 0.5),
            })

        # -- gate 4: did anything survive stage 2? -------------------------
        if not drugs:
            return {"passed": False, "gate_reason": "no_drug_predicted",
                    "diagnostics": base}

        drugs.sort(key=lambda d: -d["_rank_score"])
        drugs = drugs[:top_n]
        for rank, d in enumerate(drugs, start=1):
            d["rank"] = rank
            d.pop("_rank_score", None)

        return {
            "passed": True,
            "gate_reason": "passed",
            "drugs": drugs,
            "diagnostics": base,
            "neighbours": self._neighbours(sims, sim_floor),
        }

    def _neighbours(self, sims: np.ndarray, sim_floor: float, k: int = 3) -> List[Dict]:
        """The most similar real admissions, so a clinician can judge the match."""
        try:
            records = self.art.mimic_records
        except Exception:                                    # noqa: BLE001
            return []
        out = []
        for i in np.argsort(sims)[::-1][:k]:
            if sims[i] < sim_floor:
                break
            row = records.iloc[int(i)]
            out.append({
                "diagnosis": str(row.get("diagnosis_text", "")),
                "similarity": round(float(sims[i]), 4),
                "medications": [m.strip() for m in
                                str(row.get("medications", "")).split(";")
                                if m.strip()][:12],
            })
        return out

    # ------------------------------------------------------------------
    # Layer B - UCI drug reviews
    # ------------------------------------------------------------------
    def _resolve_condition(self, query: str,
                           disease: Optional[str]) -> Tuple[Optional[str], float, str]:
        """
        Resolve to a drug-review condition_key.

        Returns (condition_key, match_score, method). The structured link is
        tried FIRST when a disease is supplied - it was built and audited at
        training time, so fuzzy-matching free text over the top of it would
        only add noise.
        """
        table = self.art.treatment_table

        if disease:
            key = self.art.disease_condition_link.get(disease)
            if key is None:
                key = self.art.disease_condition_link.get(str(disease).lower())
            if key and key in table:
                return key, 1.0, "disease_link"

        if not query:
            return None, 0.0, "no_query"

        # Exact condition name.
        qn = _norm(query).strip()
        for key in table:
            if _norm(key).strip() == qn:
                return key, 1.0, "exact"

        # Best string/token match over every rankable condition.
        best_key, best_score = None, 0.0
        for key in table:
            s = _match_score(query, key)
            if s > best_score:
                best_key, best_score = key, s

        # The 100 MB free-text classifier is a candidate GENERATOR only. Its
        # ComplementNB probabilities are not comparable across 329 classes -
        # a nonsense query and a good one both score ~0.004 - so its suggestion
        # is scored with the same string metric as everything else rather than
        # being trusted on its own confidence.
        if best_score < CONDITION_MATCH_FLOOR and self.art.text_condition_available:
            for key, score in self._text_candidates(query):
                if key in table and score > best_score:
                    best_key, best_score = key, score

        if best_key is None or best_score < CONDITION_MATCH_FLOOR:
            return None, round(float(best_score), 4), "below_floor"
        return best_key, round(float(best_score), 4), "fuzzy"

    def _text_candidates(self, query: str, k: int = 3) -> List[Tuple[str, float]]:
        """Top-k conditions from the lazily-loaded free-text classifier."""
        try:
            bundle = self.art.text_condition_model      # 100 MB, loads on demand
            X = bundle["vectorizer"].transform([query])
            if X.nnz == 0:
                return []
            proba = bundle["classifier"].predict_proba(X)[0]
            classes = bundle["classes"]
            return [(str(classes[i]), _match_score(query, str(classes[i])))
                    for i in np.argsort(proba)[::-1][:k]]
        except Exception as e:                               # noqa: BLE001
            logger.warning("Free-text condition classifier unavailable: %s", e)
            return []

    def _layer_b(self, query: str, disease: Optional[str], top_n: int) -> Dict:
        key, score, method = self._resolve_condition(query, disease)

        if key is None:
            return {
                "condition": None,
                "match_score": score,
                "match_method": method,
                "drugs": [],
                "gate_reason": "no_condition_match",
            }

        rows = self.art.treatment_table[key]
        drugs = [{
            "rank": int(r["rank"]),
            "drug": str(r["drug"]),
            "rank_by_rating": int(r["rank_by_rating"]),
            "adjusted_rating": round(float(r["shrunk_rating"]), 2),
            "mean_rating": round(float(r["mean_rating"]), 2),
            "satisfaction_rate": round(float(r["positive_rate"]), 3),
            "n_reviews": int(r["n_reviews"]),
            "mimic_confirmed": bool(r.get("mimic_confirmed", False)),
        } for _, r in rows.head(top_n).iterrows()]

        return {
            "condition": key,
            "match_score": score,
            "match_method": method,
            "drugs": drugs,
            "gate_reason": "passed",
        }

    # ------------------------------------------------------------------
    # Similar real cases (optional feature)
    # ------------------------------------------------------------------
    def similar_cases(self, query: str, k: int = 3) -> List[Dict]:
        """
        Discharge notes with a similar diagnosis, for illustration only.

        Corroboration and dosing context - explicitly NOT a ranker. Returns []
        when the note artifacts are absent.
        """
        if not self.art.note_layer_available or not query:
            return []
        try:
            Q = self.art.note_vectorizer.transform([query])
            sims = np.asarray((Q @ self.art.note_matrix.T).todense()).ravel()
            ref = self.art.note_reference
            out = []
            for i in np.argsort(sims)[::-1][:k]:
                if sims[i] <= 0:
                    break
                row = ref.iloc[int(i)]
                out.append({
                    "diagnosis": str(row.get("diagnosis", "")),
                    "similarity": round(float(sims[i]), 4),
                    "medications": [m.strip() for m in
                                    str(row.get("medications", "")).split(";")
                                    if m.strip()][:12],
                })
            return out
        except Exception as e:                               # noqa: BLE001
            logger.warning("Similar-case lookup failed: %s", e)
            return []

    # ------------------------------------------------------------------
    # Entry point
    # ------------------------------------------------------------------
    def recommend(self, query: str, disease: Optional[str] = None,
                  top_n: int = 5) -> Dict:
        """
        Recommend treatments for a free-text query, optionally anchored to a
        Model 1 disease name.

        Always returns `layer`, `gate_reason`, `drugs` and `evidence`.
        `layer` is one of "mimic", "drug_reviews", "none".
        """
        query = (query or "").strip()
        gate_diag = None

        # -- Layer A -------------------------------------------------------
        if self.layer_a_enabled:
            try:
                a = self._layer_a(query, top_n) if query else {
                    "passed": False, "gate_reason": "similarity_below_floor",
                    "diagnostics": None}
                gate_diag = a.get("diagnostics")
                if a["passed"]:
                    return {
                        "available": True,
                        "layer": "mimic",
                        "layer_label": LAYER_LABELS["mimic"],
                        "gate_reason": "passed",
                        "condition": None,
                        "drugs": a["drugs"],
                        "evidence": {
                            "source": "MIMIC-IV discharge prescriptions",
                            "caveat": LAYER_CAVEATS["mimic"],
                            "best_similarity": a["diagnostics"]["best_similarity"],
                            "supporting_notes": a["diagnostics"]["supporting_notes"],
                            "thresholds": a["diagnostics"]["thresholds"],
                            "neighbours": a.get("neighbours", []),
                        },
                    }
                layer_a_reason = a["gate_reason"]
            except Exception as e:                           # noqa: BLE001
                # Layer A is the optional layer; a failure inside it must
                # degrade to Layer B, not fail the assessment.
                logger.exception("Layer A failed, falling through to Layer B")
                layer_a_reason = f"layer_a_error: {type(e).__name__}"
        else:
            layer_a_reason = "layer_a_unavailable"

        # -- Layer B -------------------------------------------------------
        b = self._layer_b(query, disease, top_n)

        if b["gate_reason"] == "no_condition_match":
            return {
                "available": False,
                "layer": "none",
                "layer_label": LAYER_LABELS["none"],
                "gate_reason": "no_condition_match",
                "condition": None,
                "drugs": [],
                "evidence": {
                    "source": None,
                    "caveat": LAYER_CAVEATS["none"],
                    "layer_a_gate_reason": layer_a_reason,
                    "best_condition_match_score": b["match_score"],
                    "match_floor": CONDITION_MATCH_FLOOR,
                    "layer_a_diagnostics": gate_diag,
                },
            }

        return {
            "available": True,
            "layer": "drug_reviews",
            "layer_label": LAYER_LABELS["drug_reviews"],
            # Why Layer A did not fire is the useful signal here, so it is what
            # gate_reason carries rather than a constant "passed".
            "gate_reason": layer_a_reason,
            "condition": b["condition"],
            "drugs": b["drugs"],
            "evidence": {
                "source": "UCI ML Drug Review corpus",
                "caveat": LAYER_CAVEATS["drug_reviews"],
                "matched_condition": b["condition"],
                "match_score": b["match_score"],
                "match_method": b["match_method"],
                "ranking_note": (
                    "`rank` blends patient-reported outcome with how commonly "
                    "the drug is used for this condition; `rank_by_rating` is "
                    "the pure-quality order. They disagree, and the "
                    "disagreement is informative."),
                "layer_a_diagnostics": gate_diag,
            },
        }

    # ------------------------------------------------------------------
    def status(self) -> Dict:
        """Startup diagnostics for the health check."""
        out = {
            "layer_a_enabled": self.layer_a_enabled,
            "layer_b_conditions": len(self.art.treatment_table),
            "disease_links": len(self.art.disease_condition_link),
            "note_layer_enabled": self.art.note_layer_available,
            "text_condition_available": self.art.text_condition_available,
            "condition_match_floor": CONDITION_MATCH_FLOOR,
        }
        if self.layer_a_enabled:
            g = self.gate
            out["gate"] = {"sim_floor": g["sim_floor"],
                           "min_support": g["min_support"],
                           "cat_threshold": g["cat_threshold"]}
            out["mimic_admissions"] = int(self.art.mimic_matrix.shape[0])
        return out


_CASCADE: Optional[TreatmentCascade] = None


def get_cascade() -> TreatmentCascade:
    global _CASCADE
    if _CASCADE is None:
        _CASCADE = TreatmentCascade()
    return _CASCADE
