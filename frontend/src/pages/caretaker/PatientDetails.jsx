import {
    Link,
    useParams
} from "react-router-dom";

import {
    useEffect,
    useState
} from "react";


import {
    getPatientDetails
} from "../../services/caretakerService";

import {
    FaArrowLeft,
    FaHospital,
    FaUserCircle,
    FaPhone,
    FaTint,
    FaBirthdayCake,
    FaVenusMars,
    FaBrain,
    FaNotesMedical,
    FaLightbulb,
    FaFileMedical,
    FaDownload
} from "react-icons/fa";

import "../../styles/Patient.css";
import "../../styles/Dashboard.css";
import "../../styles/Button.css";

function PatientDetails() {

    const { id } = useParams();

    const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) {
        return null;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference =
        today.getMonth() - birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() < birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
};

    const [patient, setPatient] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    
    useEffect(() => {

    loadPatientDetails();

}, [id]);


const loadPatientDetails = async () => {

    try {

        setLoading(true);

        setError("");

        const data = await getPatientDetails(id);

        setPatient(data);

    }

    catch (error) {

        console.error(
            "Failed to load patient details:",
            error
        );

        setError(
            error.response?.data?.detail ||
            "Unable to load patient details."
        );

    }

    finally {

        setLoading(false);

    }

};

    

    if (loading) {

    return (
        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                <div className="glass-card">

                    <h2>
                        Loading patient details...
                    </h2>

                </div>

            </div>

        </div>
    );

}


    if (error || !patient) {

    return (
        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                <Link
                    to="/caretaker/patients"
                    className="secondary-btn"
                >
                    <FaArrowLeft />
                    Back to Assigned Patients
                </Link>

                <div
                    className="glass-card"
                    style={{
                        marginTop: "30px",
                        textAlign: "center"
                    }}
                >

                    <h2>
                        Unable to Load Patient
                    </h2>

                    <p>
                        {error ||
                            "Patient details are unavailable."}
                    </p>

                </div>

            </div>

        </div>
    );

}

        const age = calculateAge(
            patient?.profile?.date_of_birth
        );

        const latestPrediction =
            patient?.predictions?.[0]?.predicted_disease;


    return (

        <div className="patient-dashboard">

            <div className="dashboard-overlay"></div>

            <div className="dashboard-content">

                <Link
                    to="/caretaker/patients"
                    className="secondary-btn"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "25px"
                    }}
                >

                    <FaArrowLeft />

                    Back to Assigned Patients

                </Link>

                <section className="dashboard-hero">

                    <div className="hero-content">

                        <div className="dashboard-brand">

                            <FaHospital />

                            MedAssist AI

                        </div>

                        <h1>

                            Patient Details

                        </h1>

                        <p>

                            Review patient profile, AI disease prediction,
                            symptoms, recommendations and uploaded reports
                            from one centralized healthcare dashboard.

                        </p>

                    </div>

                    <div className="hero-image">

                        <div className="hero-icon-circle">

                            <FaUserCircle />

                        </div>

                    </div>

                </section>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "30px",
                        marginTop: "40px"
                    }}
                >

                    <div className="glass-card">

                        <div className="section-header">

                            <h2>

                                Patient Profile

                            </h2>

                            <p>

                                Basic healthcare information.

                            </p>

                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "18px"
                            }}
                        >

                            <p><FaUserCircle /> <strong>Name:</strong> {patient.patient?.full_name || "—"}</p>

                            <p>
                                <FaBirthdayCake />
                                <strong>Age:</strong>{" "}
                                {age !== null ? `${age} years` : "—"}
                            </p>

                            <p><FaVenusMars /> <strong>Gender:</strong> {patient.profile?.gender || "—"}</p>

                            <p><FaTint /> <strong>Blood Group:</strong> {patient.profile?.blood_group || "—"}</p>

                            <p><FaPhone /> <strong>Phone:</strong> {patient.profile?.phone || "—"}</p>

                        </div>

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <h2>

                                Latest AI Prediction

                            </h2>

                            <p>

                                Most recent disease prediction.

                            </p>

                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "18px",
                                marginTop: "20px"
                            }}
                        >

                            <div className="card-icon">

                                <FaBrain />

                            </div>

                            <div>

                                <h3>

                                    {latestPrediction || "No prediction available"}

                                </h3>

                                <p>

                                    Generated by MedAssist AI prediction engine.

                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "30px",
                        marginTop: "30px"
                    }}
                >

                    <div className="glass-card">

                        <div className="section-header">

                            <h2>

                                Symptoms

                            </h2>

                            <p>

                                Reported symptoms.

                            </p>

                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "15px"
                            }}
                        >

                        {
                            patient.symptoms?.length > 0 ? (

                                patient.symptoms.map((symptom, index) => (

                                    <div
                                        key={index}
                                        className="feature-item"
                                    >

                                        <FaNotesMedical />

                                        <div>

                                            <strong>
                                                {symptom.symptom_name}
                                            </strong>

                                            {symptom.severity && (
                                                <span
                                                    style={{
                                                        marginLeft: "10px"
                                                    }}
                                                >
                                                    Severity: {symptom.severity}
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                ))

                            ) : (

                                <div className="feature-item">

                                    <FaNotesMedical />

                                    No symptoms have been recorded.

                                </div>

                            )
                        }

                        </div>

                    </div>

                    <div className="glass-card">

                        <div className="section-header">

                            <h2>

                                Recommendations

                            </h2>

                            <p>

                                Suggested healthcare guidance.

                            </p>

                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "15px"
                            }}
                        >
                            {
                                patient.recommendations?.length > 0 ? (

                                    patient.recommendations.map((item, index) => (

                                        <div
                                            key={index}
                                            className="feature-item"
                                        >

                                            <FaLightbulb />

                                            {item}

                                        </div>

                                    ))

                                ) : (

                                    <div className="feature-item">

                                        <FaLightbulb />

                                        No recommendations available yet.

                                    </div>

                                )
                            }
                        </div>

                    </div>

                </div>

                <div
                    className="glass-card"
                    style={{
                        marginTop: "30px"
                    }}
                >

                    <div className="section-header">

                        <h2>

                            Medical Reports

                        </h2>

                        <p>

                            Uploaded patient reports.

                        </p>

                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                            gap: "20px"
                        }}
                    >

                                            
                    {
                        patient.reports?.length > 0 ? (

                            patient.reports.map((report, index) => (

                                <div
                                    key={index}
                                    className="dashboard-card"
                                >

                                    <div className="card-icon">
                                        <FaFileMedical />
                                    </div>

                                    <h3>
                                        {report}
                                    </h3>

                                    <button
                                        className="primary-btn"
                                        style={{
                                            marginTop: "20px"
                                        }}
                                    >
                                        <FaDownload />
                                        Download
                                    </button>

                                </div>

                            ))

                        ) : (

                            <div className="dashboard-card">

                                <div className="card-icon">
                                    <FaFileMedical />
                                </div>

                                <h3>
                                    No Medical Reports
                                </h3>

                                <p>
                                    No reports have been uploaded by this patient yet.
                                </p>

                            </div>

                        )
                    }

                    </div>

                </div>

            </div>

        </div>

    );

}



export default PatientDetails;
