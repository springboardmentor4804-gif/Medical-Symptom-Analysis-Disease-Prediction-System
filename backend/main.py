import json
import logging
from collections import Counter
from datetime import datetime, timedelta
from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, require_role
from config import settings
from database import Assessment, User, SystemSettings, ProviderReport, PatientProfile, get_db, init_db
from services import (
    CONDITION_LABELS,
    SCHEMA_VERSION,
    ArtifactsUnavailable,
    get_artifacts,
    get_cascade,
    get_engine,
    red_flag_vocabulary,
    startup_health_check,
)
from report_builder import build_pdf
from routers.admin_routes import router as admin_router
from routers.analytics_routes import router as analytics_router
from routers.auth_routes import router as auth_router
from routers.patient_routes import router as patient_router
from routers.prescription_routes import router as prescription_router
from routers.report_routes import router as report_router
from roles import CLINICAL_STAFF_ROLES
from services.analytics import build_analytics, resolve_scope

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("medassist.main")

app = FastAPI(title="MedAssist AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS allowed origins: %s", settings.cors_origin_list)
logger.info("Database: %s", settings.database_url)


@app.exception_handler(Exception)
async def log_unhandled_exceptions(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


init_db()


def bootstrap_admin():
    if not (settings.bootstrap_admin_email and settings.bootstrap_admin_password):
        return
    from database import SessionLocal

    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.role == "admin").first()
        if existing_admin:
            return
        existing_email = db.query(User).filter(User.email == settings.bootstrap_admin_email).first()
        if existing_email:
            logger.info("Bootstrap admin email already registered with a non-admin role; skipping.")
            return
        admin = User(
            email=settings.bootstrap_admin_email,
            password_hash=hash_password(settings.bootstrap_admin_password),
            role="admin",
        )
        db.add(admin)
        db.commit()
        logger.info("Bootstrap admin account created: %s", settings.bootstrap_admin_email)
    finally:
        db.close()


bootstrap_admin()


@app.on_event("startup")
def load_models():
    """
    Load and verify the model layer once per worker.

    Artifacts are warmed here rather than on first request: loading costs
    1-2 s, inference costs ~10 ms, and doing it per request would make the API
    unusable. A missing REQUIRED artifact aborts startup with the filename -
    a deployment that cannot answer correctly must not accept traffic.
    """
    startup_health_check(strict=True)


app.include_router(auth_router, tags=["auth"])
app.include_router(report_router, tags=["reports"])
app.include_router(patient_router, tags=["patient"])
app.include_router(admin_router, tags=["admin"])
app.include_router(prescription_router, tags=["prescriptions"])
app.include_router(analytics_router, tags=["analytics"])


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/reference-data")
def reference_data():
    """
    Everything the frontend needs to build its forms without hardcoding a
    vocabulary that must match the trained model exactly.

    `symptoms` is the model's own 377-column feature space, in model order.
    The picker MUST offer these strings verbatim - anything else falls through
    to alias/substring resolution and is likely to be dropped.
    """
    art = get_artifacts()
    flags = red_flag_vocabulary()
    red_flag_set = set(flags["critical"]) | set(flags["serious"])

    return {
        "schema_version": SCHEMA_VERSION,
        "model_version": art.manifest.get("pipeline_version"),
        "symptoms": [
            {"name": s, "red_flag": s in red_flag_set,
             "critical": s in set(flags["critical"])}
            for s in sorted(art.symptom_columns)
        ],
        # Red flags are surfaced separately so the picker can pin them to the
        # top - these are the symptoms that can single-handedly escalate a case.
        "red_flags": flags,
        "risk_conditions": [{"key": k, "label": v}
                            for k, v in CONDITION_LABELS.items()],
        "severity_options": [
            {"value": "low", "label": "Mild"},
            {"value": "moderate", "label": "Moderate"},
            {"value": "high", "label": "Severe"},
        ],
        "smoker_status_options": [
            {"value": 4, "label": "Never smoked"},
            {"value": 3, "label": "Former smoker"},
            {"value": 2, "label": "Current smoker (some days)"},
            {"value": 1, "label": "Current smoker (every day)"},
        ],
        "general_health_options": [
            {"value": 1, "label": "Excellent"},
            {"value": 2, "label": "Very good"},
            {"value": 3, "label": "Good"},
            {"value": 4, "label": "Fair"},
            {"value": 5, "label": "Poor"},
        ],
        "vital_ranges": art.severity_config.get("vital_ranges", {}),
    }


