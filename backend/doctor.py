#!/usr/bin/env python
"""
Diagnose a MedAssist install.

Run this first on any machine where something "doesn't work". It checks the
things that actually break on a fresh clone, in the order they break, and says
what to do about each:

    python backend/doctor.py

The most common failure by far is a clone made without Git LFS. The model files
are then 130-byte text pointers rather than models, and the error you get is a
confusing artifact-load failure that reads like corruption.
"""

from __future__ import annotations

import logging
import sys
import warnings
from pathlib import Path

# The point of this script is its own report. sklearn's version-mismatch
# warnings and passlib's bcrypt probe would bury it in noise.
warnings.filterwarnings("ignore")
logging.disable(logging.WARNING)

BACKEND = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND))

ARTIFACTS = BACKEND / "artifacts"
LFS_MAGIC = b"version https://git-lfs.github.com/spec/v1"

OK, WARN, BAD = "  ok   ", "  WARN ", "  FAIL "
problems: list[str] = []


def fail(msg: str, fix: str) -> None:
    print(f"{BAD}{msg}")
    problems.append(f"{msg}\n         fix: {fix}")


def _expected_venv_python() -> Path:
    """Where install.bat / the manual setup puts the project interpreter."""
    root = BACKEND.parent
    if sys.platform == "win32":
        return root / ".venv" / "Scripts" / "python.exe"
    return root / ".venv" / "bin" / "python"


def check_interpreter() -> None:
    """
    Is this the project's virtual environment?

    Checked FIRST and reported loudly, because running the system Python
    against a correctly-installed project produces a cascade of misleading
    failures - wrong numpy, missing packages - that all point at the
    dependencies when the only thing wrong is which interpreter was invoked.
    """
    print(f"       interpreter: {sys.executable}")
    expected = _expected_venv_python()
    in_venv = sys.prefix != sys.base_prefix

    if expected.exists():
        try:
            same = Path(sys.executable).resolve() == expected.resolve()
        except OSError:
            same = False
        if same:
            print(f"{OK}running the project virtual environment")
            return
        fail("NOT running the project virtual environment - the .venv exists "
             "but a different Python is running",
             f"use it explicitly:\n"
             f"                {expected}  backend/doctor.py\n"
             f"              or activate it first: "
             f"{'.venv\\Scripts\\activate' if sys.platform == 'win32' else 'source .venv/bin/activate'}")
        return

    if in_venv:
        print(f"{WARN}in a virtual environment, but not {expected} - fine if "
              f"deliberate")
    else:
        fail("no virtual environment: running the system Python and no .venv "
             "exists",
             "create one - Windows: install.bat, otherwise "
             "python -m venv .venv && pip install -r backend/requirements.txt")


