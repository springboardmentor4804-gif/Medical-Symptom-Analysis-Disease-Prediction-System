"""
Artifact loading for the MedAssist model layer.

Everything trained by kaggle_train.py lands in model/artifacts/. This module
loads it once per process, lazily, and exposes it as plain Python objects.

Two things here are not obvious and both will bite anyone who removes them:

1. UNPICKLE SHIM. model1_classifier.joblib holds a `SoftVoteEnsemble`, a class
   defined in the training script. Pickle stores the *import path* of a class,
   not its code, and because the trainer runs as `__main__` (whether executed
   as a script or pasted into a notebook cell) the recorded path is
   `__main__.SoftVoteEnsemble`. Without re-registering these classes into
   __main__ before joblib.load, loading dies with:
       AttributeError: Can't get attribute 'SoftVoteEnsemble' on <module '__main__'>

2. NUMPY 2.x REQUIREMENT. The artifacts were pickled on Kaggle under numpy 2.x.
   numpy 1.26 cannot read a 2.x BitGenerator and fails with:
       ValueError: <class 'numpy.random._pcg64.PCG64'> is not a known BitGenerator
   requirements.txt therefore pins numpy>=2. If you must stay on 1.26, the
   models have to be retrained under it - there is no load-time workaround.
"""

from __future__ import annotations

import json
import logging
import sys
import threading
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path(__file__).resolve().parents[2] / "model" / "artifacts"


# ---------------------------------------------------------------------------
# Unpickle shim
# ---------------------------------------------------------------------------

class SoftVoteEnsemble:
    """
    Weighted soft vote over probabilistic classifiers sharing a class order.

    Must stay structurally compatible with the definition in kaggle_train.py -
    pickle restores instance state directly into __dict__, so the attribute
    names (estimators, weights, classes_) are the real contract, not __init__.
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

    Not selected during the last training run (BernoulliNB won on top-3), but
    a future run could pick it, so the class must be resolvable or that
    artifact becomes unloadable.
    """

    def __init__(self, alpha=10.0, temperature=4.0):
        self.alpha = float(alpha)
        self.temperature = float(temperature)

    @staticmethod
    def _augment(X):
        from scipy import sparse
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
    """Make the training script's classes resolvable under __main__."""
    main = sys.modules.get("__main__")
    if main is None:
        return
    for cls in (SoftVoteEnsemble, SoftmaxRidge):
        if not hasattr(main, cls.__name__):
            setattr(main, cls.__name__, cls)


_register_unpickle_shim()


class ArtifactsUnavailable(RuntimeError):
    """Raised when the model directory is missing or a required file absent."""


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

# MUST be reentrant. Several properties are defined in terms of others -
# `disease_names` reads `label_encoder`, `risk_drivers` reads `risk_metrics` -
# so the loader for one cache key re-enters _get() for another while still
# holding the lock. A plain threading.Lock deadlocks the worker permanently on
# the first such access.
_LOCK = threading.RLock()


def _path(name: str) -> Path:
    p = ARTIFACT_DIR / name
    if not p.exists():
        raise ArtifactsUnavailable(
            f"Missing artifact {name} in {ARTIFACT_DIR}. Run kaggle_train.py and "
            f"copy its artifacts/ output here."
        )
    return p


def _load_joblib(name):
    _register_unpickle_shim()
    try:
        return joblib.load(_path(name))
    except ValueError as e:
        if "BitGenerator" in str(e):
            raise ArtifactsUnavailable(
                f"{name} was pickled under numpy 2.x but numpy {np.__version__} is "
                f"installed, which cannot read it. Install numpy>=2 "
                f"(see requirements.txt) or retrain the models under numpy 1.26."
            ) from e
        raise


def _load_json(name):
    with open(_path(name), encoding="utf-8") as f:
        return json.load(f)


