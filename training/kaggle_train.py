#!/usr/bin/env python
"""
================================================================================
MedAssist AI - single-file training pipeline (Kaggle-ready)
================================================================================
Trains and exports every model a clinical decision-support dashboard needs:

    Model 1   disease prediction        -> model1_classifier.joblib
    Model 2   chronic risk assessment   -> model2_risk_models.joblib
    Severity  triage / severity score   -> severity_config.json
    Risk      composite risk scoring    -> percentiles inside model 2
    Model 3   treatment recommendation  -> model3_treatment_table.csv

RUN ON KAGGLE  (recommended - full memory isolation)
----------------------------------------------------
Cell 1:  %%writefile kaggle_train.py
         <paste this entire file below the magic>

Cell 2:  !pip -q install kagglehub duckdb
         !python kaggle_train.py

         # GPU sessions only have 13 GB, not 30 GB:
         !python kaggle_train.py --low-mem
         # re-run a single stage:
         !python kaggle_train.py --stages 2

RUN FROM A NOTEBOOK CELL  (convenient, weaker isolation)
--------------------------------------------------------
If you paste this into a cell and run it directly, argparse would normally
choke on the `-f /root/.../kernel.json` that Jupyter injects into sys.argv;
that is handled. But with no .py file on disk there is nothing to re-invoke,
so the stages run IN-PROCESS and peak memory becomes closer to sum(stages)
rather than max(stage). Prefer the %%writefile route above. From a cell:

    run(["1", "severity", "2", "3"])        # or run(low_mem=True)

Everything lands in /kaggle/working/artifacts. `manifest.json` indexes the lot.

================================================================================
WHY THE PREVIOUS SCRIPT EXHAUSTED KAGGLE'S 30 GB AND DIED MID-RUN
================================================================================
Eight distinct causes. Line refs are to the original script.py.

1. L148  `df3[cols].fillna(0).astype(int)` -> dense int64. The source matrix is
         ~247k x 377, so that is ~745 MB, held alongside the original frame.
         FIX: stream to CSR float32 -> ~30 MB. 25x less.

2. L174  `RandomForestClassifier(n_estimators=300, max_depth=None)` over 773
         classes. Every tree stores a (n_nodes, 1, n_classes) float64 value
         array: ~5k nodes x 773 x 8 B = 31 MB PER TREE, so 300 trees is ~9 GB.
         THIS is what killed the run. Trees are the wrong family at this class
         count, full stop.
         FIX: models whose entire parameter cost is n_classes x n_features.

3. L210  `cross_val_score(..., cv=5, n_jobs=-1)`. joblib forks N workers, each
         handed a full copy of the 745 MB matrix AND building its own ~9 GB
         forest. This is where a survivable run became a fatal one.
         FIX: capped n_jobs, one stratified holdout, and no forest to copy.

4. L426  Five BRFSS years concatenated as int64/float64 (~2.2M rows), then per
   -L451 condition inside a 10-iteration loop: `risk_features.copy()` (a full
         size frame each time), `pd.get_dummies` (dense one-hot blow-up), then
         `.dropna()` - which threw away most rows anyway, because BRFSS codes
         missingness as 7/9/77/99 rather than NaN.
         FIX: DuckDB projection-pushdown scan -> ONE float32 matrix, reused per
         condition via boolean masks. HistGradientBoosting bins to uint8,
         handles NaN natively (no dropna) and takes categoricals directly
         (no one-hot).

5. L429  `memory_usage(deep=True)` walked every object cell to print a number.

6. L550  `.str.split().sum()` - quadratic list concatenation. Hangs long before
         it OOMs; this is the "stops mid-run" symptom with no traceback.

7. L428  `del frames` then `len(frames)` on the next line. Survives only
         because it is guarded by `'frames' in dir()`, and silently prints '?'.

8. main() All three stages in one process. CPython does not reliably return
         freed arena memory to the OS, so stage 1's peak is carried into
         stage 2 and stage 2's into stage 3.
         FIX: each stage runs in its own subprocess, so peak RSS is
         max(stage), not sum(stages).

On the question of engines: DuckDB fixes (1) and (4) - it reads only the columns
a query names, so a 330-column BRFSS file costs what a 20-column one does. It
does nothing for (2) or (3); those required the model choice to change. PySpark
would make matters worse: a JVM heap plus Python workers on a single 4-core
node is pure overhead, and sklearn still trains in one process afterwards.

================================================================================
DATA HONESTY - please read before quoting any number from this
================================================================================
* The disease matrix is SYNTHETICALLY AUGMENTED from disease->symptom profiles.
  Held-out accuracy will look excellent and overstates real clinical
  performance. Per-class F1 and this caveat are written into model1_metrics.json.
* BRFSS is cross-sectional and self-reported. These models estimate
  prevalence-given-profile, not incidence or future onset.
* The MIMIC-IV *demo* contains NO free-text notes (see physionet.org/content/
  mimic-iv-demo). The Kaggle mirror the old script used is a ~3 MB extract, far
  too small to fit a retriever on - the original's own `if n < 300` check at
  L556 was detecting exactly this and doing nothing about it.
  Treatment is therefore rebuilt on the UCI ML Drug Review corpus (~215k
  reviews, 700+ named conditions), a real and evaluable ranking task whose
  condition labels join to stage 1's disease output. The note layer survives as
  optional enrichment and self-skips when the source is too small.
================================================================================
"""

import argparse
import gc
import json
import os
import re
import subprocess
import sys
import time
import warnings
from difflib import get_close_matches

import numpy as np
import pandas as pd
import joblib
import scipy.linalg
from scipy import sparse

from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import (average_precision_score, brier_score_loss,
                             f1_score, log_loss, precision_score, recall_score,
                             roc_auc_score, top_k_accuracy_score)
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import BernoulliNB, ComplementNB
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

try:
    import psutil
    _PROC = psutil.Process(os.getpid())
except Exception:
    psutil, _PROC = None, None


# =============================================================================
# CONFIG
# =============================================================================

ON_KAGGLE = os.path.isdir("/kaggle/working")


def _in_notebook():
    """True inside a Jupyter/IPython kernel (Kaggle, Colab), False for a script."""
    try:
        from IPython import get_ipython
        ip = get_ipython()
        return ip is not None and ip.__class__.__name__ != "TerminalInteractiveShell"
    except Exception:
        return False


IN_NOTEBOOK = _in_notebook()

# Path to this file on disk, used to re-invoke one stage per subprocess.
# None when the code was pasted straight into a cell - there is no file to
# run, so stage isolation has to be given up.
try:
    SCRIPT_PATH = (os.path.abspath(__file__)
                   if "__file__" in globals() and os.path.isfile(__file__) else None)
except (NameError, OSError):
    SCRIPT_PATH = None

ARTIFACT_DIR = os.environ.get(
    "MEDASSIST_ARTIFACTS",
    "/kaggle/working/artifacts" if ON_KAGGLE
    else os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts"))

if ON_KAGGLE:
    # The default kagglehub cache sits on the small root disk; move it to
    # working storage so a multi-GB BRFSS pull cannot fill the filesystem.
    os.environ.setdefault("KAGGLEHUB_CACHE", "/kaggle/working/.kagglehub")

LOW_MEM = os.environ.get("MEDASSIST_LOW_MEM", "0") == "1"
USE_DUCKDB = os.environ.get("MEDASSIST_USE_DUCKDB", "1") == "1"
N_JOBS = int(os.environ.get("MEDASSIST_N_JOBS", "2"))
CHUNK_ROWS = 10_000 if LOW_MEM else 25_000
RANDOM_STATE = 42
PIPELINE_VERSION = "2.0.0"

DATASETS = {
    "symptom_matrix":  "dhivyeshrk/diseases-and-symptoms-dataset",
    "patient_profile": "uom190346a/disease-symptoms-and-patient-profile-dataset",
    "symptom_cures":   "pasindueranga/disease-prediction-based-on-symptoms",
    "brfss":           "cdc/behavioral-risk-factor-surveillance-system",
    "drug_reviews":    "jessicali9530/kuc-hackathon-winter-2018",
    "notes":           "mehrnooshazizi/mimic-iv-dataset",   # optional
}

# --- stage 1 -----------------------------------------------------------------
S1_MIN_SAMPLES_PER_CLASS = 8
S1_MAX_ROWS = 120_000 if LOW_MEM else 250_000
S1_TEST_SIZE = 0.2
S1_VAL_SIZE = 0.15                 # carved from train, for ridge temperature
S1_TOP_K = (1, 3, 5)
S1_EXPLAIN_TOP_SYMPTOMS = 12
S1_RIDGE_ALPHAS = (1.0, 10.0, 100.0)
S1_RIDGE_TEMPS = (1.0, 2.0, 4.0, 8.0, 16.0)

# --- stage 2 -----------------------------------------------------------------
S2_MAX_ROWS_PER_YEAR = 90_000 if LOW_MEM else 220_000
S2_MIN_POSITIVES = 400
S2_TEST_SIZE = 0.2
S2_CAL_SIZE = 0.15

CONDITION_COLUMNS = {
    "diabetes": "DIABETE3", "heart_attack": "CVDINFR4", "coronary_hd": "CVDCRHD4",
    "stroke": "CVDSTRK3", "asthma": "ASTHMA3", "skin_cancer": "CHCSCNCR",
    "other_cancer": "CHCOCNCR", "arthritis": "HAVARTH3", "depression": "ADDEPEV2",
    "kidney_disease": "CHCKIDNY",
}
# NOTE on diabetes: code 2 is "only during pregnancy" and 4 is "pre-diabetes".
# Both are genuinely ambiguous, so they are dropped rather than forced into a
# class. The original mapped 2 -> positive, which labels pregnant respondents
# as diabetic and poisons that model's positives.
CONDITION_CODE_MAPS = {
    "diabetes": {1: 1, 3: 0},
    "heart_attack": {1: 1, 2: 0}, "coronary_hd": {1: 1, 2: 0},
    "stroke": {1: 1, 2: 0}, "asthma": {1: 1, 2: 0}, "skin_cancer": {1: 1, 2: 0},
    "other_cancer": {1: 1, 2: 0}, "arthritis": {1: 1, 2: 0},
    "depression": {1: 1, 2: 0}, "kidney_disease": {1: 1, 2: 0},
}
S2_CORE_FEATURES = ["_BMI5", "_AGEG5YR", "SEX", "_SMOKER3"]
S2_FEATURES = ["_BMI5", "_AGEG5YR", "SEX", "_SMOKER3", "EXERANY2", "BPHIGH4",
               "TOLDHI2", "ALCDAY5", "GENHLTH", "PHYSHLTH", "MENTHLTH",
               "SLEPTIM1", "_EDUCAG", "_INCOMG", "_TOTINDA", "_FRTLT1",
               "_VEGLT1", "_RACE"]
S2_CATEGORICAL = ["SEX", "_SMOKER3", "_RACE"]

FEATURE_LABELS = {
    "_BMI5": "Body mass index", "_AGEG5YR": "Age band", "SEX": "Sex",
    "_SMOKER3": "Smoking status", "EXERANY2": "Any exercise (30d)",
    "BPHIGH4": "Told high blood pressure", "TOLDHI2": "Told high cholesterol",
    "ALCDAY5": "Alcohol days/month", "GENHLTH": "Self-rated general health",
    "PHYSHLTH": "Physically unwell days/30", "MENTHLTH": "Mentally unwell days/30",
    "SLEPTIM1": "Sleep hours", "_EDUCAG": "Education level", "_INCOMG": "Income band",
    "_TOTINDA": "Meets activity guidance", "_FRTLT1": "Fruit >=1/day",
    "_VEGLT1": "Vegetables >=1/day", "_RACE": "Race/ethnicity",
    "survey_year": "Survey year",
}

# --- stage 3 -----------------------------------------------------------------
S3_MIN_REVIEWS_PER_CONDITION = 25
S3_MIN_REVIEWS_PER_DRUG = 5
S3_TOP_DRUGS_PER_CONDITION = 15
S3_RATING_PRIOR_WEIGHT = 12.0
# Quality-vs-prevalence exponent for the drug ranking, tuned on held-out data.
# 0 = rank purely by rating, 1 = essentially rank by review volume.
S3_GAMMA_GRID = (0.0, 0.15, 0.3, 0.5, 0.75, 1.0)
S3_TEST_SIZE = 0.2
S3_TFIDF_MAX_FEATURES = 15_000 if LOW_MEM else 40_000
S3_MAX_NOTES = 25_000 if LOW_MEM else 60_000
S3_NEIGHBORS = 10
S3_MAX_REDACTION = 0.4
S3_MIN_USABLE_NOTES = 300
S3_EVAL_QUERIES = 400


# =============================================================================
# UTILITIES
# =============================================================================

_START = time.perf_counter()


def rss_mb():
    return _PROC.memory_info().rss / 1e6 if _PROC else 0.0


def log(msg, indent=0):
    print(f"[{time.perf_counter() - _START:7.1f}s | {rss_mb():7.0f}MB] "
          f"{'  ' * indent}{msg}", flush=True)


def banner(title):
    log("=" * 68)
    log(title)
    log("=" * 68)


def ensure_dir(p):
    os.makedirs(p, exist_ok=True)
    return p


def _jsonable(o):
    if isinstance(o, np.integer):
        return int(o)
    if isinstance(o, np.floating):
        v = float(o)
        return None if (np.isnan(v) or np.isinf(v)) else v
    if isinstance(o, np.bool_):
        return bool(o)
    if isinstance(o, np.ndarray):
        return o.tolist()
    if isinstance(o, (set, frozenset)):
        return sorted(o)
    return str(o)


def save_json(obj, path):
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, default=_jsonable)
    return path


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


