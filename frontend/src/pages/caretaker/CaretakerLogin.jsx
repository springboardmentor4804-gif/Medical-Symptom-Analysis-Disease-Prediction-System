import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    FaUserNurse,
    FaEnvelope,
    FaLock,
    FaShieldAlt,
    FaHospital,
    FaHeartbeat
} from "react-icons/fa";

import { loginUser } from "../../services/authService";

import "../../styles/Patient.css";
import "../../styles/Form.css";
import "../../styles/Button.css";
import "../../styles/Dashboard.css";

function CaretakerLogin() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const response = await loginUser(email, password);

            if (response.user.role !== "caretaker") {

                alert("This account is not registered as a caretaker.");

                return;

            }

            localStorage.setItem(
                "access_token",
                response.access_token
            );

            localStorage.setItem(
                "token_type",
                response.token_type
            );

            localStorage.setItem(
                "user",
                JSON.stringify(response.user)
            );

            alert("Login Successful");

            navigate("/caretaker/dashboard");

        }

        catch (error) {

            console.error(error);

            alert("Invalid Email or Password");

        }

    };

    return (

        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                <div
                    className="glass-card"
                    style={{
                        maxWidth: "1100px",
                        margin: "0 auto"
                    }}
                >

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1.2fr 1fr",
                            gap: "50px",
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
                                    fontSize: "46px",
                                    marginBottom: "20px"
                                }}
                            >

                                Caretaker Portal

                            </h1>

                            <p
                                style={{
                                    color: "#d7e8ff",
                                    lineHeight: "1.9",
                                    fontSize: "18px"
                                }}
                            >

                                Securely access assigned patients,
                                monitor disease predictions,
                                review health reports,
                                and provide better healthcare support.

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

                                    <FaHeartbeat />

                                    Monitor Patient Health

                                </div>

                                <div className="feature-item">

                                    <FaShieldAlt />

                                    Secure Medical Records

                                </div>

                                <div className="feature-item">

                                    <FaUserNurse />

                                    AI Assisted Care

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

                                        Caretaker Login

                                    </h2>

                                    <p
                                        style={{
                                            color: "#d7e8ff"
                                        }}
                                    >

                                        Login to access your assigned
                                        patients and healthcare dashboard.

                                    </p>

                                </div>

                                <div className="form-group">

                                    <label>

                                        Email Address

                                    </label>

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
                                            className="form-input"
                                            style={{
                                                paddingLeft: "50px"
                                            }}
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            placeholder="Enter your email"
                                            required
                                        />

                                    </div>

                                </div>

                                <div
                                    className="form-group"
                                    style={{
                                        marginTop: "25px"
                                    }}
                                >

                                    <label>

                                        Password

                                    </label>

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
                                            className="form-input"
                                            style={{
                                                paddingLeft: "50px"
                                            }}
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            placeholder="Enter your password"
                                            required
                                        />

                                    </div>

                                </div>

                                <button
                                    type="submit"
                                    className="primary-btn large-btn"
                                >

                                    <FaUserNurse />

                                    Login to Dashboard

                                </button>

                                <div
                                    style={{
                                        marginTop: "35px",
                                        textAlign: "center"
                                    }}
                                >

                                    <p
                                        style={{
                                            color: "#d7e8ff"
                                        }}
                                    >

                                        Don't have a caretaker account?

                                    </p>

                                    <Link
                                        className="secondary-btn"
                                        to="/caretaker/register"
                                    >

                                        Register

                                    </Link>

                                </div>

                                                                <div
                                    style={{
                                        marginTop: "30px",
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

                                        Protected Healthcare Portal

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

export default CaretakerLogin;