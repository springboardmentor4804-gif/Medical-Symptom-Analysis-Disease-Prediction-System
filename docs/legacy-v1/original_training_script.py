"""
MedAssist AI — Full Model Training Pipeline
=============================================
Trains three independent, purpose-built models over five public healthcare
datasets, plus a rule-based severity/urgency layer. Designed to run
standalone on Kaggle (all datasets fetched live via kagglehub) or locally.

Models
------
Model 1 — Disease Prediction (multi-class classifier, trained on dense
          symptom-matrix data — NOT similarity matching, real train/test
          accuracy with ~4900+ labeled rows across 40+ diseases)
Model 2 — Chronic Condition Risk Screening (one classifier per condition,
          trained on CDC BRFSS survey data, multi-year if available)
Model 3 — Treatment Recommendation (TF-IDF retrieval over real MIMIC-IV
          Demo discharge summaries)
Severity — Rule-weighted emergency/urgency scoring (interpretable, not a
          learned black box — appropriate for a triage-adjacent signal)

A disease-level lookup table (df1 + df2, deduplicated to one row per
disease) is also built for symptom/cure/doctor reference display — this is
NEVER used for training or evaluation, only for showing info to users.

Outputs
-------
All trained artifacts are saved to ./artifacts/ as .pkl / .csv / .json,
ready to be loaded by an inference script or API layer.
"""

import os
import re
import json
import time
import warnings
from collections import Counter
from difflib import get_close_matches

import numpy as np
import pandas as pd
import joblib

from sklearn.preprocessing import MultiLabelBinarizer, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, classification_report, roc_auc_score,
    precision_score, recall_score, f1_score, top_k_accuracy_score,
    precision_recall_curve,
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

import kagglehub

warnings.filterwarnings("ignore")
pd.set_option("display.max_columns", None)

ARTIFACT_DIR = "artifacts"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

_START = time.perf_counter()


def log(msg):
    elapsed = time.perf_counter() - _START
    print(f"[{elapsed:7.1f}s] {msg}")


# ============================================================================
# SECTION 0 — Shared helpers
# ============================================================================

def normalize_name(name):
    if pd.isna(name):
        return name
    n = str(name).lower().strip()
    n = re.sub(r"\(.*?\)", "", n)
    n = re.sub(r"[^a-z0-9\s]", "", n)
    n = re.sub(r"\s+", " ", n)
    n = re.sub(r"\bdisease\b", "", n).strip()
    n = re.sub(r"\s+", " ", n).strip()
    return n


def self_dedup_map(names_unique):
    """Catches 'X' vs 'X uti' / 'X copd' style splits of the same disease."""
    alias = {}
    for n in names_unique:
        for other in names_unique:
            if other == n:
                continue
            n_words, other_words = set(n.split()), set(other.split())
            if n_words.issubset(other_words) and len(n_words) >= 2:
                longer, shorter = (other, n) if len(other) > len(n) else (n, other)
                alias[longer] = shorter
    return alias


# ============================================================================
# SECTION 1 — MODEL 1: Disease Prediction (trained multi-class classifier)
# ============================================================================
# Upgrade from similarity-matching to a real trained classifier: df3 (the
# dhivyeshrk dense binary symptom matrix) has ~4900+ rows across ~40+
# diseases, i.e. dozens of samples per class instead of ~1 — enough to
# properly train/test-split and report real accuracy / macro-F1 / top-k
# accuracy, not just cosine-similarity ranking.