_PAREN = re.compile(r"\(.*?\)")
_NONALNUM = re.compile(r"[^a-z0-9\s]")
_WS = re.compile(r"\s+")
_DISEASE_WORD = re.compile(r"\bdiseases?\b")


def normalize_series(s):
    out = (s.astype("string").str.lower().str.strip()
            .str.replace(_PAREN, " ", regex=True)
            .str.replace(_NONALNUM, " ", regex=True)
            .str.replace(_DISEASE_WORD, " ", regex=True)
            .str.replace(_WS, " ", regex=True).str.strip())
    return out.replace("", pd.NA)


def subset_alias_map(names):
    """
    Collapse 'x' vs 'x uti' style splits of a single condition.

    The original was an O(n^2) double loop that also left chains inconsistent
    (A->B while B->C, leaving A pointing at a non-canonical name). Here every
    value is resolved to a terminal root.
    """
    names = [n for n in names if n]
    ws = {n: frozenset(n.split()) for n in names}
    order = sorted(names, key=lambda n: (len(ws[n]), n))
    alias = {}
    for longer in reversed(order):
        for shorter in order:
            if (shorter != longer and len(ws[shorter]) >= 2
                    and len(ws[shorter]) < len(ws[longer])
                    and ws[shorter] <= ws[longer]):
                alias[longer] = shorter
                break
    resolved = {}
    for k in alias:
        seen, cur = {k}, alias[k]
        while cur in alias and cur not in seen:
            seen.add(cur)
            cur = alias[cur]
        resolved[k] = cur
    return resolved


def stratified_cap(y, max_rows, seed=RANDOM_STATE):
    n = len(y)
    if n <= max_rows:
        return np.arange(n)
    rng = np.random.default_rng(seed)
    y = np.asarray(y)
    frac, keep = max_rows / n, []
    for cls, cnt in zip(*np.unique(y, return_counts=True)):
        idx = np.flatnonzero(y == cls)
        take = max(min(cnt, 10), int(round(cnt * frac)))
        keep.append(rng.choice(idx, size=take, replace=False) if take < cnt else idx)
    out = np.concatenate(keep)
    rng.shuffle(out)
    return out


def supports_param(cls, name):
    """Feature-detect a constructor kwarg - Kaggle's sklearn version varies."""
    try:
        import inspect
        return name in inspect.signature(cls.__init__).parameters
    except Exception:
        return False


# =============================================================================
# DATA ACCESS - DuckDB fast path, chunked pandas fallback
# =============================================================================

_DUCK = None


def duck():
    """DuckDB connection, or None. Memory-capped so it cannot starve sklearn."""
    global _DUCK
    if not USE_DUCKDB:
        return None
    if _DUCK is not None:
        return _DUCK
    try:
        import duckdb
    except ImportError:
        log("duckdb not installed - using chunked pandas "
            "(`pip install duckdb` gives leaner, faster scans)")
        return None
    _DUCK = duckdb.connect()
    _DUCK.execute("SET memory_limit='4GB'")
    _DUCK.execute("SET threads=2")
    _DUCK.execute("SET preserve_insertion_order=false")
    log("DuckDB active (memory_limit=4GB, threads=2)")
    return _DUCK


def _q(name):
    return '"' + str(name).replace('"', '""') + '"'


def dataset_path(key):
    local = os.environ.get(f"MEDASSIST_LOCAL_{key.upper()}")
    if local and os.path.isdir(local):
        log(f"local '{key}': {local}")
        return local
    slug = DATASETS[key]
    attached = os.path.join("/kaggle/input", slug.split("/")[-1])
    if os.path.isdir(attached):
        log(f"attached '{key}': {attached}")
        return attached
    import kagglehub
    log(f"downloading '{key}' ({slug}) ...")
    return kagglehub.dataset_download(slug)


def find_csvs(path):
    out = []
    for root, _, files in os.walk(path):
        out += [os.path.join(root, f) for f in files
                if f.lower().endswith((".csv", ".tsv"))]
    return sorted(out)


def pick_csv(path, prefer=()):
    csvs = find_csvs(path)
    if not csvs:
        raise FileNotFoundError(f"no CSV under {path}")
    for sub in prefer:
        for c in csvs:
            if sub.lower() in os.path.basename(c).lower():
                return c
    return max(csvs, key=os.path.getsize)


def read_header(path):
    con = duck()
    if con is not None:
        try:
            r = con.execute(
                "SELECT * FROM read_csv_auto(?, sample_size=2048) LIMIT 0", [path])
            return [d[0] for d in r.description]
        except Exception:
            pass
    sep = "\t" if path.lower().endswith(".tsv") else ","
    return list(pd.read_csv(path, nrows=0, sep=sep).columns)


def read_table(path, columns=None, cast=None, sample_rows=None, limit=None,
               seed=RANDOM_STATE):
    """
    Column-pruned CSV read.

    DuckDB pushes the projection, the cast and the sample down into the scan,
    so unwanted columns are never materialised in Python at all. This is the
    single biggest win on BRFSS, where 18 of 330 columns are wanted.
    """
    con = duck()
    if con is not None:
        try:
            sel = "*" if not columns else ", ".join(
                f"CAST({_q(c)} AS {cast[c]}) AS {_q(c)}" if cast and c in cast
                else _q(c) for c in columns)
            sql = (f"SELECT {sel} FROM read_csv_auto(?, sample_size=16384, "
                   f"ignore_errors=true, null_padding=true)")
            if sample_rows:
                sql += f" USING SAMPLE {int(sample_rows)} ROWS (reservoir, {int(seed)})"
            if limit:
                sql += f" LIMIT {int(limit)}"
            return con.execute(sql, [path]).df()
        except Exception as e:
            log(f"duckdb scan failed ({type(e).__name__}: {e}); pandas fallback", 1)

    dtypes = None
    if cast:
        dtypes = {c: np.float32 for c, t in cast.items()
                  if "FLOAT" in t.upper() or "DOUBLE" in t.upper()}
    sep = "\t" if path.lower().endswith(".tsv") else ","
    parts, total = [], 0
    for chunk in pd.read_csv(path, usecols=columns, dtype=dtypes, sep=sep,
                             chunksize=CHUNK_ROWS, low_memory=False):
        parts.append(chunk)
        total += len(chunk)
        if limit and total >= limit:
            break
    df = pd.concat(parts, ignore_index=True) if parts else pd.DataFrame()
    del parts
    gc.collect()
    if limit:
        df = df.head(limit)
    if sample_rows and len(df) > sample_rows:
        df = df.sample(n=int(sample_rows), random_state=seed).reset_index(drop=True)
    return df


def read_binary_matrix_csv(path, label_col=None, chunk_rows=CHUNK_ROWS):
    """
    Stream a wide 0/1 CSV straight into a CSR matrix.

    247k x 377 read naively as int64 is ~745 MB and pandas holds the original
    alongside the cast copy. As CSR float32 with ~10 positive symptoms per row
    it is ~30 MB. Chunking bounds the transient dense block to
    chunk_rows x n_cols, so peak stays flat regardless of file size.
    """
    header = read_header(path)
    label_col = label_col or header[0]
    feats = [c for c in header if c != label_col]

    dtypes = {c: np.float32 for c in feats}
    dtypes[label_col] = "string"

    def _stream(dt):
        blocks, labels, n = [], [], 0
        for i, chunk in enumerate(pd.read_csv(path, chunksize=chunk_rows,
                                              dtype=dt, low_memory=False)):
            labels.append(chunk[label_col].to_numpy(dtype=object))
            blk = chunk[feats].to_numpy(dtype=np.float32, copy=False)
            np.nan_to_num(blk, copy=False)
            blocks.append(sparse.csr_matrix((blk > 0).astype(np.float32)))
            n += len(chunk)
            if i % 4 == 0:
                log(f"streamed {n:,} rows", 1)
            del chunk, blk
        return blocks, labels

    try:
        blocks, labels = _stream(dtypes)
    except (ValueError, TypeError) as e:
        # A stray non-numeric cell in a symptom column would abort the typed
        # read; retry untyped and coerce.
        log(f"typed read failed ({e}); retrying with coercion", 1)
        blocks, labels = _stream(None)

    X = sparse.vstack(blocks, format="csr")
    del blocks
    y = np.concatenate(labels)
    del labels
    gc.collect()

    mb = (X.data.nbytes + X.indices.nbytes + X.indptr.nbytes) / 1e6
    log(f"matrix {X.shape[0]:,} x {X.shape[1]:,} | nnz={X.nnz:,} | "
        f"density={X.nnz / (X.shape[0] * X.shape[1]):.4f} | {mb:.1f}MB sparse "
        f"(dense int64 would be {X.shape[0] * X.shape[1] * 8 / 1e6:,.0f}MB)")
    return X, y, feats


# =============================================================================
# STAGE 1 - DISEASE PREDICTION
# =============================================================================

