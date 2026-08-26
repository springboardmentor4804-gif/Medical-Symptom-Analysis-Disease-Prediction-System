import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    FaHospital,
    FaEnvelope,
    FaLock,
    FaHeartbeat,
    FaRobot,
    FaShieldAlt,
    FaArrowLeft
} from "react-icons/fa";

import { loginUser } from "../../services/authService";

import "../../styles/Patient.css";

function PatientLogin() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const response = await loginUser(email, password);

            localStorage.setItem(
                "access_token",
                response.access_token
            );

            localStorage.setItem(
                "token_type",
                response.token_type
            );

            alert("Login Successful");

            navigate("/patient/dashboard");

        }

        catch (error) {

            console.error(error);

            alert("Invalid Email or Password");

        }

    };

    return (

        <div className="patient-login-page">

            <div className="login-overlay"></div>

            <div className="login-wrapper">

                {/* Left Side */}

                <div className="login-left">

                    <div className="brand">

                        <FaHospital />

                        <span>MedAssist AI</span>

                    </div>

                    <h1>

                        Welcome Back

                    </h1>

                    <p>

                        Login to access your AI-powered healthcare
                        dashboard, predict diseases, manage reports
                        and receive personalized medical
                        recommendations.

                    </p>

                    <div className="login-features">

                        <div className="login-feature">

                            <FaHeartbeat />

                            <span>Disease Prediction</span>

                        </div>

                        <div className="login-feature">

                            <FaRobot />

                            <span>AI Recommendations</span>

                        </div>

                        <div className="login-feature">

                            <FaShieldAlt />

                            <span>Secure Medical Records</span>

                        </div>

                    </div>

                </div>

                {/* Right Side */}

                <div className="login-card">

                    <h2>

                        Patient Login

                    </h2>

                    <p>

                        Sign in to continue

                    </p>

                    <form onSubmit={handleSubmit}>

                        <div className="input-group">

                            <FaEnvelope />

                            <input

                                type="email"

                                placeholder="Email Address"

                                value={email}

                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }

                                required

                            />

                        </div>

                        <div className="input-group">

                            <FaLock />

                            <input

                                type="password"

                                placeholder="Password"

                                value={password}

                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }

                                required

                            />

                        </div>

                        <button
                            type="submit"
                            className="login-btn"
                        >

                            Login

                        </button>

                    </form>

                    <div className="login-links">

                        <p>

                            Don't have an account?

                        </p>

                        <Link to="/patient/register">

                            Create Account

                        </Link>

                        <Link
                            to="/"
                            className="back-home"
                        >

                            <FaArrowLeft />

                            Back to Home

                        </Link>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default PatientLogin;