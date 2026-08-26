import { Link } from "react-router-dom";
import {
    FaHospital,
    FaUserInjured,
    FaUserMd,
    FaArrowRight,
    FaRobot,
    FaHeartbeat,
    FaShieldAlt,
    FaFileMedical
} from "react-icons/fa";

import "../styles/Home.css";
import MedicalHero from "../assets/medical-hero.png";

function Home() {

    return (

        <div className="home">

            <div className="background-circle circle1"></div>
            <div className="background-circle circle2"></div>
            <div className="background-circle circle3"></div>

            <section className="hero-section">

                <div className="hero-left">

                    <div className="brand">

                        <FaHospital className="hospital-icon" />

                        <span>MedAssist AI</span>

                    </div>

                    <h1>

                        AI Powered
                        <br />
                        Healthcare Platform

                    </h1>

                    <p>

                        Experience intelligent disease prediction,
                        symptom analysis, secure medical history,
                        AI-powered healthcare recommendations and
                        seamless collaboration between patients
                        and caretakers.

                    </p>

                    <div className="hero-features">

                        <div className="feature">

                            <FaRobot />

                            <span>AI Disease Prediction</span>

                        </div>

                        <div className="feature">

                            <FaHeartbeat />

                            <span>Health Monitoring</span>

                        </div>

                        <div className="feature">

                            <FaFileMedical />

                            <span>Medical Reports</span>

                        </div>

                        <div className="feature">

                            <FaShieldAlt />

                            <span>Secure Access</span>

                        </div>

                    </div>

                    <img
                        src={MedicalHero}
                        alt="Medical Illustration"
                        className="hero-image"
                    />

                </div>

                <div className="hero-right">

                    <div className="portal-wrapper">

                        <h2>

                            Select Your Portal

                        </h2>

                        <p>

                            Continue as a Patient or Caretaker

                        </p>

                        <Link
                            to="/patient/login"
                            className="portal-card"
                        >

                            <div className="portal-top">

                                <FaUserInjured className="portal-icon" />

                                <div>

                                    <h3>

                                        Patient Portal

                                    </h3>

                                    <small>

                                        Access your healthcare dashboard

                                    </small>

                                </div>

                            </div>

                            <ul>

                                <li>✔ Login & Register</li>
                                <li>✔ Disease Prediction</li>
                                <li>✔ Medical History</li>
                                <li>✔ Reports & Recommendations</li>

                            </ul>

                            <button>

                                Enter Portal

                                <FaArrowRight />

                            </button>

                        </Link>

                        <Link
                            to="/caretaker/login"
                            className="portal-card"
                        >

                            <div className="portal-top">

                                <FaUserMd className="portal-icon" />

                                <div>

                                    <h3>

                                        Caretaker Portal

                                    </h3>

                                    <small>

                                        Manage patient healthcare

                                    </small>

                                </div>

                            </div>

                            <ul>

                                <li>✔ Patient Management</li>
                                <li>✔ Medical Reports</li>
                                <li>✔ Recommendations</li>
                                <li>✔ Health Monitoring</li>

                            </ul>

                            <button>

                                Enter Portal

                                <FaArrowRight />

                            </button>

                        </Link>

                    </div>

                </div>

            </section>

            <section className="stats-section">

                <div className="stat-card">

                    <h3>AI Powered</h3>

                    <p>Disease Prediction</p>

                </div>

                <div className="stat-card">

                    <h3>24/7</h3>

                    <p>Healthcare Access</p>

                </div>

                <div className="stat-card">

                    <h3>Secure</h3>

                    <p>Medical Records</p>

                </div>

                <div className="stat-card">

                    <h3>Smart</h3>

                    <p>Recommendations</p>

                </div>

            </section>

            <footer>

                © 2026 MedAssist AI

                <br />

                Built using React, FastAPI & Artificial Intelligence

            </footer>

        </div>

    );

}

export default Home;