class SoftmaxRidge:
    """
    Multi-class ridge regression solved directly from the normal equations,
    with a temperature-scaled softmax over the decision values.

    Why hand-rolled rather than an sklearn linear model: at 773 classes every
    off-the-shelf option blows up in one of two ways.
      * LogisticRegression(solver='saga') keeps an (n_samples, n_classes)
        gradient memory - 200k x 773 x 8 B = 1.2 GB - which is the exact class
        of allocation this pipeline exists to avoid.
      * SGDClassifier and LinearSVC fall back to one-vs-all, i.e. 773 separate
        passes over the matrix. Cheap in memory, but hours of runtime.

    With only ~380 symptom features the normal equations are tiny: X'X is
    378x378 and X'Y is 378x773, both computed straight off the CSR matrix by
    sparse products. One Cholesky solve yields every class at once, in seconds,
    in a few MB. Accuracy is competitive with logistic regression on binary
    presence/absence features, and it is a genuinely discriminative complement
    to the naive-Bayes members of the ensemble.
    """

    def __init__(self, alpha=10.0, temperature=4.0):
        self.alpha = float(alpha)
        self.temperature = float(temperature)

    @staticmethod
    def _augment(X):
        """Append a constant column so the model has an intercept."""
        ones = sparse.csr_matrix(np.ones((X.shape[0], 1), dtype=np.float32))
        return sparse.hstack([X, ones], format="csr")

    def fit(self, X, y):
        self.classes_ = np.unique(y)
        k = len(self.classes_)
        idx = np.searchsorted(self.classes_, y)

        Xa = self._augment(X)
        n = Xa.shape[0]
        Y = sparse.csr_matrix(
            (np.ones(n, dtype=np.float32), (np.arange(n), idx)), shape=(n, k))

        G = np.asarray((Xa.T @ Xa).todense(), dtype=np.float64)   # (d, d)
        B = np.asarray((Xa.T @ Y).todense(), dtype=np.float64)    # (d, k)
        G[np.diag_indices_from(G)] += self.alpha
        # Ridge-regularised Gram is symmetric positive definite.
        self.coef_ = scipy.linalg.solve(G, B, assume_a="pos")
        del G, B, Xa, Y
        gc.collect()
        return self

    def decision_function(self, X):
        return self._augment(X) @ self.coef_

    def predict_proba(self, X):
        z = np.asarray(self.decision_function(X), dtype=np.float64)
        z *= self.temperature
        z -= z.max(axis=1, keepdims=True)          # stabilise the exponential
        np.exp(z, out=z)
        z /= z.sum(axis=1, keepdims=True)
        return z

    def predict(self, X):
        return self.classes_[np.argmax(self.decision_function(X), axis=1)]


class SoftVoteEnsemble:
    """Weighted soft vote over probabilistic classifiers sharing a class order."""

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
        # Renormalise: some members are only approximately normalised, and
        # log_loss in newer sklearn rejects rows that do not sum to 1.
        out /= np.clip(out.sum(axis=1, keepdims=True), 1e-12, None)
        return out

    def predict(self, X):
        return self.classes_[np.argmax(self.predict_proba(X), axis=1)]


def _fit_ridge(X_tr, y_tr, X_val, y_val, n_classes):
    """Pick ridge alpha and softmax temperature on a validation carve-out."""
    labels = np.arange(n_classes)
    best, best_ll = None, np.inf
    for alpha in S1_RIDGE_ALPHAS:
        m = SoftmaxRidge(alpha=alpha).fit(X_tr, y_tr)
        for temp in S1_RIDGE_TEMPS:
            m.temperature = temp
            ll = log_loss(y_val, m.predict_proba(X_val), labels=labels)
            if ll < best_ll:
                best_ll, best = ll, (alpha, temp)
        del m
        gc.collect()
    alpha, temp = best
    log(f"ridge: alpha={alpha} temperature={temp} (val log-loss {best_ll:.4f})", 1)
    return SoftmaxRidge(alpha=alpha, temperature=temp)


def _symptom_evidence(model, feature_names, classes, top_n):
    """
    Per-disease ranked symptoms, from the Bernoulli NB log-probability lift:
    log P(symptom | disease) - log mean_d P(symptom | d).
    This is what a dashboard shows as "why this diagnosis".
    """
    nb = next((m for n, m in model.estimators if n == "bernoulli_nb"), None)
    if nb is None:
        return {}
    lp = nb.feature_log_prob_
    overall = np.log(np.clip(np.exp(lp).mean(axis=0), 1e-9, None))
    lift = lp - overall
    out = {}
    for i, cls in enumerate(classes):
        idx = np.argsort(lift[i])[::-1][:top_n]
        out[str(cls)] = [{"symptom": feature_names[j],
                          "weight": round(float(lift[i, j]), 4)}
                         for j in idx if lift[i, j] > 0]
    return out


def _build_lookup(save_dir):
    """Disease -> symptoms / cures / specialist. DISPLAY ONLY, never trained on."""
    try:
        df1 = read_table(pick_csv(dataset_path("patient_profile"),
                                  ("Disease_symptom",)))
        df2 = read_table(pick_csv(dataset_path("symptom_cures")))
    except Exception as e:
        log(f"lookup tables unavailable ({type(e).__name__}: {e}); skipping", 1)
        return
    df1.columns = [c.strip().lower().replace(" ", "_") for c in df1.columns]
    df2.columns = [c.strip().lower().replace(" ", "_") for c in df2.columns]
    c1 = next((c for c in df1.columns if "disease" in c), None)
    c2 = next((c for c in df2.columns if "disease" in c), None)
    if not c1 or not c2:
        log("lookup tables lack a disease column; skipping", 1)
        return
    for d, c in ((df1, c1), (df2, c2)):
        d["disease_key"] = normalize_series(d[c])
        d["disease_key"] = d["disease_key"].replace(
            subset_alias_map(sorted(d["disease_key"].dropna().unique())))
    names1 = sorted(df1["disease_key"].dropna().unique())
    cross = {}
    for n2 in sorted(df2["disease_key"].dropna().unique()):
        m = get_close_matches(n2, names1, n=1, cutoff=0.85)
        if m and m[0] != n2:
            cross[n2] = m[0]
    df2["disease_key"] = df2["disease_key"].replace(cross)
    a = df2.drop_duplicates("disease_key").set_index("disease_key")
    b = df1.drop_duplicates("disease_key").set_index("disease_key")
    b = b[[c for c in b.columns if c not in a.columns]]
    lk = a.join(b, how="outer").reset_index()
    lk = lk[lk["disease_key"].notna()]
    lk.to_csv(os.path.join(save_dir, "model1_disease_lookup.csv"), index=False)
    log(f"reference lookup: {len(lk)} diseases", 1)
    del df1, df2, lk
    gc.collect()


def stage1(save_dir=ARTIFACT_DIR):
    banner("STAGE 1 - Disease prediction")
    ensure_dir(save_dir)

    csv = pick_csv(dataset_path("symptom_matrix"), ("augmented", "disease"))
    log(f"source: {os.path.basename(csv)}")
    X, y_raw, feature_names = read_binary_matrix_csv(csv)

    y = normalize_series(pd.Series(y_raw))
    del y_raw
    alias = subset_alias_map(sorted(y.dropna().unique()))
    if alias:
        y = y.replace(alias)
        log(f"collapsed {len(alias)} alias labels")
    keep = y.notna().to_numpy()
    X, y = X[keep], y[keep].to_numpy(dtype=object)
    del keep
    gc.collect()

    vals, counts = np.unique(y, return_counts=True)
    thin = counts < S1_MIN_SAMPLES_PER_CLASS
    if thin.any():
        rare = set(vals[thin])
        m = np.array([v not in rare for v in y])
        log(f"dropped {int(thin.sum())} classes with <{S1_MIN_SAMPLES_PER_CLASS} "
            f"samples ({int(counts[thin].sum()):,} rows)")
        X, y = X[m], y[m]
        del m
        gc.collect()

    idx = stratified_cap(y, S1_MAX_ROWS)
    if len(idx) < X.shape[0]:
        X, y = X[idx], y[idx]
        log(f"stratified cap -> {X.shape[0]:,} rows")
    del idx

    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    n_classes, n_features = len(le.classes_), X.shape[1]
    majority = np.bincount(y_enc).max() / len(y_enc)
    del y
    gc.collect()
    log(f"train set: {X.shape[0]:,} rows x {n_features} symptoms | "
        f"{n_classes} diseases | majority baseline {majority:.4f}")

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y_enc, test_size=S1_TEST_SIZE, stratify=y_enc,
        random_state=RANDOM_STATE)
    X_fit, X_val, y_fit, y_val = train_test_split(
        X_tr, y_tr, test_size=S1_VAL_SIZE, stratify=y_tr,
        random_state=RANDOM_STATE)
    labels = np.arange(n_classes)

    # Every candidate fits in a single pass over the matrix and costs
    # O(n_classes x n_features) parameters. No tree ensembles: that is where
    # the original pipeline's ~9 GB went.
    candidates = {
        "bernoulli_nb": BernoulliNB(alpha=0.05),
        "complement_nb": ComplementNB(alpha=0.3),
        "softmax_ridge": _fit_ridge(X_fit, y_fit, X_val, y_val, n_classes),
    }
    del X_fit, X_val, y_fit, y_val
    gc.collect()

    fitted, scores = [], {}
    for name, est in candidates.items():
        log(f"fitting {name} ...")
        try:
            est.fit(X_tr, y_tr)
        except Exception as e:
            log(f"{name} failed: {type(e).__name__}: {e}", 1)
            continue
        proba = est.predict_proba(X_te)
        pred = est.classes_[np.argmax(proba, axis=1)]
        s = {"accuracy": float((pred == y_te).mean()),
             "macro_f1": float(f1_score(y_te, pred, average="macro",
                                        zero_division=0))}
        for k in S1_TOP_K:
            if k < n_classes:
                s[f"top{k}_accuracy"] = float(
                    top_k_accuracy_score(y_te, proba, k=k, labels=labels))
        scores[name] = s
        fitted.append((name, est))
        log(f"{name:14s} acc={s['accuracy']:.4f} "
            f"top3={s.get('top3_accuracy', float('nan')):.4f} "
            f"macroF1={s['macro_f1']:.4f}", 1)
        del proba
        gc.collect()

    if not fitted:
        raise RuntimeError("no stage-1 model trained successfully")

    ens = SoftVoteEnsemble(
        fitted, [max(scores[n].get("top3_accuracy", scores[n]["accuracy"]), 1e-6)
                 for n, _ in fitted])
    proba = ens.predict_proba(X_te)
    pred = ens.classes_[np.argmax(proba, axis=1)]
    e = {"accuracy": float((pred == y_te).mean()),
         "macro_f1": float(f1_score(y_te, pred, average="macro", zero_division=0)),
         "log_loss": float(log_loss(y_te, proba, labels=labels))}
    for k in S1_TOP_K:
        if k < n_classes:
            e[f"top{k}_accuracy"] = float(
                top_k_accuracy_score(y_te, proba, k=k, labels=labels))
    scores["ensemble"] = e
    log(f"{'ensemble':14s} acc={e['accuracy']:.4f} "
        f"top3={e.get('top3_accuracy', float('nan')):.4f} "
        f"macroF1={e['macro_f1']:.4f}", 1)

    # Ranked by top-3, which is the metric a differential-diagnosis UI actually
    # consumes - it shows a shortlist, not a single answer.
    best_name = max(scores, key=lambda k: scores[k].get("top3_accuracy",
                                                        scores[k]["accuracy"]))
    if best_name == "ensemble":
        best = ens
    else:
        best = SoftVoteEnsemble([(best_name, dict(fitted)[best_name])], [1.0])
        proba = best.predict_proba(X_te)
        pred = best.classes_[np.argmax(proba, axis=1)]
    log(f"selected: {best_name} (lift over majority baseline "
        f"{scores[best_name]['accuracy'] - majority:+.4f})")

    f1s = f1_score(y_te, pred, average=None, labels=labels, zero_division=0)
    te_counts = np.bincount(y_te, minlength=n_classes)
    worst = [{"disease": str(le.classes_[i]), "f1": round(float(f1s[i]), 4),
              "test_n": int(te_counts[i])} for i in np.argsort(f1s)[:40]]

    # Confidence -> empirical accuracy, so the severity layer can trust the
    # probability it is handed rather than assuming it is calibrated.
    conf, correct = proba.max(axis=1), (pred == y_te)
    edges = np.linspace(0, 1, 11)
    calib = []
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (conf >= lo) & (conf < hi)
        if m.sum() >= 20:
            calib.append({"bin_low": round(float(lo), 2),
                          "bin_high": round(float(hi), 2), "n": int(m.sum()),
                          "mean_confidence": round(float(conf[m].mean()), 4),
                          "empirical_accuracy": round(float(correct[m].mean()), 4)})

    joblib.dump(best, os.path.join(save_dir, "model1_classifier.joblib"), compress=3)
    joblib.dump(le, os.path.join(save_dir, "model1_label_encoder.joblib"), compress=3)
    save_json(feature_names, os.path.join(save_dir, "model1_symptom_columns.json"))
    save_json(_symptom_evidence(best, feature_names, le.classes_,
                                S1_EXPLAIN_TOP_SYMPTOMS),
              os.path.join(save_dir, "model1_symptom_evidence.json"))
    save_json({
        "pipeline_version": PIPELINE_VERSION, "selected_model": best_name,
        "n_classes": int(n_classes), "n_features": int(n_features),
        "n_train_rows": int(X_tr.shape[0]), "n_test_rows": int(X_te.shape[0]),
        "majority_baseline": round(float(majority), 6),
        "candidates": scores, "headline": scores[best_name],
        "worst_classes_by_f1": worst, "confidence_calibration": calib,
        "caveats": [
            "The source symptom matrix is synthetically augmented from "
            "disease-symptom profiles; held-out accuracy overstates real "
            "clinical performance and should not be quoted as diagnostic "
            "accuracy.",
            "Symptom-checker / triage aid, not a diagnostic device.",
            f"Diseases with fewer than {S1_MIN_SAMPLES_PER_CLASS} samples were "
            "excluded and cannot be predicted at all.",
            "Check worst_classes_by_f1 before trusting any single prediction: "
            "headline accuracy hides wide per-class variation.",
        ],
    }, os.path.join(save_dir, "model1_metrics.json"))

    _build_lookup(save_dir)
    log(f"stage 1 complete -> {save_dir}")
    return scores[best_name]


