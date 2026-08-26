import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    FaArrowLeft,
    FaBrain,
    FaHeartbeat,
    FaRobot,
    FaClipboardList,
    FaChartLine,
    FaStethoscope,
    FaDownload
} from "react-icons/fa";

import {
    getPatientSymptoms,
    predictDisease,
    downloadPredictionReport
} from "../../services/patientService";

import "../../styles/Dashboard.css";
import "../../styles/Button.css";
import "../../styles/Form.css";
import "../../styles/Patient.css";

function DiseasePrediction() {

    const [savedSymptoms, setSavedSymptoms] = useState([]);
    const [prediction, setPrediction] = useState(null);

    const [loading, setLoading] = useState(true);
    const [predictLoading, setPredictLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    const navigate = useNavigate();

    const handleDownloadReport = async () => {
        try {
            setDownloadLoading(true);
            await downloadPredictionReport();
        } catch (error) {
            console.error("Download failed:", error);

            // Blob responses need special parsing
            let message = "Failed to download report. Make sure you have a prediction first.";
            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    if (json.detail) message = json.detail;
                } catch (e) {
                    // keep default message
                }
            } else if (error.response?.data?.detail) {
                message = error.response.data.detail;
            }

            alert(message);
        } finally {
            setDownloadLoading(false);
        }
    };

    useEffect(() => {

        fetchSavedSymptoms();

    }, []);

    const fetchSavedSymptoms = async () => {

        try {

            const response = await getPatientSymptoms();

            setSavedSymptoms(response.symptoms);

        }

        catch (error) {

            console.error(error);

            alert(

                error.response?.data?.detail ||

                "Failed to load symptoms."

            );

        }

        finally {

            setLoading(false);

        }

    };

    const handlePredictDisease = async () => {

        try {

            if (savedSymptoms.length === 0) {

                alert("Please save symptoms first.");

                return;

            }

            setPredictLoading(true);

            const symptomNames = [

                ...new Set(

                    savedSymptoms.map(

                        (item) => item.symptom_name

                    )

                )

            ];

            const result = await predictDisease(symptomNames);

            setPrediction(result);

        }

        catch (error) {

            console.error(error);

            alert(

                error.response?.data?.detail ||

                "Prediction failed."

            );

        }

        finally {

            setPredictLoading(false);

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

                            <FaRobot />

                            MedAssist AI

                        </div>

                        <h1>

                            AI Disease Prediction

                        </h1>

                        <p>

                            Our intelligent prediction engine analyses
your saved symptoms to identify possible
health conditions and provide general
educational information.

                        </p>

                    </div>

                    <div className="hero-right">

                        <div className="hero-badge">

                            <FaBrain />

                            AI

                        </div>

                    </div>

                </section>

                <section className="stats-grid">

                    <div className="stats-card">

                        <FaClipboardList />

                        <h3>

                            Saved Symptoms

                        </h3>

                        <h2>

                            {savedSymptoms.length}

                        </h2>

                    </div>

                    <div className="stats-card">

                        <FaHeartbeat />

                        <h3>

                            Prediction

                        </h3>

                        <h2>

                            {

                                prediction

                                ?

                                "Completed"

                                :

                                "Pending"

                            }

                        </h2>

                    </div>

                    <div className="stats-card">

                        <FaChartLine />

                        <h3>

                            AI Status

                        </h3>

                        <h2>

                            Online

                        </h2>

                    </div>

                    <div className="stats-card">

                        <FaStethoscope />

                        <h3>

                            Medical Engine

                        </h3>

                        <h2>

                            Ready

                        </h2>

                    </div>

                </section>

                        <div className="dashboard-grid">

                    {/* Saved Symptoms */}

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Saved Symptoms</h2>

                                <p>
                                    These symptoms will be used by the AI
                                    prediction engine.
                                </p>

                            </div>

                        </div>

                        {
                            loading ?

                            (

                                <div className="loading-section">

                                    <div className="loading-spinner"></div>

                                    <p>Loading symptoms...</p>

                                </div>

                            )

                            :

                            savedSymptoms.length === 0 ?

                            (

                                <div className="empty-state">

                                    <FaClipboardList size={60} />

                                    <h3>No Symptoms Found</h3>

                                    <p>

                                        You haven't saved any symptoms yet.

                                    </p>

                                    <button
                                        className="primary-btn"
                                        onClick={() =>
                                            navigate("/patient/symptoms")
                                        }
                                    >

                                        Add Symptoms

                                    </button>

                                </div>

                            )

                            :

                            (

                                <div className="table-responsive">

                                    <table className="dashboard-table">

                                        <thead>

                                            <tr>

                                                <th>Symptom</th>

                                                <th>Severity</th>

                                                <th>Date</th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {

                                                savedSymptoms.map((item, index) => (

                                                    <tr key={index}>

                                                        <td>

                                                            {item.symptom_name}

                                                        </td>

                                                        <td>

                                                            <span
                                                                className={`severity-badge ${item.severity.toLowerCase()}`}
                                                            >

                                                                {item.severity}

                                                            </span>

                                                        </td>

                                                        <td>

                                                            {

                                                                item.created_at

                                                                    ?

                                                                    new Date(
                                                                        item.created_at
                                                                    ).toLocaleDateString()

                                                                    :

                                                                    "-"

                                                            }

                                                        </td>

                                                    </tr>

                                                ))

                                            }

                                        </tbody>

                                    </table>

                                </div>

                            )

                        }

                    </div>

                    {/* AI Prediction */}

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>AI Symptom Analysis</h2>

                                <p>
                                    Analyse your saved symptoms using the
                                    MedAssist AI prediction model.
                                </p>

                            </div>

                        </div>

                        <div className="prediction-panel">

                            <div className="prediction-icon">

                                <FaBrain />

                            </div>

                            <h3>

                                Ready for Analysis

                            </h3>

                            <p>

                                The AI model evaluates your symptoms,
                                identifies possible diseases and provides
                                confidence-based results.

                            </p>

                            <div className="prediction-features">

                                <div className="feature-item">
                                    ✅ Symptom Pattern Analysis
                                </div>

                                <div className="feature-item">
                                    ✅ Possible Conditions
                                </div>

                                <div className="feature-item">
                                    ✅ Model Scores
                                </div>

                                <div className="feature-item">
                                    ✅ General Precautions
                                </div>

                            </div>

                            <button
                                className="primary-btn large-btn"
                                disabled={
                                    predictLoading ||
                                    savedSymptoms.length === 0
                                }
                                onClick={handlePredictDisease}
                            >

                                {

                                    predictLoading ?

                                    "Analysing..."

                                    :

                                    "Predict Disease"

                                }

                            </button>

                        </div>

                    </div>

                </div>

                            {

                    prediction && (

                        <div className="glass-card prediction-result-card">

                            <div className="section-header">

                                <div>

                                    <h2>Prediction Result</h2>

                                    <p>
                                        AI-generated analysis based on your submitted symptoms.
                                    </p>

                                </div>

                            </div>


                            <div className="prediction-result">

                                <div className="result-top">

                                    <div className="result-icon">
                                        <FaBrain />
                                    </div>

                                    <div>

                                        <h2>
                                            Possible Conditions
                                        </h2>

                                        <p>
                                            The following conditions were ranked by the
                                            AI model based on your selected symptoms.
                                        </p>

                                    </div>

                                </div>


                                <div className="result-stats">

                                    <div className="result-stat">

                                        <span>
                                            Symptoms Used
                                        </span>

                                        <strong>
                                            {savedSymptoms.length}
                                        </strong>

                                    </div>


                                    <div className="result-stat">

                                        <span>
                                            Conditions Shown
                                        </span>

                                        <strong>
                                            {prediction.top_conditions?.length || 0}
                                        </strong>

                                    </div>


                                    <div className="result-stat">

                                        <span>
                                            Status
                                        </span>

                                        <strong>
                                            Completed
                                        </strong>

                                    </div>

                                </div>


                                {/* Top 3 Conditions */}

                                <div className="conditions-list">

                                    {prediction.top_conditions?.map(
                                        (condition, index) => (

                                            <div
                                                className="condition-card"
                                                key={condition.condition}
                                            >

                                                <div className="condition-header">

                                                    <div>

                                                        <span className="condition-rank">

                                                            #{index + 1}

                                                        </span>

                                                        <h3>

                                                            {condition.condition}

                                                        </h3>

                                                    </div>


                                                    <div className="condition-score">

                                                        <span>
                                                            Model Score
                                                        </span>

                                                        <strong>
                                                            {condition.model_score}%
                                                        </strong>

                                                    </div>

                                                </div>


                                                {/* Description */}

                                                {condition.description && (

                                                    <div className="condition-description">

                                                        <h4>
                                                            General Information
                                                        </h4>

                                                        <p>
                                                            {condition.description}
                                                        </p>

                                                    </div>

                                                )}


                                                {/* Precautions */}

                                                {condition.precautions &&
                                                    condition.precautions.length > 0 && (

                                                        <div className="condition-precautions">

                                                            <h4>
                                                                General Precautions
                                                            </h4>

                                                            <ul className="recommendation-list">

                                                                {condition.precautions.map(
                                                                    (precaution, precautionIndex) => (

                                                                        <li
                                                                            key={precautionIndex}
                                                                        >
                                                                            {precaution}
                                                                        </li>

                                                                    )
                                                                )}

                                                            </ul>

                                                        </div>

                                                    )}

                                            </div>

                                        )
                                    )}

                                </div>


                                {/* Disclaimer */}

                                <div className="medical-disclaimer">

                                    <strong>
                                        ⚠️ Important
                                    </strong>

                                    <p>

                                        {prediction.disclaimer ||

                                            "These are model-generated possible conditions "
                                            + "for educational purposes and are not a medical "
                                            + "diagnosis. Please consult a qualified healthcare "
                                            + "professional."}

                                    </p>

                                </div>


                                <div className="action-buttons">

                                    <button
                                        className="primary-btn"
                                        onClick={() =>
                                            navigate(
                                                "/patient/recommendations"
                                            )
                                        }
                                    >

                                        View Recommendations

                                    </button>


                                    <button
                                        className="secondary-btn"
                                        onClick={handleDownloadReport}
                                        disabled={downloadLoading}
                                    >

                                        <FaDownload style={{ marginRight: "8px" }} />

                                        {downloadLoading
                                            ? "Generating PDF..."
                                            : "Download Report"}

                                    </button>


                                    <button
                                        className="secondary-btn"
                                        onClick={() =>
                                            navigate(
                                                "/patient/health-reports"
                                            )
                                        }
                                    >

                                        Health Reports

                                    </button>

                                </div>

                            </div>

                        </div>

                    )

                }

            </div>

        </div>

    );

}

export default DiseasePrediction;