class LifestyleProfile(BaseModel):
    """
    Chronic-risk inputs. Everything except age and sex is optional: the
    gradient booster treats missing values as a real branch, so a partial
    profile still yields a calibrated estimate - just a wider one. The UI
    reports `profile_completeness` back to the user for that reason.
    """
    age: int = Field(..., ge=0, le=120)
    sex: Literal["male", "female"]
    bmi: Optional[float] = Field(None, ge=10, le=80)
    smoker_status: Optional[int] = Field(None, ge=1, le=4)
    exercise: Optional[bool] = None
    high_cholesterol: Optional[bool] = None
    high_blood_pressure: Optional[bool] = None
    alcohol_days_per_month: Optional[int] = Field(None, ge=0, le=31)
    # Added in v2 - these features exist in the trained model and were simply
    # never collected before.
    general_health: Optional[int] = Field(
        None, ge=1, le=5, description="1 excellent .. 5 poor")
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    physical_unwell_days: Optional[int] = Field(None, ge=0, le=30)
    mental_unwell_days: Optional[int] = Field(None, ge=0, le=30)
    meets_activity_guidance: Optional[bool] = None


class VitalsInput(BaseModel):
    heart_rate: Optional[float] = Field(None, ge=20, le=250)
    systolic_bp: Optional[float] = Field(None, ge=50, le=260)
    diastolic_bp: Optional[float] = Field(None, ge=30, le=180)
    temperature_c: Optional[float] = Field(None, ge=30, le=45)
    respiratory_rate: Optional[float] = Field(None, ge=4, le=60)
    spo2: Optional[float] = Field(None, ge=50, le=100)


class SymptomInput(BaseModel):
    """A reported symptom with the patient's own intensity rating."""
    name: str = Field(..., min_length=1)
    severity: Literal["low", "moderate", "high"] = "moderate"


class PatientInput(BaseModel):
    symptoms: List[SymptomInput] = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=120)
    gender: Literal["male", "female"]
    lifestyle: Optional[LifestyleProfile] = None
    vitals: Optional[VitalsInput] = None
    top_k: int = Field(5, ge=1, le=10)


def _recent_assessment_summaries(db: Session, user_id: int,
                                 limit: int = 6) -> List[dict]:
    """
    Compact summaries of a user's recent assessments, newest first.

    Only the three fields the trend advisory needs are extracted - reported
    symptoms, the leading prediction and the triage level - rather than
    handing the whole stored payload to the advisory layer. A record that
    fails to parse is skipped: a partial history still supports a trend, and
    one bad row must not fail the assessment being generated now.
    """
    summaries: List[dict] = []
    try:
        rows = (db.query(Assessment)
                  .filter(Assessment.user_id == user_id)
                  .order_by(Assessment.created_at.desc())
                  .limit(limit)
                  .all())
    except Exception:                                            # noqa: BLE001
        logger.exception("Could not read assessment history for advisory")
        return []

    for row in rows:
        try:
            stored = json.loads(row.input_json or "{}")
            result = json.loads(row.result_json or "{}")
            symptoms = [s.get("name") if isinstance(s, dict) else s
                        for s in (stored.get("symptoms") or [])]
            predictions = (result.get("diagnosis") or {}).get("predictions") or []
            summaries.append({
                "symptoms": [s for s in symptoms if s],
                "top_disease": (predictions[0].get("disease")
                                if predictions else None),
                "severity_level": (result.get("severity") or {}).get("level"),
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })
        except (ValueError, TypeError, AttributeError, KeyError):
            logger.warning("Skipping unparseable assessment %s in history",
                           getattr(row, "id", "?"))
    return summaries


