import { Link } from "react-router-dom";
import { useEffect, useState } from "react";


import {
    FaUserNurse,
    FaUserCircle,
    FaUsers,
    FaHeartbeat,
    FaShieldAlt,
    FaClipboardList,
    FaHospital
} from "react-icons/fa";

import { getAssignedPatients } from "../../services/caretakerService";

import "../../styles/Patient.css";
import "../../styles/Dashboard.css";

function CaretakerDashboard() {

        const [patients, setPatients] = useState([]);
const [loadingPatients, setLoadingPatients] = useState(true);
const [patientsError, setPatientsError] = useState("");

            useEffect(() => {
        loadAssignedPatients();
    }, []);

    const loadAssignedPatients = async () => {
    try {
        setLoadingPatients(true);
        setPatientsError("");

        const data = await getAssignedPatients();

        setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error(
            "Failed to load assigned patients:",
            error
        );

        setPatients([]);
        setPatientsError(
            error.response?.data?.detail ||
            "Unable to load assigned patients."
        );
    } finally {
        setLoadingPatients(false);
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


                            <div className="stat-card">

                                <FaClipboardList size={28} />

                                <h3>Reports</h3>

                                <span>
                                    Patient Records
                                </span>

                            </div>
                            

                            <Link
                                to="/caretaker/patients"
                                className="stat-card"
                                style={{
                                    textDecoration: "none",
                                    color: "inherit"
                                }}
                            >

                                <FaHeartbeat size={28} />

                                <h3>AI</h3>

                                <span>
                                    Patient Insights
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