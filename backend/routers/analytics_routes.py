"""
Healthcare analytics endpoints.

Three routes over ONE aggregation layer (services/analytics.py). The role
difference lives entirely in the scope each route resolves, never in the
metrics themselves:

    GET /analytics/me                  own rows        any authenticated user
    GET /analytics/panel               all patients    clinical staff only
    GET /analytics/patients            panel roster    clinical staff only
    GET /analytics/patient/{id}        one patient     self, or clinical staff

Access control is enforced HERE and in resolve_scope(), not by the frontend.
`require_role` refuses a patient at the door for panel routes, and
resolve_scope() independently re-checks the subject id, so a patient cannot
reach another patient's data even if a route is later mis-wired.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user, require_role
from database import User, get_db
from roles import CLINICAL_STAFF_ROLES
from services.analytics import (
    build_analytics,
    list_panel_patients,
    resolve_scope,
)

router = APIRouter(prefix="/analytics")


@router.get("/me")
def my_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Personal analytics for the logged-in user.

    Powers the Analytics section of the patient dashboard. Scope is pinned to
    the caller's own id by passing it explicitly, so this route cannot widen
    even for a clinical role.
    """
    scope = resolve_scope(db, current_user, patient_id=current_user.id)
    return build_analytics(db, scope)


@router.get("/panel")
def panel_analytics(
    current_user: User = Depends(require_role(*CLINICAL_STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Panel-wide analytics for clinical staff.

    Scope follows the convention already set by /all-assessments: this schema
    has no provider->patient panel table, so clinical roles see the whole
    patient population. The response states its own scope, so a future panel
    table only changes resolve_scope().
    """
    scope = resolve_scope(db, current_user)
    # Clinical role already enforced by require_role, so the panel baseline
    # used by the comparative module is safe to attach here.
    return build_analytics(db, scope, include_panel_baseline=True)


@router.get("/patients")
def panel_patients(
    current_user: User = Depends(require_role(*CLINICAL_STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    """Roster for the provider drill-down selector, clinical staff only."""
    scope = resolve_scope(db, current_user)
    return {"scope": scope.describe(),
            "patients": list_panel_patients(db, scope)}


@router.get("/patient/{patient_id}")
def patient_analytics(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    One patient's analytics - the provider drill-down.

    Deliberately NOT behind require_role: a patient passing their own id is
    legitimate, and resolve_scope() is what refuses any other id. Keeping the
    check in one place means the rule cannot differ between routes.
    """
    scope = resolve_scope(db, current_user, patient_id=patient_id)

    # The comparative module overlays this patient against the panel average.
    # That is aggregate data about other patients, so it is attached ONLY when
    # a clinical role is doing the drill-down - a patient reading their own
    # analytics through this same route gets no baseline, and the module then
    # hides itself.
    is_clinical = current_user.role in CLINICAL_STAFF_ROLES
    return build_analytics(db, scope,
                           include_panel_baseline=is_clinical)