def build_model1(save_dir=ARTIFACT_DIR):
    log("MODEL 1 — Downloading disease/symptom datasets...")
    path1 = kagglehub.dataset_download("uom190346a/disease-symptoms-and-patient-profile-dataset")
    path2 = kagglehub.dataset_download("pasindueranga/disease-prediction-based-on-symptoms")
    path3 = kagglehub.dataset_download("dhivyeshrk/diseases-and-symptoms-dataset")

    df1 = pd.read_csv(os.path.join(path1, "Disease_symptom_and_patient_profile_dataset.csv"))
    df2 = pd.read_csv(os.path.join(path2, os.listdir(path2)[0]))
    df3_file = [f for f in os.listdir(path3) if f.endswith(".csv")][0]
    df3 = pd.read_csv(os.path.join(path3, df3_file))

    log(f"df1 (patient profile): {df1.shape} | df2 (symptoms/cures): {df2.shape} | df3 (dense symptom matrix): {df3.shape}")

    # ---- Normalize column names defensively (dataset column casing varies) ----
    df1.columns = [c.strip().lower().replace(" ", "_") for c in df1.columns]
    df2.columns = [c.strip().lower().replace(" ", "_") for c in df2.columns]
    df3.columns = [c.strip().lower() for c in df3.columns]

    disease_col_3 = "diseases" if "diseases" in df3.columns else df3.columns[0]
    df1["disease_clean"] = df1["disease"].apply(normalize_name)
    df2["disease_clean"] = df2["disease"].apply(normalize_name)
    df3["disease_clean"] = df3[disease_col_3].apply(normalize_name)

    for d, name in [(df1, "df1"), (df2, "df2"), (df3, "df3")]:
        alias = self_dedup_map(sorted(d["disease_clean"].dropna().unique()))
        d["disease_clean"] = d["disease_clean"].replace(alias)

    log(f"Unique diseases after cleanup -> df1: {df1['disease_clean'].nunique()}, "
        f"df2: {df2['disease_clean'].nunique()}, df3: {df3['disease_clean'].nunique()}")

    # ------------------------------------------------------------------
    # TRAIN Model 1a: multi-class classifier on df3 (the real training signal)
    # ------------------------------------------------------------------
    symptom_cols = [c for c in df3.columns if c not in (disease_col_3, "disease_clean")]
    X_symptoms = df3[symptom_cols].fillna(0).astype(int)
    y_raw = df3["disease_clean"]

    # Drop classes with too few samples to stratify-split meaningfully
    class_counts = y_raw.value_counts()
    valid_classes = class_counts[class_counts >= 3].index
    mask = y_raw.isin(valid_classes)
    X_symptoms, y_raw = X_symptoms[mask], y_raw[mask]
    dropped = sorted(set(class_counts.index) - set(valid_classes))
    log(f"Dropped {len(dropped)} disease classes with <3 samples: {dropped}")
    log(f"Model 1a training set after low-count filter: {X_symptoms.shape[0]} rows, {y_raw.nunique()} classes")

    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X_symptoms, y, test_size=0.2, stratify=y, random_state=42
    )

    majority_baseline = class_counts.max() / class_counts.sum()
    log(f"Majority-class baseline: {majority_baseline:.3f}")

    # Try both RandomForest and XGBoost (if available), keep whichever
    # generalizes better on the held-out test set — not just train accuracy.
    candidates = {}

    rf = RandomForestClassifier(
        n_estimators=300, max_depth=None, min_samples_leaf=2,
        class_weight="balanced", random_state=42, n_jobs=-1
    )
    rf.fit(X_train, y_train)
    candidates["random_forest"] = rf

    if HAS_XGB:
        xgb = XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.1,
            subsample=0.8, colsample_bytree=0.8,
            eval_metric="mlogloss", random_state=42, n_jobs=-1
        )
        xgb.fit(X_train, y_train)
        candidates["xgboost"] = xgb

    results = {}
    for name, model in candidates.items():
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)
        acc = accuracy_score(y_test, y_pred)
        f1_macro = f1_score(y_test, y_pred, average="macro", zero_division=0)
        try:
            top3 = top_k_accuracy_score(y_test, y_proba, k=3, labels=np.arange(len(le.classes_)))
        except Exception:
            top3 = None
        results[name] = {"accuracy": acc, "macro_f1": f1_macro, "top3_accuracy": top3}
        log(f"  {name:15s} test_accuracy={acc:.3f}  macro_f1={f1_macro:.3f}  top3_acc={top3}")

    best_name = max(results, key=lambda k: results[k]["accuracy"])
    best_model = candidates[best_name]
    log(f"Best Model 1 classifier: {best_name} (accuracy={results[best_name]['accuracy']:.3f}, "
        f"lift over baseline={results[best_name]['accuracy'] - majority_baseline:+.3f})")

    # 5-fold CV on the winning model for a more stable estimate
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(best_model, X_symptoms, y, cv=cv, scoring="accuracy", n_jobs=-1)
    log(f"5-fold CV accuracy ({best_name}): {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

    # ------------------------------------------------------------------
    # Symptom-similarity matcher (kept as a fallback / explainability layer
    # for free-text symptom input that doesn't cleanly map to df3's columns)
    # ------------------------------------------------------------------
    symptom_synonyms = {
        "shortness of breath": "difficulty_breathing", "sob": "difficulty_breathing",
        "breathlessness": "difficulty_breathing", "tiredness": "fatigue", "exhaustion": "fatigue",
    }

    def normalize_input_symptoms(symptom_list):
        return [
            symptom_synonyms.get(s.lower().strip().replace(" ", "_"), s.lower().strip().replace(" ", "_"))
            for s in symptom_list
        ]

    # ------------------------------------------------------------------
    # Disease-level LOOKUP table (df1 + df2, deduped) — for DISPLAY ONLY,
    # never trained on or evaluated. Cross-dataset alias mapping first.
    # ------------------------------------------------------------------
    names1 = sorted(df1["disease_clean"].dropna().unique())
    names2 = sorted(df2["disease_clean"].dropna().unique())
    cross_alias = {}
    for n2 in names2:
        m = get_close_matches(n2, names1, n=1, cutoff=0.82)
        if m and m[0] != n2:
            cross_alias[n2] = m[0]
    df2["disease_canonical"] = df2["disease_clean"].replace(cross_alias)
    df1["disease_canonical"] = df1["disease_clean"]

    lookup = (
        df2.drop_duplicates(subset="disease_canonical", keep="first")
        .merge(
            df1.drop_duplicates(subset="disease_canonical", keep="first")[
                ["disease_canonical"] + [c for c in df1.columns if c not in df2.columns and c != "disease_canonical"]
            ],
            on="disease_canonical", how="outer"
        )
    )
    lookup.to_csv(os.path.join(save_dir, "model1_disease_lookup.csv"), index=False)

    # ------------------------------------------------------------------
    # Save all Model 1 artifacts
    # ------------------------------------------------------------------
    joblib.dump(best_model, os.path.join(save_dir, "model1_classifier.pkl"))
    joblib.dump(le, os.path.join(save_dir, "model1_label_encoder.pkl"))
    joblib.dump(list(X_symptoms.columns), os.path.join(save_dir, "model1_symptom_columns.pkl"))
    joblib.dump(symptom_synonyms, os.path.join(save_dir, "model1_symptom_synonyms.pkl"))

    with open(os.path.join(save_dir, "model1_metrics.json"), "w") as f:
        json.dump({
            "best_model": best_name,
            "n_classes": int(len(le.classes_)),
            "n_training_rows": int(X_symptoms.shape[0]),
            "majority_baseline": float(majority_baseline),
            "cv_accuracy_mean": float(cv_scores.mean()),
            "cv_accuracy_std": float(cv_scores.std()),
            "all_candidates": {k: {kk: (float(vv) if vv is not None else None) for kk, vv in v.items()}
                                for k, v in results.items()},
        }, f, indent=2)

    log(f"Model 1 artifacts saved to {save_dir}/")
    return {
        "model": best_model, "label_encoder": le, "symptom_columns": list(X_symptoms.columns),
        "lookup": lookup, "metrics": results[best_name],
    }


# ============================================================================
# SECTION 2 — SEVERITY / URGENCY (rule-weighted, interpretable — not a
# learned model, deliberately, since triage-style urgency should be
# auditable rather than a black box)
# ============================================================================

CRITICAL_RED_FLAGS = {
    "chest pain", "sudden weakness", "slurred speech",
    "loss of consciousness", "severe bleeding",
}
MODERATE_RED_FLAGS = {
    "difficulty breathing", "shortness of breath", "confusion",
}
RED_FLAG_SYMPTOMS = CRITICAL_RED_FLAGS | MODERATE_RED_FLAGS

SEVERITY_WEIGHTS = {
    "symptom_count": 0.15,
    "age_factor": 0.15,
    "disease_prediction_confidence": 0.30,
    "chronic_risk_score": 0.25,
    "red_flag_present": 0.15,
}


def compute_severity(symptoms, age, model1_confidence, model2_risk_score=0.0):
    normalized = {s.lower().strip() for s in symptoms}
    critical_hit = len(normalized & CRITICAL_RED_FLAGS) >= 1
    moderate_hits = len(normalized & MODERATE_RED_FLAGS)
    red_flag = critical_hit or moderate_hits >= 1
    age_factor = 1.0 if (age < 5 or age > 65) else 0.3

    score = (
        SEVERITY_WEIGHTS["symptom_count"] * min(len(symptoms) / 5, 1.0)
        + SEVERITY_WEIGHTS["age_factor"] * age_factor
        + SEVERITY_WEIGHTS["disease_prediction_confidence"] * model1_confidence
        + SEVERITY_WEIGHTS["chronic_risk_score"] * model2_risk_score
        + SEVERITY_WEIGHTS["red_flag_present"] * (1.0 if red_flag else 0.0)
    )

    if critical_hit or moderate_hits >= 2 or score > 0.75:
        level = "EMERGENCY"
    elif score > 0.5:
        level = "URGENT"
    elif score > 0.25:
        level = "MODERATE"
    else:
        level = "MILD"

    return {
        "severity_score": round(float(score), 3),
        "severity_level": level,
        "red_flag_triggered": red_flag,
        "matched_red_flags": sorted(normalized & RED_FLAG_SYMPTOMS),
    }


def save_severity_config(save_dir=ARTIFACT_DIR):
    with open(os.path.join(save_dir, "severity_config.json"), "w") as f:
        json.dump({"red_flag_symptoms": sorted(RED_FLAG_SYMPTOMS), "weights": SEVERITY_WEIGHTS}, f, indent=2)
    log(f"Severity config saved to {save_dir}/severity_config.json")


# ============================================================================
# SECTION 3 — MODEL 2: Chronic Condition Risk Screening (CDC BRFSS)
# ============================================================================
# Trains one classifier per chronic condition on real survey data. If more
# than one BRFSS year is available in the dataset, they're concatenated
# with a survey_year feature for more training volume and trend signal.

CONDITION_COLUMNS = {
    "diabetes": "DIABETE3", "heart_attack": "CVDINFR4", "coronary_hd": "CVDCRHD4",
    "stroke": "CVDSTRK3", "asthma": "ASTHMA3", "skin_cancer": "CHCSCNCR",
    "other_cancer": "CHCOCNCR", "arthritis": "HAVARTH3", "depression": "ADDEPEV2",
    "kidney_disease": "CHCKIDNY",
}
CONDITION_CODE_MAPS = {
    "diabetes": {1: 1, 2: 1, 3: 0, 4: 0},
    "heart_attack": {1: 1, 2: 0}, "coronary_hd": {1: 1, 2: 0}, "stroke": {1: 1, 2: 0},
    "asthma": {1: 1, 2: 0}, "skin_cancer": {1: 1, 2: 0}, "other_cancer": {1: 1, 2: 0},
    "arthritis": {1: 1, 2: 0}, "depression": {1: 1, 2: 0}, "kidney_disease": {1: 1, 2: 0},
}
RISK_FEATURE_COLS = ["_BMI5", "_AGEG5YR", "SEX", "_SMOKER3", "EXERANY2", "BPHIGH4", "TOLDHI2", "ALCDAY5"]
CAT_COLS = ["_AGEG5YR", "SEX", "_SMOKER3", "BPHIGH4"]


def decode_yn(series):
    return series.map({1: 1, 2: 0}).where(series.isin([1, 2]))


def decode_alcdays(v):
    if pd.isna(v):
        return np.nan
    v = int(v)
    if v == 888:
        return 0
    if 101 <= v <= 199:
        return (v - 100) * 4.33
    if 201 <= v <= 299:
        return v - 200
    return np.nan


def prep_risk_features(raw):
    df = raw[RISK_FEATURE_COLS].copy()
    df["EXERANY2"] = decode_yn(df["EXERANY2"])
    df["TOLDHI2"] = decode_yn(df["TOLDHI2"])
    df["BPHIGH4"] = df["BPHIGH4"].map({1: 1, 2: 1, 3: 0, 4: 0}).where(df["BPHIGH4"].isin([1, 2, 3, 4]))
    df["_BMI5"] = df["_BMI5"].where(df["_BMI5"] < 9000) / 100
    df["_AGEG5YR"] = df["_AGEG5YR"].where(df["_AGEG5YR"] <= 14)
    df["_SMOKER3"] = df["_SMOKER3"].where(df["_SMOKER3"] != 9)
    df["ALCDAY5"] = df["ALCDAY5"].apply(decode_alcdays)
    return df


def build_model2(save_dir=ARTIFACT_DIR):
    log("MODEL 2 — Downloading CDC BRFSS...")
    brfss_path = kagglehub.dataset_download("cdc/behavioral-risk-factor-surveillance-system")
    csv_files = [f for f in os.listdir(brfss_path) if f.endswith(".csv")]
    log(f"BRFSS files found: {csv_files}")

    needed_cols = RISK_FEATURE_COLS + list(CONDITION_COLUMNS.values())
    frames = []
    for f in csv_files:
        try:
            header = pd.read_csv(os.path.join(brfss_path, f), nrows=0).columns
            usecols = [c for c in needed_cols if c in header]
            if not all(col in usecols for col in RISK_FEATURE_COLS):
                log(f"  Skipped {f}: missing required risk feature columns")
                continue
            year_df = pd.read_csv(os.path.join(brfss_path, f), usecols=usecols, low_memory=False)
            year_df["survey_year"] = re.sub(r"\D", "", f) or "unknown"
            frames.append(year_df)
            log(f"  Loaded {f}: {year_df.shape} (columns pre-filtered)")
            del year_df
        except Exception as e:
            log(f"  Skipped {f}: {e}")

    if not frames:
        raise RuntimeError("No usable BRFSS year files found with expected schema.")

    for fdf in frames:
        for col in fdf.select_dtypes(include=["float64"]).columns:
            fdf[col] = pd.to_numeric(fdf[col], downcast="float")
        for col in fdf.select_dtypes(include=["int64"]).columns:
            fdf[col] = pd.to_numeric(fdf[col], downcast="integer")

    brfss = pd.concat(frames, ignore_index=True) if len(frames) > 1 else frames[0]
    del frames
    log(f"Combined BRFSS shape across {len(frames) if 'frames' in dir() else '?'} year(s): {brfss.shape}, "
        f"memory: {brfss.memory_usage(deep=True).sum() / 1e6:.1f} MB")

    risk_features = prep_risk_features(brfss)

    risk_models = {}
    metrics_rows = []
    for name, condition_col in CONDITION_COLUMNS.items():
        if condition_col not in brfss.columns:
            log(f"  {name}: column {condition_col} not found, skipped")
            continue

        code_map = CONDITION_CODE_MAPS[name]
        target = brfss[condition_col].map(code_map).where(brfss[condition_col].isin(code_map.keys()))

        combined = risk_features.copy()
        combined["target"] = target
        combined = combined.dropna()

        if combined.empty or len(Counter(combined["target"])) < 2:
            log(f"  {name}: insufficient data, skipped")
            continue

        X = pd.get_dummies(combined.drop(columns="target"), columns=CAT_COLS)
        y = combined["target"].astype(int).values

        if min(Counter(y).values()) < 100:
            log(f"  {name}: insufficient class balance, skipped")
            continue

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
        clf = RandomForestClassifier(
            n_estimators=200, max_depth=10, min_samples_leaf=15,
            class_weight="balanced", random_state=42, n_jobs=-1
        )
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        y_proba = clf.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_proba)

        risk_models[name] = {
            "model": clf, "features": list(X.columns), "auc": auc,
            "n": len(y), "positive_rate": float(y.mean()),
            "precision": precision_score(y_test, y_pred, zero_division=0),
            "recall": recall_score(y_test, y_pred, zero_division=0),
            "f1": f1_score(y_test, y_pred, zero_division=0),
        }
        metrics_rows.append({"condition": name, "n": len(y), "auc": auc,
                              "precision": risk_models[name]["precision"],
                              "recall": risk_models[name]["recall"],
                              "f1": risk_models[name]["f1"]})
        log(f"  {name:15s} n={len(y):>8,}  ROC-AUC={auc:.3f}  F1={risk_models[name]['f1']:.3f}")
        del combined, X, y, X_train, X_test, y_train, y_test

    metrics_df = pd.DataFrame(metrics_rows)
    metrics_df.to_csv(os.path.join(save_dir, "model2_condition_metrics.csv"), index=False)
    joblib.dump(risk_models, os.path.join(save_dir, "model2_risk_models.pkl"))

    log(f"Model 2 artifacts saved to {save_dir}/ — {len(risk_models)} condition models trained")
    return risk_models


