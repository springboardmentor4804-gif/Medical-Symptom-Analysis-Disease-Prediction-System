import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    FaArrowLeft,
    FaUsers,
    FaUserCircle,
    FaEnvelope,
    FaCalendarAlt,
    FaEye,
    FaHospital
} from "react-icons/fa";

import { getAssignedPatients } from "../../services/caretakerService";

import "../../styles/Patient.css";
import "../../styles/Dashboard.css";
import "../../styles/Button.css";

function AssignedPatients() {

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadPatients();

    }, []);

        const loadPatients = async () => {

            try {

                setLoading(true);

                const data = await getAssignedPatients();

                setPatients(data);

            }

            catch (error) {

                console.error(
                    "Failed to load assigned patients:",
                    error
                );

                setPatients([]);

            }

            finally {

                setLoading(false);

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

                        <h1>

                            Assigned Patients

                        </h1>

                        <p>

                            View every patient assigned to you, access
                            their healthcare information, disease
                            predictions and medical reports from one
                            centralized dashboard.

                        </p>

                    </div>

                    <div className="hero-image">

                        <div className="hero-icon-circle">

                            <FaUsers />

                        </div>

                    </div>

                </section>

                <div
                    className="dashboard-grid"
                    style={{
                        marginTop: "40px"
                    }}
                >

                {
                    loading ? (

                        <div
                            className="glass-card"
                            style={{
                                gridColumn: "1 / -1",
                                textAlign: "center",
                                padding: "60px 30px"
                            }}
                        >

                            <FaUsers
                                size={60}
                                style={{
                                    marginBottom: "20px",
                                    opacity: 0.7
                                }}
                            />

                            <h2>
                                Loading Patients...
                            </h2>

                            <p>
                                Fetching your assigned patients.
                            </p>

                        </div>

                    ) : patients.length === 0 ? (

                        <div
                            className="glass-card"
                            style={{
                                gridColumn: "1 / -1",
                                textAlign: "center",
                                padding: "60px 30px"
                            }}
                        >

                            <FaUsers
                                size={70}
                                style={{
                                    marginBottom: "20px",
                                    opacity: 0.7
                                }}
                            />

                            <h2>
                                No Assigned Patients
                            </h2>

                            <p>
                                Patients who select you as their caretaker
                                will appear here.
                            </p>

                        </div>

                    ) : (

                            patients.map((patient) => (

                                <div
                                    key={patient.id}
                                    className="dashboard-card"
                                >

                                    <div
                                        className="card-icon"
                                        style={{
                                            marginBottom: "20px"
                                        }}
                                    >

                                        <FaUserCircle />

                                    </div>

                                    <h2>

                                        {patient.full_name || "Unknown Patient"}

                                    </h2>

                                    <div
                                        style={{
                                            marginTop: "20px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "15px"
                                        }}
                                    >

                                        <p
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px"
                                            }}
                                        >

                                            <FaEnvelope />

                                            {patient.email || "No email available"}

                                        </p>

                                        <p
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px"
                                            }}
                                        >

                                            <FaCalendarAlt />

                                            Assigned on{" "}

                                            {

                                                new Date(
                                                    patient.assigned_at
                                                ).toLocaleDateString()

                                            }

                                        </p>

                                    </div>

                                    <Link
                                        to={`/caretaker/patients/${patient.id}`}
                                        className="primary-btn"
                                        style={{
                                            marginTop: "30px",
                                            width: "100%",
                                            justifyContent: "center"
                                        }}
                                    >

                                        <FaEye />

                                        View Patient Details

                                    </Link>

                                </div>

                            ))

                        )

                    }

                </div>

                            </div>

        </div>

    );

}

export default AssignedPatients;
