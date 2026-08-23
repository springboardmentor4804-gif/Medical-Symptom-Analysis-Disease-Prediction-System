"""
MedAssist model layer.

    from services import get_engine, startup_health_check
    result = get_engine().analyze(symptoms=[...], age=54, profile={...})

Four models behind one orchestrator:

    disease_model.py      Model 1  symptoms -> ranked diseases
    risk_model.py         Model 2  lifestyle -> 10 chronic risk scores
    treatment_cascade.py  Model 3  two-layer treatment cascade
    severity_engine.py    rule-based triage, config-driven (not a model)

All inference. Nothing in this package fits, trains or downloads anything, and
every threshold that matters travels inside an artifact rather than living in
Python.
"""

from .artifacts import ArtifactsUnavailable, get_artifacts
from .disease_model import get_disease_model
from .engine import SCHEMA_VERSION, MedAssistEngine, get_engine
from .risk_model import CONDITION_LABELS, get_risk_model
from .severity_engine import (
    compute_severity,
    red_flag_vocabulary,
    severity_to_flag,
)
from .startup import startup_health_check
from .treatment_cascade import TreatmentCascade, get_cascade

__all__ = [
    "ArtifactsUnavailable",
    "get_artifacts",
    "get_engine",
    "MedAssistEngine",
    "SCHEMA_VERSION",
    "CONDITION_LABELS",
    "get_disease_model",
    "get_risk_model",
    "get_cascade",
    "TreatmentCascade",
    "compute_severity",
    "severity_to_flag",
    "red_flag_vocabulary",
    "startup_health_check",
]