@app.post("/assess")
def assess(
    patient: PatientInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    input_dict = patient.model_dump(exclude_none=True)

    # Pass the lifestyle block through as-is (possibly None). The engine keys
    # "was a profile supplied?" off this, so defaulting it to {age, sex} here
    # would make every symptoms-only request look like a completed profile.
    profile = input_dict.get("lifestyle")

    # Advisory Features can detect cross-session patterns - the same symptom
    # recurring, the same leading prediction, severity climbing - which no
    # single assessment can see. That needs the user's own prior records, so
    # they are read here (the engine has no DB access by design) and passed
    # in. A first-time user simply supplies none and the sub-section reports
    # itself unavailable rather than erroring.
    history = _recent_assessment_summaries(db, current_user.id)

    try:
        result = get_engine().analyze(
            symptoms=input_dict["symptoms"],
            age=patient.age,
            sex=patient.gender,
            profile=profile,
            vitals=input_dict.get("vitals"),
            top_k=patient.top_k,
            historical_assessments=history,
        )
    except ArtifactsUnavailable as e:
        logger.error("Model artifacts unavailable: %s", e)
        raise HTTPException(status_code=503, detail=str(e))

    treatment = result.get("treatment", {})
    record = Assessment(
        user_id=current_user.id,
        input_json=json.dumps(input_dict),
        result_json=json.dumps(result),
        # Legacy triage vocabulary ("HIGH PRIORITY" / "REVIEW" / "LOW"). The
        # triage queue and analytics both filter on these exact strings.
        risk_flag=result["meta"]["flag"],
        # Denormalised cascade telemetry - see the Assessment model.
        treatment_layer=treatment.get("layer"),
        gate_reason=treatment.get("gate_reason"),
        treatment_evidence=treatment.get("evidence"),
    )
    db.add(record)
    db.commit()

    logger.info(
        "Assessment recorded: user_id=%s severity=%s flag=%s dx=%s "
        "layer=%s gate=%s",
        current_user.id, result["severity"]["level"], result["meta"]["flag"],
        result["diagnosis"].get("top_disease"),
        treatment.get("layer"), treatment.get("gate_reason"),
    )
    return result


@app.get("/history")
def history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(Assessment).filter(Assessment.user_id == current_user.id).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "input": json.loads(r.input_json),
            "result": json.loads(r.result_json),
            "risk_flag": r.risk_flag,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


@app.get("/all-assessments")
def all_assessments(
    current_user: User = Depends(require_role(*CLINICAL_STAFF_ROLES)),
    db: Session = Depends(get_db)
):
    """Get all assessments across all patients (Clinical staff only)"""
    records = (
        db.query(Assessment, User)
        .join(User, Assessment.user_id == User.id)
        .order_by(Assessment.created_at.desc())
        .all()
    )
    
    return [
        {
            "id": assessment.id,
            "user_id": assessment.user_id,
            "patient_email": user.email,
            "patient_role": user.role,
            "input": json.loads(assessment.input_json),
            "result": json.loads(assessment.result_json),
            "risk_flag": assessment.risk_flag,
            "created_at": assessment.created_at.isoformat(),
        }
        for assessment, user in records
    ]


# Age banding now lives with the aggregation layer that uses it, so the
# buckets cannot drift between this module and services/analytics.py. Kept
# importable from here for any existing caller.
from services.analytics import (                                # noqa: E402
    AGE_BUCKETS,
    AGE_BUCKET_LABELS,
    age_bucket_label,
)


@app.get("/analytics")
def analytics(
    current_user: User = Depends(require_role(*CLINICAL_STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Panel analytics in the original response shape.

    Kept for the existing Dashboard page, but no longer a second
    implementation: it is now a thin projection of services/analytics.py, the
    same aggregation the role-scoped /analytics/* endpoints use. Two copies of
    "top predicted diseases" were free to disagree; one cannot.

    New work should call /analytics/panel, which returns the full shape.
    """
    scope = resolve_scope(db, current_user)
    data = build_analytics(db, scope)

    # The original endpoint always returned a padded 14-day window so the
    # chart axis stays put on quiet days. Preserved here.
    today = datetime.utcnow().date()
    window = [(today - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
    per_day = {row["date"]: row["count"] for row in data["volume_trend"]}

    return {
        "total_assessments": data["summary"]["assessment_count"],
        "total_patients": data["summary"]["patients_with_assessments"],
        "risk_flag_distribution": data["risk_flag_distribution"],
        # Counted across the whole differential, as this endpoint always did -
        # NOT the same metric as predictions_by_condition, which is rank-1 only.
        "top_predicted_diseases": data["predictions_all_ranks"],
        "assessments_per_day": [{"date": d, "count": per_day.get(d, 0)}
                                for d in window],
        "gender_distribution": data["demographics"]["gender_distribution"],
        "age_distribution": data["demographics"]["age_distribution"],
    }


# ---------------------------------------------------------------------------
# Result accessors (v1 / v2 compatible)
# ---------------------------------------------------------------------------
# Assessments stored before the model rewrite use the v1 response shape. These
# read either, so existing history, analytics and PDF downloads keep working
# instead of 500-ing on a KeyError. New rows are always v2.

def _is_v2(result: dict) -> bool:
    return "schema_version" in result and "diagnosis" in result


def result_top_disease(result: dict) -> Optional[str]:
    if _is_v2(result):
        preds = result.get("diagnosis", {}).get("predictions") or []
        return preds[0]["disease"] if preds else None
    legacy = result.get("disease_prediction", {}).get("top_possible_diseases") or []
    return legacy[0].get("disease_canonical") if legacy else None


def result_all_diseases(result: dict) -> List[str]:
    if _is_v2(result):
        return [p["disease"] for p in result.get("diagnosis", {}).get("predictions", [])]
    return [d.get("disease_canonical") for d
            in result.get("disease_prediction", {}).get("top_possible_diseases", [])
            if d.get("disease_canonical")]


def result_symptoms(result: dict) -> List[dict]:
    if _is_v2(result):
        return result.get("input", {}).get("symptoms", [])
    return result.get("symptom_analysis", {}).get("reported_symptoms", [])


def result_priority(result: dict) -> float:
    """Normalised 0-1 urgency, for ordering the triage queue."""
    if _is_v2(result):
        return round(float(result.get("severity", {}).get("score", 0.0)), 3)
    legacy = result.get("risk_assessment", {}).get("priority_score", 0)
    return round(min(float(legacy) / 3, 1.0), 3)


def result_health_score(result: dict) -> int:
    """
    0-100 where HIGHER IS BETTER.

    v1 stored `health_score` as the unified *risk* score, i.e. higher was
    worse. It is inverted here so a single trend line stays meaningful for
    users who have assessments from both eras.
    """
    if _is_v2(result):
        return int(round(100 - float(result["severity"]["score"]) * 100))
    legacy = result.get("health_score")
    if legacy is None:
        legacy = round(float(result.get("risk_assessment", {})
                             .get("priority_score", 0)) * 100)
    return int(round(100 - float(legacy)))


def result_severity_level(result: dict) -> Optional[str]:
    if _is_v2(result):
        return result.get("severity", {}).get("level")
    return result.get("severity_analysis", {}).get("severity_tier")


TRIAGE_FLAGS = ("HIGH PRIORITY", "REVIEW")


@app.get("/triage")
def triage_queue(
    current_user: User = Depends(require_role(*CLINICAL_STAFF_ROLES)),
    db: Session = Depends(get_db),
    limit: int = 100,
):
    """Cross-patient list of flagged assessments needing clinical follow-up
    (the spec's "Emergency case identification" requirement)."""
    records = (
        db.query(Assessment, User)
        .join(User, Assessment.user_id == User.id)
        .filter(Assessment.risk_flag.in_(TRIAGE_FLAGS))
        .order_by(Assessment.created_at.desc())
        .limit(limit)
        .all()
    )

    items = []
    for r, patient in records:
        result = json.loads(r.result_json)
        items.append({
            "id": r.id,
            "patient_email": patient.email,
            "risk_flag": r.risk_flag,
            "priority_score": result_priority(result),
            "severity_level": result_severity_level(result),
            "escalation_reason": (result.get("severity", {})
                                  .get("escalation_override")),
            "top_disease": result_top_disease(result),
            "reported_symptoms": result_symptoms(result),
            "created_at": r.created_at.isoformat(),
        })
    # Most urgent first, then most recent - a provider works the top of this list.
    items.sort(key=lambda i: (-i["priority_score"], i["created_at"]), reverse=False)
    items.sort(key=lambda i: -i["priority_score"])

    return {
        "count": len(items),
        "items": items,
    }


@app.get("/me/summary")
def my_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Personal health summary powering the patient dashboard."""
    records = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.asc())
        .all()
    )

    if not records:
        return {
            "total_assessments": 0,
            "latest_health_score": None,
            "latest_risk_flag": None,
            "latest_created_at": None,
            "health_score_trend": [],
            "recent_assessments": [],
        }

    trend = []
    for r in records:
        result = json.loads(r.result_json)
        trend.append({"date": r.created_at.date().isoformat(),
                      "health_score": result_health_score(result)})

    latest = records[-1]

    recent = []
    for r in reversed(records[-5:]):
        result = json.loads(r.result_json)
        recent.append({
            "id": r.id,
            "risk_flag": r.risk_flag,
            "severity_level": result_severity_level(result),
            "top_disease": result_top_disease(result),
            "created_at": r.created_at.isoformat(),
        })

    return {
        "total_assessments": len(records),
        "latest_health_score": trend[-1]["health_score"],
        "latest_risk_flag": latest.risk_flag,
        "latest_created_at": latest.created_at.isoformat(),
        "health_score_trend": trend[-14:],
        "recent_assessments": recent,
    }


@app.get("/system/model-status")
def get_model_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Real artifact health, not a database flag.

    v1 had a `model_mode` toggle that swapped in placeholder predictions. That
    is gone: an endpoint that can silently return fabricated clinical output is
    a liability, not a feature. This reports whether each artifact actually
    loaded, so a broken deployment is visible instead of quietly plausible.
    """
    art = get_artifacts()
    try:
        status = art.status()
    except Exception as e:
        return {"model_enabled": False, "healthy": False,
                "error": f"{type(e).__name__}: {e}", "artifacts": {}}

    manifest = {}
    try:
        manifest = art.manifest
    except Exception:
        pass

    cascade = {}
    try:
        cascade = get_cascade().status()
    except Exception as e:                                   # noqa: BLE001
        cascade = {"error": f"{type(e).__name__}: {e}"}

    return {
        "model_enabled": status["healthy"],
        "healthy": status["healthy"],
        "schema_version": SCHEMA_VERSION,
        "model_version": manifest.get("pipeline_version", manifest.get("created")),
        "trained_at_unix": manifest.get("built_at_unix"),
        "artifact_count": manifest.get("n_files"),
        "headline_metrics": manifest.get("headline_metrics", {}),
        "artifact_dir": status["artifact_dir"],
        "artifacts": status["artifacts"],
        # The active gate thresholds, read from the artifact. Surfaced so a
        # deployment can be checked against the notebook that tuned it.
        "cascade": cascade,
        "layer_a_enabled": status.get("layer_a_enabled"),
        "disabled_features": status.get("disabled_features", []),
    }


@app.get("/assessments/{assessment_id}/download")
def download_assessment_report(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download a patient's assessment report as PDF."""
    import os
    import tempfile
    
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        return JSONResponse(status_code=404, content={"detail": "Assessment not found"})
    
    # Verify access: patient can access their own, clinical staff can access any
    if assessment.user_id != current_user.id and current_user.role not in CLINICAL_STAFF_ROLES:
        return JSONResponse(status_code=403, content={"detail": "Access denied"})
    
    # Get patient profile (use assessment owner, not current user)
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == assessment.user_id).first()
    profile_dict = None
    if profile:
        profile_dict = {
            "full_name": profile.full_name,
            "date_of_birth": profile.date_of_birth,
            "allergies": profile.allergies,
            "medical_history": profile.medical_history,
        }
    
    # Get patient email
    patient = db.query(User).filter(User.id == assessment.user_id).first()
    patient_email = patient.email if patient else current_user.email
    
    # Parse data
    input_data = json.loads(assessment.input_json)
    result_data = json.loads(assessment.result_json)
    
    # Generate PDF
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        build_pdf(
            temp_file.name,
            patient_email=patient_email,
            profile=profile_dict,
            input_data=input_data,
            result=result_data,
            assessment_created_at=assessment.created_at,
            assessment_id=assessment.id,
        )
        
        return FileResponse(
            temp_file.name,
            media_type="application/pdf",
            filename=f"MedAssist_Assessment_{assessment_id}.pdf",
        )
    except Exception as e:
        logger.exception("Failed to generate assessment PDF")
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        return JSONResponse(status_code=500, content={"detail": "Failed to generate PDF"})
        build_pdf(
            temp_file.name,
            patient_email=current_user.email,
            profile=profile_dict,
            input_data=input_data,
            result=result_data,
            assessment_created_at=assessment.created_at,
            assessment_id=assessment.id,
        )
        
        return FileResponse(
            temp_file.name,
            media_type="application/pdf",
            filename=f"MedAssist_Assessment_{assessment_id}.pdf",
        )
    except Exception as e:
        logger.exception("Failed to generate assessment PDF")
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        return JSONResponse(status_code=500, content={"detail": "Failed to generate PDF"})


# NOTE: POST /system/model-mode was removed in v2.
#
# It flipped a database flag that made /assess return
# `_generate_placeholder_assessment(...)` - fabricated diseases, risk scores and
# care plans, returned in the same shape as a real result with nothing in the
# payload marking them as fake. Any authenticated user could flip it. Clinical
# output that can be silently replaced by invented data is a liability, not a
# feature, so the endpoint and the placeholder generator are both gone.
#
# Use GET /system/model-status to check whether the real artifacts loaded.