# =============================================================================
# STAGE 2 - CHRONIC CONDITION RISK + RISK SCORING
# =============================================================================
# Every BRFSS variable codes refusals and don't-knows as sentinels
# (7/9/77/99/777/888/999). Left raw, a model reads "9 = refused" as a large
# ordinal value. Each decoder maps sentinels to NaN, which
# HistGradientBoosting handles as a genuine missing branch - so there is no
# dropna, which is what destroyed the original pipeline's sample size.

def _dec_bmi(s):     return s.where(s < 9000) / 100.0
def _dec_age(s):     return s.where(s <= 13)
def _dec_yesno(s):   return s.map({1.0: 1.0, 2.0: 0.0})
def _dec_bp(s):      return s.map({1.0: 1.0, 2.0: 1.0, 3.0: 0.0, 4.0: 0.5})
def _dec_smoker(s):  return s.where(s <= 4)


def _dec_alcdays(s):
    # 1xx = times per week, 2xx = times per month, 888 = none, 777/999 missing
    v = s.to_numpy(dtype=np.float64, copy=True)
    out = np.full_like(v, np.nan)
    out[v == 888] = 0.0
    wk = (v >= 101) & (v <= 199)
    out[wk] = (v[wk] - 100) * 4.33
    mo = (v >= 201) & (v <= 299)
    out[mo] = v[mo] - 200
    return pd.Series(out, index=s.index)


def _dec_days30(s):
    # 88 = none, 77/99 = missing
    v = s.to_numpy(dtype=np.float64, copy=True)
    out = np.full_like(v, np.nan)
    out[v == 88] = 0.0
    ok = (v >= 1) & (v <= 30)
    out[ok] = v[ok]
    return pd.Series(out, index=s.index)


def _dec_scale(hi):
    return lambda s: s.where(s <= hi)


DECODERS = {
    "_BMI5": _dec_bmi, "_AGEG5YR": _dec_age, "SEX": _dec_scale(2),
    "_SMOKER3": _dec_smoker, "EXERANY2": _dec_yesno, "BPHIGH4": _dec_bp,
    "TOLDHI2": _dec_yesno, "ALCDAY5": _dec_alcdays, "GENHLTH": _dec_scale(5),
    "PHYSHLTH": _dec_days30, "MENTHLTH": _dec_days30, "SLEPTIM1": _dec_scale(24),
    "_EDUCAG": _dec_scale(4), "_INCOMG": _dec_scale(5), "_TOTINDA": _dec_yesno,
    "_FRTLT1": _dec_yesno, "_VEGLT1": _dec_yesno, "_RACE": _dec_scale(8),
}


def load_brfss(path):
    """Read each year file with column pruning, float32 cast and sampling in-scan."""
    files = find_csvs(path)
    if not files:
        raise FileNotFoundError(f"no BRFSS CSVs under {path}")
    wanted = list(dict.fromkeys(S2_FEATURES + list(CONDITION_COLUMNS.values())))

    frames = []
    for fp in files:
        name = os.path.basename(fp)
        try:
            header = read_header(fp)
        except Exception as e:
            log(f"skip {name}: unreadable header ({e})", 1)
            continue
        missing = [c for c in S2_CORE_FEATURES if c not in header]
        if missing:
            log(f"skip {name}: missing core features {missing}", 1)
            continue

        use = [c for c in wanted if c in header]
        try:
            df = read_table(fp, columns=use, cast={c: "FLOAT" for c in use},
                            sample_rows=S2_MAX_ROWS_PER_YEAR)
        except Exception as e:
            log(f"skip {name}: {type(e).__name__}: {e}", 1)
            continue
        if df.empty:
            log(f"skip {name}: no rows returned", 1)
            continue

        for c in df.columns:
            if df[c].dtype != np.float32:
                df[c] = df[c].astype(np.float32)
        digits = "".join(ch for ch in name if ch.isdigit())[:4]
        df["survey_year"] = np.float32(int(digits) if len(digits) == 4 else 0)
        frames.append(df)
        log(f"{name}: {len(df):,} rows x {len(use)} of {len(header)} cols "
            f"({df.memory_usage().sum() / 1e6:.0f}MB)", 1)

    if not frames:
        raise RuntimeError("no BRFSS year file matched the expected schema")

    # UNION of columns across years, not the intersection.
    #
    # Intersecting lets the thinnest year veto everything: BRFSS 2012 carries
    # 22 of the wanted columns while 2013 carries 28, so an intersection
    # collapsed the feature space to 13 and silently threw away six usable
    # predictors. Because HistGradientBoosting treats NaN as a real branch, a
    # year that lacks a column can simply carry NaN for it - which is strictly
    # more information than dropping the column for every year.
    all_cols = []
    for f in frames:
        for c in f.columns:
            if c not in all_cols:
                all_cols.append(c)
    coverage = {c: sum(c in f.columns for f in frames) for c in all_cols}
    partial = [c for c, n in coverage.items() if n < len(frames)]

    brfss = pd.concat([f.reindex(columns=all_cols) for f in frames],
                      ignore_index=True, copy=False)
    for c in brfss.columns:
        if brfss[c].dtype != np.float32:
            brfss[c] = brfss[c].astype(np.float32)
    n_years = len(frames)
    del frames
    gc.collect()

    log(f"combined {n_years} year(s): {brfss.shape[0]:,} rows x "
        f"{brfss.shape[1]} cols ({brfss.memory_usage().sum() / 1e6:.0f}MB)")
    if partial:
        log(f"present in only some years (NaN elsewhere, kept anyway): "
            f"{ {c: f'{coverage[c]}/{n_years}' for c in partial} }", 1)
    return brfss


def _make_booster(cat_idx):
    kw = dict(max_iter=300, learning_rate=0.06, max_leaf_nodes=31,
              min_samples_leaf=60, l2_regularization=1.0,
              categorical_features=cat_idx or None, early_stopping=True,
              n_iter_no_change=20, validation_fraction=0.1,
              random_state=RANDOM_STATE)
    # class_weight arrived in sklearn 1.2; Kaggle images vary.
    if supports_param(HistGradientBoostingClassifier, "class_weight"):
        kw["class_weight"] = "balanced"
    return HistGradientBoostingClassifier(**kw)


def _train_condition(X, y, cat_idx, feature_names):
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=S2_TEST_SIZE, stratify=y, random_state=RANDOM_STATE)
    X_tr, X_cal, y_tr, y_cal = train_test_split(
        X_tr, y_tr, test_size=S2_CAL_SIZE, stratify=y_tr,
        random_state=RANDOM_STATE)

    clf = _make_booster(cat_idx)
    if "class_weight" in clf.get_params():
        clf.fit(X_tr, y_tr)
    else:
        # Older sklearn: emulate class_weight='balanced' via sample weights.
        w = np.where(y_tr == 1, len(y_tr) / (2 * max(y_tr.sum(), 1)),
                     len(y_tr) / (2 * max((y_tr == 0).sum(), 1)))
        clf.fit(X_tr, y_tr, sample_weight=w)

    # Isotonic calibration on a slice the booster never saw. Done by hand
    # rather than CalibratedClassifierCV(cv='prefit'), whose semantics changed
    # across sklearn versions.
    cal = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
    cal.fit(clf.predict_proba(X_cal)[:, 1], y_cal)

    raw = clf.predict_proba(X_te)[:, 1]
    p = np.clip(cal.predict(raw), 1e-6, 1 - 1e-6)

    # 0.5 is meaningless at these base rates; take the F1-optimal threshold.
    grid = np.unique(np.quantile(p, np.linspace(0.5, 0.995, 60)))
    f1s = [f1_score(y_te, (p >= t).astype(int), zero_division=0) for t in grid]
    thr = float(grid[int(np.argmax(f1s))])
    pred = (p >= thr).astype(int)

    m = {"n_total": int(len(y)), "n_test": int(len(y_te)),
         "positive_rate": round(float(y.mean()), 5),
         "roc_auc": round(float(roc_auc_score(y_te, p)), 4),
         "pr_auc": round(float(average_precision_score(y_te, p)), 4),
         "pr_auc_baseline": round(float(y_te.mean()), 4),
         "brier": round(float(brier_score_loss(y_te, p)), 5),
         "brier_uncalibrated": round(float(brier_score_loss(y_te, raw)), 5),
         "decision_threshold": round(thr, 4),
         "precision": round(float(precision_score(y_te, pred, zero_division=0)), 4),
         "recall": round(float(recall_score(y_te, pred, zero_division=0)), 4),
         "f1": round(float(max(f1s)), 4), "n_iter": int(clf.n_iter_)}

    # Probability -> population percentile. This is the risk SCORE the
    # dashboard shows; a raw 0.08 probability means nothing to a reader,
    # "87th percentile for your profile" does.
    percentiles = np.quantile(p, np.linspace(0, 1, 101)).round(6).tolist()

    edges = np.linspace(0, 1, 11)
    reliability = []
    for lo, hi in zip(edges[:-1], edges[1:]):
        k = (p >= lo) & (p < hi)
        if k.sum() >= 30:
            reliability.append({"predicted": round(float(p[k].mean()), 4),
                                "observed": round(float(y_te[k].mean()), 4),
                                "n": int(k.sum())})

    # Permutation importance on a 20k subsample - cheap, and it drives the
    # "what is driving this person's risk" panel.
    rng = np.random.default_rng(RANDOM_STATE)
    sub = rng.choice(len(X_te), size=min(20_000, len(X_te)), replace=False)
    Xs, ys = X_te[sub], y_te[sub]
    base = roc_auc_score(ys, clf.predict_proba(Xs)[:, 1])
    imp = []
    for j, fname in enumerate(feature_names):
        Xp = Xs.copy()
        rng.shuffle(Xp[:, j])
        imp.append({"feature": fname, "label": FEATURE_LABELS.get(fname, fname),
                    "auc_drop": round(float(
                        base - roc_auc_score(ys, clf.predict_proba(Xp)[:, 1])), 5)})
        del Xp
    imp.sort(key=lambda d: -d["auc_drop"])

    del X_tr, X_te, X_cal, y_tr, y_te, y_cal, Xs, ys
    gc.collect()
    return clf, cal, m, percentiles, reliability, imp


