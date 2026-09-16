import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
    FaUserNurse,
    FaUserCircle,
    FaUsers,
    FaHeartbeat,
    FaShieldAlt,
    FaClipboardList,
    FaHospital,
    FaSignOutAlt,
    FaChartBar,
    FaNotesMedical,
    FaExclamationTriangle,
    FaClock,
    FaUserMd,
    FaCheckCircle,
    FaArrowRight
} from "react-icons/fa";

import { getAssignedPatients, getCaretakerTriageQueue } from "../../services/caretakerService";
import { useToast } from "../../context/ToastContext";

import "../../styles/Patient.css";
import "../../styles/Dashboard.css";

function CaretakerDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [patientsError, setPatientsError] = useState("");

    const [triageData, setTriageData] = useState(null);
    const [loadingTriage, setLoadingTriage] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_type");
        showToast("Signed out from Caretaker Portal.", "info");
        navigate("/caretaker/login");
    };

    useEffect(() => {
        loadAssignedPatients();
        loadTriageQueue();
    }, []);

    const loadAssignedPatients = async () => {
        try {
            setLoadingPatients(true);
            setPatientsError("");

            const data = await getAssignedPatients();
            setPatients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load assigned patients:", error);
            setPatients([]);
            setPatientsError(
                error.response?.data?.detail ||
                "Unable to load assigned patients."
            );
        } finally {
            setLoadingPatients(false);
        }
    };

    const loadTriageQueue = async () => {
        try {
            setLoadingTriage(true);
            const data = await getCaretakerTriageQueue();
            setTriageData(data);
        } catch (error) {
            console.error("Failed to load triage queue:", error);
        } finally {
            setLoadingTriage(false);
        }
    };


    return (

        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                <section className="dashboard-hero">

                    <div className="hero-content">

                        <div className="dashboard-brand">

                            <FaHospital />

                            MedAssist AI

                        </div>

                        <h1>

                            Caretaker Dashboard

                        </h1>

                        <p>

                            Manage your assigned patients, review health
                            records, monitor AI disease predictions and
                            provide continuous healthcare support through
                            one secure workspace.

                        </p>

                        <div
                            style={{
                                display: "flex",
                                gap: "18px",
                                marginTop: "30px",
                                flexWrap: "wrap"
                            }}
                        >
                            <div className="stat-card">
                                <FaUsers size={28} />
                                <h3>
                                    {loadingPatients ? "..." : patients.length}
                                </h3>
                                <span>
                                    {patients.length === 1
                                        ? "Assigned Patient"
                                        : "Assigned Patients"}
                                </span>
                            </div>

                            <div className="stat-card" style={{ border: triageData && (triageData.emergency_count > 0 || triageData.urgent_count > 0) ? "1px solid rgba(239, 68, 68, 0.4)" : undefined }}>
                                <FaExclamationTriangle size={28} style={{ color: triageData && triageData.emergency_count > 0 ? "#ef4444" : "#f59e0b" }} />
                                <h3 style={{ color: triageData && triageData.emergency_count > 0 ? "#ef4444" : undefined }}>
                                    {loadingTriage ? "..." : (triageData ? triageData.emergency_count + triageData.urgent_count : 0)}
                                </h3>
                                <span>
                                    Priority Triage Alerts
                                </span>
                            </div>

                            <Link
                                to="/caretaker/care-plans"
                                className="stat-card"
                                style={{
                                    textDecoration: "none",
                                    color: "inherit"
                                }}
                            >
                                <FaNotesMedical size={28} style={{ color: "#a855f7" }} />
                                <h3>Care Plans</h3>
                                <span>
                                    Clinical Formulations
                                </span>
                            </Link>

                            <Link
                                to="/caretaker/analytics"
                                className="stat-card"
                                style={{
                                    textDecoration: "none",
                                    color: "inherit"
                                }}
                            >
                                <FaChartBar size={28} style={{ color: "#38bdf8" }} />
                                <h3>Analytics</h3>
                                <span>
                                    Health Trends
                                </span>
                            </Link>
                        </div>
                    </div>

                    <div className="hero-image">
                        <div className="hero-icon-circle">
                            <FaUserNurse />
                        </div>
                    </div>
                </section>

                {/* Priority Triage Queue Section */}
                <section style={{ marginTop: "50px" }}>
                    <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <h2 style={{ margin: 0 }}>Priority Triage & Severity Queue</h2>
                                {triageData && (triageData.emergency_count > 0 || triageData.urgent_count > 0) && (
                                    <span style={{
                                        background: "rgba(239, 68, 68, 0.2)",
                                        border: "1px solid #ef4444",
                                        color: "#fca5a5",
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}>
                                        <FaExclamationTriangle size={11} /> {triageData.emergency_count} Emergency · {triageData.urgent_count} Urgent
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: "5px 0 0 0" }}>
                                AI-stratified patient urgency queue based on red flags, symptom severity, and diagnostic risk models.
                            </p>
                        </div>

                        {triageData && (
                            <div style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                                <span style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                                    Emergency: {triageData.emergency_count}
                                </span>
                                <span style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(245, 158, 11, 0.15)", color: "#fde68a", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                                    Urgent: {triageData.urgent_count}
                                </span>
                                <span style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(56, 189, 248, 0.15)", color: "#bae6fd", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                                    Moderate: {triageData.moderate_count}
                                </span>
                                <span style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.15)", color: "#a7f3d0", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                                    Mild: {triageData.mild_count}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="glass-card" style={{ marginTop: "15px" }}>
                        {loadingTriage ? (
                            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>Evaluating patient triage queue...</p>
                        ) : !triageData || triageData.queue.length === 0 ? (
                            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
                                No active triage records found for assigned patients.
                            </p>
                        ) : (
                            <div style={{ display: "grid", gap: "14px" }}>
                                {triageData.queue.map((item) => {
                                    const isEmergency = item.triage_level === "EMERGENCY";
                                    const isUrgent = item.triage_level === "URGENT";
                                    const badgeBg = isEmergency
                                        ? "rgba(239, 68, 68, 0.2)"
                                        : isUrgent
                                        ? "rgba(245, 158, 11, 0.2)"
                                        : item.triage_level === "MODERATE"
                                        ? "rgba(56, 189, 248, 0.2)"
                                        : "rgba(16, 185, 129, 0.2)";
                                    const badgeBorder = isEmergency
                                        ? "#ef4444"
                                        : isUrgent
                                        ? "#f59e0b"
                                        : item.triage_level === "MODERATE"
                                        ? "#38bdf8"
                                        : "#10b981";
                                    const badgeColor = isEmergency
                                        ? "#fca5a5"
                                        : isUrgent
                                        ? "#fde68a"
                                        : item.triage_level === "MODERATE"
                                        ? "#bae6fd"
                                        : "#a7f3d0";

                                    return (
                                        <div
                                            key={item.patient_user_id}
                                            style={{
                                                padding: "16px",
                                                borderRadius: "12px",
                                                background: isEmergency
                                                    ? "rgba(239, 68, 68, 0.08)"
                                                    : "rgba(255, 255, 255, 0.05)",
                                                border: `1px solid ${isEmergency ? "rgba(239, 68, 68, 0.35)" : "rgba(255, 255, 255, 0.08)"}`,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: "15px"
                                            }}
                                        >
                                            <div style={{ flex: "1 1 320px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                                                    <span style={{
                                                        background: badgeBg,
                                                        border: `1px solid ${badgeBorder}`,
                                                        color: badgeColor,
                                                        padding: "2px 8px",
                                                        borderRadius: "8px",
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        letterSpacing: "0.5px"
                                                    }}>
                                                        {item.triage_level}
                                                    </span>
                                                    <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>
                                                        {item.patient_name}
                                                    </h3>
                                                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                                                        ({item.gender || "Gender N/A"} {item.blood_group ? `· ${item.blood_group}` : ""})
                                                    </span>
                                                </div>

                                                <div style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "4px" }}>
                                                    <span>Latest AI Prediction: <strong style={{ color: "#38bdf8" }}>{item.last_prediction}</strong></span>
                                                    {item.symptoms_count > 0 && (
                                                        <span style={{ marginLeft: "12px", color: "#94a3b8" }}>({item.symptoms_count} reported symptoms)</span>
                                                    )}
                                                </div>

                                                {item.critical_red_flags && item.critical_red_flags.length > 0 && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                                                        <span style={{ fontSize: "11px", color: "#fca5a5", fontWeight: "600" }}>Red Flags:</span>
                                                        {item.critical_red_flags.map((flag, idx) => (
                                                            <span
                                                                key={idx}
                                                                style={{
                                                                    fontSize: "11px",
                                                                    padding: "2px 6px",
                                                                    borderRadius: "6px",
                                                                    background: "rgba(239, 68, 68, 0.25)",
                                                                    border: "1px solid rgba(239, 68, 68, 0.5)",
                                                                    color: "#fecaca"
                                                                }}
                                                            >
                                                                {flag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div style={{ display: "flex", gap: "15px", marginTop: "8px", fontSize: "12px", color: "#94a3b8", flexWrap: "wrap" }}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <FaClock size={11} /> {item.urgency_timeline}
                                                    </span>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#38bdf8" }}>
                                                        <FaUserMd size={11} /> Specialist: {item.recommended_specialist}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                <Link
                                                    to="/caretaker/care-plans"
                                                    className="secondary-btn"
                                                    style={{ fontSize: "12px", padding: "8px 14px", textDecoration: "none" }}
                                                >
                                                    <FaNotesMedical style={{ marginRight: "5px" }} /> Plan Care
                                                </Link>
                                                <Link
                                                    to={`/caretaker/patients/${item.patient_user_id}`}
                                                    className="primary-btn"
                                                    style={{ fontSize: "12px", padding: "8px 14px" }}
                                                >
                                                    View Details <FaArrowRight style={{ marginLeft: "4px", fontSize: "10px" }} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                <section
                    style={{
                        marginTop: "50px"
                    }}
                >
                    <div className="section-header">
                        <h2>
                            Quick Actions
                        </h2>
                        <p>
                            Access your healthcare tools from one place.
                        </p>
                    </div>

                    <div className="dashboard-grid">
                        <Link
                            to="/caretaker/profile"
                            className="dashboard-card"
                        >
                            <div className="card-icon">
                                <FaUserCircle />
                            </div>
                            <h3>
                                My Profile
                            </h3>
                            <p>
                                View and update your caretaker information,
                                contact details and account settings.
                            </p>
                        </Link>

                        <Link
                            to="/caretaker/patients"
                            className="dashboard-card"
                        >
                            <div className="card-icon">
                                <FaUsers />
                            </div>
                            <h3>
                                Assigned Patients
                            </h3>
                            <p>
                                Access all patients assigned to you,
                                monitor their health records and provide
                                continuous care.
                            </p>
                        </Link>

                        <Link
                            to="/caretaker/analytics"
                            className="dashboard-card"
                        >
                            <div className="card-icon" style={{ color: "#38bdf8" }}>
                                <FaChartBar />
                            </div>
                            <h3>
                                Analytics & Health Trends
                            </h3>
                            <p>
                                Monitor patient volume, disease distribution,
                                risk stratification, and health activity trends.
                            </p>
                        </Link>

                        <Link
                            to="/caretaker/care-plans"
                            className="dashboard-card"
                        >
                            <div className="card-icon" style={{ color: "#a855f7" }}>
                                <FaNotesMedical />
                            </div>
                            <h3>
                                Clinical Care Plans
                            </h3>
                            <p>
                                Formulate and issue personalized treatment notes,
                                medication advice, and dietary recommendations.
                            </p>
                        </Link>

                        <div
                            className="dashboard-card"
                            onClick={handleLogout}
                            style={{ cursor: "pointer", border: "1px solid rgba(239, 68, 68, 0.35)" }}
                        >
                            <div className="card-icon" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
                                <FaSignOutAlt />
                            </div>
                            <h3>Sign Out / Exit</h3>
                            <p>
                                Safely end your current session and exit the Caretaker portal.
                            </p>
                        </div>
                    </div>
                </section>

                <section
                    style={{
                        marginTop: "55px"
                    }}
                >
                    <div className="section-header">
                        <h2>
                            Assigned Patients
                        </h2>
                        <p>
                            Patients currently assigned to your care.
                        </p>
                    </div>

                    <div className="glass-card">
                        {loadingPatients ? (
                            <p>
                                Loading assigned patients...
                            </p>
                        ) : patientsError ? (
                            <div>
                                <p>
                                    {patientsError}
                                </p>
                                <button
                                    className="primary-btn"
                                    onClick={loadAssignedPatients}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : patients.length === 0 ? (
                            <p>
                                No patients are currently assigned to you.
                            </p>
                        ) : (
                            <div
                                style={{
                                    display: "grid",
                                    gap: "15px"
                                }}
                            >
                                {patients.slice(0, 5).map((patient) => (
                                    <div
                                        key={patient.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "20px",
                                            padding: "16px",
                                            borderRadius: "12px",
                                            background: "rgba(255, 255, 255, 0.08)"
                                        }}
                                    >
                                        <div>
                                            <h3>
                                                {patient.full_name || "Unknown Patient"}
                                            </h3>
                                            <p>
                                                {patient.email || "No email available"}
                                            </p>
                                            {patient.assigned_at && (
                                                <small>
                                                    Assigned on{" "}
                                                    {new Date(
                                                        patient.assigned_at
                                                    ).toLocaleDateString()}
                                                </small>
                                            )}
                                        </div>
                                        <Link
                                            to={`/caretaker/patients/${patient.id}`}
                                            className="primary-btn"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>


                <section
                    style={{
                        marginTop: "55px"
                    }}
                >

                    <div className="glass-card">

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
                                gap: "25px"
                            }}
                        >

                            <div className="feature-item">

                                <FaHeartbeat />

                                AI Disease Monitoring

                            </div>

                            <div className="feature-item">

                                <FaClipboardList />

                                Medical Report Review

                            </div>

                            <div className="feature-item">

                                <FaShieldAlt />

                                Secure Patient Records

                            </div>

                            <div className="feature-item">

                                <FaUserNurse />

                                Professional Care Support

                            </div>

                        </div>

                    </div>

                </section>

                            </div>

        </div>

    );

}

export default CaretakerDashboard;