"""
MedAssist model layer.

Wraps the artifacts produced by kaggle_train.py behind one entry point:

    from medmodels import get_engine
    result = get_engine().analyze(symptoms=[...], age=54, profile={...})

Replaces the previous predict.py / severity_engine.py / unified_risk_engine.py
trio, which shared no validated contract and held two disagreeing definitions
of "risk".
"""

from .artifacts import ArtifactsUnavailable, get_artifacts
from .engine import CONDITION_LABELS, SCHEMA_VERSION, MedAssistEngine, get_engine
from .severity import compute_severity, red_flag_vocabulary, severity_to_flag

__all__ = [
    "ArtifactsUnavailable",
    "get_artifacts",
    "get_engine",
    "MedAssistEngine",
    "CONDITION_LABELS",
    "SCHEMA_VERSION",
    "compute_severity",
    "severity_to_flag",
    "red_flag_vocabulary",
]
