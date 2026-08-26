import os

import streamlit as st
import requests

API_URL = os.environ.get("API_URL", "http://127.0.0.1:8000")
REQUEST_TIMEOUT = 10

st.set_page_config(page_title="MedAssist AI", page_icon="🩺", layout="centered")

# ---- Session state ----
if "token" not in st.session_state:
    st.session_state.token = None
if "role" not in st.session_state:
    st.session_state.role = None
if "email" not in st.session_state:
    st.session_state.email = None


def auth_headers():
    return {"Authorization": f"Bearer {st.session_state.token}"}


def safe_request(method, path, **kwargs):
    """Wrap requests calls so a down/unreachable backend shows a clear message instead of a stack trace."""
    try:
        return requests.request(method, f"{API_URL}{path}", timeout=REQUEST_TIMEOUT, **kwargs)
    except requests.exceptions.ConnectionError:
        st.error(f"Could not reach the MedAssist API at {API_URL}. Is the backend running?")
    except requests.exceptions.Timeout:
        st.error("The request timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        st.error(f"Unexpected error contacting the API: {e}")
    return None


def error_detail(resp, fallback="Something went wrong"):
    try:
        return resp.json().get("detail", fallback)
    except ValueError:
        return fallback


# ---- Sidebar: auth status + nav ----
st.sidebar.title("🩺 MedAssist AI")

if st.session_state.token:
    st.sidebar.success(f"Logged in as {st.session_state.email} ({st.session_state.role})")
    nav_options = ["Symptom Checker", "History", "My Profile"]
    if st.session_state.role == "provider":
        nav_options.append("Analytics Dashboard")
    page = st.sidebar.radio("Navigate", nav_options)
    if st.sidebar.button("Logout"):
        st.session_state.token = None
        st.session_state.role = None
        st.session_state.email = None
        st.rerun()
else:
    page = st.sidebar.radio("Navigate", ["Login", "Signup"])

# ---- Login page ----
if page == "Login":
    st.title("Login")
    email = st.text_input("Email")
    password = st.text_input("Password", type="password")
    if st.button("Login"):
        resp = safe_request("post", "/login", data={"username": email, "password": password})
        if resp is None:
            pass
        elif resp.status_code == 200:
            data = resp.json()
            st.session_state.token = data["access_token"]
            st.session_state.role = data["role"]
            st.session_state.email = email
            st.success("Logged in!")
            st.rerun()
        else:
            st.error(error_detail(resp, "Login failed"))

# ---- Signup page ----
elif page == "Signup":
    st.title("Sign Up")
    email = st.text_input("Email")
    password = st.text_input("Password", type="password", help="At least 8 characters")
    role = st.selectbox("Role", ["patient", "provider"])
    if st.button("Create Account"):
        resp = safe_request("post", "/signup", json={"email": email, "password": password, "role": role})
        if resp is None:
            pass
        elif resp.status_code == 200:
            st.success("Account created! Go to Login.")
        else:
            st.error(error_detail(resp, "Signup failed"))

# ---- Symptom Checker page ----
elif page == "Symptom Checker":
    st.title("Symptom Checker")
    st.caption("This is a preliminary AI-generated assessment, not a medical diagnosis.")

    # Symptom vocabulary comes from the API so it always matches the trained
    # model's 377 feature columns exactly.
    ref_resp = safe_request("get", "/reference-data")
    reference = ref_resp.json() if ref_resp is not None and ref_resp.status_code == 200 else None
    if reference is None:
        st.error("Could not load the symptom vocabulary from the API.")
        st.stop()

    vocab = [s["name"] for s in reference["symptoms"]]
    critical = set(reference["red_flags"]["critical"])

    picked = st.multiselect(
        "Symptoms", vocab,
        help="Only symptoms the model recognises are listed.")

    flagged = [s for s in picked if s in critical]
    if flagged:
        st.error(
            "**" + ", ".join(flagged) + "** can indicate a medical emergency. "
            "If this is sudden or severe, seek emergency care now rather than "
            "waiting for this assessment."
        )

    severities = {}
    if picked:
        st.caption("How severe is each symptom?")
        for name in picked:
            severities[name] = st.select_slider(
                name, options=["low", "moderate", "high"], value="moderate",
                key=f"sev_{name}")

    col1, col2 = st.columns(2)
    with col1:
        age = st.number_input("Age", min_value=0, max_value=120, value=30)
    with col2:
        gender = st.selectbox("Sex", ["male", "female"])

    with st.expander("Health profile (enables chronic risk screening)"):
        # Chronic risk shares no inputs with the symptom model, so without
        # this section the risk panel is unavailable by design.
        include_profile = st.checkbox("Include chronic risk screening", value=True)
        height_cm = st.number_input("Height (cm)", 50, 250, 170)
        weight_kg = st.number_input("Weight (kg)", 10, 300, 70)
        smoker = st.selectbox(
            "Smoking status",
            reference["smoker_status_options"],
            format_func=lambda o: o["label"])
        gen_health = st.selectbox(
            "General health",
            reference["general_health_options"],
            format_func=lambda o: o["label"], index=2)
        sleep_hours = st.number_input("Sleep per night (hours)", 0.0, 24.0, 7.0, 0.5)
        alcohol_days = st.number_input("Alcohol days per month", 0, 31, 0)
        phys_days = st.number_input("Days physically unwell (last 30)", 0, 30, 0)
        ment_days = st.number_input("Days mentally unwell (last 30)", 0, 30, 0)
        exercise = st.checkbox("Any physical activity in the last 30 days", value=True)
        meets_activity = st.checkbox("Meets recommended activity levels", value=True)
        high_bp = st.checkbox("Told I have high blood pressure")
        high_chol = st.checkbox("Told I have high cholesterol")

    with st.expander("Vital signs (optional)"):
        vitals = {}
        for key, label, lo, hi, default in [
            ("heart_rate", "Heart rate (bpm)", 20.0, 250.0, 0.0),
            ("systolic_bp", "Systolic BP (mmHg)", 50.0, 260.0, 0.0),
            ("diastolic_bp", "Diastolic BP (mmHg)", 30.0, 180.0, 0.0),
            ("temperature_c", "Temperature (C)", 30.0, 45.0, 0.0),
            ("respiratory_rate", "Breathing rate (/min)", 4.0, 60.0, 0.0),
            ("spo2", "Oxygen saturation (%)", 50.0, 100.0, 0.0),
        ]:
            v = st.number_input(label, 0.0, hi, default,
                                help="Leave at 0 if unknown")
            if v and lo <= v <= hi:
                vitals[key] = v

    if st.button("Assess Symptoms", type="primary", disabled=not picked):
        bmi = round(weight_kg / ((height_cm / 100) ** 2), 1) if height_cm else None
        payload = {
            "symptoms": [{"name": n, "severity": severities.get(n, "moderate")}
                         for n in picked],
            "age": int(age),
            "gender": gender,
        }
        if vitals:
            payload["vitals"] = vitals
        if include_profile:
            payload["lifestyle"] = {
                "age": int(age), "sex": gender, "bmi": bmi,
                "smoker_status": smoker["value"],
                "exercise": exercise,
                "high_cholesterol": high_chol,
                "high_blood_pressure": high_bp,
                "alcohol_days_per_month": int(alcohol_days),
                "general_health": gen_health["value"],
                "sleep_hours": float(sleep_hours),
                "physical_unwell_days": int(phys_days),
                "mental_unwell_days": int(ment_days),
                "meets_activity_guidance": meets_activity,
            }

        resp = safe_request("post", "/assess", json=payload, headers=auth_headers())

        if resp is None:
            pass
        elif resp.status_code == 200:
            result = resp.json()
            sev = result["severity"]

            banner = f"{sev['level']} — {sev['action']}"
            if sev["level"] == "EMERGENCY":
                st.error(banner)
            elif sev["level"] == "URGENT":
                st.warning(banner)
            elif sev["level"] == "MODERATE":
                st.info(banner)
            else:
                st.success(banner)
            if sev.get("escalation_override"):
                st.caption(f"Escalated: {sev['escalation_override']}")

            dx = result["diagnosis"]
            st.subheader("Possible conditions")
            if dx.get("available"):
                st.caption(dx["confidence"]["explanation"])
                for p in dx["predictions"]:
                    line = f"- **{p['disease'].title()}** — {p['confidence_pct']}%"
                    if p.get("matched_symptoms"):
                        line += f"  \n  _matches: {', '.join(p['matched_symptoms'])}_"
                    st.markdown(line)
                if dx.get("unmatched_symptoms"):
                    st.caption("Not recognised: " + ", ".join(dx["unmatched_symptoms"]))
            else:
                st.info(dx.get("reason", "No diagnosis available."))

            risk = result["risk"]
            st.subheader("Chronic condition risk")
            if risk.get("available"):
                st.write(f"Composite risk index: **{risk['composite']['score']}/100** "
                         f"({risk['composite']['band']})")
                rows = sorted(risk["conditions"].values(),
                              key=lambda c: -c["risk_score"])
                st.table([{
                    "Condition": c["label"],
                    "Percentile": f"{c['risk_score']}/100",
                    "Probability": f"{c['probability']:.1%}",
                    "Band": c["band"],
                    "Flagged": "Yes" if c["flagged"] else "No",
                } for c in rows])
                st.caption(risk["note"])
            else:
                st.info(risk.get("reason", "No risk screening available."))

            tx = result["treatment"]
            st.subheader("Treatment options")
            # The two cascade layers mean different things and must not share a
            # heading - see services/treatment_cascade.py.
            layer = tx.get("layer", "none")
            drugs = tx.get("drugs", [])
            evidence = tx.get("evidence") or {}
            if drugs and layer == "mimic":
                st.markdown("**Real hospital prescriptions**")
                st.caption(
                    f"Drawn from {evidence.get('supporting_notes')} similar "
                    f"admissions - closest match "
                    f"{evidence.get('best_similarity', 0):.0%} similar")
                st.table([{
                    "Drug": o["drug"],
                    "Class": str(o.get("drug_class", "")).title(),
                    "Class conf.": f"{o.get('class_confidence', 0):.0%}",
                    "Drug conf.": ("-" if o.get("drug_confidence") is None
                                   else f"{o['drug_confidence']:.0%}"),
                } for o in drugs])
                st.caption(evidence.get("caveat", ""))
            elif drugs:
                st.markdown("**Patient-reported experience**")
                if tx.get("condition"):
                    st.caption(f"Matched condition: {tx['condition']}")
                st.table([{
                    "Drug": o["drug"],
                    "Commonly used": f"#{o['rank']}",
                    "Best rated": f"#{o['rank_by_rating']}",
                    "Satisfaction": f"{o['satisfaction_rate']:.0%}",
                    "Reviews": o["n_reviews"],
                } for o in drugs])
                st.caption(evidence.get("caveat", ""))
            else:
                st.info("No treatment data available for this condition.")
                st.caption(evidence.get("caveat", ""))
                if (tx.get("reference") or {}).get("cures"):
                    st.write(f"**General guidance:** {tx['reference']['cures']}")

            # ---- Recommendation Section (NEW) ----
            rec = result.get("recommendation")
            if rec:
                st.subheader("📋 Recommendation")
                
                # Primary action with urgency
                action_text = f"**{rec['primary_action']}**"
                urgency = rec.get("urgency_timeline", "")
                
                if urgency == "immediate":
                    st.error(f"⚠️ {action_text}")
                elif urgency == "same-day":
                    st.warning(f"⏰ {action_text}")
                elif urgency in ["within a week", "2-4 weeks"]:
                    st.info(f"📅 {action_text}")
                else:
                    st.success(action_text)
                
                st.caption(rec.get("urgency_description", ""))
                
                # Recommended specialist
                specialist = rec.get("recommended_specialist")
                if specialist:
                    st.markdown(f"**Recommended specialist:** {specialist}")
                    if rec.get("specialist_note"):
                        st.caption(rec["specialist_note"])
                
                # Preventive care notes
                preventive_notes = rec.get("preventive_care_notes", [])
                if preventive_notes:
                    st.markdown("**Preventive Care Recommendations:**")
                    for note in preventive_notes:
                        with st.expander(f"{note['condition_label']} (Risk: {note['risk_score']}/100)"):
                            st.write(note['message'])
                            if note.get('contributing_factors'):
                                st.caption(f"Key factors: {', '.join(note['contributing_factors'][:3])}")
                
                # Self-care suggestions
                self_care = rec.get("self_care_suggestions", [])
                if self_care:
                    st.markdown("**Self-Care Suggestions:**")
                    for i, sugg in enumerate(self_care, 1):
                        icon = "💊" if sugg.get("type") == "otc_medication" else "🏠"
                        st.write(f"{icon} {sugg['suggestion']}")
                
                # Disclaimer
                if rec.get("disclaimer"):
                    st.caption(f"_{rec['disclaimer']}_")

            with st.expander("Model limitations"):
                for c in result.get("meta", {}).get("caveats", []):
                    st.write(f"- {c}")
                st.caption(result.get("disclaimer", ""))

            st.caption(result["disclaimer"])
        elif resp.status_code == 401:
            st.error("Session expired. Please log in again.")
            st.session_state.token = None
        elif resp.status_code == 429:
            st.error("Too many requests. Please wait a moment and try again.")
        else:
            st.error(error_detail(resp, f"Error {resp.status_code}"))

# ---- History page ----
elif page == "History":
    st.title("Assessment History")
    resp = safe_request("get", "/history", headers=auth_headers())

    if resp is not None and resp.status_code == 200:
        records = resp.json()
        if not records:
            st.info("No assessments yet. Run one from the Symptom Checker page.")
        for r in reversed(records):
            with st.expander(f"Assessment #{r['id']} — {r['risk_flag']} — {r['created_at'][:19]}"):
                st.write("**Symptoms:**", r["input"])
                st.write("**Top possible diseases:**")
                _dx = r["result"].get("diagnosis") or {}
                _preds = _dx.get("predictions") or [
                    {"disease": d.get("disease_canonical"),
                     "confidence_pct": d.get("confidence_pct", 0)}
                    for d in (r["result"].get("disease_prediction") or {})
                    .get("top_possible_diseases", [])
                ]
                # Keys must match what _preds actually builds. This read
                # d['Disease'] and d['match_count'] - neither of which either
                # branch produces - so every history entry raised KeyError.
                for d in _preds:
                    st.write(f"- {d.get('disease')} ({d.get('confidence_pct', 0)}%)")

                # v3 treatment cascade. The old line indexed
                # result["recommendations"]["suggested_cures"], a v1 key that no
                # longer exists, so this crashed on every current assessment.
                _tx = r["result"].get("treatment") or {}
                _drugs = _tx.get("drugs") or _tx.get("options") or []
                if _drugs:
                    _label = ("Real hospital prescriptions"
                              if _tx.get("layer") == "mimic"
                              else "Patient-reported experience")
                    st.write(f"**Treatment ({_label}):**",
                             ", ".join(str(d.get("drug", "")) for d in _drugs))
                    st.caption((_tx.get("evidence") or {}).get("caveat", ""))
                else:
                    st.write("**Treatment:** no treatment data for this condition.")

                report_resp = safe_request("get", f"/report/{r['id']}", headers=auth_headers())
                if report_resp is not None and report_resp.status_code == 200:
                    st.download_button(
                        "📄 Download PDF Report",
                        data=report_resp.content,
                        file_name=f"MedAssist_Report_{r['id']}.pdf",
                        mime="application/pdf",
                        key=f"pdf_{r['id']}"
                    )
    elif resp is not None:
        st.error("Could not load history.")

# ---- My Profile page ----
elif page == "My Profile":
    st.title("My Profile")
    st.caption("Keep your medical history up to date for more context in future assessments.")

    resp = safe_request("get", "/profile", headers=auth_headers())
    profile = resp.json() if (resp is not None and resp.status_code == 200) else {}

    full_name = st.text_input("Full name", value=profile.get("full_name") or "")
    date_of_birth = st.text_input("Date of birth (YYYY-MM-DD)", value=profile.get("date_of_birth") or "")
    gender = st.selectbox(
        "Gender", ["", "Male", "Female", "Other"],
        index=["", "Male", "Female", "Other"].index(profile.get("gender")) if profile.get("gender") in ["Male", "Female", "Other"] else 0,
    )
    allergies = st.text_area("Known allergies", value=profile.get("allergies") or "")
    medical_history = st.text_area("Medical history", value=profile.get("medical_history") or "")

    if st.button("Save Profile", type="primary"):
        payload = {
            "full_name": full_name or None,
            "date_of_birth": date_of_birth or None,
            "gender": gender or None,
            "allergies": allergies or None,
            "medical_history": medical_history or None,
        }
        put_resp = safe_request("put", "/profile", json=payload, headers=auth_headers())
        if put_resp is not None and put_resp.status_code == 200:
            st.success("Profile saved.")
        elif put_resp is not None:
            st.error(error_detail(put_resp, "Could not save profile"))

# ---- Analytics Dashboard page (providers only) ----
elif page == "Analytics Dashboard":
    st.title("📊 Analytics Dashboard")
    resp = safe_request("get", "/analytics", headers=auth_headers())

    if resp is not None and resp.status_code == 200:
        data = resp.json()

        col1, col2 = st.columns(2)
        col1.metric("Total Assessments", data["total_assessments"])
        col2.metric("Total Patients", data["total_patients"])

        if data["total_assessments"] > 0:
            st.subheader("Risk Flag Distribution")
            st.bar_chart(data["risk_flag_distribution"])

            st.subheader("Top Predicted Diseases")
            disease_df = {d["disease"]: d["count"] for d in data["top_predicted_diseases"]}
            st.bar_chart(disease_df)
        else:
            st.info("No assessments yet.")
    elif resp is not None and resp.status_code == 403:
        st.error("Only providers can view analytics.")
    elif resp is not None:
        st.error("Could not load analytics.")
