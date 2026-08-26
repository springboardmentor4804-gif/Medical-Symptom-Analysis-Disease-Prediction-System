import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
    FaHospital,
    FaUserNurse,
    FaUser,
    FaEnvelope,
    FaLock,
    FaShieldAlt
} from "react-icons/fa";

import { registerUser } from "../../services/authService";

import "../../styles/Patient.css";
import "../../styles/Dashboard.css";
import "../../styles/Form.css";
import "../../styles/Button.css";

function CaretakerRegister() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({

        full_name: "",

        email: "",

        password: "",

        confirmPassword: ""

    });

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {

            alert("Passwords do not match");

            return;

        }

        try {

            await registerUser({

                full_name: formData.full_name,

                email: formData.email,

                password: formData.password,

                role: "caretaker"

            });

            alert("Registration Successful");

            navigate("/caretaker/login");

        }

        catch (error) {

            console.error(error);

            alert("Registration Failed");

        }

    };

    return (

        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                <div
                    className="glass-card"
                    style={{
                        maxWidth: "1200px",
                        margin: "0 auto"
                    }}
                >

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1.1fr",
                            gap: "60px",
                            alignItems: "center"
                        }}
                    >

                        <div>

                            <div className="dashboard-brand">

                                <FaHospital />

                                MedAssist AI

                            </div>

                            <h1
                                style={{
                                    color: "#fff",
                                    fontSize: "44px",
                                    marginBottom: "20px"
                                }}
                            >

                                Become a Caretaker

                            </h1>

                            <p
                                style={{
                                    color: "#d7e8ff",
                                    lineHeight: "1.9",
                                    fontSize: "18px"
                                }}
                            >

                                Join MedAssist AI as a healthcare caretaker
                                and securely manage patient records,
                                monitor disease predictions,
                                and provide continuous care.

                            </p>

                            <div
                                style={{
                                    marginTop: "40px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "18px"
                                }}
                            >

                                <div className="feature-item">

                                    <FaShieldAlt />

                                    Secure Healthcare Platform

                                </div>

                                <div className="feature-item">

                                    <FaUserNurse />

                                    Manage Assigned Patients

                                </div>

                                <div className="feature-item">

                                    <FaHospital />

                                    Professional Medical Workspace

                                </div>

                            </div>

                        </div>

                                            <div>

                            <form onSubmit={handleSubmit}>

                                <div className="section-header">

                                    <h2
                                        style={{
                                            color: "#fff",
                                            marginBottom: "10px"
                                        }}
                                    >

                                        Caretaker Registration

                                    </h2>

                                    <p
                                        style={{
                                            color: "#d7e8ff"
                                        }}
                                    >

                                        Create your professional healthcare
                                        account to start managing patients.

                                    </p>

                                </div>

                                <div className="form-group">

                                    <label>Full Name</label>

                                    <div
                                        style={{
                                            position: "relative"
                                        }}
                                    >

                                        <FaUser
                                            style={{
                                                position: "absolute",
                                                left: "18px",
                                                top: "18px",
                                                color: "#42a5f5"
                                            }}
                                        />

                                        <input
                                            type="text"
                                            name="full_name"
                                            className="form-input"
                                            style={{
                                                paddingLeft: "50px"
                                            }}
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            placeholder="Enter your full name"
                                            required
                                        />

                                    </div>

                                </div>

                                <div
                                    className="form-group"
                                    style={{
                                        marginTop: "22px"
                                    }}
                                >

                                    <label>Email Address</label>

                                    <div
                                        style={{
                                            position: "relative"
                                        }}
                                    >

                                        <FaEnvelope
                                            style={{
                                                position: "absolute",
                                                left: "18px",
                                                top: "18px",
                                                color: "#42a5f5"
                                            }}
                                        />

                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            style={{
                                                paddingLeft: "50px"
                                            }}
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email"
                                            required
                                        />

                                    </div>

                                </div>

                                <div
                                    className="form-group"
                                    style={{
                                        marginTop: "22px"
                                    }}
                                >

                                    <label>Password</label>

                                    <div
                                        style={{
                                            position: "relative"
                                        }}
                                    >

                                        <FaLock
                                            style={{
                                                position: "absolute",
                                                left: "18px",
                                                top: "18px",
                                                color: "#42a5f5"
                                            }}
                                        />

                                        <input
                                            type="password"
                                            name="password"
                                            className="form-input"
                                            style={{
                                                paddingLeft: "50px"
                                            }}
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Create a password"
                                            required
                                        />

                                    </div>

                                </div>

                                <div
                                    className="form-group"
                                    style={{
                                        marginTop: "22px"
                                    }}
                                >

                                    <label>Confirm Password</label>

                                    <div
                                        style={{
                                            position: "relative"
                                        }}
                                    >

                                        <FaLock
                                            style={{
                                                position: "absolute",
                                                left: "18px",
                                                top: "18px",
                                                color: "#42a5f5"
                                            }}
                                        />

                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            className="form-input"
                                            style={{
                                                paddingLeft: "50px"
                                            }}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm your password"
                                            required
                                        />

                                    </div>

                                </div>

                                <button
                                    type="submit"
                                    className="primary-btn large-btn"
                                >

                                    <FaUserNurse />

                                    Create Caretaker Account

                                </button>

                                                            <div
                                    style={{
                                        marginTop: "30px",
                                        textAlign: "center"
                                    }}
                                >

                                    <p
                                        style={{
                                            color: "#d7e8ff",
                                            marginBottom: "15px"
                                        }}
                                    >

                                        Already have a caretaker account?

                                    </p>

                                    <Link
                                        to="/caretaker/login"
                                        className="secondary-btn"
                                    >

                                        Login Instead

                                    </Link>

                                </div>

                                <div
                                    style={{
                                        marginTop: "35px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "15px"
                                    }}
                                >

                                    <Link
                                        to="/"
                                        style={{
                                            color: "#81d4fa",
                                            textDecoration: "none",
                                            fontWeight: "600"
                                        }}
                                    >

                                        ← Back to Home

                                    </Link>

                                    <span
                                        style={{
                                            color: "#9ecbff",
                                            fontSize: "14px"
                                        }}
                                    >

                                        Secure Registration • MedAssist AI

                                    </span>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default CaretakerRegister;