def main() -> int:
    print("MedAssist install check")
    print("=" * 70)

    # -- 1. Interpreter ----------------------------------------------------
    check_interpreter()

    # -- 2. Python version -------------------------------------------------
    v = sys.version_info
    if v < (3, 10):
        fail(f"Python {v.major}.{v.minor} is too old",
             "install Python 3.10-3.12; the artifacts are numpy 2.x pickles")
    else:
        print(f"{OK}Python {v.major}.{v.minor}.{v.micro}")

    # -- 2. Dependencies ---------------------------------------------------
    try:
        import numpy, sklearn, scipy, pandas, joblib  # noqa: F401
    except ImportError as e:
        fail(f"missing dependency: {e.name}",
             "pip install -r backend/requirements.txt")
        print("\nCannot continue without the dependencies.")
        return 1

    print(f"{OK}numpy {numpy.__version__}, scikit-learn {sklearn.__version__}")
    if int(numpy.__version__.split(".")[0]) < 2:
        # requirements.txt pins numpy>=2, so seeing 1.x almost always means
        # the project venv was not the interpreter that ran - not that the
        # install failed.
        expected = _expected_venv_python()
        hint = ("pip install 'numpy>=2' - the artifacts are numpy 2.x pickles")
        if expected.exists():
            hint = (f"requirements.txt already pins numpy>=2, so this is "
                    f"very likely the wrong interpreter. Run:\n"
                    f"                {expected}  backend/doctor.py")
        fail(f"numpy {numpy.__version__} cannot read the artifacts", hint)

    # -- 3. Artifact directory --------------------------------------------
    if not ARTIFACTS.is_dir():
        fail(f"missing {ARTIFACTS}",
             "the models live in the repo; re-clone or restore the directory")
        return _summary()
    files = sorted(p for p in ARTIFACTS.iterdir() if p.is_file())
    print(f"{OK}{len(files)} files in backend/artifacts/")

    # -- 4. Git LFS pointers (the big one) ---------------------------------
    pointers = []
    for p in files:
        try:
            with open(p, "rb") as fh:
                if fh.read(len(LFS_MAGIC)) == LFS_MAGIC:
                    pointers.append(p.name)
        except OSError:
            pass

    if pointers:
        fail(f"{len(pointers)} model files are Git LFS pointers, not models "
             f"({', '.join(pointers[:3])}{'...' if len(pointers) > 3 else ''})",
             "git lfs install && git lfs pull")
    else:
        big = ARTIFACTS / "model3_text_condition.joblib"
        if big.exists():
            mb = big.stat().st_size / 1e6
            print(f"{OK}LFS content present (model3_text_condition.joblib "
                  f"{mb:.0f} MB)")
        else:
            print(f"{WARN}model3_text_condition.joblib absent - free-text "
                  f"condition search disabled (optional)")

    # -- 5. Load the model layer ------------------------------------------
    try:
        from services import get_artifacts, get_cascade
        from services.artifacts import ArtifactsUnavailable
    except Exception as e:                                   # noqa: BLE001
        fail(f"cannot import the model layer: {type(e).__name__}: {e}",
             "run from the repo root, or check the traceback above")
        return _summary()

    art = get_artifacts()
    try:
        report = art.health_check()
    except ArtifactsUnavailable as e:
        # Point at the cause the message actually indicates rather than
        # guessing at LFS every time.
        text = str(e)
        if "Git LFS pointer" in text:
            hint = "git lfs install && git lfs pull"
        elif "numpy" in text:
            hint = ("this is the numpy version above, not a bad download - "
                    "use the project venv, or pip install 'numpy>=2'")
        elif "Missing required artifact" in text or "Missing artifact" in text:
            hint = "re-export the artifacts from the training notebook"
        else:
            hint = ("see the message above; if it mentions neither LFS nor "
                    "numpy, the artifacts may be from a different run")
        fail(f"artifacts did not load: {e}", hint)
        return _summary()

    for name, info in sorted(report["artifacts"].items()):
        print(f"{OK}{name:24} rows={info['rows']}")

    # -- 6. Treatment cascade ---------------------------------------------
    print("-" * 70)
    cascade = get_cascade()
    status = cascade.status()
    if status["layer_a_enabled"]:
        g = status["gate"]
        print(f"{OK}Layer A (MIMIC-IV) enabled, {status['mimic_admissions']} "
              f"admissions")
        print(f"       gate sim_floor={g['sim_floor']} "
              f"min_support={g['min_support']} cat_threshold={g['cat_threshold']}")
    else:
        print(f"{WARN}Layer A DISABLED - hospital-prescription recommendations "
              f"unavailable, drug reviews only")
    print(f"{OK}Layer B: {status['layer_b_conditions']} conditions, "
          f"{status['disease_links']} disease links")

    # Known-good probes, one per routing outcome.
    checks = [
        ("pneumonia", "mimic"),
        ("acne", "drug_reviews"),
        ("xyzzy nonsense", "none"),
    ]
    for query, expected in checks:
        result = cascade.recommend(query)
        drugs = [d["drug"] for d in result["drugs"]][:3]
        if result["layer"] == expected:
            print(f"{OK}{query:16} -> {result['layer']:13} {drugs}")
        elif expected == "mimic" and not status["layer_a_enabled"]:
            print(f"{WARN}{query:16} -> {result['layer']} (Layer A disabled)")
        else:
            fail(f"{query!r} routed to {result['layer']!r}, expected "
                 f"{expected!r} (gate_reason={result['gate_reason']})",
                 "artifacts may be from a different training run")

    # -- 7. End to end -----------------------------------------------------
    try:
        from services import get_engine
        result = get_engine().analyze(
            symptoms=[{"name": "cough", "severity": "high"},
                      {"name": "fever", "severity": "high"}],
            age=60, sex="male")
        tx = result["treatment"]
        print(f"{OK}full assessment: dx={result['diagnosis']['top_disease']!r} "
              f"severity={result['severity']['level']}")
        print(f"{OK}treatment: layer={tx['layer']} "
              f"drugs={[d['drug'] for d in tx['drugs']][:3]}")
        if not tx["drugs"]:
            print(f"{WARN}no drugs for this case - correct when neither source "
                  f"covers the condition, not necessarily a fault")
    except Exception as e:                                   # noqa: BLE001
        fail(f"assessment failed: {type(e).__name__}: {e}",
             "see the traceback; this is a real bug, please report it")

    return _summary()


def _summary() -> int:
    print("=" * 70)
    if not problems:
        print("No problems found. The model layer is healthy.")
        return 0
    print(f"{len(problems)} problem(s) found:\n")
    for i, p in enumerate(problems, 1):
        print(f"  {i}. {p}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