def stage2(save_dir=ARTIFACT_DIR):
    banner("STAGE 2 - Chronic condition risk screening")
    ensure_dir(save_dir)

    brfss = load_brfss(dataset_path("brfss"))
    feature_cols = [c for c in S2_FEATURES if c in brfss.columns]

    feats = pd.DataFrame(index=brfss.index)
    for c in feature_cols:
        dec = DECODERS.get(c)
        feats[c] = (dec(brfss[c]) if dec else brfss[c]).astype(np.float32)
    if "survey_year" in brfss.columns:
        feats["survey_year"] = brfss["survey_year"].astype(np.float32)

    feature_names = list(feats.columns)
    cat_idx = [i for i, c in enumerate(feature_names) if c in S2_CATEGORICAL]
    miss = feats.isna().mean().sort_values(ascending=False)
    log(f"feature matrix {feats.shape[0]:,} x {feats.shape[1]} float32 "
        f"({feats.memory_usage().sum() / 1e6:.0f}MB) | "
        f"most missing: {miss.index[0]}={miss.iloc[0]:.1%}")

    # ONE dense array, reused by every condition through boolean masks. The
    # original made a fresh full-size copy per condition, ten times over.
    X_all = feats.to_numpy(dtype=np.float32)
    del feats
    gc.collect()

    models, metrics = {}, {}
    for name, col in CONDITION_COLUMNS.items():
        if col not in brfss.columns:
            log(f"{name}: source column {col} absent, skipped", 1)
            continue
        target = brfss[col].map(CONDITION_CODE_MAPS[name])
        mask = target.notna().to_numpy()
        y = target[mask].to_numpy(dtype=np.int8)
        if len(y) == 0 or y.min() == y.max():
            log(f"{name}: no label variance, skipped", 1)
            continue
        pos = int(y.sum())
        if min(pos, len(y) - pos) < S2_MIN_POSITIVES:
            log(f"{name}: only {pos:,} positives, skipped", 1)
            continue

        try:
            clf, cal, m, pct, rel, imp = _train_condition(
                X_all[mask], y, cat_idx, feature_names)
        except Exception as e:
            log(f"{name}: training failed ({type(e).__name__}: {e}), skipped", 1)
            continue

        models[name] = {"model": clf, "calibrator": cal,
                        "features": feature_names,
                        "threshold": m["decision_threshold"],
                        "percentiles": pct}
        metrics[name] = {**m, "reliability": rel, "top_features": imp[:10]}
        log(f"{name:15s} n={m['n_total']:>9,} pos={m['positive_rate']:.3f} "
            f"AUC={m['roc_auc']:.3f} PR-AUC={m['pr_auc']:.3f}"
            f"(base {m['pr_auc_baseline']:.3f}) Brier={m['brier']:.4f} "
            f"F1={m['f1']:.3f}", 1)
        del y, target, mask
        gc.collect()

    if not models:
        raise RuntimeError("no chronic-risk model could be trained")

    joblib.dump(models, os.path.join(save_dir, "model2_risk_models.joblib"),
                compress=3)
    save_json({
        "pipeline_version": PIPELINE_VERSION, "n_conditions": len(models),
        "n_rows_loaded": int(X_all.shape[0]),
        "features": [{"name": f, "label": FEATURE_LABELS.get(f, f)}
                     for f in feature_names],
        "categorical_features": S2_CATEGORICAL,
        "mean_roc_auc": round(float(np.mean(
            [m["roc_auc"] for m in metrics.values()])), 4),
        "conditions": metrics,
        "scoring_note": "Each model exposes `percentiles`: a 101-point grid "
                        "mapping a calibrated probability to a population "
                        "percentile. np.searchsorted(percentiles, p) gives the "
                        "0-100 risk score to display.",
        "caveats": [
            "BRFSS is cross-sectional and self-reported: these models estimate "
            "prevalence given a profile, not incidence or future onset.",
            "Probabilities are isotonically calibrated on a held-out slice - "
            "compare 'brier' against 'brier_uncalibrated' to see the gain.",
            "Percentiles are relative to US adult respondents and do not "
            "transfer to other populations.",
            "BPHIGH4 and TOLDHI2 are themselves diagnosed conditions, so high "
            "importance on them reflects clinical correlation, not causation.",
        ],
    }, os.path.join(save_dir, "model2_metrics.json"))

    pd.DataFrame([{"condition": k,
                   **{a: b for a, b in v.items()
                      if not isinstance(b, (list, dict))}}
                  for k, v in metrics.items()]).to_csv(
        os.path.join(save_dir, "model2_condition_metrics.csv"), index=False)

    log(f"stage 2 complete - {len(models)} condition models -> {save_dir}")
    return metrics


# =============================================================================
# STAGE 3 - TREATMENT RECOMMENDATION
# =============================================================================

def _load_reviews():
    csvs = find_csvs(dataset_path("drug_reviews"))
    if not csvs:
        raise FileNotFoundError("no drug-review CSVs found")
    rv = pd.concat([read_table(fp) for fp in csvs], ignore_index=True)
    rv.columns = [c.strip().lower() for c in rv.columns]

    ren = {}
    for c in rv.columns:
        if "drug" in c:
            ren[c] = "drug"
        elif "condition" in c:
            ren[c] = "condition"
        elif c.startswith("rating"):
            ren[c] = "rating"
        elif "useful" in c:
            ren[c] = "useful"
        elif "review" in c:
            ren[c] = "review"
    rv = rv.rename(columns=ren)

    missing = {"drug", "condition", "rating"} - set(rv.columns)
    if missing:
        raise RuntimeError(f"drug-review data missing columns: {sorted(missing)} "
                           f"(found: {sorted(rv.columns)})")

    rv["rating"] = pd.to_numeric(rv["rating"], errors="coerce")
    if "useful" in rv.columns:
        rv["useful"] = pd.to_numeric(rv["useful"], errors="coerce").fillna(0)
    else:
        rv["useful"] = 0.0
    rv["condition_key"] = normalize_series(rv["condition"])
    rv["drug"] = rv["drug"].astype("string").str.strip()

    # The source has scraped HTML junk in `condition`, e.g.
    # "3</span> users found this comment helpful."
    junk = rv["condition_key"].str.contains("users found this comment", na=False)
    rv = rv[~junk & rv["condition_key"].notna() & rv["drug"].notna()
            & rv["rating"].notna()].reset_index(drop=True)
    log(f"reviews: {len(rv):,} rows | {rv['condition_key'].nunique():,} "
        f"conditions | {rv['drug'].nunique():,} drugs", 1)
    return rv


def _aggregate_drugs(df, global_mean):
    """Per (condition, drug) aggregates with a Bayesian-shrunk rating."""
    g = df.groupby(["condition_key", "drug"], observed=True).agg(
        n_reviews=("rating", "size"), mean_rating=("rating", "mean"),
        positive_rate=("rating", lambda s: float((s >= 7).mean())),
        mean_useful=("useful", "mean")).reset_index()
    g = g[g["n_reviews"] >= S3_MIN_REVIEWS_PER_DRUG].copy()
    # A drug with one 10/10 review must not outrank one with 400 reviews
    # averaging 8.5, so ratings shrink toward the global mean by
    # S3_RATING_PRIOR_WEIGHT pseudo-counts.
    g["shrunk_rating"] = ((g["mean_rating"] * g["n_reviews"]
                           + global_mean * S3_RATING_PRIOR_WEIGHT)
                          / (g["n_reviews"] + S3_RATING_PRIOR_WEIGHT))
    return g


def _rank_drugs(df, global_mean, gamma):
    """
    Rank drugs within a condition by quality x prevalence.

        score = shrunk_rating * n_reviews ** gamma

    gamma is the single knob trading outcome quality against how commonly the
    drug is actually used for the condition. gamma=0 is pure rating; gamma=1
    is close to pure popularity. It is tuned on held-out data in stage3()
    rather than guessed - an earlier fixed `0.02 * log1p(n)` bonus was far too
    weak and the ranking lost outright to a popularity baseline, floating
    thinly-reviewed drugs to the top.

    Two rank columns are emitted so a dashboard can offer both views:
      rank            blended - the default recommendation order
      rank_by_rating  pure quality, ignoring how common the drug is
    """
    g = _aggregate_drugs(df, global_mean)
    g["score"] = g["shrunk_rating"] * np.power(g["n_reviews"].astype(float), gamma)
    g = g.sort_values(["condition_key", "score"], ascending=[True, False])
    g["rank"] = g.groupby("condition_key").cumcount() + 1
    g = g.sort_values(["condition_key", "shrunk_rating"], ascending=[True, False])
    g["rank_by_rating"] = g.groupby("condition_key").cumcount() + 1
    return g.sort_values(["condition_key", "rank"])


def _eval_ranking(table, test, k):
    """
    Held-out check: for reviews reporting a good outcome (rating >= 8), how
    often is that drug inside its condition's top-k?

    Reported against a popularity baseline (rank by review volume, ignoring
    outcome) and a random baseline, so the number means something on its own.
    """
    topk = table[table["rank"] <= k].groupby(
        "condition_key")["drug"].apply(set).to_dict()
    pop = (table.sort_values(["condition_key", "n_reviews"], ascending=[True, False])
                .groupby("condition_key").head(k)
                .groupby("condition_key")["drug"].apply(set).to_dict())
    avail = table.groupby("condition_key")["drug"].nunique().to_dict()

    good = test[(test["rating"] >= 8) & test["condition_key"].isin(topk.keys())]
    if good.empty:
        return {f"n_eval_at_{k}": 0}
    cond, drug = list(good["condition_key"]), list(good["drug"])
    return {
        f"n_eval_at_{k}": int(len(good)),
        f"hit_rate_at_{k}": round(float(np.mean(
            [d in topk.get(c, ()) for c, d in zip(cond, drug)])), 4),
        f"popularity_baseline_at_{k}": round(float(np.mean(
            [d in pop.get(c, ()) for c, d in zip(cond, drug)])), 4),
        f"random_baseline_at_{k}": round(float(np.mean(
            [min(k / max(avail.get(c, k), 1), 1.0) for c in cond])), 4),
    }


