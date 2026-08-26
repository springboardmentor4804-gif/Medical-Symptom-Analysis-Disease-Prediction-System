import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import {
    FaArrowLeft,
    FaHeartbeat,
    FaLeaf,
    FaAppleAlt,
    FaWalking,
    FaUserMd,
    FaCheckCircle,
    FaExclamationTriangle,
    FaShieldAlt,
    FaPills,
    FaUtensils,
    FaInfoCircle,
    FaClipboardList
} from "react-icons/fa";


import {
    getPatientRecommendations,
    getTreatmentSuggestions,
    getHealthAdvisory
} from "../../services/patientService";


import "../../styles/Dashboard.css";
import "../../styles/Button.css";
import "../../styles/Form.css";
import "../../styles/Patient.css";

function Recommendations() {

    const [recommendationData, setRecommendationData] = useState(null);
    const [treatmentData, setTreatmentData] = useState(null);
    const [advisoryData, setAdvisoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadAllData = async () => {

        try {

            setLoading(true);
            setError("");

            const [recData, treatData, advData] = await Promise.all([
                getPatientRecommendations(),
                getTreatmentSuggestions(),
                getHealthAdvisory()
            ]);

            setRecommendationData(recData);
            setTreatmentData(treatData);
            setAdvisoryData(advData);

        } catch (error) {

            console.error(
                "Failed to load recommendations:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Unable to load recommendations."
            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        loadAllData();
    }, []);


    const recommendations =
        recommendationData?.recommendations || [];

    const latestDisease =
        recommendationData?.disease;

    const diseaseDescription =
        recommendationData?.description;

    
    // Urgency color helper
    const getUrgencyColor = (urgency) => {
        if (urgency === "High") return "#ef4444";
        if (urgency === "Medium") return "#f59e0b";
        return "#22c55e";
    };

    
    if (loading) {

        return (
            <div className="patient-dashboard">

                <div className="dashboard-overlay"></div>

                <div className="dashboard-content">

                    <div className="glass-card">

                        <h2>
                            Loading Recommendations...
                        </h2>

                        <p>
                            Preparing recommendations based on
                            your latest AI prediction.
                        </p>

                    </div>

                </div>

            </div>
        );

    }


    if (error) {

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

                    <div
                        className="glass-card"
                        style={{
                            marginTop: "30px"
                        }}
                    >

                        <h2>
                            Unable to Load Recommendations
                        </h2>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>

            </div>
        );

    }



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

                            <FaHeartbeat />

                            MedAssist AI

                        </div>

                        <h1>

                            Personalized Health Recommendations

                        </h1>

                        <p>
                            Personalized healthcare guidance based on
                            your latest AI disease prediction.
                        </p>

                    </div>

                    <div className="hero-right">

                        <div className="hero-badge">

                            <FaLeaf />

                            Wellness

                        </div>

                    </div>

                </section>

                <section className="stats-grid">

                    <div className="stats-card">

                        <FaCheckCircle />

                        <h3>Total Tips</h3>

                        <h2>{recommendations.length}</h2>

                    </div>

                    <div className="stats-card">

                        <FaAppleAlt />

                        <h3>Diet</h3>

                        <h2>Healthy</h2>

                    </div>

                    <div className="stats-card">

                        <FaWalking />

                        <h3>Activity</h3>

                        <h2>Daily</h2>

                    </div>

                    <div className="stats-card">

                        <FaUserMd />

                        <h3>Doctor Care</h3>

                        <h2>Recommended</h2>

                    </div>

                </section>


                {/* ========================= */}
                {/* HEALTH ADVISORY SECTION   */}
                {/* ========================= */}

                {advisoryData && advisoryData.urgency && (

                    <div className="glass-card" style={{ marginBottom: "25px" }}>

                        <div className="section-header">
                            <div>
                                <h2>
                                    <FaShieldAlt style={{ marginRight: "10px" }} />
                                    Health Advisory
                                </h2>
                                <p>
                                    Combined analysis from your disease prediction
                                    and risk assessment.
                                </p>
                            </div>
                        </div>

                        <div className="prediction-result">

                            <div className="result-top">

                                <div className="result-icon" style={{
                                    background: getUrgencyColor(advisoryData.urgency)
                                }}>
                                    <FaExclamationTriangle />
                                </div>

                                <div>
                                    <h2>
                                        Urgency Level: {advisoryData.urgency}
                                    </h2>
                                    <p>
                                        {advisoryData.advisory_message}
                                    </p>
                                </div>

                            </div>

                            <div className="result-stats">

                                {advisoryData.prediction_summary && (
                                    <div className="result-stat">
                                        <span>Predicted Disease</span>
                                        <strong>
                                            {advisoryData.prediction_summary.disease}
                                        </strong>
                                    </div>
                                )}

                                {advisoryData.risk_summary && (
                                    <>
                                        <div className="result-stat">
                                            <span>Risk Outcome</span>
                                            <strong>
                                                {advisoryData.risk_summary.predicted_outcome}
                                            </strong>
                                        </div>

                                        <div className="result-stat">
                                            <span>Risk Score</span>
                                            <strong>
                                                {advisoryData.risk_summary.positive_score}%
                                            </strong>
                                        </div>
                                    </>
                                )}

                            </div>

                        </div>

                        {/* Next Steps */}
                        <div style={{ marginTop: "20px" }}>
                            <h3 style={{ marginBottom: "10px", color: "#e2e8f0" }}>
                                <FaClipboardList style={{ marginRight: "8px" }} />
                                Next Steps
                            </h3>
                            <div className="prediction-features">
                                {advisoryData.next_steps.map((step, index) => (
                                    <div className="feature-item" key={index}>
                                        ✅ {step}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Warning Signs */}
                        {advisoryData.warning_signs &&
                            advisoryData.warning_signs.length > 0 && (
                            <div style={{ marginTop: "20px" }}>
                                <h3 style={{ marginBottom: "10px", color: "#fbbf24" }}>
                                    <FaExclamationTriangle style={{ marginRight: "8px" }} />
                                    Warning Signs to Watch
                                </h3>
                                <div className="prediction-features">
                                    {advisoryData.warning_signs.map((sign, index) => (
                                        <div className="feature-item" key={index}>
                                            ⚠️ {sign}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lifestyle Modifications */}
                        {advisoryData.lifestyle_modifications &&
                            advisoryData.lifestyle_modifications.length > 0 && (
                            <div style={{ marginTop: "20px" }}>
                                <h3 style={{ marginBottom: "10px", color: "#60a5fa" }}>
                                    <FaWalking style={{ marginRight: "8px" }} />
                                    Lifestyle Modifications
                                </h3>
                                <div className="prediction-features">
                                    {advisoryData.lifestyle_modifications.map((mod, index) => (
                                        <div className="feature-item" key={index}>
                                            💡 {mod}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                )}


                {/* ========================= */}
                {/* TREATMENT SUGGESTIONS      */}
                {/* ========================= */}

                {treatmentData && treatmentData.treatment && (

                    <div className="glass-card" style={{ marginBottom: "25px" }}>

                        <div className="section-header">
                            <div>
                                <h2>
                                    <FaPills style={{ marginRight: "10px" }} />
                                    Treatment Suggestions
                                </h2>
                                <p>
                                    Personalised treatment guidance for{" "}
                                    <strong>{treatmentData.disease}</strong>{" "}
                                    ({treatmentData.treatment.category}).
                                </p>
                            </div>
                        </div>

                        {/* Treatment Suggestions List */}
                        <div className="recommendation-grid">
                            {treatmentData.treatment.suggestions.map(
                                (suggestion, index) => (
                                    <div
                                        className="recommendation-card"
                                        key={index}
                                    >
                                        <div className="recommendation-icon">
                                            <FaPills />
                                        </div>
                                        <h3>
                                            Treatment {index + 1}
                                        </h3>
                                        <p>{suggestion}</p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Dietary Advice */}
                        <div style={{ marginTop: "20px" }}>
                            <h3 style={{ marginBottom: "10px", color: "#34d399" }}>
                                <FaUtensils style={{ marginRight: "8px" }} />
                                Dietary Advice
                            </h3>
                            <div className="prediction-features">
                                <div className="feature-item">
                                    🍎 {treatmentData.treatment.dietary_advice}
                                </div>
                            </div>
                        </div>

                        {/* When to See Doctor */}
                        <div style={{ marginTop: "20px" }}>
                            <h3 style={{ marginBottom: "10px", color: "#f87171" }}>
                                <FaUserMd style={{ marginRight: "8px" }} />
                                When to See a Doctor
                            </h3>
                            <div className="prediction-features">
                                <div className="feature-item">
                                    🏥 {treatmentData.treatment.when_to_see_doctor}
                                </div>
                            </div>
                        </div>

                        {/* Risk Context */}
                        {treatmentData.risk_context && (
                            <div style={{ marginTop: "20px" }}>
                                <h3 style={{ marginBottom: "10px", color: "#e2e8f0" }}>
                                    <FaInfoCircle style={{ marginRight: "8px" }} />
                                    Risk Context
                                </h3>
                                <div className="result-stats">
                                    <div className="result-stat">
                                        <span>Risk Outcome</span>
                                        <strong>
                                            {treatmentData.risk_context.predicted_outcome}
                                        </strong>
                                    </div>
                                    <div className="result-stat">
                                        <span>Blood Pressure</span>
                                        <strong>
                                            {treatmentData.risk_context.blood_pressure}
                                        </strong>
                                    </div>
                                    <div className="result-stat">
                                        <span>Cholesterol</span>
                                        <strong>
                                            {treatmentData.risk_context.cholesterol_level}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile-Based Tips */}
                        {treatmentData.profile_tips &&
                            treatmentData.profile_tips.length > 0 && (
                            <div style={{ marginTop: "20px" }}>
                                <h3 style={{ marginBottom: "10px", color: "#a78bfa" }}>
                                    <FaInfoCircle style={{ marginRight: "8px" }} />
                                    Personalised Tips (Based on Your Profile)
                                </h3>
                                <div className="prediction-features">
                                    {treatmentData.profile_tips.map((tip, index) => (
                                        <div className="feature-item" key={index}>
                                            👤 {tip}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                )}


                {/* ========================= */}
                {/* EXISTING RECOMMENDATIONS   */}
                {/* ========================= */}

                <div className="dashboard-grid">

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Latest Diagnosis</h2>

                                <p>

                                    Recommendations are generated based on
                                    your latest disease prediction.

                                </p>

                            </div>

                        </div>

                        <div className="prediction-result">

                            <div className="result-top">

                                <div className="result-icon">

                                    <FaHeartbeat />

                                </div>

                                <div>

                                    <h2>
                                        {latestDisease || "No Diagnosis Yet"}
                                    </h2>

                                    <p>

                                        Follow these recommendations to
                                        manage symptoms and improve recovery.

                                    </p>

                                </div>

                            </div>

                            <div className="result-stats">

                                <div className="result-stat">

                                    <span>Condition</span>

                                    <strong>

                                        Stable

                                    </strong>

                                </div>

                                <div className="result-stat">

                                    <span>Recommendations</span>

                                    <strong>

                                        {recommendations.length}

                                    </strong>

                                </div>

                                <div className="result-stat">

                                    <span>Priority</span>

                                    <strong>

                                        Medium

                                    </strong>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>

                                    AI Health Recommendations

                                </h2>

                                <p>
                                    {diseaseDescription ||
                                        "Make a disease prediction to receive personalized recommendations."}
                                </p>

                            </div>

                        </div>

                        <div className="recommendation-grid">

                        {
                            recommendations.length > 0 ? (

                                recommendations.map((item, index) => (

                                    <div
                                        className="recommendation-card"
                                        key={index}
                                    >

                                        <div className="recommendation-icon">

                                            <FaHeartbeat />

                                        </div>

                                        <h3>
                                            Recommendation {index + 1}
                                        </h3>

                                        <p>
                                            {item}
                                        </p>

                                    </div>

                                ))

                            ) : (

                                <div className="feature-item">

                                    <FaCheckCircle />

                                    No personalized recommendations are available yet.
                                    Make a disease prediction first.

                                </div>

                            )
                        }

                        </div>

                    </div>

                </div>

                            <div className="dashboard-grid">

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Daily Wellness Checklist</h2>

                                <p>

                                    Small daily habits that contribute to
                                    long-term health and faster recovery.

                                </p>

                            </div>

                        </div>

                        <div className="prediction-features">

                            <div className="feature-item">

                                ✅ Drink 2-3 litres of water every day.

                            </div>

                            <div className="feature-item">

                                ✅ Eat fresh fruits and vegetables.

                            </div>

                            <div className="feature-item">

                                ✅ Walk or exercise for at least 30 minutes.

                            </div>

                            <div className="feature-item">

                                ✅ Get 7-8 hours of quality sleep.

                            </div>

                            <div className="feature-item">

                                ✅ Take medicines exactly as prescribed.

                            </div>

                            <div className="feature-item">

                                ✅ Schedule routine medical checkups.

                            </div>

                        </div>

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Recovery Progress</h2>

                                <p>

                                    Maintain these healthy practices to improve
                                    your recovery and overall wellbeing.

                                </p>

                            </div>

                        </div>

                        <div className="stats-grid">

                            <div className="stats-card">

                                <FaHeartbeat />

                                <h3>Hydration</h3>

                                <h2>Good</h2>

                            </div>

                            <div className="stats-card">

                                <FaAppleAlt />

                                <h3>Nutrition</h3>

                                <h2>Healthy</h2>

                            </div>

                            <div className="stats-card">

                                <FaWalking />

                                <h3>Exercise</h3>

                                <h2>Daily</h2>

                            </div>

                        </div>

                        <div
                            className="action-buttons"
                            style={{ marginTop: "25px" }}
                        >

                            <Link
                                to="/patient/disease-prediction"
                                className="primary-btn"
                            >

                                View Prediction

                            </Link>

                            <Link
                                to="/patient/health-reports"
                                className="secondary-btn"
                            >

                                Health Reports

                            </Link>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Recommendations;