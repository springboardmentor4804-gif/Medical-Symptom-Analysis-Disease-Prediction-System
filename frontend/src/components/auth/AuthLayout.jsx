import {
    FaHospital,
    FaHeartbeat,
    FaRobot,
    FaShieldAlt
} from "react-icons/fa";

import "../../styles/Auth.css";

function AuthLayout({

    title,
    description,
    children

}) {

    return (

        <div className="auth-page">

            <div className="auth-overlay"></div>

            <div className="auth-wrapper">

                {/* Left Section */}

                <div className="auth-left">

                    <div className="auth-brand">

                        <FaHospital />

                        <span>MedAssist AI</span>

                    </div>

                    <h1>

                        {title}

                    </h1>

                    <p>

                        {description}

                    </p>

                    <div className="auth-features">

                        <div className="auth-feature">

                            <FaHeartbeat />

                            <span>

                                Disease Prediction

                            </span>

                        </div>

                        <div className="auth-feature">

                            <FaRobot />

                            <span>

                                AI Recommendations

                            </span>

                        </div>

                        <div className="auth-feature">

                            <FaShieldAlt />

                            <span>

                                Secure Medical Records

                            </span>

                        </div>

                    </div>

                </div>

                {/* Right Section */}

                <div className="auth-right">

                    {children}

                </div>

            </div>

        </div>

    );

}

export default AuthLayout;