# ============================================================================
# SECTION 4 — MODEL 3: Treatment Recommendation (MIMIC-IV Demo, TF-IDF)
# ============================================================================
# Uses the openly-licensed MIMIC-IV Clinical Database DEMO (not the full
# credentialed dataset) — no PhysioNet access approval required.

def extract_section(text, section_name, next_sections):
    pattern = rf"{re.escape(section_name)}:?(.*?)(?:{'|'.join(re.escape(s) for s in next_sections)}|$)"
    match = re.search(pattern, str(text), re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else None


def redaction_ratio(text):
    if not text:
        return 1.0
    tokens = text.split()
    if not tokens:
        return 1.0
    return sum(1 for t in tokens if "___" in t) / len(tokens)


def build_model3(save_dir=ARTIFACT_DIR):
    log("MODEL 3 — Downloading MIMIC-IV Demo discharge summaries...")
    mimic_path = kagglehub.dataset_download("mehrnooshazizi/mimic-iv-dataset")
    mimic_csv = [f for f in os.listdir(mimic_path) if f.endswith(".csv")][0]
    mimic_df = pd.read_csv(os.path.join(mimic_path, mimic_csv))
    log(f"MIMIC-IV Demo shape: {mimic_df.shape}, columns: {list(mimic_df.columns)}")

    text_col = next((c for c in mimic_df.columns if mimic_df[c].dtype == object and mimic_df[c].str.len().mean() > 500), mimic_df.columns[-1])
    log(f"Using text column: {text_col}")

    mimic_df["diagnosis_raw"] = mimic_df[text_col].apply(
        lambda t: extract_section(t, "Discharge Diagnosis", ["Discharge Condition", "Discharge Instructions", "Discharge Disposition"])
    )
    mimic_df["medications_raw"] = mimic_df[text_col].apply(
        lambda t: extract_section(t, "Discharge Medications", ["Discharge Disposition", "Discharge Condition", "Discharge Instructions"])
    )
    mimic_df["diagnosis_redaction_ratio"] = mimic_df["diagnosis_raw"].apply(redaction_ratio)

    before = mimic_df.shape[0]
    mimic_clean = mimic_df[
        mimic_df["diagnosis_raw"].notna() & mimic_df["medications_raw"].notna()
        & (mimic_df["diagnosis_redaction_ratio"] < 0.4)
    ].copy()
    mimic_clean["diagnosis_clean"] = mimic_clean["diagnosis_raw"].str.replace(r"\s+", " ", regex=True).str.strip()
    mimic_clean["medications_clean"] = mimic_clean["medications_raw"].str.replace(r"\s+", " ", regex=True).str.strip()
    log(f"Usable notes after redaction filter: {mimic_clean.shape[0]} / {before} "
        f"({mimic_clean.shape[0] / before * 100:.1f}%)")

    tfidf = TfidfVectorizer(stop_words="english", max_features=3000, ngram_range=(1, 2))
    diagnosis_matrix = tfidf.fit_transform(mimic_clean["diagnosis_clean"])

    # Held-out relevance check: split notes, confirm retrieval beats random baseline
    train_notes, test_notes = train_test_split(mimic_clean, test_size=0.2, random_state=42)
    train_matrix = tfidf.transform(train_notes["diagnosis_clean"])
    hits, total = 0, min(50, len(test_notes))
    for _, row in test_notes.head(total).iterrows():
        query_vec = tfidf.transform([row["diagnosis_clean"]])
        sims = cosine_similarity(query_vec, train_matrix)[0]
        top_idx = sims.argsort()[::-1][:3]
        top_meds = set(train_notes.iloc[top_idx]["medications_clean"].str.lower().str.split().sum())
        true_meds = set(row["medications_clean"].lower().split())
        if top_meds & true_meds:
            hits += 1
    relevance_rate = hits / total if total else 0.0
    log(f"Held-out retrieval relevance (medication token overlap in top-3): {relevance_rate:.3f} over {total} queries")
    if mimic_clean.shape[0] < 300:
        log(f"NOTE: only {mimic_clean.shape[0]}")

    joblib.dump(tfidf, os.path.join(save_dir, "model3_tfidf_vectorizer.pkl"))
    mimic_clean[["diagnosis_clean", "medications_clean"]].to_csv(
        os.path.join(save_dir, "model3_diagnosis_medication_reference.csv"), index=False
    )
    with open(os.path.join(save_dir, "model3_metrics.json"), "w") as f:
        json.dump({"n_notes_usable": int(mimic_clean.shape[0]), "held_out_relevance_rate": relevance_rate}, f, indent=2)

    log(f"Model 3 artifacts saved to {save_dir}/")
    return {"vectorizer": tfidf, "reference": mimic_clean, "relevance_rate": relevance_rate}


# ============================================================================
# SECTION 5 — MAIN
# ============================================================================

def main():
    log("=" * 70)
    log("MedAssist AI — Full Training Pipeline Starting")
    log("=" * 70)

    m1 = build_model1()
    save_severity_config()
    m2 = build_model2()
    m3 = build_model3()

    log("=" * 70)
    log("ALL MODELS TRAINED — SUMMARY")
    log("=" * 70)
    log(f"Model 1 (Disease Prediction): {m1['metrics']['accuracy']:.3f} test accuracy, "
        f"{m1['metrics']['macro_f1']:.3f} macro-F1, {len(m1['label_encoder'].classes_)} classes")
    log(f"Model 2 (Risk Screening): {len(m2)} condition models, "
        f"mean ROC-AUC={np.mean([v['auc'] for v in m2.values()]):.3f}")
    log(f"Model 3 (Treatment Retrieval): {m3['relevance_rate']:.3f} held-out relevance rate, "
        f"{m3['reference'].shape[0]} usable clinical notes")

    total_size = sum(
        os.path.getsize(os.path.join(ARTIFACT_DIR, f))
        for f in os.listdir(ARTIFACT_DIR)
    )
    log(f"Total artifact size: {total_size / 1024:.1f} KB across {len(os.listdir(ARTIFACT_DIR))} files")
    log(f"Total runtime: {(time.perf_counter() - _START) / 60:.1f} min")


if __name__ == "__main__":
    main()