import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
    getPatientPredictions,
    getPatientRiskAssessments,
    getPatientSymptoms
} from "../../services/patientService";


import {
    FaUser,
    FaHeartbeat,
    FaRobot,
    FaHistory,
    FaLightbulb,
    FaFileMedical,
    FaUserNurse,
    FaSignOutAlt,
    FaChartLine,
    FaClipboardCheck,
    FaHospital,
    FaChartBar
} from "react-icons/fa";

import DashboardCard from "../../components/DashboardCard";

import "../../styles/Dashboard.css";

function PatientDashboard() {

    const navigate = useNavigate();


    const [predictionCount, setPredictionCount] = useState(0);
    const [symptomCount, setSymptomCount] = useState(0);
    const [riskCount, setRiskCount] = useState(0);
    const [healthStatus, setHealthStatus] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);


    const loadDashboardStats = async () => {
    try {
        setLoadingStats(true);

        const [
            predictionsData,
            symptomsData,
            riskData
        ] = await Promise.all([
            getPatientPredictions(),
            getPatientSymptoms(),
            getPatientRiskAssessments()
        ]);

        setPredictionCount(
            predictionsData?.total_predictions || 0
        );

        setSymptomCount(
            symptomsData?.symptoms?.length || 0
        );

        setRiskCount(
            riskData?.total_assessments || 0
        );

        const latestAssessment =
            riskData?.assessments?.[0];

        if (latestAssessment) {
            setHealthStatus(
                latestAssessment.predicted_outcome
            );
        } else {
            setHealthStatus(null);
        }

    } catch (error) {
        console.error(
            "Failed to load dashboard statistics:",
            error
        );
    } finally {
        setLoadingStats(false);
    }
};


    useEffect(() => {
        loadDashboardStats();
    }, []);

    const logout = () => {

        localStorage.removeItem("access_token");
        localStorage.removeItem("token_type");

        navigate("/patient/login");

    };

    return (

        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                {/* Hero */}

                <section className="dashboard-hero">

                    <div className="hero-left">

                        <div className="dashboard-brand">

                            <FaHospital />

                            <span>MedAssist AI</span>

                        </div>

                        <h1>

                            Welcome Back 👋

                        </h1>

                        <p>

                            Monitor your health, predict diseases,
                            manage reports and stay connected with
                            your caretaker through one intelligent
                            healthcare platform.

                        </p>

                    </div>

                    <div className="hero-right">

                        <div className="hero-badge">

                            <FaHeartbeat />

                            Healthy Lifestyle

                        </div>

                    </div>

                </section>

                {/* Statistics */}

                <section className="stats-grid">

                    <div className="stats-card">

                        <FaHeartbeat />

                        <h3>Health Status</h3>

                        <p>
                            {loadingStats ? "..." : healthStatus || "Not assessed"}
                        </p>

                    </div>

                    <div className="stats-card">

                        <FaRobot />

                        <h3>AI Predictions</h3>

                        <p>
                            {loadingStats ? "..." : predictionCount}
                        </p>

                    </div>

                    <div className="stats-card">

                        <FaFileMedical />

                        <h3>Reports</h3>

                        <h2>—</h2>

                    </div>

                    <div className="stats-card">

                        <FaChartLine />

                        <h3>Progress</h3>

                        <p>
                            {loadingStats
                                ? "..."
                                : `${symptomCount} symptoms`}
                        </p>

                    </div>

                </section>

                {/* Dashboard Modules */}

                <section className="dashboard-grid">

                    <DashboardCard
                        to="/patient/profile"
                        icon={<FaUser />}
                        title="My Profile"
                        description="Manage your personal information."
                    />

                    <DashboardCard
                        to="/patient/symptoms"
                        icon={<FaHeartbeat />}
                        title="Symptoms"
                        description="Record and manage symptoms."
                    />

                    <DashboardCard
                        to="/patient/disease-prediction"
                        icon={<FaRobot />}
                        title="Disease Prediction"
                        description="AI-powered disease prediction."
                    />

                    <DashboardCard
                        to="/patient/risk-assessment"
                        icon={<FaHeartbeat />}
                        title="Risk Assessment"
                        description="Assess health risk using your patient profile."
                    />

                    <DashboardCard
                        to="/patient/medical-history"
                        icon={<FaHistory />}
                        title="Medical History"
                        description="View previous diagnoses."
                    />

                    <DashboardCard
                        to="/patient/recommendations"
                        icon={<FaLightbulb />}
                        title="Recommendations"
                        description="Personalized healthcare advice."
                    />

                    <DashboardCard
                        to="/patient/health-reports"
                        icon={<FaFileMedical />}
                        title="Health Reports"
                        description="Upload and manage reports."
                    />

                    <DashboardCard
                        to="/patient/select-caretaker"
                        icon={<FaUserNurse />}
                        title="Select Caretaker"
                        description="Choose your healthcare caretaker."
                    />

                    <DashboardCard
                        to="/patient/analytics"
                        icon={<FaChartBar />}
                        title="Analytics"
                        description="View health trends and statistics."
                    />

                    <button
                        className="dashboard-card logout-card"
                        onClick={logout}
                    >

                        <div className="card-icon">
                            <FaSignOutAlt />
                        </div>

                        {/* existing logout content */}

                    </button>

                </section>

                {/* Activity */}

                <section className="activity-section">

                    <h2>

                        <FaClipboardCheck />

                        Recent Activity

                    </h2>

                    <div className="activity-card">

                        <span>✅</span>

                        <div>

                            <h4>Complete your profile</h4>

                            <p>Add your personal and emergency-contact details first.</p>

                        </div>

                    </div>

                    <div className="activity-card">

                        <span>🤖</span>

                        <div>

                            <h4>Record symptoms</h4>

                            <p>Save symptoms before requesting an AI analysis.</p>

                        </div>

                    </div>

                    <div className="activity-card">

                        <span>📄</span>

                        <div>

                            <h4>Review results carefully</h4>

                            <p>Predictions are informational and are not medical diagnoses.</p>

                        </div>

                    </div>

                </section>

            </div>

        </div>

    );

}

export default PatientDashboard;