class Artifacts:
    """
    Lazily-loaded, process-wide artifact bundle.

    Each property loads on first access and caches. A web worker therefore pays
    the cost once, and an endpoint that only needs the symptom vocabulary never
    touches the 3 MB risk models.
    """

    def __init__(self, directory: Path = ARTIFACT_DIR):
        self.dir = directory
        self._cache = {}

    def _get(self, key, loader):
        if key not in self._cache:
            with _LOCK:
                if key not in self._cache:
                    self._cache[key] = loader()
        return self._cache[key]

    # -- model 1: disease prediction --------------------------------------
    @property
    def disease_model(self):
        return self._get("m1", lambda: _load_joblib("model1_classifier.joblib"))

    @property
    def label_encoder(self):
        return self._get("le", lambda: _load_joblib("model1_label_encoder.joblib"))

    @property
    def disease_names(self):
        return self._get("dn", lambda: [str(c) for c in self.label_encoder.classes_])

    @property
    def symptom_columns(self):
        return self._get("cols", lambda: _load_json("model1_symptom_columns.json"))

    @property
    def symptom_evidence(self):
        return self._get("ev", lambda: _load_json("model1_symptom_evidence.json"))

    @property
    def disease_lookup(self):
        """disease_key -> {disease, symptoms, cures, doctor, risk_level, ...}"""
        def _load():
            df = pd.read_csv(_path("model1_disease_lookup.csv"))
            df = df[df["disease_key"].notna()]
            out = {}
            for rec in df.to_dict("records"):
                out[str(rec["disease_key"])] = {
                    k: v for k, v in rec.items()
                    if isinstance(v, str) and v.strip() and k != "disease_key"
                }
            return out
        return self._get("lookup", _load)

    @property
    def disease_metrics(self):
        return self._get("m1m", lambda: _load_json("model1_metrics.json"))

    @property
    def confidence_calibration(self):
        """Confidence bin -> empirically observed accuracy on the held-out set."""
        return self._get(
            "calib",
            lambda: self.disease_metrics.get("confidence_calibration", []))

    # -- model 2: chronic risk --------------------------------------------
    @property
    def risk_models(self):
        return self._get("m2", lambda: _load_joblib("model2_risk_models.joblib"))

    @property
    def risk_metrics(self):
        return self._get("m2m", lambda: _load_json("model2_metrics.json"))

    @property
    def risk_drivers(self):
        """condition -> ranked permutation-importance features, for the UI."""
        def _load():
            conds = self.risk_metrics.get("conditions", {})
            return {k: v.get("top_features", []) for k, v in conds.items()}
        return self._get("drivers", _load)

    # -- model 3: treatment -----------------------------------------------
    @property
    def treatment_table(self):
        def _load():
            df = pd.read_csv(_path("model3_treatment_table.csv"))
            return {k: v.sort_values("rank") for k, v in df.groupby("condition_key")}
        return self._get("m3", _load)

    @property
    def disease_condition_link(self):
        return self._get(
            "link", lambda: _load_json("model3_disease_condition_link.json"))

    @property
    def treatment_metrics(self):
        return self._get("m3m", lambda: _load_json("model3_metrics.json"))

    # -- shared ------------------------------------------------------------
    @property
    def severity_config(self):
        return self._get("sev", lambda: _load_json("severity_config.json"))

    @property
    def manifest(self):
        return self._get("mf", lambda: _load_json("manifest.json"))

    # -- diagnostics -------------------------------------------------------
    def status(self):
        """Per-artifact load report, surfaced by /system/model-status."""
        checks = {
            "disease_model": lambda: len(self.disease_model.classes_),
            "label_encoder": lambda: len(self.disease_names),
            "symptom_columns": lambda: len(self.symptom_columns),
            "symptom_evidence": lambda: len(self.symptom_evidence),
            "disease_lookup": lambda: len(self.disease_lookup),
            "risk_models": lambda: len(self.risk_models),
            "treatment_table": lambda: len(self.treatment_table),
            "disease_condition_link": lambda: len(self.disease_condition_link),
            "severity_config": lambda: len(self.severity_config.get("weights", {})),
        }
        out, ok = {}, True
        for name, fn in checks.items():
            try:
                out[name] = {"loaded": True, "size": int(fn())}
            except Exception as e:
                ok = False
                out[name] = {"loaded": False, "error": f"{type(e).__name__}: {e}"}
        return {"healthy": ok, "artifact_dir": str(self.dir), "artifacts": out}


@lru_cache(maxsize=1)
def get_artifacts() -> Artifacts:
    """Process-wide singleton."""
    return Artifacts()
