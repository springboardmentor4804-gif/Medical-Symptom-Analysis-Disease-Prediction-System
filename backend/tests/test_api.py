def signup_and_login(client, email="patient@example.com", password="supersecret1", role="patient"):
    resp = client.post("/signup", json={"email": email, "password": password, "role": role})
    assert resp.status_code == 200, resp.text
    resp = client.post("/login", data={"username": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_reference_data_shape(client):
    resp = client.get("/reference-data")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["symptoms"]) > 100
    # v2: each entry is {name, red_flag, critical} so the picker can
    # prioritise the symptoms that can escalate a case on their own.
    assert all("name" in s for s in data["symptoms"])
    assert "critical" in data["red_flags"]
    assert any(c["key"] == "diabetes" for c in data["risk_conditions"])
    assert len(data["smoker_status_options"]) == 4


def test_assess_with_lifestyle_screening(client):
    token = signup_and_login(client, "patient15@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/assess", json={
        "symptoms": [{"name": "fatigue", "severity": "moderate"}],
        "age": 45, "gender": "male",
        "lifestyle": {
            "age": 45, "sex": "male", "bmi": 31, "smoker_status": 4,
            "exercise": False, "high_cholesterol": True, "high_blood_pressure": True,
            "alcohol_days_per_month": 8, "general_health": 4, "sleep_hours": 6,
            "physical_unwell_days": 5, "mental_unwell_days": 2,
            "meets_activity_guidance": False,
        },
    }, headers=headers)
    assert resp.status_code == 200, resp.text
    risk = resp.json()["risk"]
    assert risk["available"] is True
    # v2 screens every trained condition rather than a caller-chosen subset,
    # and returns a calibrated probability plus a population percentile.
    assert {"diabetes", "heart_attack"} <= set(risk["conditions"])
    assert all(0 <= c["probability"] <= 1 for c in risk["conditions"].values())
    assert all(0 <= c["risk_score"] <= 100 for c in risk["conditions"].values())
    assert 0 <= risk["composite"]["score"] <= 100
    assert 0 < risk["profile_completeness"] <= 1


def test_signup_rejects_short_password(client):
    resp = client.post("/signup", json={"email": "weak@example.com", "password": "short", "role": "patient"})
    assert resp.status_code == 400


def test_signup_rejects_invalid_role(client):
    resp = client.post("/signup", json={"email": "bad@example.com", "password": "supersecret1", "role": "admin"})
    assert resp.status_code == 400


def test_login_wrong_password(client):
    client.post("/signup", json={"email": "u1@example.com", "password": "supersecret1", "role": "patient"})
    resp = client.post("/login", data={"username": "u1@example.com", "password": "wrongpass"})
    assert resp.status_code == 401


def test_assess_requires_auth(client):
    resp = client.post("/assess", json={
        "symptoms": [{"name": "fever", "severity": "moderate"},
                     {"name": "fatigue", "severity": "low"}],
        "age": 30, "gender": "male", "blood_pressure": "normal", "cholesterol_level": "normal",
    })
    assert resp.status_code == 401


def test_assess_and_history_flow(client):
    token = signup_and_login(client, "patient2@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/assess", json={
        "symptoms": [{"name": "fever", "severity": "moderate"},
                     {"name": "cough", "severity": "moderate"},
                     {"name": "fatigue", "severity": "low"},
                     {"name": "difficulty breathing", "severity": "moderate"}],
        "age": 40, "gender": "female", "blood_pressure": "high", "cholesterol_level": "high",
    }, headers=headers)
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert result["schema_version"].startswith("3")
    assert "diagnosis" in result
    assert "risk" in result
    assert "severity" in result
    assert "treatment" in result
    assert result["diagnosis"]["confidence"]["label"] in ("Low", "Moderate", "High")
    assert result["diagnosis"]["predictions"], "expected a differential"

    # v3 treatment cascade: the source must always be identified, because the
    # two layers carry incompatible caveats.
    treatment = result["treatment"]
    assert treatment["layer"] in ("mimic", "drug_reviews", "none")
    assert treatment["gate_reason"]
    assert isinstance(treatment["drugs"], list)
    assert treatment["evidence"]["caveat"]

    resp = client.get("/history", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_analytics_blocked_for_patient(client):
    token = signup_and_login(client, "patient3@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/analytics", headers=headers)
    assert resp.status_code == 403


def test_analytics_allowed_for_provider(client):
    token = signup_and_login(client, "provider1@example.com", role="provider")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/analytics", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total_assessments"] == 0


def test_profile_upsert_and_get(client):
    token = signup_and_login(client, "patient4@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/profile", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["full_name"] is None

    resp = client.put("/profile", json={
        "full_name": "Jane Doe",
        "date_of_birth": "1990-01-01",
        "gender": "Female",
        "allergies": "Penicillin",
        "medical_history": "None",
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Jane Doe"

    resp = client.get("/profile", headers=headers)
    assert resp.json()["full_name"] == "Jane Doe"


def admin_token(client):
    resp = client.post("/login", data={"username": "admin@example.com", "password": "adminpass123"})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_admin_bootstrap_login(client):
    token = admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/analytics", headers=headers)
    assert resp.status_code == 200


def test_admin_users_forbidden_for_patient(client):
    token = signup_and_login(client, "patient5@example.com")
    resp = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_admin_can_list_and_promote_user(client):
    signup_and_login(client, "patient6@example.com")
    a_token = admin_token(client)
    a_headers = {"Authorization": f"Bearer {a_token}"}

    resp = client.get("/admin/users", headers=a_headers)
    assert resp.status_code == 200
    users = resp.json()
    target = next(u for u in users if u["email"] == "patient6@example.com")
    assert target["role"] == "patient"
    assert target["is_active"] is True

    resp = client.patch(f"/admin/users/{target['id']}", json={"role": "provider"}, headers=a_headers)
    assert resp.status_code == 200
    assert resp.json()["role"] == "provider"


def test_admin_cannot_deactivate_self(client):
    a_token = admin_token(client)
    a_headers = {"Authorization": f"Bearer {a_token}"}
    resp = client.get("/admin/users", headers=a_headers)
    me = next(u for u in resp.json() if u["email"] == "admin@example.com")

    resp = client.patch(f"/admin/users/{me['id']}", json={"is_active": False}, headers=a_headers)
    assert resp.status_code == 400


def test_deactivated_user_cannot_login(client):
    token = signup_and_login(client, "patient7@example.com")
    a_token = admin_token(client)
    a_headers = {"Authorization": f"Bearer {a_token}"}

    resp = client.get("/admin/users", headers=a_headers)
    target = next(u for u in resp.json() if u["email"] == "patient7@example.com")
    resp = client.patch(f"/admin/users/{target['id']}", json={"is_active": False}, headers=a_headers)
    assert resp.status_code == 200

    resp = client.post("/login", data={"username": "patient7@example.com", "password": "supersecret1"})
    assert resp.status_code == 403


def test_analytics_shape_has_new_fields(client):
    token = signup_and_login(client, "patient8@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/assess", json={
        "symptoms": [{"name": "fever", "severity": "moderate"}],
        "age": 22, "gender": "female", "blood_pressure": "normal", "cholesterol_level": "normal",
    }, headers=headers)

    a_token = admin_token(client)
    resp = client.get("/analytics", headers={"Authorization": f"Bearer {a_token}"})
    data = resp.json()
    assert len(data["assessments_per_day"]) == 14
    assert "19-35" in data["age_distribution"]
    assert data["gender_distribution"].get("female", 0) >= 1


def test_signup_allows_nurse_role(client):
    resp = client.post("/signup", json={"email": "nurse1@example.com", "password": "supersecret1", "role": "nurse"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "nurse"


def test_signup_rejects_clinic_admin_role(client):
    resp = client.post("/signup", json={"email": "ca1@example.com", "password": "supersecret1", "role": "clinic_admin"})
    assert resp.status_code == 400


def test_patient_cannot_view_triage(client):
    token = signup_and_login(client, "patient9@example.com")
    resp = client.get("/triage", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_nurse_can_view_analytics_and_triage(client):
    token = signup_and_login(client, "nurse2@example.com", role="nurse")
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/analytics", headers=headers).status_code == 200
    assert client.get("/triage", headers=headers).status_code == 200


def test_triage_lists_high_priority_assessment(client):
    token = signup_and_login(client, "patient10@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/assess", json={
        "symptoms": [{"name": "sharp chest pain", "severity": "high"},
                     {"name": "difficulty breathing", "severity": "high"}],
        "age": 50, "gender": "male", "blood_pressure": "high", "cholesterol_level": "high",
    }, headers=headers)
    assert resp.status_code == 200

    a_token = admin_token(client)
    resp = client.get("/triage", headers={"Authorization": f"Bearer {a_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] >= 1
    assert any(item["patient_email"] == "patient10@example.com" for item in data["items"])


def test_assess_includes_care_plan_and_health_score(client):
    token = signup_and_login(client, "patient11@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/assess", json={
        "symptoms": [{"name": "nasal congestion", "severity": "low"}],
        "age": 25, "gender": "female", "blood_pressure": "normal", "cholesterol_level": "normal",
    }, headers=headers)
    result = resp.json()
    # care_plan/health_score were v1 shape; v2 carries the same information
    # in the severity block, with a per-component breakdown.
    assert result["severity"]["level"] in ("MILD", "MODERATE", "URGENT", "EMERGENCY")
    assert 0 <= result["severity"]["score"] <= 1
    assert result["severity"]["action"]
    assert "components" in result["severity"]
    assert result["meta"]["flag"] in ("LOW", "REVIEW", "HIGH PRIORITY")
    # symptoms-only request: chronic risk must report an honest empty state
    # rather than inferring a ten-condition panel from age and sex alone.
    assert result["risk"]["available"] is False
    assert result["risk"]["reason"]


def test_me_summary_shape(client):
    token = signup_and_login(client, "patient12@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/me/summary", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total_assessments"] == 0

    client.post("/assess", json={
        "symptoms": [{"name": "fever", "severity": "moderate"}],
        "age": 40, "gender": "male", "blood_pressure": "normal", "cholesterol_level": "normal",
    }, headers=headers)

    resp = client.get("/me/summary", headers=headers)
    data = resp.json()
    assert data["total_assessments"] == 1
    assert data["latest_health_score"] is not None
    assert len(data["recent_assessments"]) == 1


def test_clinic_admin_cannot_manage_admin_accounts(client):
    signup_and_login(client, "patient13@example.com")
    a_token = admin_token(client)
    a_headers = {"Authorization": f"Bearer {a_token}"}

    # Promote patient13 to clinic_admin
    resp = client.get("/admin/users", headers=a_headers)
    target = next(u for u in resp.json() if u["email"] == "patient13@example.com")
    resp = client.patch(f"/admin/users/{target['id']}", json={"role": "clinic_admin"}, headers=a_headers)
    assert resp.status_code == 200

    ca_token_resp = client.post("/login", data={"username": "patient13@example.com", "password": "supersecret1"})
    ca_headers = {"Authorization": f"Bearer {ca_token_resp.json()['access_token']}"}

    # clinic_admin can list users
    resp = client.get("/admin/users", headers=ca_headers)
    assert resp.status_code == 200

    # clinic_admin cannot touch the bootstrap admin account
    admin_user = next(u for u in resp.json() if u["email"] == "admin@example.com")
    resp = client.patch(f"/admin/users/{admin_user['id']}", json={"is_active": False}, headers=ca_headers)
    assert resp.status_code == 403

    # clinic_admin cannot grant admin/clinic_admin roles
    signup_and_login(client, "patient14@example.com")
    resp = client.get("/admin/users", headers=ca_headers)
    other = next(u for u in resp.json() if u["email"] == "patient14@example.com")
    resp = client.patch(f"/admin/users/{other['id']}", json={"role": "admin"}, headers=ca_headers)
    assert resp.status_code == 403

    # but clinic_admin CAN promote a patient to provider
    resp = client.patch(f"/admin/users/{other['id']}", json={"role": "provider"}, headers=ca_headers)
    assert resp.status_code == 200


def test_org_admin_roles_have_scoped_admin_access(client):
    """hospital_admin / telemedicine_admin / org_admin behave like clinic_admin:
    can manage patient/nurse/provider accounts and view analytics/triage, but
    cannot touch admin or other org-admin accounts."""
    a_token = admin_token(client)
    a_headers = {"Authorization": f"Bearer {a_token}"}

    for i, org_role in enumerate(["hospital_admin", "telemedicine_admin", "org_admin"]):
        patient_email = f"orgpatient{i}@example.com"
        signup_and_login(client, patient_email)
        resp = client.get("/admin/users", headers=a_headers)
        target = next(u for u in resp.json() if u["email"] == patient_email)
        resp = client.patch(f"/admin/users/{target['id']}", json={"role": org_role}, headers=a_headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["role"] == org_role

        login_resp = client.post("/login", data={"username": patient_email, "password": "supersecret1"})
        org_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        assert client.get("/analytics", headers=org_headers).status_code == 200
        assert client.get("/triage", headers=org_headers).status_code == 200
        assert client.get("/admin/users", headers=org_headers).status_code == 200

        admin_row = next(u for u in client.get("/admin/users", headers=org_headers).json() if u["email"] == "admin@example.com")
        resp = client.patch(f"/admin/users/{admin_row['id']}", json={"is_active": False}, headers=org_headers)
        assert resp.status_code == 403


def test_assessment_persists_cascade_telemetry(client):
    """
    The denormalised cascade columns must be written on every assessment.

    These exist so operations can answer "how often does Layer A fire, and when
    it doesn't, why?" without scanning result_json across every row. If they
    silently stay NULL the monitoring question becomes unanswerable.
    """
    token = signup_and_login(client, "telemetry@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/assess", json={
        "symptoms": [{"name": "cough", "severity": "moderate"},
                     {"name": "fever", "severity": "high"}],
        "age": 55, "gender": "male",
    }, headers=headers)
    assert resp.status_code == 200, resp.text
    layer = resp.json()["treatment"]["layer"]

    import database as database_module

    db = database_module.SessionLocal()
    try:
        row = db.query(database_module.Assessment).order_by(
            database_module.Assessment.id.desc()).first()
        assert row.treatment_layer == layer
        assert row.gate_reason, "gate_reason must record why this layer was used"
        assert isinstance(row.treatment_evidence, dict)
        assert row.treatment_evidence.get("caveat")
    finally:
        db.close()


def test_model_status_reports_gate_thresholds(client):
    """A deployment must be able to show which gate it is actually enforcing."""
    token = signup_and_login(client, "status@example.com")
    resp = client.get("/system/model-status",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["healthy"] is True
    assert body["schema_version"].startswith("3")

    cascade = body["cascade"]
    assert cascade["layer_b_conditions"] > 0
    if cascade["layer_a_enabled"]:
        for key in ("sim_floor", "min_support", "cat_threshold"):
            assert key in cascade["gate"]


def test_treatment_suggestions_for_prescriber(client):
    """The prescription form's bridge to the cascade."""
    ptoken = signup_and_login(client, "rxpatient@example.com")
    r = client.post("/assess", json={
        "symptoms": [{"name": "cough", "severity": "high"},
                     {"name": "fever", "severity": "high"}],
        "age": 61, "gender": "male",
    }, headers={"Authorization": f"Bearer {ptoken}"})
    assert r.status_code == 200, r.text

    me = client.get("/me/summary", headers={"Authorization": f"Bearer {ptoken}"})
    assert me.status_code == 200

    prov = signup_and_login(client, "rxprovider@example.com", role="provider")
    ph = {"Authorization": f"Bearer {prov}"}

    # Free-text lookup.
    r = client.get("/treatment-suggestions", params={"query": "acne"}, headers=ph)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["layer"] in ("mimic", "drug_reviews", "none")
    assert body["evidence"]["caveat"]
    assert body["prescribing_note"]
    assert body["drugs"], "acne should resolve to drug-review treatments"

    # Patients cannot pull prescribing suggestions.
    r = client.get("/treatment-suggestions", params={"query": "acne"},
                   headers={"Authorization": f"Bearer {ptoken}"})
    assert r.status_code == 403

    # Neither argument supplied is a bad request, not a silent empty answer.
    assert client.get("/treatment-suggestions", headers=ph).status_code == 400


def test_treatment_suggestions_by_patient(client):
    """Suggestions keyed to the patient's own latest assessment."""
    ptoken = signup_and_login(client, "rxpatient2@example.com")
    client.post("/assess", json={
        "symptoms": [{"name": "shortness of breath", "severity": "high"},
                     {"name": "cough", "severity": "moderate"}],
        "age": 70, "gender": "female",
    }, headers={"Authorization": f"Bearer {ptoken}"})

    import database as database_module
    db = database_module.SessionLocal()
    try:
        pid = db.query(database_module.User).filter(
            database_module.User.email == "rxpatient2@example.com").first().id
    finally:
        db.close()

    prov = signup_and_login(client, "rxprovider2@example.com", role="provider")
    r = client.get("/treatment-suggestions", params={"patient_id": pid},
                   headers={"Authorization": f"Bearer {prov}"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "latest_assessment"
    assert body["assessment_id"] is not None
    assert body["disease"], "should key off the assessed condition"


def test_env_example_allows_the_web_ui_origin():
    """
    backend/.env.example listed only port 8501 (Streamlit), so anyone following
    the manual setup - `cp backend/.env.example backend/.env` - silently broke
    the React UI. CORS_ORIGINS REPLACES the default in config.py rather than
    adding to it, and the symptom is a page that renders but stays empty while
    the API answers every request normally.
    """
    from pathlib import Path

    template = Path(__file__).resolve().parents[1] / ".env.example"
    line = next(l for l in template.read_text(encoding="utf-8").splitlines()
                if l.startswith("CORS_ORIGINS="))
    for origin in ("http://localhost:5173", "http://127.0.0.1:5173"):
        assert origin in line, f"{origin} missing from .env.example CORS_ORIGINS"


def test_bootstrap_env_and_template_agree_on_cors():
    """install.bat writes its own .env; the two must not drift apart."""
    from pathlib import Path

    backend = Path(__file__).resolve().parents[1]
    template = next(
        l for l in (backend / ".env.example").read_text(encoding="utf-8").splitlines()
        if l.startswith("CORS_ORIGINS="))
    written = next(
        l for l in (backend / "bootstrap_env.py").read_text(encoding="utf-8").splitlines()
        if l.startswith("CORS_ORIGINS="))
    origins = lambda s: set(s.split("=", 1)[1].split(","))   # noqa: E731
    assert origins(template) == origins(written)
