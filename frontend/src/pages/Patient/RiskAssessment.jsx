import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    assessPatientRisk,
    getPatientRiskAssessments
} from "../../services/patientService";

import "../../styles/Patient.css";

function RiskAssessment() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({

        fever: "No",

        cough: "No",

        fatigue: "No",

        difficulty_breathing: "No",

        age: "",

        gender: "Male",

        blood_pressure: "Normal",

        cholesterol_level: "Normal"

    });


    const [result, setResult] = useState(null);

    const [loading, setLoading] = useState(false);

    const [riskHistory, setRiskHistory] = useState([]);

    const [expandedAssessment, setExpandedAssessment] =
    useState(null);


    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };



        const loadRiskHistory = async () => {

    try {

        const response =
            await getPatientRiskAssessments();

        setRiskHistory(
            response.assessments || []
        );

    } catch (error) {

        console.error(
            "Failed to load risk history:",
            error
        );

    }

};


    useEffect(() => {

        loadRiskHistory();

    }, []);



    const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    setResult(null);

    try {

        const response = await assessPatientRisk({

            fever: formData.fever,

            cough: formData.cough,

            fatigue: formData.fatigue,

            difficulty_breathing:
                formData.difficulty_breathing,

            age: Number(formData.age),

            gender: formData.gender,

            blood_pressure:
                formData.blood_pressure,

            cholesterol_level:
                formData.cholesterol_level

        });


        // Display current result

        setResult(
            response.risk_assessment
        );


        // Refresh history

        await loadRiskHistory();


    } catch (error) {

        console.error(
            "Risk assessment failed:",
            error
        );

        alert(
            "Unable to complete risk assessment."
        );

    } finally {

        setLoading(false);

    }

};



    return (
    <div className="patient-page">

        <div className="patient-content">

            <button
                className="back-button"
                onClick={() =>
                    navigate("/patient/dashboard")
                }
            >
                ← Back to Dashboard
            </button>


            {/* HERO */}

            <section className="risk-hero">

                <div className="risk-hero-circle">
                    🩺
                    <span>
                        Patient Module
                    </span>
                </div>

                <div className="risk-hero-content">

                    <h1>
                        Patient Risk Assessment
                    </h1>

                    <p>
                        Evaluate your health profile using
                        demographic, symptom and clinical
                        indicators.
                    </p>

                </div>

            </section>


            {/* FORM */}

            <form
                className="risk-assessment-form"
                onSubmit={handleSubmit}
            >

                {/* BASIC INFORMATION */}

                <section className="risk-card">

                    <div className="risk-card-header">

                        <div className="risk-icon">
                            👤
                        </div>

                        <div>

                            <h2>
                                Basic Information
                            </h2>

                            <p>
                                Provide your basic demographic details.
                            </p>

                        </div>

                    </div>


                    <div className="risk-grid">

                        <div className="risk-field">

                            <label>
                                Age
                            </label>

                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                min="1"
                                max="120"
                                placeholder="Enter your age"
                                required
                            />

                        </div>


                        <div className="risk-field">

                            <label>
                                Gender
                            </label>

                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                            >

                                <option value="Male">
                                    Male
                                </option>

                                <option value="Female">
                                    Female
                                </option>

                            </select>

                        </div>

                    </div>

                </section>


                {/* HEALTH INDICATORS */}

                <section className="risk-card">

                    <div className="risk-card-header">

                        <div className="risk-icon">
                            🩺
                        </div>

                        <div>

                            <h2>
                                Health Indicators
                            </h2>

                            <p>
                                Select the symptoms currently experienced.
                            </p>

                        </div>

                    </div>


                    <div className="risk-grid">

                        <div className="risk-field">

                            <label>
                                Fever
                            </label>

                            <select
                                name="fever"
                                value={formData.fever}
                                onChange={handleChange}
                            >

                                <option value="No">
                                    No
                                </option>

                                <option value="Yes">
                                    Yes
                                </option>

                            </select>

                        </div>


                        <div className="risk-field">

                            <label>
                                Cough
                            </label>

                            <select
                                name="cough"
                                value={formData.cough}
                                onChange={handleChange}
                            >

                                <option value="No">
                                    No
                                </option>

                                <option value="Yes">
                                    Yes
                                </option>

                            </select>

                        </div>


                        <div className="risk-field">

                            <label>
                                Fatigue
                            </label>

                            <select
                                name="fatigue"
                                value={formData.fatigue}
                                onChange={handleChange}
                            >

                                <option value="No">
                                    No
                                </option>

                                <option value="Yes">
                                    Yes
                                </option>

                            </select>

                        </div>


                        <div className="risk-field">

                            <label>
                                Difficulty Breathing
                            </label>

                            <select
                                name="difficulty_breathing"
                                value={
                                    formData.difficulty_breathing
                                }
                                onChange={handleChange}
                            >

                                <option value="No">
                                    No
                                </option>

                                <option value="Yes">
                                    Yes
                                </option>

                            </select>

                        </div>

                    </div>

                </section>


                {/* CLINICAL INDICATORS */}

                <section className="risk-card">

                    <div className="risk-card-header">

                        <div className="risk-icon">
                            ❤️
                        </div>

                        <div>

                            <h2>
                                Clinical Indicators
                            </h2>

                            <p>
                                Provide your general health measurements.
                            </p>

                        </div>

                    </div>


                    <div className="risk-grid">

                        <div className="risk-field">

                            <label>
                                Blood Pressure
                            </label>

                            <select
                                name="blood_pressure"
                                value={
                                    formData.blood_pressure
                                }
                                onChange={handleChange}
                            >

                                <option value="Normal">
                                    Normal
                                </option>

                                <option value="High">
                                    High
                                </option>

                                <option value="Low">
                                    Low
                                </option>

                            </select>

                        </div>


                        <div className="risk-field">

                            <label>
                                Cholesterol Level
                            </label>

                            <select
                                name="cholesterol_level"
                                value={
                                    formData.cholesterol_level
                                }
                                onChange={handleChange}
                            >

                                <option value="Normal">
                                    Normal
                                </option>

                                <option value="High">
                                    High
                                </option>

                                <option value="Low">
                                    Low
                                </option>

                            </select>

                        </div>

                    </div>

                </section>


                {/* SUBMIT */}

                <div className="risk-submit">

                    <button
                        type="submit"
                        className="risk-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Assessing..."
                            : "🧠 Assess Risk"
                        }

                    </button>

                </div>

            </form>


            {/* RESULT */}

            {result && (

                <section className="risk-result-card">

                    <div className="risk-result-title">

                        <div className="risk-icon">
                            🧠
                        </div>

                        <div>

                            <h2>
                                Risk Assessment Result
                            </h2>

                            <p>
                                AI-generated assessment based
                                on your submitted profile.
                            </p>

                        </div>

                    </div>


                    <div className="risk-result-grid">

                        <div>

                            <span>
                                Predicted Outcome
                            </span>

                            <strong>
                                {result.predicted_outcome}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Positive Model Score
                            </span>

                            <strong>
                                {result.positive_model_score}%
                            </strong>

                        </div>


                        <div>

                            <span>
                                Negative Model Score
                            </span>

                            <strong>
                                {result.negative_model_score}%
                            </strong>

                        </div>

                    </div>


                    <div className="risk-disclaimer">

                        <strong>
                            ⚠️ Important
                        </strong>

                        <p>
                            {result.disclaimer}
                        </p>

                    </div>

                </section>

            )}



            {riskHistory.length > 0 && (

    <section className="risk-history-card">

        <div className="risk-history-header">

            <div className="risk-icon">
                📋
            </div>

            <div>

                <h2>
                    Previous Risk Assessments
                </h2>

                <p>
                    Review your previous AI-generated
                    risk assessments.
                </p>

            </div>

        </div>


        <div className="risk-history-list">

            {riskHistory.map((assessment) => (

                <div
                    className="risk-history-item"
                    key={assessment.id}
                    onClick={() =>
                        setExpandedAssessment(
                            expandedAssessment === assessment.id
                                ? null
                                : assessment.id
                        )
                    }
                >

                    <div className="risk-history-main">

                        <strong>
                            {assessment.predicted_outcome}
                        </strong>

                        <span>
                            {new Date(
                                assessment.created_at
                            ).toLocaleString()}
                        </span>

                        <span className="risk-history-arrow">
                            {expandedAssessment === assessment.id
                                ? "▲"
                                : "▼"}
                        </span>

                    </div>


                    <div className="risk-history-scores">

                        <div>

                            <span>
                                Positive Score
                            </span>

                            <strong>
                                {
                                    assessment
                                        .positive_model_score
                                }%
                            </strong>

                        </div>


                        <div>

                            <span>
                                Negative Score
                            </span>

                            <strong>
                                {
                                    assessment
                                        .negative_model_score
                                }%
                            </strong>

                        </div>

                    </div>

                    {expandedAssessment === assessment.id && (

        <div className="risk-history-details">

            <div className="risk-detail-section">

                <h3>
                    Patient Information
                </h3>

                <div className="risk-detail-grid">

                    <span>
                        Age:
                        <strong>
                            {assessment.age}
                        </strong>
                    </span>

                    <span>
                        Gender:
                        <strong>
                            {assessment.gender}
                        </strong>
                    </span>

                </div>

            </div>


            <div className="risk-detail-section">

                <h3>
                    Health Indicators
                </h3>

                <div className="risk-detail-grid">

                    <span>
                        Fever:
                        <strong>
                            {assessment.fever}
                        </strong>
                    </span>

                    <span>
                        Cough:
                        <strong>
                            {assessment.cough}
                        </strong>
                    </span>

                    <span>
                        Fatigue:
                        <strong>
                            {assessment.fatigue}
                        </strong>
                    </span>

                    <span>
                        Difficulty Breathing:
                        <strong>
                            {assessment.difficulty_breathing}
                        </strong>
                    </span>

                </div>

            </div>


            <div className="risk-detail-section">

                <h3>
                    Clinical Indicators
                </h3>

                <div className="risk-detail-grid">

                    <span>
                        Blood Pressure:
                        <strong>
                            {assessment.blood_pressure}
                        </strong>
                    </span>

                    <span>
                        Cholesterol:
                        <strong>
                            {assessment.cholesterol_level}
                        </strong>
                    </span>

            </div>

        </div>

    </div>

)}

                </div>

            ))}

        </div>

    </section>

)}


        </div>

    </div>
);

}




export default RiskAssessment;