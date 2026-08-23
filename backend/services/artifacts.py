"""
Artifact loading for the MedAssist model layer.

Everything the Kaggle notebook trains lands in backend/artifacts/. This module
loads it once per process and exposes it as plain Python objects. Nothing here
fits, downloads or touches the network - inference only.

Three things here are not obvious and all three will bite anyone who removes
them:

1. UNPICKLE SHIM. model1_classifier.joblib holds a `SoftVoteEnsemble`, a class
   defined in the training notebook. Pickle stores the *import path* of a
   class, not its code, and because the trainer runs as `__main__` (whether as
   a script or a notebook cell) the recorded path is `__main__.SoftVoteEnsemble`.
   Without re-registering these classes into __main__ before joblib.load,
   loading dies with:
       AttributeError: Can't get attribute 'SoftVoteEnsemble' on <module '__main__'>

2. NUMPY 2.x REQUIREMENT. The artifacts were pickled on Kaggle under numpy 2.x.
   numpy 1.26 cannot read a 2.x BitGenerator and fails with:
       ValueError: <class 'numpy.random._pcg64.PCG64'> is not a known BitGenerator
   requirements.txt therefore pins numpy>=2. There is no load-time workaround;
   the models would have to be retrained under 1.26.

3. THE 100 MB LAZY LOAD. model3_text_condition.joblib is a 100 MB free-text ->
   condition classifier used only when Layer B has to resolve unstructured
   text. It is deliberately NOT part of the startup health check and NOT
   touched by `preload()`. Loading it eagerly would add ~10 s and ~1 GB of RSS
   to every worker for a code path most requests never reach.

REQUIRED vs OPTIONAL is declared once, in REQUIRED_FILES / OPTIONAL_FILES
below, and enforced by `health_check()` at startup. A missing required file
fails loudly with its filename; a missing optional file degrades a named
feature and says so. Nothing here substitutes a default for absent data.
"""

from __future__ import annotations

import difflib
import json
import re
import logging
import sys
import threading
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy import sparse

logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "artifacts"


# Absent -> the application must not start. Each entry is (filename, purpose).
REQUIRED_FILES = {
    "model1_classifier.joblib": "disease prediction",
    "model1_label_encoder.joblib": "disease prediction",
    "model1_symptom_columns.json": "disease prediction",
    "model1_symptom_evidence.json": "disease prediction",
    "model1_metrics.json": "disease prediction",
    "model2_risk_models.joblib": "chronic risk",
    "model2_metrics.json": "chronic risk",
    "model2_condition_metrics.csv": "chronic risk",
    "model3_treatment_table.csv": "treatment cascade layer B",
    "model3_disease_condition_link.json": "treatment cascade layer B",
    "model3_metrics.json": "treatment cascade",
    "severity_config.json": "severity engine",
}

# Absent -> a specific feature switches off, the rest of the app runs.
OPTIONAL_FILES = {
    "model3_mimic_layer.joblib": "treatment cascade layer A (MIMIC-IV)",
    "model3_mimic_matrix.npz": "treatment cascade layer A (MIMIC-IV)",
    "model3_mimic_records.csv": "treatment cascade layer A neighbour display",
    "model3_note_vectorizer.joblib": "similar-real-case lookup",
    "model3_note_matrix.npz": "similar-real-case lookup",
    "model3_note_reference.csv": "similar-real-case lookup",
    "model3_text_condition.joblib": "free-text condition classifier (lazy)",
    "model3_cascade_metrics.json": "cascade diagnostics",
    "model3_note_metrics.json": "note-layer diagnostics",
    "model1_disease_lookup.csv": "plain-language disease reference text",
    "MANIFEST.json": "build provenance",
}

# Layer A needs all three to run at all.
LAYER_A_FILES = (
    "model3_mimic_layer.joblib",
    "model3_mimic_matrix.npz",
    "model3_mimic_records.csv",
)

NOTE_LAYER_FILES = (
    "model3_note_vectorizer.joblib",
    "model3_note_matrix.npz",
    "model3_note_reference.csv",
)


# ---------------------------------------------------------------------------
# Unpickle shim
# ---------------------------------------------------------------------------

