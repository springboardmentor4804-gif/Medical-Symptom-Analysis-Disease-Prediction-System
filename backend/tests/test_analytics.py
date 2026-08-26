"""
Healthcare analytics tests.

Two things are guarded here, in order of importance:

  1. SCOPE ENFORCEMENT, server-side. A patient must not reach panel analytics
     or another patient's analytics by calling the endpoint directly - route
     hiding in the frontend is not access control. These are the tests that
     must never be relaxed.
  2. That both role views are computed by the SAME aggregation layer, so the
     patient chart and the provider drill-down of that same patient agree.
"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tests.test_api import signup_and_login                    # noqa: E402

ASSESS_PAYLOAD = {
    "symptoms": [{"name": "ear pain"}, {"name": "fever"}],
    "age": 30,
    "gender": "male",
}


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _user_id(email):
    """
    Look the id up directly.

    There is no endpoint that returns the caller's own user id, and adding one
    just for tests would widen the API surface. The `client` fixture has
    already pointed `database` at the temp DB by the time this runs.
    """
    import database

    session = database.SessionLocal()
    try:
        user = session.query(database.User).filter(
            database.User.email == email).first()
        assert user is not None, f"{email} was not created"
        return user.id
    finally:
        session.close()


def _make_assessment(client, token, symptoms=None):
    payload = dict(ASSESS_PAYLOAD)
    if symptoms:
        payload["symptoms"] = [{"name": s} for s in symptoms]
    resp = client.post("/assess", json=payload, headers=_auth(token))
    assert resp.status_code == 200, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Access control - the security boundary
# ---------------------------------------------------------------------------

def test_patient_cannot_reach_panel_analytics(client):
    """A patient calling the provider endpoint directly must be refused."""
    token = signup_and_login(client, email="p1@example.com", role="patient")
    resp = client.get("/analytics/panel", headers=_auth(token))
    assert resp.status_code == 403


def test_patient_cannot_reach_panel_roster(client):
    """The roster would enumerate other users - patients must not see it."""
    token = signup_and_login(client, email="p2@example.com", role="patient")
    resp = client.get("/analytics/patients", headers=_auth(token))
    assert resp.status_code == 403


def test_patient_cannot_read_another_patients_analytics(client):
    """
    403, not an empty result. An empty 200 would confirm the id exists, which
    is itself a leak.
    """
    other = signup_and_login(client, email="victim@example.com", role="patient")
    _make_assessment(client, other)
    other_id = _user_id("victim@example.com")

    attacker = signup_and_login(client, email="attacker@example.com",
                                role="patient")
    resp = client.get(f"/analytics/patient/{other_id}", headers=_auth(attacker))
    assert resp.status_code == 403


def test_patient_may_read_their_own_analytics_by_id(client):
    token = signup_and_login(client, email="self@example.com", role="patient")
    _make_assessment(client, token)
    own_id = _user_id("self@example.com")

    resp = client.get(f"/analytics/patient/{own_id}", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["scope"]["kind"] == "patient"


def test_analytics_requires_authentication(client):
    for path in ("/analytics/me", "/analytics/panel", "/analytics/patients",
                 "/analytics/patient/1"):
        assert client.get(path).status_code == 401, path


def test_provider_can_read_panel_and_drill_down(client):
    patient = signup_and_login(client, email="panelpt@example.com",
                               role="patient")
    _make_assessment(client, patient)
    patient_id = _user_id("panelpt@example.com")

    provider = signup_and_login(client, email="doc@example.com",
                                role="provider")

    panel = client.get("/analytics/panel", headers=_auth(provider))
    assert panel.status_code == 200
    assert panel.json()["scope"]["kind"] == "panel"

    drill = client.get(f"/analytics/patient/{patient_id}",
                       headers=_auth(provider))
    assert drill.status_code == 200
    assert drill.json()["scope"]["subject_user_id"] == patient_id


def test_me_endpoint_stays_patient_scoped_even_for_a_provider(client):
    """
    /analytics/me is the patient dashboard's feed. It pins the caller's own id
    so a clinical role cannot accidentally render panel totals there.
    """
    provider = signup_and_login(client, email="doc2@example.com",
                                role="provider")
    resp = client.get("/analytics/me", headers=_auth(provider))
    assert resp.status_code == 200
    assert resp.json()["scope"]["kind"] == "patient"


def test_drill_down_on_unknown_patient_is_404(client):
    provider = signup_and_login(client, email="doc3@example.com",
                                role="provider")
    resp = client.get("/analytics/patient/999999", headers=_auth(provider))
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# One aggregation layer, two views
# ---------------------------------------------------------------------------

def test_patient_view_and_provider_drilldown_agree(client):
    """
    The provider drill-down must reuse the patient-scoped computation. If
    these ever disagree, the two views have grown separate implementations -
    which is the thing this design exists to prevent.
    """
    patient = signup_and_login(client, email="shared@example.com",
                               role="patient")
    _make_assessment(client, patient)
    _make_assessment(client, patient, symptoms=["cough", "fever"])
    patient_id = _user_id("shared@example.com")

    provider = signup_and_login(client, email="doc4@example.com",
                                role="provider")

    own = client.get("/analytics/me", headers=_auth(patient)).json()
    drill = client.get(f"/analytics/patient/{patient_id}",
                       headers=_auth(provider)).json()

    for section in ("summary", "risk_trend", "symptom_frequency",
                    "severity_history", "predictions_by_condition"):
        assert own[section] == drill[section], f"{section} diverged"


def test_panel_totals_cover_more_than_one_patient(client):
    a = signup_and_login(client, email="pa@example.com", role="patient")
    b = signup_and_login(client, email="pb@example.com", role="patient")
    _make_assessment(client, a)
    _make_assessment(client, b)

    provider = signup_and_login(client, email="doc5@example.com",
                                role="provider")
    panel = client.get("/analytics/panel", headers=_auth(provider)).json()
    own_a = client.get("/analytics/me", headers=_auth(a)).json()

    assert panel["summary"]["patients_with_assessments"] >= 2
    assert (panel["summary"]["assessment_count"]
            > own_a["summary"]["assessment_count"])


# ---------------------------------------------------------------------------
# Aggregation correctness
# ---------------------------------------------------------------------------

def test_every_section_is_present_even_with_no_assessments(client):
    """A new user gets an empty dashboard, not a broken one."""
    token = signup_and_login(client, email="fresh@example.com", role="patient")
    data = client.get("/analytics/me", headers=_auth(token)).json()

    for section in ("risk_trend", "assessment_history", "symptom_frequency",
                    "severity_history", "predictions_by_condition",
                    "risk_distribution", "volume_trend"):
        assert section in data
        assert isinstance(data[section], list)

    assert data["summary"]["assessment_count"] == 0
    assert data["escalation"]["rate_pct"] == 0.0
    # Severity categories stay present so the chart axis does not collapse.
    assert len(data["severity_history"]) == 4


def test_severity_history_covers_all_levels(client):
    token = signup_and_login(client, email="sev@example.com", role="patient")
    _make_assessment(client, token)
    data = client.get("/analytics/me", headers=_auth(token)).json()
    levels = [row["level"] for row in data["severity_history"]]
    assert levels == ["MILD", "MODERATE", "URGENT", "EMERGENCY"]


def test_symptom_frequency_counts_assessments_not_mentions(client):
    """
    A symptom repeated inside one submission is one check-in, not three -
    otherwise the "most commonly reported" chart rewards repetition.
    """
    token = signup_and_login(client, email="freq@example.com", role="patient")
    client.post("/assess", json={
        "symptoms": [{"name": "fever"}, {"name": "fever"}, {"name": "fever"}],
        "age": 30, "gender": "male",
    }, headers=_auth(token))

    data = client.get("/analytics/me", headers=_auth(token)).json()
    fever = [s for s in data["symptom_frequency"] if s["symptom"] == "fever"]
    assert fever and fever[0]["count"] == 1


def test_escalation_rate_reports_its_denominator(client):
    """A bare percentage hides whether it came from 2 assessments or 200."""
    token = signup_and_login(client, email="esc@example.com", role="patient")
    _make_assessment(client, token)
    data = client.get("/analytics/me", headers=_auth(token)).json()
    esc = data["escalation"]
    assert esc["escalated"] + esc["non_escalated"] == esc["total_graded"]
    assert set(esc["by_level"]) == {"MILD", "MODERATE", "URGENT", "EMERGENCY"}


def test_response_states_its_own_scope(client):
    """
    Every response carries the scope it was computed under, so a chart can
    never be captioned with the wrong population.
    """
    token = signup_and_login(client, email="scope@example.com", role="patient")
    data = client.get("/analytics/me", headers=_auth(token)).json()
    assert data["scope"]["kind"] == "patient"
    assert data["scope"]["patient_count"] == 1
    assert data["meta"]["note"]


# ---------------------------------------------------------------------------
# Trend-module series
# ---------------------------------------------------------------------------

def test_trend_series_are_present_for_the_modules(client):
    """Each trend module needs its series in the payload, empty or not."""
    token = signup_and_login(client, email="trend@example.com", role="patient")
    _make_assessment(client, token)
    data = client.get("/analytics/me", headers=_auth(token)).json()

    for key in ("risk_trend_by_condition", "prediction_trend", "vitals_trend"):
        assert key in data, key
        assert isinstance(data[key].get("points"), list)

    # The vitals module reads its normal ranges from severity_config via the
    # API rather than restating them, so they must be served.
    assert data["vitals_trend"]["ranges"], "vital ranges must reach the chart"


def test_prediction_trend_buckets_by_day_with_explicit_zeros(client):
    """
    A day where a condition was not predicted must be 0, not absent - a gap
    would imply data was missing rather than the condition not occurring.
    """
    token = signup_and_login(client, email="ptrend@example.com", role="patient")
    _make_assessment(client, token)
    _make_assessment(client, token, symptoms=["cough", "fever"])
    data = client.get("/analytics/me", headers=_auth(token)).json()

    trend = data["prediction_trend"]
    if trend["points"]:
        keys = {c["key"] for c in trend["conditions"]}
        for point in trend["points"]:
            for key in keys:
                assert key in point, f"{key} missing from {point['date']}"


def test_vitals_trend_flags_out_of_range_readings(client):
    """
    The out-of-range flag is computed server-side against severity_config, so
    the chart cannot mark a breach the severity engine would not.
    """
    token = signup_and_login(client, email="vitals@example.com", role="patient")
    resp = client.post("/assess", json={
        "symptoms": [{"name": "fever"}],
        "age": 40, "gender": "female",
        # spo2 88 is below the configured low bound of 94.
        "vitals": {"heart_rate": 70, "spo2": 88},
    }, headers=_auth(token))
    assert resp.status_code == 200, resp.text

    data = client.get("/analytics/me", headers=_auth(token)).json()
    trend = data["vitals_trend"]
    assert trend["points"], "a vitals reading was submitted"

    keys = {v["key"] for v in trend["vitals"]}
    assert {"heart_rate", "spo2"} <= keys

    point = trend["points"][-1]
    assert point["spo2_out"] is True, "88% SpO2 is below the normal range"
    assert point["heart_rate_out"] is False, "70 bpm is within range"


def test_vitals_trend_is_empty_without_vitals(client):
    """The module shows its empty state rather than erroring."""
    token = signup_and_login(client, email="novitals@example.com", role="patient")
    _make_assessment(client, token)
    data = client.get("/analytics/me", headers=_auth(token)).json()
    assert data["vitals_trend"]["points"] == []
    assert data["vitals_trend"]["vitals"] == []


# ---------------------------------------------------------------------------
# Comparative module - the reason it can hide itself safely
# ---------------------------------------------------------------------------

def test_patient_payload_never_carries_the_panel_baseline(client):
    """
    The comparative module keys off the PRESENCE of panel_baseline. That is
    only safe because a patient response never contains it - a frontend flag
    could be passed wrongly, a missing payload cannot leak.
    """
    token = signup_and_login(client, email="nobaseline@example.com",
                             role="patient")
    _make_assessment(client, token)
    own_id = _user_id("nobaseline@example.com")

    for path in ("/analytics/me", f"/analytics/patient/{own_id}"):
        data = client.get(path, headers=_auth(token)).json()
        assert "panel_baseline" not in data, f"{path} leaked panel aggregates"


def test_provider_drilldown_carries_the_panel_baseline(client):
    patient = signup_and_login(client, email="cmp@example.com", role="patient")
    _make_assessment(client, patient)
    patient_id = _user_id("cmp@example.com")

    provider = signup_and_login(client, email="cmpdoc@example.com",
                                role="provider")
    data = client.get(f"/analytics/patient/{patient_id}",
                      headers=_auth(provider)).json()

    assert "panel_baseline" in data
    assert data["scope"]["kind"] == "patient", "still a single-patient scope"
    baseline = data["panel_baseline"]
    assert baseline["patients_in_baseline"] >= 1
    assert isinstance(baseline["points"], list)


def test_panel_endpoint_carries_the_baseline(client):
    provider = signup_and_login(client, email="cmpdoc2@example.com",
                                role="provider")
    data = client.get("/analytics/panel", headers=_auth(provider)).json()
    assert "panel_baseline" in data
