import "../styles/DoctorDashboard.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FaHeartbeat,
  FaHome,
  FaUsers,
  FaHistory,
  FaBrain,
  FaExclamationTriangle,
  FaLightbulb,
  FaChartLine,
  FaSignOutAlt,
  FaSyncAlt
} from "react-icons/fa";

function DoctorDashboard() {

  const navigate = useNavigate();

  const userName = localStorage.getItem("name") || "Doctor";
  const userRole = localStorage.getItem("role") || "doctor";

  // =========================================
  // STATES
  // =========================================

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [patientRecords, setPatientRecords] = useState(null);

  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [patientError, setPatientError] = useState("");
  const [recordError, setRecordError] = useState("");

  // =========================================
  // LOAD ALL PATIENTS
  // =========================================

  const loadPatients = async () => {

    setLoadingPatients(true);
    setPatientError("");

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/patients"
      );

      if (!response.ok) {
        throw new Error("Unable to load patients.");
      }

      const data = await response.json();

      setPatients(data.patients || []);

    } catch (error) {

      console.error("Patient loading error:", error);

      setPatientError(
        "Unable to load patients. Make sure the backend is running."
      );

    } finally {

      setLoadingPatients(false);

    }
  };

  // =========================================
  // LOAD PATIENT RECORDS
  // =========================================

  const loadPatientRecords = async (patient) => {

    setSelectedPatient(patient);

    setLoadingRecords(true);
    setRecordError("");
    setPatientRecords(null);

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/patient-records/${patient.patient_id}`
      );

      if (!response.ok) {
        throw new Error("Unable to load patient records.");
      }

      const data = await response.json();

      setPatientRecords(data);

    } catch (error) {

      console.error("Patient records error:", error);

      setRecordError(
        "Unable to load this patient's records."
      );

    } finally {

      setLoadingRecords(false);

    }
  };

  // =========================================
  // LOAD PATIENTS WHEN PAGE OPENS
  // =========================================

  useEffect(() => {

    loadPatients();

  }, []);

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {

    localStorage.clear();

    navigate("/");

  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDateTime = (dateValue) => {

    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  };

  // =========================================
  // GET LATEST PREDICTION
  // =========================================

  const predictions =
    patientRecords?.prediction_history || [];

  const latestPrediction =
    predictions.length > 0
      ? predictions[0]
      : null;

  // =========================================
  // RENDER
  // =========================================

  return (

    <div className="doctor-container">

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside className="sidebar">

        <div className="logo">

          <FaHeartbeat className="logo-icon" />

          <h2>
            MedAssist AI
          </h2>

        </div>

        <div className="profile">

          <div className="avatar">
            {userName.charAt(0).toUpperCase()}
          </div>

          <h3>
            {userName}
          </h3>

          <p>
            {userRole === "doctor"
              ? "Healthcare Provider"
              : "Patient"}
          </p>

        </div>

        <ul>

          <li className="active">

            <FaHome />

            Dashboard

          </li>

          <li>

            <FaUsers />

            Patients

          </li>

          <li>

            <FaChartLine />

            Analytics

          </li>

          <li onClick={handleLogout}>

            <FaSignOutAlt />

            Logout

          </li>

        </ul>

      </aside>


      {/* =========================================
          MAIN CONTENT
      ========================================= */}

      <main className="doctor-content">

        <div className="dashboard-header">

          <h1>
            Healthcare Provider Dashboard
          </h1>

          <p>
            Monitor patients, review reports and
            AI-powered health insights.
          </p>

        </div>


        {/* =========================================
            SUMMARY
        ========================================= */}

        <div className="summary-grid">

          <div className="summary-card">

            <h4>
              Total Patients
            </h4>

            <h2>
              {patients.length}
            </h2>

          </div>


          <div className="summary-card">

            <h4>
              High Risk Cases
            </h4>

            <h2>
              0
            </h2>

          </div>


          <div className="summary-card">

            <h4>
              Total Predictions
            </h4>

            <h2>
              {predictions.length}
            </h2>

          </div>

        </div>


        {/* =========================================
            DASHBOARD GRID
        ========================================= */}

        <div className="doctor-grid">


          {/* =========================================
              PATIENT LIST
          ========================================= */}

          <div className="card patient-list-card">

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px"
              }}
            >

              <h3 style={{ margin: 0 }}>

                <FaUsers />

                Patient List

              </h3>

              <button
                type="button"
                onClick={loadPatients}
                disabled={loadingPatients}
                style={{
                  border: "none",
                  background: "#eff6ff",
                  color: "#2563eb",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >

                <FaSyncAlt />

                {" "}

                {loadingPatients
                  ? "Loading..."
                  : "Refresh"}

              </button>

            </div>


            {patientError && (

              <p
                style={{
                  color: "#dc2626",
                  background: "#fef2f2",
                  padding: "10px",
                  borderRadius: "8px"
                }}
              >
                {patientError}
              </p>

            )}


            {loadingPatients ? (

              <p>
                Loading patients...
              </p>

            ) : patients.length === 0 ? (

              <p>
                No patients registered yet.
              </p>

            ) : (

              <div
                style={{
                  overflowX: "auto"
                }}
              >

                <table>

                  <thead>

                    <tr>

                      <th>ID</th>

                      <th>Name</th>

                      <th>Email</th>

                      <th>Age</th>

                      <th>Gender</th>

                      <th>Blood Group</th>

                    </tr>

                  </thead>

                  <tbody>

                    {patients.map((patient) => (

                      <tr
                        key={patient.patient_id}
                        onClick={() =>
                          loadPatientRecords(patient)
                        }
                        style={{
                          cursor: "pointer",
                          background:
                            selectedPatient?.patient_id ===
                            patient.patient_id
                              ? "#eff6ff"
                              : "transparent"
                        }}
                      >

                        <td>
                          P
                          {String(
                            patient.patient_id
                          ).padStart(3, "0")}
                        </td>

                        <td>
                          {patient.name}
                        </td>

                        <td>
                          {patient.email}
                        </td>

                        <td>
                          {patient.age ?? "Not provided"}
                        </td>

                        <td>
                          {patient.gender ?? "Not provided"}
                        </td>

                        <td>
                          {patient.blood_group ??
                            "Not provided"}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>


          {/* =========================================
              PATIENT HISTORY
          ========================================= */}

          <div className="card">

            <h3>

              <FaHistory />

              Patient History

            </h3>


            {loadingRecords ? (

              <div className="history-box">

                <p>
                  Loading patient records...
                </p>

              </div>

            ) : recordError ? (

              <div className="history-box">

                <p style={{ color: "#dc2626" }}>
                  {recordError}
                </p>

              </div>

            ) : selectedPatient && patientRecords ? (

              <div className="history-box">

                <p>
                  <strong>
                    Patient:
                  </strong>{" "}
                  {patientRecords.patient.name}
                </p>

                <p>
                  <strong>
                    Medical History:
                  </strong>{" "}
                  {patientRecords.medical_history ||
                    "No medical history recorded."}
                </p>

                <p>
                  <strong>
                    Latest Symptoms:
                  </strong>{" "}
                  {patientRecords.latest_symptoms ||
                    "No symptoms recorded."}
                </p>

              </div>

            ) : (

              <div className="history-box">

                <p>
                  Select a patient from the
                  Patient List.

                </p>

              </div>

            )}

          </div>


          {/* =========================================
              DISEASE PREDICTION
          ========================================= */}

          <div className="card">

            <h3>

              <FaBrain />

              Disease Prediction

            </h3>


            <div className="prediction-box">

              {latestPrediction ? (

                <>

                  <p>
                    <strong>
                      Predicted Disease:
                    </strong>{" "}
                    {latestPrediction.predicted_disease}
                  </p>

                 

                  <p>
                    <strong>
                      Date:
                    </strong>{" "}
                    {formatDateTime(
                      latestPrediction.created_at
                    )}
                  </p>

                </>

              ) : (

                <p>
                  Select a patient to view
                  prediction results.
                </p>

              )}

            </div>

          </div>


          {/* =========================================
              RISK ASSESSMENT
          ========================================= */}

          <div className="card">

            <h3>

              <FaExclamationTriangle />

              Risk Assessment

            </h3>


            <div className="risk-box">

              {latestPrediction ? (

                <>

                  <p>
                    <strong>
                      Risk Level:
                    </strong>{" "}
                    {latestPrediction.risk_level ||
                      "Not available"}
                  </p>

                  <p>
                    <strong>
                      Priority:
                    </strong>{" "}
                    AI Prediction
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    Review recommended
                  </p>

                </>

              ) : (

                <p>
                  Select a patient to view
                  risk information.
                </p>

              )}

            </div>

          </div>


          {/* =========================================
              RECOMMENDATIONS
          ========================================= */}

          <div className="card">

            <h3>

              <FaLightbulb />

              Recommendations

            </h3>


            <div className="recommendation-box">

              {latestPrediction ? (

                <p>
                  {latestPrediction.recommendation ||
                    "No recommendation available."}
                </p>

              ) : (

                <>

                  <p>
                    ✔ Select a patient
                  </p>

                  <p>
                    ✔ Review their medical history
                  </p>

                  <p>
                    ✔ Review their AI predictions
                  </p>

                </>

              )}

            </div>

          </div>


          {/* =========================================
              REPORTS & ANALYTICS
          ========================================= */}

          <div className="card">

            <h3>

              <FaChartLine />

              Reports & Analytics

            </h3>


            <div className="analytics-box">

              <p>
                <strong>
                  Total Patients:
                </strong>{" "}
                {patients.length}
              </p>

              <p>
                <strong>
                  Selected Patient:
                </strong>{" "}
                {selectedPatient
                  ? selectedPatient.name
                  : "None"}
              </p>

              <p>
                <strong>
                  Total Predictions:
                </strong>{" "}
                {predictions.length}
              </p>

              <p>
                <strong>
                  Latest Prediction:
                </strong>{" "}
                {latestPrediction
                  ? latestPrediction.predicted_disease
                  : "None"}

              </p>

            </div>

          </div>


        </div>

      </main>

    </div>

  );

}

export default DoctorDashboard;