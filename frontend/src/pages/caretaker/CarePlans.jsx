import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    FaArrowLeft,
    FaNotesMedical,
    FaPlus,
    FaTrash,
    FaUserInjured,
    FaPills,
    FaAppleAlt,
    FaExclamationCircle,
    FaHospital,
    FaDownload
} from "react-icons/fa";

import {
    getAssignedPatients,
    createCarePlan,
    getCarePlans,
    deleteCarePlan,
    downloadCarePlanPdf
} from "../../services/caretakerService";
import { useToast } from "../../context/ToastContext";

import "../../styles/Patient.css";
import "../../styles/Dashboard.css";
import "../../styles/Button.css";
import "../../styles/Form.css";

const PRIORITY_BADGES = {
    Urgent: { bg: "rgba(239, 68, 68, 0.2)", border: "#ef4444", text: "#fca5a5" },
    High: { bg: "rgba(245, 158, 11, 0.2)", border: "#f59e0b", text: "#fde68a" },
    Standard: { bg: "rgba(56, 189, 248, 0.2)", border: "#38bdf8", text: "#bae6fd" },
    "Follow-up": { bg: "rgba(16, 185, 129, 0.2)", border: "#10b981", text: "#a7f3d0" }
};

function CarePlans() {
    const { showToast } = useToast();
    const [patients, setPatients] = useState([]);
    const [carePlans, setCarePlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        patient_user_id: "",
        title: "",
        diagnosis_notes: "",
        medication_advice: "",
        dietary_lifestyle: "",
        priority: "Standard"
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [patientsData, plansData] = await Promise.all([
                getAssignedPatients(),
                getCarePlans()
            ]);
            setPatients(Array.isArray(patientsData) ? patientsData : []);
            setCarePlans(Array.isArray(plansData) ? plansData : []);
            if (patientsData?.length > 0 && !formData.patient_user_id) {
                setFormData((prev) => ({ ...prev, patient_user_id: patientsData[0].id }));
            }
        } catch (error) {
            console.error("Failed to load care plans data:", error);
            showToast("Failed to load care plans.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "patient_user_id" ? parseInt(value, 10) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patient_user_id) {
            showToast("Please select a patient.", "warning");
            return;
        }
        if (!formData.title.trim()) {
            showToast("Please enter a care plan title.", "warning");
            return;
        }

        try {
            setSubmitting(true);
            await createCarePlan(formData);
            showToast("Clinical Care Plan issued successfully!", "success");
            setFormData({
                patient_user_id: patients[0]?.id || "",
                title: "",
                diagnosis_notes: "",
                medication_advice: "",
                dietary_lifestyle: "",
                priority: "Standard"
            });
            const updatedPlans = await getCarePlans();
            setCarePlans(updatedPlans);
        } catch (error) {
            console.error("Failed to create care plan:", error);
            showToast(error.response?.data?.detail || "Failed to create care plan.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (planId) => {
        if (!window.confirm("Are you sure you want to delete this care plan?")) return;
        try {
            await deleteCarePlan(planId);
            showToast("Care plan deleted.", "info");
            setCarePlans((prev) => prev.filter((p) => p.id !== planId));
        } catch (error) {
            console.error("Failed to delete care plan:", error);
            showToast("Failed to delete care plan.", "error");
        }
    };

    const handleDownload = async (planId, patientName) => {
        try {
            showToast("Generating PDF Care Plan...", "info");
            await downloadCarePlanPdf(planId, patientName);
            showToast("Care Plan PDF downloaded successfully!", "success");
        } catch (error) {
            console.error("Failed to download care plan PDF:", error);
            showToast("Failed to download care plan PDF.", "error");
        }
    };


    return (
        <div className="patient-dashboard">
            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">
                <Link
                    to="/caretaker/dashboard"
                    className="secondary-btn"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "25px"
                    }}
                >
                    <FaArrowLeft />
                    Back to Dashboard
                </Link>

                <section className="dashboard-hero">
                    <div className="hero-content">
                        <div className="dashboard-brand">
                            <FaHospital />
                            MedAssist AI
                        </div>
                        <h1>Clinical Care Plans & Consultations</h1>
                        <p>
                            Formulate personalized healthcare guidelines, medication schedules, dietary
                            recommendations, and follow-up clinical care notes for your assigned patients.
                        </p>
                    </div>

                    <div className="hero-image">
                        <div className="hero-icon-circle">
                            <FaNotesMedical />
                        </div>
                    </div>
                </section>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                        gap: "30px",
                        marginTop: "40px"
                    }}
                >
                    {/* FORM: Issue New Care Plan */}
                    <div className="glass-card">
                        <div className="section-header" style={{ marginBottom: "20px" }}>
                            <h2>Issue Clinical Care Plan</h2>
                            <p>Direct healthcare guidance for your assigned patient</p>
                        </div>

                        {patients.length === 0 ? (
                            <p style={{ color: "#94a3b8" }}>
                                No patients are currently assigned to you. Assign patients first before creating care plans.
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Select Assigned Patient</label>
                                    <select
                                        name="patient_user_id"
                                        value={formData.patient_user_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        {patients.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.full_name} ({p.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Care Plan Title / Focus Area</label>
                                    <input
                                        type="text"
                                        name="title"
                                        placeholder="e.g. Typhoid Recovery & Hydration Protocol"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Clinical Priority Level</label>
                                    <select name="priority" value={formData.priority} onChange={handleChange}>
                                        <option value="Standard">Standard</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                        <option value="Follow-up">Follow-up</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Diagnosis & Clinical Evaluation</label>
                                    <textarea
                                        rows={3}
                                        name="diagnosis_notes"
                                        placeholder="Doctor / Caretaker observations, disease review notes..."
                                        value={formData.diagnosis_notes}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Medication & Treatment Instructions</label>
                                    <textarea
                                        rows={2}
                                        name="medication_advice"
                                        placeholder="Dosage schedules, prescribed medications, follow-up tests..."
                                        value={formData.medication_advice}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Dietary & Lifestyle Recommendations</label>
                                    <textarea
                                        rows={2}
                                        name="dietary_lifestyle"
                                        placeholder="Hydration, physical rest, foods to avoid, exercise restrictions..."
                                        value={formData.dietary_lifestyle}
                                        onChange={handleChange}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={submitting}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "10px",
                                        marginTop: "10px"
                                    }}
                                >
                                    <FaPlus />
                                    {submitting ? "Issuing Care Plan..." : "Issue Care Plan to Patient"}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* LIST: Issued Care Plans */}
                    <div className="glass-card">
                        <div className="section-header" style={{ marginBottom: "20px" }}>
                            <h2>Active Care Plans ({carePlans.length})</h2>
                            <p>All healthcare plans and clinical notes issued by you</p>
                        </div>

                        {loading ? (
                            <p style={{ color: "#94a3b8" }}>Loading care plans...</p>
                        ) : carePlans.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                                <FaNotesMedical size={40} style={{ opacity: 0.4, marginBottom: "12px" }} />
                                <p>No care plans issued yet. Use the form to issue your first patient care plan.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxHeight: "680px", overflowY: "auto" }}>
                                {carePlans.map((plan) => {
                                    const badge = PRIORITY_BADGES[plan.priority] || PRIORITY_BADGES.Standard;
                                    return (
                                        <div
                                            key={plan.id}
                                            style={{
                                                padding: "18px",
                                                borderRadius: "14px",
                                                background: "rgba(255, 255, 255, 0.05)",
                                                border: "1px solid rgba(255, 255, 255, 0.1)"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <div>
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "3px 10px",
                                                            borderRadius: "12px",
                                                            background: badge.bg,
                                                            border: `1px solid ${badge.border}`,
                                                            color: badge.text,
                                                            fontSize: "12px",
                                                            fontWeight: "600",
                                                            marginBottom: "8px"
                                                        }}
                                                    >
                                                        {plan.priority} Priority
                                                    </span>
                                                    <h3 style={{ color: "#ffffff", margin: "0 0 4px 0", fontSize: "17px" }}>{plan.title}</h3>
                                                    <span style={{ color: "#38bdf8", fontSize: "13px" }}>
                                                        Patient: <strong>{plan.patient_name}</strong>
                                                    </span>
                                                </div>

                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        onClick={() => handleDownload(plan.id, plan.patient_name)}
                                                        style={{
                                                            background: "rgba(56, 189, 248, 0.15)",
                                                            border: "1px solid rgba(56, 189, 248, 0.3)",
                                                            color: "#38bdf8",
                                                            padding: "6px 10px",
                                                            borderRadius: "8px",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "5px",
                                                            fontSize: "12px",
                                                            fontWeight: "600"
                                                        }}
                                                        title="Download Care Plan & Prescription PDF"
                                                    >
                                                        <FaDownload size={12} /> PDF
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(plan.id)}
                                                        style={{
                                                            background: "rgba(239, 68, 68, 0.15)",
                                                            border: "1px solid rgba(239, 68, 68, 0.3)",
                                                            color: "#fca5a5",
                                                            padding: "6px 10px",
                                                            borderRadius: "8px",
                                                            cursor: "pointer"
                                                        }}
                                                        title="Delete Care Plan"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {plan.diagnosis_notes && (
                                                <div style={{ marginTop: "12px", fontSize: "13px", color: "#e2e8f0" }}>
                                                    <strong style={{ color: "#94a3b8" }}>Clinical Evaluation:</strong>
                                                    <p style={{ margin: "3px 0 0 0" }}>{plan.diagnosis_notes}</p>
                                                </div>
                                            )}

                                            {plan.medication_advice && (
                                                <div style={{ marginTop: "10px", fontSize: "13px", color: "#e2e8f0" }}>
                                                    <strong style={{ color: "#94a3b8" }}>Medication & Dosage:</strong>
                                                    <p style={{ margin: "3px 0 0 0" }}>{plan.medication_advice}</p>
                                                </div>
                                            )}

                                            {plan.dietary_lifestyle && (
                                                <div style={{ marginTop: "10px", fontSize: "13px", color: "#e2e8f0" }}>
                                                    <strong style={{ color: "#94a3b8" }}>Diet & Lifestyle:</strong>
                                                    <p style={{ margin: "3px 0 0 0" }}>{plan.dietary_lifestyle}</p>
                                                </div>
                                            )}

                                            <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                                                <small style={{ color: "#64748b" }}>
                                                    Issued on {new Date(plan.created_at).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CarePlans;