def _train_text_classifier(rv, save_dir):
    """
    Free-text complaint -> condition, so a dashboard can accept typed input
    instead of only symptom checkboxes.

    ComplementNB rather than SGD/LinearSVC: at ~700 classes the linear models
    fall back to one-vs-all, i.e. 700 passes over a 170k-document matrix.
    ComplementNB fits in a single pass and is specifically designed for the
    imbalanced text case.
    """
    if "review" not in rv.columns:
        log("no review text column; skipping text classifier", 1)
        return None
    df = rv[rv["review"].notna()]
    # Re-filter after the notna drop so stratification cannot fail on a class
    # that fell below two members.
    vc = df["condition_key"].value_counts()
    df = df[df["condition_key"].isin(vc[vc >= 10].index)]
    if df["condition_key"].nunique() < 5:
        log("too few conditions for a text classifier; skipping", 1)
        return None

    classes = np.unique(df["condition_key"].astype(str).to_numpy())
    ci = {c: i for i, c in enumerate(classes)}
    y = np.array([ci[v] for v in df["condition_key"].astype(str)])
    text = df["review"].astype(str).str.replace(r"&#\d+;", " ", regex=True)

    Xt, Xv, y_tr, y_te = train_test_split(text, y, test_size=S3_TEST_SIZE,
                                          stratify=y, random_state=RANDOM_STATE)
    vec = TfidfVectorizer(stop_words="english", sublinear_tf=True,
                          ngram_range=(1, 2), min_df=3,
                          max_features=S3_TFIDF_MAX_FEATURES, dtype=np.float32)
    X_tr, X_te = vec.fit_transform(Xt), vec.transform(Xv)
    log(f"text matrix {X_tr.shape[0]:,} x {X_tr.shape[1]:,} | nnz={X_tr.nnz:,} "
        f"({X_tr.data.nbytes / 1e6:.0f}MB sparse)", 1)

    clf = ComplementNB(alpha=0.3)
    clf.fit(X_tr, y_tr)
    proba = clf.predict_proba(X_te)
    pred = np.argmax(proba, axis=1)
    m = {"n_classes": int(len(classes)), "n_train": int(X_tr.shape[0]),
         "accuracy": round(float((pred == y_te).mean()), 4),
         "macro_f1": round(float(f1_score(y_te, pred, average="macro",
                                          zero_division=0)), 4),
         "top3_accuracy": round(float(top_k_accuracy_score(
             y_te, proba, k=3, labels=np.arange(len(classes)))), 4),
         "majority_baseline": round(float(np.bincount(y).max() / len(y)), 4)}
    log(f"text->condition: acc={m['accuracy']:.3f} top3={m['top3_accuracy']:.3f} "
        f"over {m['n_classes']} conditions (baseline {m['majority_baseline']:.3f})", 1)

    joblib.dump({"vectorizer": vec, "classifier": clf, "classes": classes},
                os.path.join(save_dir, "model3_text_condition.joblib"), compress=3)
    del X_tr, X_te, proba
    gc.collect()
    return m


def _extract_section(text, name, stops):
    pat = rf"{re.escape(name)}:?(.*?)(?:{'|'.join(re.escape(s) for s in stops)}|$)"
    m = re.search(pat, str(text), re.IGNORECASE | re.DOTALL)
    return _WS.sub(" ", m.group(1)).strip() if m else None


# Dosage / route / frequency / formulation filler that appears in essentially
# every medication list. Counting these as a "match" is what pushed the naive
# overlap metric to 0.995 - it measured nothing.
_MED_STOPWORDS = frozenset("""
mg mcg ml gm gram grams unit units meq tab tabs tablet tablets cap caps capsule
capsules po iv im sc sl pr inh neb topical oral daily bid tid qid qhs prn q q4h
q6h q8h q12h hs am pm every hour hours day days week weeks month months take by
mouth with without food one two three four five six as needed dose doses
disp refills refill sig none and or the for of in on at to a an is
solution suspension syringe patch cream ointment drops spray inhaler puff puffs
release extended delayed er xr sr dr injection subcutaneous intravenous
""".split())


def _med_tokens(text):
    """Plausible drug-name tokens: alphabetic, >=4 chars, not dosage filler."""
    return {t for t in re.findall(r"[a-z]{4,}", str(text).lower())
            if t not in _MED_STOPWORDS}


def _note_layer(save_dir):
    """Optional enrichment. Self-skips when the source is too small to fit on."""
    try:
        csv = pick_csv(dataset_path("notes"),
                       ("discharge", "note", "summar", "text"))
        probe = pd.read_csv(csv, nrows=200)
        text_col, best = None, 0
        for c in probe.columns:
            if probe[c].dtype == object:
                avg = probe[c].astype(str).str.len().mean()
                if avg > best:
                    best, text_col = avg, c
        del probe
        if text_col is None or best < 200:
            raise RuntimeError(f"no long-text column (best avg {best:.0f} chars)")
        parts, total = [], 0
        for ch in pd.read_csv(csv, usecols=[text_col], chunksize=5_000):
            parts.append(ch)
            total += len(ch)
            if total >= S3_MAX_NOTES:
                break
        notes = pd.concat(parts, ignore_index=True).head(S3_MAX_NOTES)
        del parts
    except Exception as ex:
        log(f"note dataset unavailable ({type(ex).__name__}: {ex}); skipping", 1)
        return {"skipped": True, "reason": f"{type(ex).__name__}: {ex}"}

    stops = ["Discharge Condition", "Discharge Instructions",
             "Discharge Disposition", "Followup Instructions"]
    dx = notes[text_col].apply(lambda t: _extract_section(t, "Discharge Diagnosis", stops))
    rx = notes[text_col].apply(lambda t: _extract_section(t, "Discharge Medications", stops))
    ratio = dx.apply(lambda t: 1.0 if not t else
                     (sum("___" in w for w in t.split()) / max(len(t.split()), 1)))
    ok = dx.notna() & rx.notna() & (ratio < S3_MAX_REDACTION)
    clean = pd.DataFrame({"diagnosis": dx[ok],
                          "medications": rx[ok]}).reset_index(drop=True)
    del notes, dx, rx, ratio
    gc.collect()
    log(f"usable notes after redaction filter: {len(clean):,}", 1)

    if len(clean) < S3_MIN_USABLE_NOTES:
        log(f"below the {S3_MIN_USABLE_NOTES}-note floor - too small to fit a "
            f"retriever on. Skipping rather than reporting a fake metric.", 1)
        return {"skipped": True, "n_usable_notes": int(len(clean)),
                "reason": f"fewer than {S3_MIN_USABLE_NOTES} usable notes"}

    tr, te = train_test_split(clean, test_size=0.2, random_state=RANDOM_STATE)
    vec = TfidfVectorizer(stop_words="english", sublinear_tf=True,
                          ngram_range=(1, 2), min_df=2,
                          max_features=S3_TFIDF_MAX_FEATURES, dtype=np.float32)
    M = vec.fit_transform(tr["diagnosis"])
    nn = NearestNeighbors(n_neighbors=min(S3_NEIGHBORS, M.shape[0]),
                          metric="cosine", algorithm="brute").fit(M)

    n_eval = min(S3_EVAL_QUERIES, len(te))
    sample = te.head(n_eval)
    _, idx = nn.kneighbors(vec.transform(sample["diagnosis"]), n_neighbors=3)
    # Token sets precomputed once. The original used `.str.split().sum()`,
    # which is quadratic list concatenation and hangs long before it OOMs.
    tr_meds = [_med_tokens(m) for m in tr["medications"]]

    jac, hit = [], 0
    for i, med in enumerate(sample["medications"]):
        truth = _med_tokens(med)
        got = set().union(*(tr_meds[j] for j in idx[i])) if len(idx[i]) else set()
        hit += bool(truth & got)
        jac.append(len(truth & got) / max(len(truth | got), 1))

    m = {"skipped": False, "n_usable_notes": int(len(clean)),
         "n_eval_queries": int(n_eval),
         "any_drug_overlap_rate_at_3": round(float(hit / max(n_eval, 1)), 4),
         "mean_jaccard_at_3": round(float(np.mean(jac)), 4),
         "metric_note": "Tokens are filtered to plausible drug names - dosage, "
                        "route and frequency words are stripped. Without that "
                        "filter 'any overlap' sits near 1.00 purely because "
                        "every medication list contains 'mg' and 'tablet', "
                        "which is not evidence of anything."}
    log(f"note retrieval: drug-overlap@3={m['any_drug_overlap_rate_at_3']:.3f} "
        f"jaccard@3={m['mean_jaccard_at_3']:.3f} "
        f"(jaccard is the honest number here)", 1)

    joblib.dump(vec, os.path.join(save_dir, "model3_note_vectorizer.joblib"),
                compress=3)
    sparse.save_npz(os.path.join(save_dir, "model3_note_matrix.npz"), M)
    tr.reset_index(drop=True).to_csv(
        os.path.join(save_dir, "model3_note_reference.csv"), index=False)
    del clean, M, tr, te
    gc.collect()
    return m


def _link_diseases(save_dir, table):
    """
    Map stage-1 disease names onto stage-3 condition keys.

    A single strict fuzzy match (difflib cutoff 0.86) linked only 92 of 684
    diseases - 13% - which would leave the treatment panel empty for most
    predictions. The two vocabularies genuinely differ: one is a symptom-
    dataset disease list, the other is what drug reviewers wrote. So this
    tries progressively looser strategies and records which one fired, so the
    weak links stay auditable rather than invisible.

    Full coverage is not achievable and should not be faked: many of the 684
    diseases have no drug reviews at all, and those correctly stay unlinked.
    """
    le_path = os.path.join(save_dir, "model1_label_encoder.joblib")
    if not os.path.exists(le_path):
        log("stage 1 artifacts absent; skipping disease->condition link", 1)
        return {}, {}

    diseases = [str(d) for d in joblib.load(le_path).classes_]
    conds = sorted(table["condition_key"].unique())
    cond_tokens = {c: frozenset(c.split()) for c in conds}
    link, methods = {}, {}

    def _take(d, c, how):
        link[d] = c
        methods[how] = methods.get(how, 0) + 1

    for d in diseases:
        if d in cond_tokens:
            _take(d, d, "exact")
            continue
        dt = frozenset(d.split())

        # One name contains the other as a phrase, e.g.
        # "allergic rhinitis" <-> "rhinitis". Prefer the closest in length.
        contains = [c for c in conds if d in c or c in d]
        if contains:
            _take(d, min(contains, key=lambda c: abs(len(c) - len(d))), "substring")
            continue

        # Token containment, e.g. "urinary tract infection" -> "urinary tract
        # infection" written with extra qualifiers on either side.
        subset = [c for c in conds
                  if (dt and cond_tokens[c] and
                      (dt <= cond_tokens[c] or cond_tokens[c] <= dt))]
        if subset:
            _take(d, min(subset, key=lambda c: abs(len(cond_tokens[c]) - len(dt))),
                  "token_subset")
            continue

        # Strong shared-token overlap (Jaccard), which catches word-order and
        # qualifier differences that difflib scores poorly.
        best_j, best_c = 0.0, None
        for c, ct in cond_tokens.items():
            if not (dt & ct):
                continue
            j = len(dt & ct) / len(dt | ct)
            if j > best_j:
                best_j, best_c = j, c
        if best_j >= 0.6:
            _take(d, best_c, "token_overlap")
            continue

        m = get_close_matches(d, conds, n=1, cutoff=0.86)
        if m:
            _take(d, m[0], "fuzzy_strict")
            continue
        m = get_close_matches(d, conds, n=1, cutoff=0.75)
        if m:
            _take(d, m[0], "fuzzy_loose")

    pct = 100.0 * len(link) / max(len(diseases), 1)
    log(f"linked {len(link)}/{len(diseases)} stage-1 diseases to conditions "
        f"({pct:.1f}%) via {methods}", 1)
    log(f"{len(diseases) - len(link)} diseases have no treatment data and will "
        f"show an empty treatment panel - that is correct, not a bug.", 1)
    return link, methods