class SoftVoteEnsemble:
    """
    Weighted soft vote over probabilistic classifiers sharing a class order.

    Must stay structurally compatible with the definition in the training
    notebook - pickle restores instance state directly into __dict__, so the
    attribute names (estimators, weights, classes_) are the real contract, not
    __init__.
    """

    def __init__(self, estimators, weights):
        self.estimators = estimators
        w = np.asarray(weights, dtype=np.float64)
        self.weights = w / w.sum()
        self.classes_ = estimators[0][1].classes_

    def predict_proba(self, X):
        out = None
        for (_, est), w in zip(self.estimators, self.weights):
            p = w * est.predict_proba(X)
            out = p if out is None else out + p
        out /= np.clip(out.sum(axis=1, keepdims=True), 1e-12, None)
        return out

    def predict(self, X):
        return self.classes_[np.argmax(self.predict_proba(X), axis=1)]


class SoftmaxRidge:
    """
    Multi-class ridge with a temperature-scaled softmax.

    Not selected during the last training run (BernoulliNB won on top-3), but a
    future run could pick it, so the class must be resolvable or that artifact
    becomes unloadable.
    """

    def __init__(self, alpha=10.0, temperature=4.0):
        self.alpha = float(alpha)
        self.temperature = float(temperature)

    @staticmethod
    def _augment(X):
        ones = sparse.csr_matrix(np.ones((X.shape[0], 1), dtype=np.float32))
        return sparse.hstack([X, ones], format="csr")

    def decision_function(self, X):
        return self._augment(X) @ self.coef_

    def predict_proba(self, X):
        z = np.asarray(self.decision_function(X), dtype=np.float64)
        z *= self.temperature
        z -= z.max(axis=1, keepdims=True)
        np.exp(z, out=z)
        z /= z.sum(axis=1, keepdims=True)
        return z

    def predict(self, X):
        return self.classes_[np.argmax(self.decision_function(X), axis=1)]


def _register_unpickle_shim():
    """Make the training notebook's classes resolvable under __main__."""
    main = sys.modules.get("__main__")
    if main is None:
        return
    for cls in (SoftVoteEnsemble, SoftmaxRidge):
        if not hasattr(main, cls.__name__):
            setattr(main, cls.__name__, cls)


_register_unpickle_shim()


def _link_plausibility(disease: str, condition: str) -> float:
    """
    Is `condition` a recognisable name for `disease`? 0..1.

    Deliberately local and simple rather than importing the cascade's matcher -
    artifacts.py must not depend on the modules that consume it. It only has to
    separate a real (if misspelt) condition name from a two-letter fragment.
    """
    d = {t for t in re.sub(r"[^a-z0-9]+", " ", str(disease).lower().strip()).split() if t}
    c = {t for t in re.sub(r"[^a-z0-9]+", " ", str(condition).lower().strip()).split() if t}
    if not d or not c:
        return 0.0
    hits = 0
    for word in c:
        if word in d or any(
                difflib.SequenceMatcher(None, word, dw).ratio() >= 0.8 for dw in d):
            hits += 1
    return hits / len(c)


class ArtifactsUnavailable(RuntimeError):
    """Raised when the artifact directory is missing or a required file absent."""


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

# MUST be reentrant. Several properties are defined in terms of others -
# `disease_names` reads `label_encoder`, `risk_drivers` reads `risk_metrics` -
# so the loader for one cache key re-enters _get() for another while still
# holding the lock. A plain threading.Lock deadlocks the worker permanently on
# the first such access.
_LOCK = threading.RLock()


