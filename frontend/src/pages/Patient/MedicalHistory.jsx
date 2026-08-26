import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import {
    getPatientPredictions,
    getPatientSymptoms,
    getPatientRiskAssessments
} from "../../services/patientService";

import {
    FaArrowLeft,
    FaHistory,
    FaHeartbeat,
    FaNotesMedical,
    FaCheckCircle,
    FaCalendarAlt,
    FaStethoscope
} from "react-icons/fa";

import "../../styles/Dashboard.css";
import "../../styles/Button.css";
import "../../styles/Form.css";
import "../../styles/Patient.css";

function MedicalHistory() {

    const [predictions, setPredictions] = useState([]);
    const [symptoms, setSymptoms] = useState([]);
    const [riskAssessments, setRiskAssessments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const loadMedicalHistory = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                predictionsData,
                symptomsData,
                riskData
            ] = await Promise.all([
                getPatientPredictions(),
                getPatientSymptoms(),
                getPatientRiskAssessments()
            ]);

            setPredictions(
                predictionsData?.predictions || []
            );

            setSymptoms(
                symptomsData?.symptoms || []
            );

            setRiskAssessments(
                riskData?.assessments || []
            );

        } catch (error) {

            console.error(
                "Failed to load medical history:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Unable to load medical history."
            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        loadMedicalHistory();
    }, []);


    const medicalHistory = predictions.map(
        (prediction) => {

            const predictionDate =
                prediction.created_at
                    ? new Date(
                        prediction.created_at
                    ).toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    )
                    : "—";

            const predictionSymptoms =
                symptoms.length > 0
                    ? symptoms
                        .map(
                            symptom =>
                                symptom.symptom_name
                        )
                        .join(", ")
                    : "No symptoms recorded";

            return {
                id: prediction.id,
                disease: prediction.predicted_disease,
                predictionDate,
                symptoms: predictionSymptoms,
                status: "AI Predicted"
            };

        }
    );



    if (loading) {

        return (
            <div className="patient-dashboard">

                <div className="dashboard-overlay"></div>

                <div className="dashboard-content">

                    <div className="glass-card">

                        <h2>
                            Loading Medical History...
                        </h2>

                        <p>
                            Fetching your health records.
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
                            Unable to Load Medical History
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

                            <FaHistory />

                            MedAssist AI

                        </div>

                        <h1>

                            Medical History

                        </h1>

                        <p>

                            Access your disease prediction history,
                            recorded symptoms and risk assessments
                            from one secure location.

                        </p>

                    </div>

                    <div className="hero-right">

                        <div className="hero-badge">

                            <FaNotesMedical />

                            History

                        </div>

                    </div>

                </section>

                <section className="stats-grid">

                    <div className="stats-card">

                        <FaHistory />

                        <h3>Total Records</h3>

                        <h2>

                            {medicalHistory.length}

                        </h2>

                    </div>

                    <div className="stats-card">

                        <FaHeartbeat />

                        <h3>Risk Assessments</h3>

                            <h2>
                                {riskAssessments.length}
                            </h2>

                    </div>

                    <div className="stats-card">

                        <FaStethoscope />

                        <h3>Recorded Symptoms</h3>

                        <h2>
                            {symptoms.length}
                        </h2>

                    </div>

                    <div className="stats-card">

                        <FaCheckCircle />

                        <h3>Health Status</h3>

                        <h2>
                            {
                                riskAssessments.length > 0
                                    ? riskAssessments[0].predicted_outcome
                                    : "Not Assessed"
                            }
                        </h2>

                    </div>

                </section>

                            <div className="dashboard-grid">

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Health Timeline</h2>

                                <p>

                                    A quick overview of your recent medical
                                    history and disease predictions.

                                </p>

                            </div>

                        </div>

                        <div className="prediction-features">

                            {

                                medicalHistory.map((record) => (

                                    <div
                                        className="feature-item"
                                        key={record.id}
                                    >

                                        <FaCalendarAlt />

                                        <div>

                                            <strong>

                                                {record.predictionDate}

                                            </strong>

                                            <br />

                                            {record.disease}

                                        </div>

                                    </div>

                                ))

                            }

                        </div>

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Medical Records</h2>

                                <p>

                                    Previous AI predictions and their
                                    corresponding health status.

                                </p>

                            </div>

                        </div>

                        {

                            medicalHistory.length === 0 ? (

                                <div className="empty-state">

                                    <FaHistory size={60} />

                                    <h3>

                                        No Medical History

                                    </h3>

                                    <p>

                                        Your previous diagnoses will appear
                                        here after disease predictions.

                                    </p>

                                </div>

                            ) : (

                                <div className="table-responsive">

                                    <table className="dashboard-table">

                                        <thead>

                                            <tr>

                                                <th>Disease</th>

                                                <th>Date</th>

                                                <th>Symptoms</th>

                                                <th>Status</th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {

                                                medicalHistory.map((record) => (

                                                    <tr key={record.id}>

                                                        <td>

                                                            <strong>

                                                                {record.disease}

                                                            </strong>

                                                        </td>

                                                        <td>

                                                            {record.predictionDate}

                                                        </td>

                                                        <td>

                                                            {record.symptoms}

                                                        </td>

                                                        <td>

                                                            <span
                                                                className={
                                                                    record.status === "Recovered"
                                                                        ? "status-badge success"
                                                                        : "status-badge warning"
                                                                }
                                                            >

                                                                {record.status}

                                                            </span>

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

                </div>

                                <div className="dashboard-grid">

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Medical Summary</h2>

                                <p>

                                    A quick summary of your health records.

                                </p>

                            </div>

                        </div>

                        <div className="stats-grid">

                            <div className="stats-card">

                                <FaHistory />

                                <h3>Total Diagnoses</h3>

                                <h2>

                                    {medicalHistory.length}

                                </h2>

                            </div>

                            <div className="stats-card">

                                <FaCheckCircle />

                                <h3>Recovered</h3>

                                <h2>

                                    {
                                        medicalHistory.filter(
                                            item =>
                                                item.status === "Recovered"
                                        ).length
                                    }

                                </h2>

                            </div>

                            <div className="stats-card">

                                <FaHeartbeat />

                                <h3>Observation</h3>

                                <h2>

                                    {
                                        medicalHistory.filter(
                                            item =>
                                                item.status ===
                                                "Under Observation"
                                        ).length
                                    }

                                </h2>

                            </div>

                        </div>

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <div>

                                <h2>Health Insights</h2>

                                <p>

                                    AI generated recommendations for maintaining
                                    good health.

                                </p>

                            </div>

                        </div>

                        <div className="prediction-features">

                            <div className="feature-item">

                                ✅ Maintain a balanced and nutritious diet.

                            </div>

                            <div className="feature-item">

                                ✅ Exercise for at least 30 minutes daily.

                            </div>

                            <div className="feature-item">

                                ✅ Drink sufficient water every day.

                            </div>

                            <div className="feature-item">

                                ✅ Schedule regular medical checkups.

                            </div>

                            <div className="feature-item">

                                ✅ Follow your doctor's prescribed treatment.

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default MedicalHistory;