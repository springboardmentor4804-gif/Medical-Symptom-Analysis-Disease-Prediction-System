# Training

`kaggle_train.py` produces every artifact the application loads at runtime. It
is a single self-contained script with no imports from the app — the app
consumes its output, never the other way round.

## Run it on Kaggle

```
Cell 1:  %%writefile kaggle_train.py
         <paste kaggle_train.py>

Cell 2:  !pip -q install kagglehub duckdb
         !python kaggle_train.py
```

Roughly 7 minutes and ~1.4 GB peak RAM on a standard CPU session. On a GPU
session (13 GB rather than 30 GB) add `--low-mem`.

Use the `%%writefile` route rather than pasting into a cell and running it
directly: with a file on disk the script isolates each stage in its own
subprocess, so peak memory is `max(stage)` instead of `sum(stages)`. It falls
back gracefully and warns if run from a bare cell.

Other flags:

```bash
python kaggle_train.py --stages 2          # retrain one stage
python kaggle_train.py --low-mem           # smaller memory budgets
python kaggle_train.py --no-duckdb         # chunked pandas instead of DuckDB
python kaggle_train.py --artifacts ./out   # custom output directory
```

## Installing the output

Copy the generated `artifacts/` into `model/artifacts/` at the repo root and
restart the API. `install.bat` verifies they load; `GET /system/model-status`
reports per-artifact health at runtime.

`model3_text_condition.joblib` (~104 MB) is deliberately **not** installed. It
powers free-text condition search, is 95% of total artifact weight, and the
symptom picker covers the same ground. Add it only if you wire that endpoint.

## Datasets

Downloaded automatically via `kagglehub`:

| Key | Dataset | Used for |
|---|---|---|
| `symptom_matrix` | `dhivyeshrk/diseases-and-symptoms-dataset` | Model 1 training |
| `patient_profile` | `uom190346a/disease-symptoms-and-patient-profile-dataset` | Display-only reference |
| `symptom_cures` | `pasindueranga/disease-prediction-based-on-symptoms` | Display-only reference |
| `brfss` | `cdc/behavioral-risk-factor-surveillance-system` | Model 2 training |
| `drug_reviews` | `jessicali9530/kuc-hackathon-winter-2018` | Model 3 training |
| `notes` | `mehrnooshazizi/mimic-iv-dataset` | Optional; self-skips when too small |

## Notes on the data

- The symptom matrix is **synthetically augmented** from disease→symptom
  profiles, so held-out accuracy overstates real-world performance.
- The MIMIC-IV *demo* contains no free-text notes, so the note-retrieval layer
  is built from a small third-party mirror and self-skips below 300 usable
  notes rather than reporting a metric fitted on nothing.
- `eda/milestone-1-eda.ipynb` is the original exploratory analysis.

## Why the script is shaped the way it is

The header of `kaggle_train.py` documents the eight distinct causes that made
the original pipeline exhaust Kaggle's 30 GB and die mid-run — dense int64
matrices, a 773-class RandomForest whose per-tree value arrays alone reached
~9 GB, `cross_val_score(n_jobs=-1)` forking copies of both, and so on — with
the fix for each. Read it before changing model families or parallelism.
