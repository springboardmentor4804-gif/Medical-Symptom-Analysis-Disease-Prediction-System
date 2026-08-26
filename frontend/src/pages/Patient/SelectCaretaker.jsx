import { useEffect, useState } from "react";

import {
    FaUserNurse,
    FaHospital,
    FaBriefcaseMedical,
    FaAward,
    FaUserFriends,
    FaArrowLeft
} from "react-icons/fa";

import { Link } from "react-router-dom";

import {
    getCaretakers,
    selectCaretaker
} from "../../services/patientService";

import "../../styles/Dashboard.css";
import "../../styles/Button.css";
import "../../styles/Form.css";
import "../../styles/Patient.css";

function SelectCaretaker() {

    const [caretakers, setCaretakers] = useState([]);

    useEffect(() => {

        loadCaretakers();

    }, []);

    const loadCaretakers = async () => {

        try {

            const data = await getCaretakers();

            setCaretakers(data);

        }

        catch (error) {

            console.error(error);

        }

    };

    const handleSelect = async (id) => {

        try {

            await selectCaretaker(id);

            alert("Caretaker selected successfully.");

        }

        catch (error) {

            alert(

                error.response?.data?.detail ||

                "Selection failed."

            );

        }

    };

    return (

        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                <Link
                    to="/patient/dashboard"
                    className="back-button"
                >

                    <FaArrowLeft />

                    Back to Dashboard

                </Link>

                <section className="dashboard-hero">

                    <div className="hero-left">

                        <div className="dashboard-brand">

                            <FaUserNurse />

                            MedAssist AI

                        </div>

                        <h1>

                            Choose Your Caretaker

                        </h1>

                        <p>

                            Select a trusted healthcare professional who
                            can monitor your health, review your reports,
                            and assist you during your treatment journey.

                        </p>

                    </div>

                    <div className="hero-right">

                        <div className="hero-badge">

                            <FaUserFriends />

                            Care

                        </div>

                    </div>

                </section>

                <section className="stats-grid">

                    <div className="stats-card">

                        <FaUserFriends />

                        <h3>Available</h3>

                        <h2>

                            {caretakers.length}

                        </h2>

                    </div>

                    <div className="stats-card">

                        <FaHospital />

                        <h3>Hospitals</h3>

                        <h2>

                            Connected

                        </h2>

                    </div>

                    <div className="stats-card">

                        <FaBriefcaseMedical />

                        <h3>Specialists</h3>

                        <h2>

                            Verified

                        </h2>

                    </div>

                    <div className="stats-card">

                        <FaAward />

                        <h3>Support</h3>

                        <h2>

                            24×7

                        </h2>

                    </div>

                </section>

                
                                <div className="caretaker-grid">

                    {

                        caretakers.length === 0 ? (

                            <div className="glass-card">

                                <div className="empty-state">

                                    <FaUserNurse size={60} />

                                    <h3>

                                        No Caretakers Available

                                    </h3>

                                    <p>

                                        There are currently no registered
                                        caretakers available.

                                    </p>

                                </div>

                            </div>

                        ) : (

                            caretakers.map((caretaker) => (

                                <div
                                    className="glass-card caretaker-card"
                                    key={caretaker.id}
                                >

                                    <div className="caretaker-header">

                                        <div className="caretaker-avatar">

                                            <FaUserNurse />

                                        </div>

                                        <div>

                                            <h2>

                                                {caretaker.full_name}

                                            </h2>

                                            <p>

                                                {caretaker.profession}

                                            </p>

                                        </div>

                                    </div>

                                    <div className="caretaker-details">

                                        <div className="detail-row">

                                            <FaHospital />

                                            <div>

                                                <strong>

                                                    Organization

                                                </strong>

                                                <span>

                                                    {caretaker.organization}

                                                </span>

                                            </div>

                                        </div>

                                        <div className="detail-row">

                                            <FaBriefcaseMedical />

                                            <div>

                                                <strong>

                                                    Specialization

                                                </strong>

                                                <span>

                                                    {caretaker.specialization}

                                                </span>

                                            </div>

                                        </div>

                                        <div className="detail-row">

                                            <FaAward />

                                            <div>

                                                <strong>

                                                    Experience

                                                </strong>

                                                <span>

                                                    {caretaker.years_of_experience}
                                                    {" "}
                                                    Years

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                    <div className="caretaker-footer">

                                        <button
                                            className="primary-btn"
                                            onClick={() =>
                                                handleSelect(caretaker.id)
                                            }
                                        >

                                            Select Caretaker

                                        </button>

                                    </div>

                                </div>

                            ))

                        )

                    }

                </div>

                                <div className="dashboard-grid">

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Why Choose a Caretaker?</h2>

                                <p>

                                    Your assigned caretaker helps you manage
                                    your healthcare journey more effectively.

                                </p>

                            </div>

                        </div>

                        <div className="prediction-features">

                            <div className="feature-item">

                                ✅ Review your uploaded health reports.

                            </div>

                            <div className="feature-item">

                                ✅ Monitor disease prediction history.

                            </div>

                            <div className="feature-item">

                                ✅ Track symptoms and recovery progress.

                            </div>

                            <div className="feature-item">

                                ✅ Receive personalized medical guidance.

                            </div>

                            <div className="feature-item">

                                ✅ Better communication with healthcare providers.

                            </div>

                        </div>

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Selection Guide</h2>

                                <p>

                                    Consider these factors before selecting
                                    your caretaker.

                                </p>

                            </div>

                        </div>

                        <div className="stats-grid">

                            <div className="stats-card">

                                <FaAward />

                                <h3>Experience</h3>

                                <h2>✔</h2>

                            </div>

                            <div className="stats-card">

                                <FaBriefcaseMedical />

                                <h3>Specialization</h3>

                                <h2>✔</h2>

                            </div>

                            <div className="stats-card">

                                <FaHospital />

                                <h3>Organization</h3>

                                <h2>✔</h2>

                            </div>

                        </div>

                        <div
                            className="action-buttons"
                            style={{ marginTop: "25px" }}
                        >

                            <Link
                                to="/patient/profile"
                                className="secondary-btn"
                            >

                                Back to Profile

                            </Link>

                            <Link
                                to="/patient/dashboard"
                                className="primary-btn"
                            >

                                Dashboard

                            </Link>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default SelectCaretaker;