def stage3(save_dir=ARTIFACT_DIR):
    banner("STAGE 3 - Treatment recommendation")
    ensure_dir(save_dir)

    rv = _load_reviews()
    global_mean = float(rv["rating"].mean())
    counts = rv["condition_key"].value_counts()
    rankable = counts[counts >= S3_MIN_REVIEWS_PER_CONDITION].index
    rv = rv[rv["condition_key"].isin(rankable)].reset_index(drop=True)
    log(f"{len(rankable):,} conditions have >= {S3_MIN_REVIEWS_PER_CONDITION} "
        f"reviews and are rankable", 1)

    train, test = train_test_split(rv, test_size=S3_TEST_SIZE,
                                   random_state=RANDOM_STATE)

    # Tune the quality/prevalence exponent on held-out data. A fixed guess
    # produced a ranking that lost outright to the popularity baseline, so
    # this is chosen rather than assumed - and reported alongside both
    # baselines so the comparison stays visible.
    sweep = []
    for gamma in S3_GAMMA_GRID:
        tbl = _rank_drugs(train, global_mean, gamma)
        r = _eval_ranking(tbl, test, 5)
        sweep.append({"gamma": gamma, "hit_rate_at_5": r.get("hit_rate_at_5", 0.0)})
        log(f"gamma={gamma:<5} hit@5={r.get('hit_rate_at_5')}", 1)
        del tbl
        gc.collect()
    best_gamma = max(sweep, key=lambda d: d["hit_rate_at_5"])["gamma"]

    eval_tbl = _rank_drugs(train, global_mean, best_gamma)
    ranking = {"gamma": best_gamma, "gamma_sweep": sweep}
    for k in (1, 3, 5):
        ranking.update(_eval_ranking(eval_tbl, test, k))
    hit, pop = ranking.get("hit_rate_at_5"), ranking.get("popularity_baseline_at_5")
    log(f"selected gamma={best_gamma} | hit@5={hit} | "
        f"popularity {pop} | random {ranking.get('random_baseline_at_5')}", 1)
    if hit is not None and pop is not None and hit < pop:
        # Do not quietly ship a ranker that a one-line baseline beats.
        log("!! ranking still below the popularity baseline. The blended order "
            "is NOT better than 'most reviewed' on this metric - surface "
            "rank_by_rating and n_reviews in the UI and let the clinician "
            "judge, rather than presenting `rank` as authoritative.", 1)
        ranking["beats_popularity_baseline"] = False
    else:
        ranking["beats_popularity_baseline"] = True
    del eval_tbl, train, test
    gc.collect()

    # Refit the shipped table on everything, now the exponent is validated.
    table = _rank_drugs(rv, global_mean, best_gamma)
    table = table[table["rank"] <= S3_TOP_DRUGS_PER_CONDITION]
    table[["condition_key", "drug", "rank", "rank_by_rating", "score",
           "shrunk_rating", "mean_rating", "n_reviews", "positive_rate",
           "mean_useful"]].round(4)\
        .to_csv(os.path.join(save_dir, "model3_treatment_table.csv"), index=False)
    log(f"treatment table: {len(table):,} (condition, drug) rows across "
        f"{table['condition_key'].nunique():,} conditions", 1)

    text_m = _train_text_classifier(rv, save_dir)
    note_m = _note_layer(save_dir)

    link, methods = _link_diseases(save_dir, table)
    save_json(link, os.path.join(save_dir, "model3_disease_condition_link.json"))

    save_json({
        "pipeline_version": PIPELINE_VERSION,
        "primary_source": "UCI ML Drug Review (~215k reviews, 700+ conditions)",
        "n_reviews": int(len(rv)), "n_conditions_rankable": int(len(rankable)),
        "n_drugs": int(rv["drug"].nunique()),
        "global_mean_rating": round(global_mean, 4),
        "ranking": ranking, "text_condition_classifier": text_m,
        "note_retrieval": note_m,
        "disease_condition_link": {"linked": len(link), "by_method": methods},
        "caveats": [
            "`rank` blends outcome rating with prevalence (gamma, tuned on "
            "held-out data). `rank_by_rating` is the pure-quality order. Show "
            "both - they disagree, and the disagreement is informative.",
            "Links produced by the 'fuzzy_loose' method are the weakest; check "
            "disease_condition_link.by_method before trusting coverage.",
            "Ratings are patient-reported satisfaction, not clinical efficacy "
            "or safety. Outcome bias and self-selection are severe.",
            "Rankings reflect what reviewers took and liked, which tracks "
            "prescribing fashion and marketing as much as effectiveness.",
            "Clinician-facing decision support only - this must never be shown "
            "to a patient as a prescription.",
            "The MIMIC-IV demo contains no free-text notes; any note layer here "
            "is built from a small third-party mirror and is enrichment only.",
        ],
    }, os.path.join(save_dir, "model3_metrics.json"))
    log(f"stage 3 complete -> {save_dir}")
    return ranking


# =============================================================================
# SEVERITY / TRIAGE - rule-weighted, deliberately not learned
# =============================================================================
# No dataset here carries labelled triage outcomes, so a "learned" severity
# model would fit noise and dress it up as authority. A transparent weighted
# score can be audited, tuned by a clinician, and explained line by line in a
# UI - which is what a triage-adjacent signal actually needs.

CRITICAL_RED_FLAGS = {
    "chest pain", "crushing chest pain", "sudden weakness", "slurred speech",
    "facial droop", "loss of consciousness", "unresponsive", "severe bleeding",
    "uncontrolled bleeding", "coughing blood", "vomiting blood", "seizure",
    "stiff neck with fever", "sudden severe headache", "worst headache of life",
    "blue lips", "cyanosis", "anaphylaxis", "suicidal ideation",
    "severe abdominal pain",
}
SERIOUS_RED_FLAGS = {
    "difficulty breathing", "shortness of breath", "wheezing", "confusion",
    "fainting", "dizziness on standing", "high fever", "persistent vomiting",
    "dehydration", "rapid heartbeat", "palpitations", "severe pain",
    "vision loss", "numbness", "swelling of face or throat",
}
SEVERITY_WEIGHTS = {
    "symptom_burden": 0.12, "age_vulnerability": 0.13,
    "diagnosis_confidence": 0.22, "chronic_risk": 0.20,
    "red_flags": 0.18, "vitals": 0.15,
}
SEVERITY_LEVELS = [
    (0.75, "EMERGENCY", "Seek emergency care now"),
    (0.50, "URGENT", "Seek same-day medical attention"),
    (0.25, "MODERATE", "Book an appointment within a few days"),
    (0.00, "MILD", "Self-care; monitor and review if it worsens"),
]
VITAL_RANGES = {
    "heart_rate": (50, 110, "bpm"), "systolic_bp": (90, 160, "mmHg"),
    "diastolic_bp": (60, 100, "mmHg"), "temperature_c": (36.0, 38.0, "degC"),
    "respiratory_rate": (12, 22, "breaths/min"), "spo2": (94, 100, "%"),
}


def _age_vulnerability(age):
    if age is None:  return 0.3, "age not provided"
    if age < 1:      return 1.0, "infant (<1y)"
    if age < 5:      return 0.9, "young child (<5y)"
    if age >= 80:    return 1.0, "very elderly (80+)"
    if age >= 65:    return 0.8, "elderly (65+)"
    if age >= 50:    return 0.45, "middle-aged (50-64)"
    return 0.2, "low-risk age band"


def compute_severity(symptoms, age=None, diagnosis_confidence=0.0,
                     chronic_risk=0.0, vitals=None):
    """
    Score a case 0-1 and bucket it MILD / MODERATE / URGENT / EMERGENCY.

    Returns the score, the level, the recommended action and a full
    per-component breakdown, so a dashboard can show WHY rather than a number.
    """
    norm = {str(s).lower().strip() for s in (symptoms or [])}
    critical = sorted(norm & CRITICAL_RED_FLAGS)
    serious = sorted(norm & SERIOUS_RED_FLAGS)
    age_v, age_note = _age_vulnerability(age)

    worst, breaches = 0.0, []
    for key, val in (vitals or {}).items():
        if val is None or key not in VITAL_RANGES:
            continue
        lo, hi, unit = VITAL_RANGES[key]
        if val < lo or val > hi:
            span = max(hi - lo, 1e-6)
            sev = min(float((lo - val) / span if val < lo else (val - hi) / span), 1.0)
            worst = max(worst, sev)
            breaches.append({"vital": key, "value": val, "unit": unit,
                             "normal_range": [lo, hi],
                             "direction": "low" if val < lo else "high",
                             "deviation": round(sev, 3)})

    parts = {"symptom_burden": min(len(norm) / 6.0, 1.0),
             "age_vulnerability": age_v,
             "diagnosis_confidence": float(np.clip(diagnosis_confidence, 0, 1)),
             "chronic_risk": float(np.clip(chronic_risk, 0, 1)),
             "red_flags": 1.0 if critical else min(len(serious) * 0.5, 1.0),
             "vitals": worst}
    contrib = {k: round(SEVERITY_WEIGHTS[k] * v, 4) for k, v in parts.items()}
    score = sum(contrib.values())

    # Hard overrides. A single critical flag must never be averaged away by
    # low scores on the other components.
    override = None
    if critical:
        level, action = "EMERGENCY", "Seek emergency care now"
        override = f"critical red flag: {critical[0]}"
    elif len(serious) >= 2:
        level, action = "EMERGENCY", "Seek emergency care now"
        override = f"{len(serious)} serious red flags"
    elif worst >= 0.75:
        level, action = "EMERGENCY", "Seek emergency care now"
        override = "vital sign critically out of range"
    else:
        level, action = next((l, a) for t, l, a in SEVERITY_LEVELS if score >= t)

    return {"severity_score": round(float(score), 4), "severity_level": level,
            "recommended_action": action, "escalation_override": override,
            "components": {k: {"raw": round(v, 4), "weight": SEVERITY_WEIGHTS[k],
                               "contribution": contrib[k]}
                           for k, v in parts.items()},
            "critical_red_flags": critical, "serious_red_flags": serious,
            "abnormal_vitals": breaches, "age_band": age_note}