class Artifacts:
    """
    Process-wide artifact bundle.

    Each property loads on first access and caches. `preload()` warms
    everything the request path needs at startup so the first real request does
    not pay a 1-2 s penalty; per-call inference is then ~10 ms.
    """

    def __init__(self, directory: Path = ARTIFACT_DIR):
        self.dir = Path(directory)
        self._cache = {}

    # -- primitives --------------------------------------------------------
    def path(self, name: str) -> Path:
        p = self.dir / name
        if not p.exists():
            raise ArtifactsUnavailable(
                f"Missing artifact '{name}' in {self.dir}. Re-export it from the "
                f"training notebook - the application will not serve inference "
                f"without it."
            )
        return p

    def exists(self, name: str) -> bool:
        return (self.dir / name).exists()

    def _get(self, key, loader):
        if key not in self._cache:
            with _LOCK:
                if key not in self._cache:
                    self._cache[key] = loader()
        return self._cache[key]

    def load_joblib(self, name):
        _register_unpickle_shim()
        try:
            return joblib.load(self.path(name))
        except ValueError as e:
            if "BitGenerator" in str(e):
                raise ArtifactsUnavailable(
                    f"{name} was pickled under numpy 2.x but numpy "
                    f"{np.__version__} is installed, which cannot read it. "
                    f"Install numpy>=2 (see requirements.txt)."
                ) from e
            raise

    def load_json(self, name):
        with open(self.path(name), encoding="utf-8") as f:
            return json.load(f)

    def load_npz(self, name):
        return sparse.load_npz(self.path(name))

    # -- model 1: disease prediction --------------------------------------
    @property
    def disease_model(self):
        return self._get("m1", lambda: self.load_joblib("model1_classifier.joblib"))

    @property
    def label_encoder(self):
        return self._get("le", lambda: self.load_joblib("model1_label_encoder.joblib"))

    @property
    def disease_names(self):
        return self._get("dn", lambda: [str(c) for c in self.label_encoder.classes_])

    @property
    def symptom_columns(self):
        """The 377 feature names, in the exact order the model was fitted on."""
        return self._get("cols", lambda: self.load_json("model1_symptom_columns.json"))

    @property
    def symptom_evidence(self):
        return self._get("ev", lambda: self.load_json("model1_symptom_evidence.json"))

    @property
    def disease_metrics(self):
        return self._get("m1m", lambda: self.load_json("model1_metrics.json"))

    @property
    def confidence_calibration(self):
        """Confidence bin -> empirically observed accuracy on the held-out set."""
        return self._get(
            "calib",
            lambda: self.disease_metrics.get("confidence_calibration", []))

    @property
    def disease_lookup(self):
        """
        disease_key -> {disease, symptoms, cures, doctor, risk_level, ...}

        OPTIONAL and partial: the lookup covers 159 keys against the model's 684
        classes, so most predictions have no entry. Callers must treat a miss as
        normal and render nothing, never a placeholder.
        """
        def _load():
            if not self.exists("model1_disease_lookup.csv"):
                return {}
            df = pd.read_csv(self.path("model1_disease_lookup.csv"))
            df = df[df["disease_key"].notna()]
            out = {}
            for rec in df.to_dict("records"):
                out[str(rec["disease_key"])] = {
                    k: v for k, v in rec.items()
                    if isinstance(v, str) and v.strip() and k != "disease_key"
                }
            return out
        return self._get("lookup", _load)

    # -- model 2: chronic risk --------------------------------------------
    @property
    def risk_models(self):
        """condition -> {model, calibrator, features, threshold, percentiles}."""
        return self._get("m2", lambda: self.load_joblib("model2_risk_models.joblib"))

    @property
    def risk_metrics(self):
        return self._get("m2m", lambda: self.load_json("model2_metrics.json"))

    @property
    def risk_condition_metrics(self):
        """Per-condition held-out scores, including the tuned threshold."""
        def _load():
            df = pd.read_csv(self.path("model2_condition_metrics.csv"))
            return {str(r["condition"]): {k: r[k] for k in df.columns if k != "condition"}
                    for _, r in df.iterrows()}
        return self._get("m2c", _load)

    @property
    def risk_drivers(self):
        """condition -> ranked permutation-importance features, for the UI."""
        def _load():
            conds = self.risk_metrics.get("conditions", {})
            return {k: v.get("top_features", []) for k, v in conds.items()}
        return self._get("drivers", _load)

    # -- model 3 layer B: drug-review rankings -----------------------------
    @property
    def treatment_table(self):
        """condition_key -> rank-sorted DataFrame of drugs."""
        def _load():
            df = pd.read_csv(self.path("model3_treatment_table.csv"))
            return {k: v.sort_values("rank") for k, v in df.groupby("condition_key")}
        return self._get("m3", _load)

    @property
    def disease_condition_link(self):
        """
        Model 1 disease name -> drug-review condition_key, with the artifact's
        substring-collision links removed.

        The notebook builds 112 of these 219 links by substring match, and that
        matcher has no word-boundary check. The result is a set of two- and
        three-letter fragments acting as catch-all buckets:

            'ge'  <- asper(ge)r syndrome, (ge)nital herpes, esophageal cancer,
                     intracerebral hemorrhage, ... 27 diseases, 1 drug total
                     (amlodipine/valsartan - a blood-pressure drug)
            'min' <- abdo(min)al aortic aneurysm, vita(min) b12 deficiency ...
            'gas' <- (gas)tritis, (gas)troesophageal reflux ...

        Serving one antihypertensive as "the treatment" for 27 unrelated
        diseases is worse than serving nothing, so those links are dropped and
        the diseases fall through to the cascade's normal resolution.

        The test is deliberately narrow - the condition key must appear inside
        the disease name WITHOUT word boundaries. That is the exact signature of
        the collision, and it spares the legitimate short links the same
        matcher produced:

            'flu' -> 'influenza'      (target is not a substring of the source)
            'allergy' -> 'allergies'  (morphological variant, not a fragment)

        Repairing here rather than by rewriting the JSON means a fresh export
        from the notebook is corrected too, instead of silently reintroducing
        the bug. Fixing it upstream in the link builder is still the right
        long-term move.
        """
        def _load():
            raw = self.load_json("model3_disease_condition_link.json")
            table = self.treatment_table
            kept, dropped = {}, {}
            for disease, condition in raw.items():
                if condition not in table:
                    dropped[disease] = f"{condition} (not in treatment table)"
                    continue
                d_norm = re.sub(r"[^a-z0-9]+", " ", str(disease).lower())
                c_norm = re.sub(r"[^a-z0-9]+", " ", str(condition).lower()).strip()
                # A collision needs BOTH signals: the key hides inside the
                # disease name without word boundaries, AND it is not a
                # recognisable name for that disease.
                #
                # The second test matters because the treatment table also
                # contains keys with a character lopped off the end or front -
                # 'skin cance', 'bipolar disorde', 'ibromyalgia'. Those trip
                # the substring test too, but they are the RIGHT condition and
                # dropping them would throw away real coverage. They score well
                # above the floor against their disease, so they survive.
                collides = (c_norm in d_norm
                            and not re.search(rf"\b{re.escape(c_norm)}\b", d_norm))
                if collides and _link_plausibility(disease, condition) < 0.45:
                    dropped[disease] = f"{condition} (substring collision)"
                    continue
                kept[disease] = condition
            if dropped:
                logger.warning(
                    "disease_condition_link: dropped %d of %d links as "
                    "substring collisions (e.g. %s). Fix the link builder in "
                    "the training notebook.",
                    len(dropped), len(raw),
                    "; ".join(f"{k} -> {v}" for k, v in list(dropped.items())[:3]))
            self._cache["link_dropped"] = dropped
            return kept
        return self._get("link", _load)

    @property
    def disease_link_dropped(self) -> dict:
        """Links rejected by the repair above, for /system/model-status."""
        _ = self.disease_condition_link
        return self._cache.get("link_dropped", {})

    @property
    def treatment_metrics(self):
        return self._get("m3m", lambda: self.load_json("model3_metrics.json"))

    # -- model 3 layer A: MIMIC-IV discharge prescriptions -----------------
    @property
    def layer_a_available(self) -> bool:
        return all(self.exists(f) for f in LAYER_A_FILES)

    @property
    def mimic_layer(self):
        """
        {vec, mlb, stage1, stage2, stage2_lab, stage2_fb, categories, gate}

        The `gate` key carries the thresholds tuned in the notebook. Read them
        from here - never copy the numbers into Python constants, or the next
        retrain silently diverges from what the app enforces.
        """
        return self._get("m3a", lambda: self.load_joblib("model3_mimic_layer.joblib"))

    @property
    def mimic_matrix(self):
        return self._get("m3am", lambda: self.load_npz("model3_mimic_matrix.npz"))

    @property
    def mimic_records(self):
        def _load():
            return pd.read_csv(self.path("model3_mimic_records.csv")).fillna("")
        return self._get("m3ar", _load)

    @property
    def cascade_metrics(self):
        def _load():
            if not self.exists("model3_cascade_metrics.json"):
                return {}
            return self.load_json("model3_cascade_metrics.json")
        return self._get("m3cm", _load)

    # -- model 3: similar-case note lookup (optional) ----------------------
    @property
    def note_layer_available(self) -> bool:
        return all(self.exists(f) for f in NOTE_LAYER_FILES)

    @property
    def note_vectorizer(self):
        return self._get(
            "nv", lambda: self.load_joblib("model3_note_vectorizer.joblib"))

    @property
    def note_matrix(self):
        return self._get("nm", lambda: self.load_npz("model3_note_matrix.npz"))

    @property
    def note_reference(self):
        def _load():
            return pd.read_csv(self.path("model3_note_reference.csv")).fillna("")
        return self._get("nr", _load)

    @property
    def note_metrics(self):
        def _load():
            if not self.exists("model3_note_metrics.json"):
                return {}
            return self.load_json("model3_note_metrics.json")
        return self._get("nmx", _load)

    # -- model 3: 100 MB free-text classifier, LAZY ------------------------
    @property
    def text_condition_available(self) -> bool:
        return self.exists("model3_text_condition.joblib")

    @property
    def text_condition_model(self):
        """
        100 MB free-text -> condition classifier.

        Loaded on FIRST USE, never at startup. Touching this property costs
        several seconds and roughly a gigabyte of resident memory, so it must
        stay off the health-check and preload paths.
        """
        def _load():
            logger.info(
                "Lazily loading model3_text_condition.joblib (100 MB); this "
                "takes a few seconds and happens once per worker.")
            return self.load_joblib("model3_text_condition.joblib")
        return self._get("m3t", _load)

    # -- shared ------------------------------------------------------------
    @property
    def severity_config(self):
        return self._get("sev", lambda: self.load_json("severity_config.json"))

    @property
    def manifest(self):
        def _load():
            for name in ("MANIFEST.json", "manifest.json"):
                if self.exists(name):
                    return self.load_json(name)
            return {}
        return self._get("mf", _load)

    # -- startup -----------------------------------------------------------
    def preload(self):
        """
        Warm every artifact on the request path, once, at startup.

        Excludes model3_text_condition.joblib by design - see the class
        docstring.
        """
        _ = (self.disease_model, self.label_encoder, self.symptom_columns,
             self.symptom_evidence, self.confidence_calibration,
             self.disease_lookup, self.risk_models, self.risk_drivers,
             self.treatment_table, self.disease_condition_link,
             self.severity_config)
        if self.layer_a_available:
            _ = (self.mimic_layer, self.mimic_matrix, self.mimic_records)
        if self.note_layer_available:
            _ = (self.note_vectorizer, self.note_matrix, self.note_reference)

    def health_check(self) -> dict:
        """
        Per-artifact load report. Raises if a REQUIRED file is missing or
        unloadable; optional gaps are reported as disabled features.
        """
        if not self.dir.is_dir():
            raise ArtifactsUnavailable(f"Artifact directory not found: {self.dir}")

        missing_required = [n for n in REQUIRED_FILES if not self.exists(n)]
        if missing_required:
            raise ArtifactsUnavailable(
                "Missing required artifacts in "
                f"{self.dir}: {', '.join(sorted(missing_required))}")

        probes = {
            "disease_model": lambda: len(self.disease_model.classes_),
            "label_encoder": lambda: len(self.disease_names),
            "symptom_columns": lambda: len(self.symptom_columns),
            "symptom_evidence": lambda: len(self.symptom_evidence),
            "risk_models": lambda: len(self.risk_models),
            "treatment_table": lambda: len(self.treatment_table),
            "disease_condition_link": lambda: len(self.disease_condition_link),
            "severity_config": lambda: len(self.severity_config.get("weights", {})),
        }
        if self.layer_a_available:
            probes["mimic_layer"] = lambda: self.mimic_matrix.shape[0]
        if self.note_layer_available:
            probes["note_layer"] = lambda: self.note_matrix.shape[0]
        if self.disease_lookup:
            probes["disease_lookup"] = lambda: len(self.disease_lookup)

        report, failures = {}, []
        for name, fn in probes.items():
            try:
                report[name] = {"loaded": True, "rows": int(fn())}
            except Exception as e:                      # noqa: BLE001
                report[name] = {"loaded": False,
                                "error": f"{type(e).__name__}: {e}"}
                failures.append(f"{name}: {type(e).__name__}: {e}")

        if failures:
            raise ArtifactsUnavailable(
                "Required artifacts present but unloadable - " + "; ".join(failures))

        disabled = {
            purpose for name, purpose in OPTIONAL_FILES.items()
            if not self.exists(name)
        }
        return {
            "healthy": True,
            "artifact_dir": str(self.dir),
            "artifacts": report,
            "layer_a_enabled": self.layer_a_available,
            "note_layer_enabled": self.note_layer_available,
            "text_condition_available": self.text_condition_available,
            "text_condition_loaded": "m3t" in self._cache,
            "disabled_features": sorted(disabled),
        }

    # Kept under the old name because /system/model-status calls it.
    def status(self) -> dict:
        try:
            return self.health_check()
        except ArtifactsUnavailable as e:
            return {"healthy": False, "artifact_dir": str(self.dir),
                    "error": str(e), "artifacts": {}}


@lru_cache(maxsize=1)
def get_artifacts() -> Artifacts:
    """Process-wide singleton."""
    return Artifacts()
