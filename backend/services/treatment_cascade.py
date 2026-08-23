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
from collections import Counter
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

    # Partial coverage is penalised QUADRATICALLY, not linearly. Half the words
    # of a condition matching is not half a match - it is usually a different
    # condition that happens to share an adjective. "interstitial lung" matched
    # "interstitial cystitis" at exactly 0.45 under linear scoring and returned
    # Elmiron and pentosan polysulfate, which are bladder drugs, for a lung
    # disease. Squaring drops that pair to 0.24 and out of range.
    token_score = 0.95 * (coverage ** 2)

    # A query that is the opening of a condition name IS that condition, more
    # specifically named: "diabetes" -> "diabetes type 2", "herpes" ->
    # "herpes simplex". Quadratic coverage alone would reject these, and unlike
    # the case above the extra words narrow the condition rather than relocate
    # it to another organ.
    prefix = 0.9 if (c.startswith(q + " ") or q.startswith(c + " ")) else 0.0

    # Near-identical whole strings (typo of a full condition name).
    ratio = difflib.SequenceMatcher(None, q, c).ratio()
    whole = ratio if ratio >= _WHOLE_STRING_CUTOFF else 0.0

    return float(max(token_score, prefix, whole))


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
    #
    # WHY THIS IS NOT JUST stage1 -> stage2
    #
    # Taking stage 1's classes at face value and naming one drug per class
    # produced ward-routine polypharmacy for every query: "migraine" returned
    # docusate sodium and aspirin, "depression" returned ciprofloxacin. Two
    # things cause that, and both are properties of the data, not bugs in the
    # artifact:
    #
    #   1. Stage 1's PRIOR already clears cat_threshold for all 13 classes. Ask
    #      it about a query with no vocabulary overlap and it still answers
    #      "analgesic 0.50, gi_medication 0.48, antibiotic 0.47, ...", because
    #      almost every ICU admission receives one of each. A raw probability
    #      of 0.5 therefore carries no information about THIS diagnosis. What
    #      matters is the LIFT over that prior, and the prior is read from the
    #      model itself (a null query), never hard-coded.
    #
    #   2. Stage 2 names the modal drug within a class, which is the most
    #      commonly prescribed one overall - docusate for gi_medication,
    #      aspirin for anticoagulant - regardless of the diagnosis.
    #
    # So classes are filtered by lift, and the drugs themselves come from what
    # the genuinely similar admissions were actually prescribed, scored against
    # the corpus base rate. That is both more accurate and a more honest
    # rendering of the claim the layer makes: "clinicians treating similar
    # admissions prescribed these". Stage 2 is retained as corroboration on the
    # drug it independently endorses.
    #
    # The three gates in the spec are unchanged and still read from the
    # artifact's "gate" key.

    # A drug class must be this much likelier than stage 1's own prior before
    # it counts as diagnosis-specific. Ranking filter, NOT a model threshold:
    # the tuned gates stay in the artifact. 1.0 would mean "no evidence at all",
    # so this is the smallest value that still demands the query moved the
    # model.
    CLASS_LIFT_FLOOR = 1.5

    # Same idea for an individual drug against its corpus-wide frequency.
    DRUG_LIFT_FLOOR = 1.5

    # A single drug is a coincidence, not a prescribing pattern. Layer A claims
    # "clinicians treating similar admissions prescribed these"; one surviving
    # drug does not support that claim, and Layer B - which is condition-
    # specific by construction - is the better answer in that case. This is
    # what stops "depression" being answered with a lone bronchodilator.
    MIN_PATTERN_DRUGS = 2

    # Words that qualify a diagnosis without naming one. A neighbourhood match
    # resting only on these is not a clinical match: "acute bronchiolitis" hit
    # "acute cholecystitis" at 0.39 similarity on the word "acute" alone,
    # cleared every gate, and recommended metformin.
    #
    # A stop-list rather than a frequency cut-off because the corpus is small
    # and diverse enough that frequency cannot separate them - "acute" appears
    # in 9.3% of discharge diagnoses and "hypertension" in 8.8%, so any
    # threshold that removes the qualifier also removes a real condition. These
    # are qualifiers by grammar, not by rarity.
    GENERIC_TERMS = frozenset({
        "acute", "chronic", "subacute", "recurrent", "persistent", "severe",
        "mild", "moderate", "left", "right", "bilateral", "upper", "lower",
        "with", "and", "the", "for", "due", "status", "post", "history",
        "unspecified", "other", "disease", "disorder", "syndrome", "pain",
        "infection", "failure", "injury", "acquired", "suspected", "possible",
        "new", "old", "large", "small",
    })

    # Dose, route, frequency and MIMIC's ___ redactions, stripped so that
    # "Guaifenesin ___ mL PO Q6H" and "Guaifenesin" are one drug rather than
    # two singletons that each look rare and therefore high-lift.
    _DOSE_NOISE = re.compile(
        r"\s*[\(\[].*?[\)\]]"                       # (5mg-325mg), [Tylenol]
        r"|_+"                                       # ___ redactions
        r"|\b\d+(\.\d+)?\s*(mg|mcg|ml|unit|units|g|%)\b.*$"
        r"|\b(po|iv|pr|sc|im|q\d+h|bid|tid|qid|daily|prn|inhaler|nebu|neb|mdi"
        r"|diskus|suspension|liquid|tablet|capsule|nasal|patch|cream|ointment)\b.*$",
        re.IGNORECASE,
    )

    @staticmethod
    def _clean_drug(name: str) -> str:
        cleaned = TreatmentCascade._DOSE_NOISE.sub("", str(name or ""))
        return re.sub(r"\s+", " ", cleaned).strip(" -/,")

    @property
    def _corpus(self):
        """
        (per-admission drug sets, corpus frequency, n_admissions).

        Built once. The frequency table is the baseline every drug is scored
        against - without it "aspirin" looks impressive for every diagnosis in
        the corpus, because two thirds of admissions receive it.
        """
        def _build():
            records = self.art.mimic_records
            sets = []
            for raw in records.get("medications", []):
                drugs = set()
                for part in str(raw).split(";"):
                    cleaned = self._clean_drug(part).lower()
                    if len(cleaned) > 2:
                        drugs.add(cleaned)
                sets.append(drugs)
            freq = Counter()
            for s in sets:
                freq.update(s)
            return sets, freq, max(len(sets), 1)
        return self.art._get("mimic_corpus", _build)

    def _shares_distinctive_term(self, query: str, idx) -> bool:
        """
        Is the neighbourhood match driven by anything but filler words?

        True when the query and at least one matched admission share a word
        that actually names something - so "acute kidney injury" matching
        "hypernatremia acute kidney injury" passes on "kidney", while "acute
        bronchiolitis" matching "acute cholecystitis" fails, because "acute" is
        all they have in common.
        """
        q = _tokens(query) - self.GENERIC_TERMS
        if not q:
            return False
        texts = self.art.mimic_records.get("diagnosis_text", [])
        for i in idx:
            if q & (_tokens(str(texts.iloc[int(i)])) - self.GENERIC_TERMS):
                return True
        return False

    @property
    def _class_prior(self) -> np.ndarray:
        """
        Stage 1's output for a query it knows nothing about.

        A string guaranteed to miss the vectoriser's vocabulary yields the
        all-zero feature vector, so what comes back is the model's prior. Read
        from the model rather than written down, so it follows a retrain.
        """
        def _build():
            layer = self.art.mimic_layer
            null = layer["vec"].transform(["zzzz nonvocabulary sentinel zzzz"])
            return layer["stage1"].predict_proba(null)[0]
        return self.art._get("stage1_prior", _build)

    def _classify_drug(self, drug: str) -> Optional[str]:
        """Map a drug name onto a stage-1 class using the artifact's keywords."""
        categories = self.art.mimic_layer.get("categories", {})
        low = drug.lower()
        for category, keywords in categories.items():
            if any(str(k).lower() in low for k in keywords):
                return category
        return None

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

        Q = layer["vec"].transform([query])

        # Both the query and the stored matrix are L2-normalised TF-IDF rows,
        # so the dot product IS cosine similarity.
        sims = np.asarray((Q @ self.art.mimic_matrix.T).todense()).ravel()
        best_sim = float(sims.max()) if sims.size else 0.0
        neighbour_idx = [int(i) for i in np.where(sims >= sim_floor)[0]]
        supporting = len(neighbour_idx)

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

        # -- gate 2b: is the match driven by a real clinical term? ---------
        if not self._shares_distinctive_term(query, neighbour_idx):
            return {"passed": False, "gate_reason": "nonspecific_match",
                    "diagnostics": base}

        # -- gate 3: does stage 1 commit to any drug class for THIS query? --
        classes = list(layer["mlb"].classes_)
        proba = layer["stage1"].predict_proba(Q)[0]
        prior = self._class_prior
        endorsed = {}
        for i, name in enumerate(classes):
            if name == _CATCHALL_CATEGORY:
                continue
            p = float(proba[i])
            if p < cat_threshold:
                continue
            lift = p / max(float(prior[i]), 1e-9)
            if lift >= self.CLASS_LIFT_FLOOR:
                endorsed[name] = {"probability": round(p, 4),
                                  "prior": round(float(prior[i]), 4),
                                  "lift": round(lift, 2)}
        base["endorsed_classes"] = endorsed
        if not endorsed:
            return {"passed": False, "gate_reason": "no_class_predicted",
                    "diagnostics": base}

        # -- what were similar patients actually prescribed? ---------------
        med_sets, corpus_freq, n_corpus = self._corpus
        weight_total = float(sum(sims[i] for i in neighbour_idx)) or 1.0
        support_count, weighted = Counter(), Counter()
        for i in neighbour_idx:
            for drug in med_sets[i]:
                support_count[drug] += 1
                weighted[drug] += float(sims[i])

        # Stage 2's own pick per endorsed class, used only to corroborate.
        stage2_pick = {}
        for category in endorsed:
            model = layer["stage2"].get(category)
            binarizer = layer["stage2_lab"].get(category)
            if model is None or binarizer is None:
                continue
            labels = np.asarray(binarizer.classes_)
            probs = model.predict_proba(Q)[0]
            for j in np.argsort(probs)[::-1]:
                label = str(labels[j])
                if not _PLACEHOLDER_LABEL.match(label):
                    stage2_pick[self._clean_drug(label).lower()] = float(probs[j])
                    break

        candidates = []
        for drug, count in support_count.items():
            # Backed by at least as many real admissions as the gate demands.
            if count < min_support:
                continue
            share = weighted[drug] / weight_total
            lift = share / max(corpus_freq[drug] / n_corpus, 1e-9)
            if lift < self.DRUG_LIFT_FLOOR:
                continue
            category = self._classify_drug(drug)
            # Keep only drugs belonging to a class stage 1 endorsed for this
            # query. This is what stops an irrelevant neighbourhood leaking
            # ward-routine drugs into an out-of-domain answer.
            if category is None or category not in endorsed:
                continue
            candidates.append({
                "drug": drug.title(),
                "drug_class": category.replace("_", " "),
                "supporting_notes": count,
                "co_prescription_rate": round(float(share), 3),
                "lift_vs_corpus": round(float(lift), 2),
                "class_confidence": endorsed[category]["probability"],
                "class_lift": endorsed[category]["lift"],
                "stage2_confirmed": drug in stage2_pick,
                "drug_confidence": (round(stage2_pick[drug], 4)
                                    if drug in stage2_pick else None),
                # Prevalence among similar cases, damped by how distinctive the
                # drug is. Without the lift term the list is just "what every
                # inpatient gets"; without the share term it is dominated by
                # one-off drugs that appear in a single admission.
                "_rank": float(share) * float(np.log1p(lift)),
            })

        # -- gate 4: did a prescribing PATTERN survive? --------------------
        if len(candidates) < self.MIN_PATTERN_DRUGS:
            base["surviving_drugs"] = len(candidates)
            return {"passed": False, "gate_reason": "no_drug_predicted",
                    "diagnostics": base}

        candidates.sort(key=lambda d: -d["_rank"])
        drugs = candidates[:top_n]
        for rank, d in enumerate(drugs, start=1):
            d["rank"] = rank
            d.pop("_rank", None)

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
