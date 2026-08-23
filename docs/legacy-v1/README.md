# Archived: v1 model layer documentation

**These documents describe code that no longer exists.** They are kept for
history only — do not follow them as instructions.

The v1 model layer (`backend/predict.py`, `backend/severity_engine.py`,
`backend/unified_risk_engine.py`) was replaced by `backend/medmodels/`. The
files documented here were removed, so anything below referring to
`unified_risk_engine`, `assess_severity`, `run_assessment`, `model_mode`, or the
`model/*.pkl` artifacts is describing a system that is gone.

| Archived file | Described |
|---|---|
| `original_training_script.py` | The original single-file training script, superseded by `training/kaggle_train.py` |
| `UNIFIED_RISK_ENGINE_SUMMARY.md` | The v1 unified risk engine |
| `SEVERITY_*.md` | The v1 rule engine, replaced by `medmodels/severity.py` + `severity_config.json` |
| `RISK_*.md` | v1 risk scoring, including the display-rescaling workaround that substituted hardcoded percentages for missing values |
| `MODEL_*.md`, `ACCURACY_IMPROVEMENT_GUIDE.md` | v1 accuracy work |
| `PER_SYMPTOM_SEVERITY_IMPLEMENTATION.md` | Per-symptom severity input (this feature survived; the implementation did not) |
| `PREDICTION_CONFIDENCE_SUMMARY.md` | v1 confidence heuristics, replaced by empirical calibration bins |
| `TESTING_GUIDE.md`, `MODEL_VERIFICATION_GUIDE.md`, `RESTART_INSTRUCTIONS.md` | v1 workflows |

## What replaced them

- **Models and metrics** — `model/artifacts/*_metrics.json`, each carrying its
  own held-out numbers, baselines and caveats.
- **Severity rules** — `model/artifacts/severity_config.json`, editable without
  code changes.
- **Architecture and limitations** — the root `README.md`.
- **Training** — `training/kaggle_train.py`, whose header documents the memory
  failures of the original pipeline and how each was fixed.