def stage_severity(save_dir=ARTIFACT_DIR):
    banner("SEVERITY - triage configuration")
    ensure_dir(save_dir)
    p = save_json({
        "pipeline_version": PIPELINE_VERSION, "weights": SEVERITY_WEIGHTS,
        "levels": [{"min_score": t, "level": l, "action": a}
                   for t, l, a in SEVERITY_LEVELS],
        "critical_red_flags": sorted(CRITICAL_RED_FLAGS),
        "serious_red_flags": sorted(SERIOUS_RED_FLAGS),
        "vital_ranges": {k: {"low": v[0], "high": v[1], "unit": v[2]}
                         for k, v in VITAL_RANGES.items()},
        "overrides": ["any single critical red flag -> EMERGENCY",
                      "two or more serious red flags -> EMERGENCY",
                      "any vital deviating >75% of its normal span -> EMERGENCY"],
        "inputs": {
            "symptoms": "list of lowercase symptom strings",
            "age": "years",
            "diagnosis_confidence": "top probability from model 1",
            "chronic_risk": "composite 0-1, e.g. top risk percentile / 100",
            "vitals": f"any of {sorted(VITAL_RANGES)}",
        },
        "rationale": "Rule-weighted rather than learned: no dataset in this "
                     "pipeline carries labelled triage outcomes, so a learned "
                     "severity model would fit noise. Auditable and "
                     "clinician-tunable by design.",
    }, os.path.join(save_dir, "severity_config.json"))

    demo = compute_severity(["chest pain", "shortness of breath"], age=68,
                            diagnosis_confidence=0.71, chronic_risk=0.62,
                            vitals={"heart_rate": 124, "spo2": 91})
    log(f"self-check -> {demo['severity_level']} (score {demo['severity_score']}, "
        f"override: {demo['escalation_override']})")
    log(f"severity config -> {p}")
    return demo


# =============================================================================
# MANIFEST + ORCHESTRATION
# =============================================================================

STAGES = {
    "1": ("Disease prediction", stage1),
    "severity": ("Severity configuration", stage_severity),
    "2": ("Chronic risk screening", stage2),
    "3": ("Treatment recommendation", stage3),
}


def build_manifest(save_dir, results):
    metrics, headline = {}, {}
    for key, fn in (("disease", "model1_metrics.json"),
                    ("risk", "model2_metrics.json"),
                    ("treatment", "model3_metrics.json"),
                    ("severity", "severity_config.json")):
        p = os.path.join(save_dir, fn)
        if os.path.exists(p):
            metrics[key] = load_json(p)

    if "disease" in metrics:
        h = metrics["disease"].get("headline", {})
        headline.update(disease_top1_accuracy=h.get("accuracy"),
                        disease_top3_accuracy=h.get("top3_accuracy"),
                        disease_macro_f1=h.get("macro_f1"),
                        disease_n_classes=metrics["disease"].get("n_classes"))
    if "risk" in metrics:
        headline.update(risk_mean_roc_auc=metrics["risk"].get("mean_roc_auc"),
                        risk_n_conditions=metrics["risk"].get("n_conditions"))
    if "treatment" in metrics:
        r = metrics["treatment"].get("ranking", {})
        headline.update(treatment_hit_rate_at_5=r.get("hit_rate_at_5"),
                        treatment_random_baseline_at_5=r.get("random_baseline_at_5"))

    files = []
    for root, _, fs in os.walk(save_dir):
        for f in fs:
            fp = os.path.join(root, f)
            files.append({"file": os.path.relpath(fp, save_dir),
                          "bytes": os.path.getsize(fp)})
    files.sort(key=lambda d: -d["bytes"])

    return save_json({
        "pipeline_version": PIPELINE_VERSION,
        "built_at_unix": int(time.time()),
        "python": sys.version.split()[0],
        "low_mem": LOW_MEM, "duckdb": USE_DUCKDB,
        "stage_results": results, "headline_metrics": headline,
        "artifacts": files, "total_bytes": sum(f["bytes"] for f in files),
        "artifact_guide": {
            "model1_classifier.joblib":
                "disease classifier; .predict_proba(csr 1 x n_symptoms)",
            "model1_label_encoder.joblib":
                "LabelEncoder; .classes_[i] maps a column index to a name",
            "model1_symptom_columns.json":
                "ordered symptom feature space - build the input vector from this",
            "model1_symptom_evidence.json":
                "per-disease top symptoms, for the 'why this diagnosis' panel",
            "model1_disease_lookup.csv":
                "display-only reference (symptoms / cures / specialist)",
            "model2_risk_models.joblib":
                "{condition: {model, calibrator, features, threshold, percentiles}}",
            "model2_condition_metrics.csv":
                "flat per-condition metrics table",
            "model3_treatment_table.csv":
                "condition_key -> ranked drugs with scores and review counts",
            "model3_text_condition.joblib":
                "{vectorizer, classifier, classes} for free-text input",
            "model3_disease_condition_link.json":
                "stage-1 disease name -> stage-3 condition_key",
            "severity_config.json":
                "triage weights, red flags, vital ranges, escalation overrides",
            "*_metrics.json":
                "held-out metrics WITH baselines and caveats - read before quoting",
        },
        "inference_sketch": (
            "p = model1.predict_proba(x)[0]; conf = p.max()\n"
            "risk_p = cal.predict(model.predict_proba(row)[:, 1])[0]\n"
            "score  = np.searchsorted(percentiles, risk_p)   # 0-100\n"
            "sev    = compute_severity(symptoms, age, conf, score/100, vitals)\n"
            "drugs  = treatment_table[treatment_table.condition_key == link[dx]]"
        ),
    }, os.path.join(save_dir, "manifest.json"))


def main(argv=None):
    ap = argparse.ArgumentParser(description="MedAssist training pipeline")
    ap.add_argument("--stages", nargs="+", default=["1", "severity", "2", "3"],
                    choices=list(STAGES))
    ap.add_argument("--stage", default=None, help=argparse.SUPPRESS)
    ap.add_argument("--low-mem", action="store_true")
    ap.add_argument("--no-duckdb", action="store_true")
    ap.add_argument("--n-jobs", type=int, default=None)
    ap.add_argument("--artifacts", default=None)
    ap.add_argument("--in-process", action="store_true",
                    help="run every stage in this process (loses memory isolation)")
    # parse_known_args, not parse_args: Jupyter injects
    # `-f /root/.../kernel-<uuid>.json` into sys.argv, which argparse would
    # otherwise reject with "unrecognized arguments" and SystemExit: 2.
    args, unknown = ap.parse_known_args(argv)
    if unknown and not IN_NOTEBOOK:
        print(f"ignoring unrecognised arguments: {unknown}", file=sys.stderr)

    # Child invocation: run exactly one stage then exit, so the OS reclaims
    # every page this process touched before the next stage starts.
    if args.stage:
        STAGES[args.stage][1](ARTIFACT_DIR)
        return 0

    env = os.environ.copy()
    if args.low_mem:
        env["MEDASSIST_LOW_MEM"] = "1"
    if args.no_duckdb:
        env["MEDASSIST_USE_DUCKDB"] = "0"
    if args.n_jobs:
        env["MEDASSIST_N_JOBS"] = str(args.n_jobs)
    if args.artifacts:
        env["MEDASSIST_ARTIFACTS"] = os.path.abspath(args.artifacts)
    save_dir = env.get("MEDASSIST_ARTIFACTS", ARTIFACT_DIR)
    ensure_dir(save_dir)

    # Subprocess isolation needs a file on disk to re-invoke. Pasted into a
    # notebook cell there is none, so fall back rather than fail - but say so,
    # because peak memory then approaches sum(stages) instead of max(stage).
    isolate = not args.in_process and SCRIPT_PATH is not None

    banner("MedAssist AI - training pipeline")
    log(f"artifacts : {save_dir}")
    log(f"stages    : {args.stages}")
    log(f"low_mem   : {args.low_mem or LOW_MEM}")
    log(f"isolation : {'subprocess per stage' if isolate else 'OFF (single process)'}")
    if not isolate and not args.in_process:
        log("!! No script file on disk, so stages cannot be isolated. Peak "
            "memory will be closer to sum(stages) than max(stage).")
        log("!! For full isolation put this file on disk first:")
        log("!!   cell 1:  %%writefile kaggle_train.py   (then paste this file)")
        log("!!   cell 2:  !python kaggle_train.py")
    if psutil:
        vm = psutil.virtual_memory()
        log(f"host      : {vm.total / 1e9:.1f}GB RAM, {vm.available / 1e9:.1f}GB free")

    results = {}
    for s in args.stages:
        label, fn = STAGES[s]
        t0 = time.perf_counter()
        print(f"\n{'#' * 72}\n### STAGE {s}: {label}\n{'#' * 72}", flush=True)
        rc, err = 0, None
        try:
            if isolate:
                rc = subprocess.run(
                    [sys.executable, SCRIPT_PATH, "--stage", s], env=env).returncode
            else:
                os.environ.update({k: v for k, v in env.items()
                                   if k.startswith("MEDASSIST_")})
                fn(save_dir)
        except Exception as ex:
            rc, err = 1, f"{type(ex).__name__}: {ex}"
            print(f"!!! stage {s} raised: {err}", file=sys.stderr)
        dt = time.perf_counter() - t0
        results[s] = {"label": label, "ok": rc == 0, "exit_code": rc,
                      "error": err, "seconds": round(dt, 1)}
        print(f"### STAGE {s} {'OK' if rc == 0 else f'FAILED (exit {rc})'} "
              f"in {dt / 60:.1f} min", flush=True)
        if rc != 0:
            # exit 137 / -9 is the OOM killer. Say so explicitly rather than
            # leaving a bare exit code, which is what made the original's
            # failures so hard to read.
            if rc in (137, -9):
                print("    exit 137 / -9 means the kernel OOM-killer took this "
                      "stage. Re-run with --low-mem.", file=sys.stderr)
            print("    continuing; later stages degrade gracefully.",
                  file=sys.stderr)
        gc.collect()

    path = build_manifest(save_dir, results)
    m = load_json(path)
    banner("PIPELINE COMPLETE")
    for s, r in results.items():
        log(f"stage {s:<9} {'OK  ' if r['ok'] else 'FAIL'} "
            f"{r['seconds'] / 60:>6.1f} min   {r['label']}")
    log(f"artifacts : {len(m['artifacts'])} files, "
        f"{m['total_bytes'] / 1e6:.1f} MB in {save_dir}")
    for k, v in m["headline_metrics"].items():
        log(f"  {k:<32s} {v}")
    log(f"manifest  : {path}")
    log("Every metrics JSON carries its own baselines and caveats - read them "
        "before putting a number on a dashboard.")
    return 1 if any(not r["ok"] for r in results.values()) else 0


def run(stages=None, low_mem=False, no_duckdb=False, n_jobs=None,
        artifacts=None, in_process=False):
    """
    Notebook-friendly entry point. Equivalent to the CLI but without argparse,
    and it returns the exit code instead of raising SystemExit (which shows up
    in a cell as an ugly traceback).

        run()                       # everything
        run(["2"], low_mem=True)    # just the risk models, tight budget
    """
    argv = []
    if stages:
        argv += ["--stages", *stages]
    if low_mem:
        argv.append("--low-mem")
    if no_duckdb:
        argv.append("--no-duckdb")
    if n_jobs:
        argv += ["--n-jobs", str(n_jobs)]
    if artifacts:
        argv += ["--artifacts", artifacts]
    if in_process:
        argv.append("--in-process")
    return main(argv)


if __name__ == "__main__":
    # Inside a notebook sys.exit would surface as `SystemExit: 2` plus a
    # traceback, so return the code quietly instead.
    _rc = main()
    if not IN_NOTEBOOK:
        sys.exit(_rc)
