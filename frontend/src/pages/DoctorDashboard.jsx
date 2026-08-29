
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
  FaSyncAlt,
  FaFileMedical,
  FaNotesMedical
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
  // MILESTONE 3 - ANALYTICS STATES
  // =========================================

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  const [healthTrends, setHealthTrends] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  const [predictionReport, setPredictionReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

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
    setHealthTrends(null);
    setPredictionReport(null);

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/patient-records/${patient.patient_id}`
      );

      if (!response.ok) {
        throw new Error("Unable to load patient records.");
      }

      const data = await response.json();

      setPatientRecords(data);

      // Load health trends for the selected patient
      loadHealthTrends(patient.user_id);

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
  // LOAD ANALYTICS
  // =========================================

  const loadAnalytics = async () => {

    setAnalyticsLoading(true);
    setAnalyticsError("");

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/analytics"
      );

      if (!response.ok) {
        throw new Error("Unable to load analytics.");
      }

      const data = await response.json();

      setAnalytics(data);

    } catch (error) {

      console.error("Analytics loading error:", error);

      setAnalyticsError(
        "Unable to load healthcare analytics."
      );

    } finally {

      setAnalyticsLoading(false);

    }
  };

  // =========================================
  // LOAD HEALTH TRENDS
  // =========================================

  const loadHealthTrends = async (userId) => {

    if (!userId) {
      return;
    }

    setTrendLoading(true);

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/health-trends/${userId}`
      );

      if (!response.ok) {
        throw new Error("Unable to load health trends.");
      }

      const data = await response.json();

      setHealthTrends(data);

    } catch (error) {

      console.error("Health trends error:", error);

      setHealthTrends(null);

    } finally {

      setTrendLoading(false);

    }
  };

  // =========================================
  // LOAD PREDICTION REPORT
  // =========================================

  const loadPredictionReport = async (predictionId) => {

    if (!predictionId) {
      return;
    }

    setReportLoading(true);
    setPredictionReport(null);

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/prediction-report/${predictionId}`
      );

      if (!response.ok) {
        throw new Error("Unable to load prediction report.");
      }

      const data = await response.json();

      setPredictionReport(data.report);

    } catch (error) {

      console.error("Prediction report error:", error);

      setPredictionReport(null);

    } finally {

      setReportLoading(false);

    }
  };

  // =========================================
  // LOAD DATA WHEN PAGE OPENS
  // =========================================

  useEffect(() => {

    loadPatients();
    loadAnalytics();

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
  // RISK DISPLAY HELPER
  // =========================================

  const getRiskStyle = (risk) => {

    const value = String(risk || "").toLowerCase();

    if (value.includes("high")) {

      return {
        background: "#fee2e2",
        color: "#b91c1c"
      };

    }

    if (value.includes("moderate")) {

      return {
        background: "#fef3c7",
        color: "#92400e"
      };

    }

    if (value.includes("low")) {

      return {
        background: "#dcfce7",
        color: "#166534"
      };

    }

    return {
      background: "#e0e7ff",
      color: "#3730a3"
    };
  };

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
              {analytics
                ? analytics.total_patients
                : patients.length}
            </h2>

          </div>


          <div className="summary-card">

            <h4>
              High Risk Cases
            </h4>

            <h2>
              {analytics
                ? analytics.high_risk_cases
                : 0}
            </h2>

          </div>


          <div className="summary-card">

            <h4>
              Total Predictions
            </h4>

            <h2>
              {analytics
                ? analytics.total_predictions
                : 0}
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
                onClick={() => {
                  loadPatients();
                  loadAnalytics();
                }}
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
                      Confidence:
                    </strong>{" "}
                    {Number(
                      latestPrediction.confidence || 0
                    ).toFixed(2)}
                    %
                  </p>

                  <p>
                    <strong>
                      Date:
                    </strong>{" "}
                    {formatDateTime(
                      latestPrediction.created_at
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      loadPredictionReport(
                        latestPrediction.id
                      )
                    }
                    disabled={reportLoading}
                    style={{
                      marginTop: "10px",
                      border: "none",
                      background: "#2563eb",
                      color: "white",
                      padding: "9px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >

                    <FaFileMedical />

                    {" "}

                    {reportLoading
                      ? "Loading Report..."
                      : "View Prediction Report"}

                  </button>

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

                    <span
                      style={{
                        ...getRiskStyle(
                          latestPrediction.risk_level
                        ),
                        padding: "5px 10px",
                        borderRadius: "15px",
                        fontWeight: "700"
                      }}
                    >
                      {latestPrediction.risk_level ||
                        "Needs Review"}
                    </span>
                  </p>

                  <p>
                    <strong>
                      Confidence:
                    </strong>{" "}
                    {Number(
                      latestPrediction.confidence || 0
                    ).toFixed(2)}
                    %
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
              TREATMENT & ADVISORY
          ========================================= */}

          <div className="card">

            <h3>

              <FaNotesMedical />

              Treatment & Advisory

            </h3>


            <div className="analytics-box">

              {predictionReport ? (

                <>

                  <p>
                    <strong>
                      Treatment Suggestion:
                    </strong>
                  </p>

                  <p>
                    {predictionReport.treatment ||
                      "No treatment suggestion available."}
                  </p>

                  <p>
                    <strong>
                      Advisory:
                    </strong>
                  </p>

                  <p>
                    {predictionReport.advisory ||
                      "No advisory available."}
                  </p>

                </>

              ) : latestPrediction ? (

                <p>
                  Click <strong>View Prediction Report</strong>
                  {" "}
                  to see treatment suggestions and
                  advisory information.
                </p>

              ) : (

                <p>
                  Treatment and advisory information
                  will appear after selecting a patient
                  with a prediction.
                </p>

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

              {analyticsLoading ? (

                <p>
                  Loading analytics...
                </p>

              ) : analyticsError ? (

                <p style={{ color: "#dc2626" }}>
                  {analyticsError}
                </p>

              ) : analytics ? (

                <>

                  <p>
                    <strong>
                      Total Patients:
                    </strong>{" "}
                    {analytics.total_patients}
                  </p>

                  <p>
                    <strong>
                      Total Predictions:
                    </strong>{" "}
                    {analytics.total_predictions}
                  </p>

                  <p>
                    <strong>
                      High Risk Cases:
                    </strong>{" "}
                    {analytics.high_risk_cases}
                  </p>

                  <p>
                    <strong>
                      Average Confidence:
                    </strong>{" "}
                    {analytics.average_confidence}%
                  </p>

                  <button
                    type="button"
                    onClick={loadAnalytics}
                    style={{
                      marginTop: "8px",
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

                    Refresh Analytics

                  </button>

                </>

              ) : (

                <p>
                  Analytics unavailable.
                </p>

              )}

            </div>

          </div>


          {/* =========================================
              HEALTHCARE ANALYTICS DASHBOARD
          ========================================= */}

          <div
            className="card"
            style={{
              gridColumn: "1 / -1"
            }}
          >

            <h3>

              <FaChartLine />

              Healthcare Analytics Dashboard

            </h3>


            {analyticsLoading ? (

              <p>
                Loading healthcare analytics...
              </p>

            ) : analytics ? (

              <>

                {/* ANALYTICS SUMMARY */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "15px",
                    marginTop: "15px"
                  }}
                >

                  <div
                    style={{
                      padding: "15px",
                      background: "#eff6ff",
                      borderRadius: "10px"
                    }}
                  >

                    <strong>
                      Total Patients
                    </strong>

                    <h2>
                      {analytics.total_patients}
                    </h2>

                  </div>

                  <div
                    style={{
                      padding: "15px",
                      background: "#f0fdf4",
                      borderRadius: "10px"
                    }}
                  >

                    <strong>
                      Total Predictions
                    </strong>

                    <h2>
                      {analytics.total_predictions}
                    </h2>

                  </div>

                  <div
                    style={{
                      padding: "15px",
                      background: "#fef2f2",
                      borderRadius: "10px"
                    }}
                  >

                    <strong>
                      High Risk
                    </strong>

                    <h2>
                      {analytics.high_risk_cases}
                    </h2>

                  </div>

                  <div
                    style={{
                      padding: "15px",
                      background: "#fefce8",
                      borderRadius: "10px"
                    }}
                  >

                    <strong>
                      Avg. Confidence
                    </strong>

                    <h2>
                      {analytics.average_confidence}%
                    </h2>

                  </div>

                </div>


                {/* RISK DISTRIBUTION */}

                <div
                  style={{
                    marginTop: "25px"
                  }}
                >

                  <h4>
                    Risk Distribution
                  </h4>

                  {[
                    {
                      name: "High Risk",
                      value:
                        analytics.risk_distribution?.high || 0
                    },
                    {
                      name: "Moderate Risk",
                      value:
                        analytics.risk_distribution?.moderate || 0
                    },
                    {
                      name: "Low Risk",
                      value:
                        analytics.risk_distribution?.low || 0
                    },
                    {
                      name: "Needs Review",
                      value:
                        analytics.risk_distribution
                          ?.needs_review || 0
                    }
                  ].map((item) => {

                    const total =
                      analytics.total_predictions || 1;

                    const percentage =
                      (item.value / total) * 100;

                    return (

                      <div
                        key={item.name}
                        style={{
                          marginBottom: "12px"
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            marginBottom: "4px"
                          }}
                        >

                          <span>
                            {item.name}
                          </span>

                          <strong>
                            {item.value}
                          </strong>

                        </div>

                        <div
                          style={{
                            height: "10px",
                            background: "#e5e7eb",
                            borderRadius: "10px",
                            overflow: "hidden"
                          }}
                        >

                          <div
                            style={{
                              width: `${percentage}%`,
                              height: "100%",
                              background: "#2563eb",
                              borderRadius: "10px"
                            }}
                          />

                        </div>

                      </div>

                    );

                  })}

                </div>


                {/* DISEASE DISTRIBUTION */}

                <div
                  style={{
                    marginTop: "25px"
                  }}
                >

                  <h4>
                    Disease Distribution
                  </h4>

                  {analytics.disease_distribution?.length >
                  0 ? (

                    analytics.disease_distribution.map(
                      (item) => {

                        const maxCount =
                          Math.max(
                            ...analytics.disease_distribution.map(
                              (disease) =>
                                disease.count
                            )
                          );

                        const width =
                          maxCount > 0
                            ? (item.count / maxCount) *
                              100
                            : 0;

                        return (

                          <div
                            key={item.disease}
                            style={{
                              marginBottom: "12px"
                            }}
                          >

                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                marginBottom: "4px"
                              }}
                            >

                              <span>
                                {item.disease}
                              </span>

                              <strong>
                                {item.count}
                              </strong>

                            </div>

                            <div
                              style={{
                                height: "10px",
                                background: "#e5e7eb",
                                borderRadius: "10px"
                              }}
                            >

                              <div
                                style={{
                                  width: `${width}%`,
                                  height: "100%",
                                  background: "#16a34a",
                                  borderRadius: "10px"
                                }}
                              />

                            </div>

                          </div>

                        );

                      }
                    )

                  ) : (

                    <p>
                      No disease prediction data
                      available yet.
                    </p>

                  )}

                </div>


                {/* RECENT PREDICTIONS */}

                <div
                  style={{
                    marginTop: "25px",
                    overflowX: "auto"
                  }}
                >

                  <h4>
                    Recent Predictions
                  </h4>

                  {analytics.recent_predictions?.length >
                  0 ? (

                    <table>

                      <thead>

                        <tr>

                          <th>
                            Patient
                          </th>

                          <th>
                            Disease
                          </th>

                          <th>
                            Confidence
                          </th>

                          <th>
                            Risk
                          </th>

                          <th>
                            Date
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {analytics.recent_predictions.map(
                          (item) => (

                            <tr key={item.id}>

                              <td>
                                {item.patient_name}
                              </td>

                              <td>
                                {item.disease}
                              </td>

                              <td>
                                {Number(
                                  item.confidence || 0
                                ).toFixed(2)}
                                %
                              </td>

                              <td>

                                <span
                                  style={{
                                    ...getRiskStyle(
                                      item.risk_level
                                    ),
                                    padding:
                                      "4px 8px",
                                    borderRadius:
                                      "12px",
                                    fontWeight:
                                      "600"
                                  }}
                                >
                                  {item.risk_level ||
                                    "Needs Review"}
                                </span>

                              </td>

                              <td>
                                {formatDateTime(
                                  item.created_at
                                )}
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  ) : (

                    <p>
                      No recent predictions available.
                    </p>

                  )}

                </div>

              </>

            ) : (

              <p>
                Analytics data is unavailable.
              </p>

            )}

          </div>


          {/* =========================================
              HEALTH TREND VISUALIZATION
          ========================================= */}

          <div
            className="card"
            style={{
              gridColumn: "1 / -1"
            }}
          >

            <h3>

              <FaChartLine />

              Health Trend Visualization

            </h3>


            {!selectedPatient ? (

              <div className="analytics-box">

                <p>
                  Select a patient from the Patient List
                  to view their health trends.
                </p>

              </div>

            ) : trendLoading ? (

              <div className="analytics-box">

                <p>
                  Loading health trends...
                </p>

              </div>

            ) : healthTrends &&
              healthTrends.trends?.length > 0 ? (

              <>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "15px",
                    marginTop: "15px"
                  }}
                >

                  <div
                    style={{
                      padding: "15px",
                      background: "#eff6ff",
                      borderRadius: "10px"
                    }}
                  >

                    <strong>
                      Total Predictions
                    </strong>

                    <h2>
                      {healthTrends.total_predictions}
                    </h2>

                  </div>

                  <div
                    style={{
                      padding: "15px",
                      background: "#f0fdf4",
                      borderRadius: "10px"
                    }}
                  >

                    <strong>
                      Average Confidence
                    </strong>

                    <h2>
                      {healthTrends.average_confidence}%
                    </h2>

                  </div>

                  <div
                    style={{
                      padding: "15px",
                      background: "#faf5ff",
                      borderRadius: "10px"
                    }}
                  >

                    <strong>
                      Latest Disease
                    </strong>

                    <h3>
                      {healthTrends.latest_prediction?.disease ||
                        "None"}
                    </h3>

                  </div>

                </div>


                {/* TREND CHART */}

                <div
                  style={{
                    marginTop: "25px",
                    overflowX: "auto"
                  }}
                >

                  <h4>
                    Prediction Confidence Trend
                  </h4>

                  <div
                    style={{
                      minWidth: "500px",
                      height: "240px",
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "12px",
                      padding:
                        "20px 10px 10px",
                      borderBottom:
                        "2px solid #d1d5db"
                    }}
                  >

                    {healthTrends.trends.map(
                      (trend, index) => {

                        const confidence =
                          Math.max(
                            0,
                            Math.min(
                              100,
                              Number(
                                trend.confidence || 0
                              )
                            )
                          );

                        return (

                          <div
                            key={
                              trend.id || index
                            }
                            style={{
                              flex: "1",
                              minWidth: "45px",
                              height: "100%",
                              display: "flex",
                              flexDirection:
                                "column",
                              justifyContent:
                                "flex-end",
                              alignItems:
                                "center"
                            }}
                          >

                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                marginBottom: "4px"
                              }}
                            >
                              {confidence.toFixed(1)}%
                            </span>

                            <div
                              title={`${trend.disease} - ${confidence.toFixed(
                                2
                              )}%`}
                              style={{
                                width: "70%",
                                height: `${Math.max(
                                  confidence,
                                  3
                                )}%`,
                                background:
                                  "#2563eb",
                                borderRadius:
                                  "6px 6px 0 0",
                                minHeight: "8px"
                              }}
                            />

                            <span
                              style={{
                                fontSize: "10px",
                                marginTop: "5px",
                                whiteSpace:
                                  "nowrap"
                              }}
                            >
                              {formatDateTime(
                                trend.date
                              ).split(",")[0]}
                            </span>

                          </div>

                        );

                      }
                    )}

                  </div>

                </div>


                {/* TREND TABLE */}

                <div
                  style={{
                    marginTop: "25px",
                    overflowX: "auto"
                  }}
                >

                  <h4>
                    Health Prediction History
                  </h4>

                  <table>

                    <thead>

                      <tr>

                        <th>
                          Date
                        </th>

                        <th>
                          Disease
                        </th>

                        <th>
                          Confidence
                        </th>

                        <th>
                          Risk Level
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {healthTrends.trends
                        .slice()
                        .reverse()
                        .map((trend) => (

                          <tr key={trend.id}>

                            <td>
                              {formatDateTime(
                                trend.date
                              )}
                            </td>

                            <td>
                              {trend.disease}
                            </td>

                            <td>
                              {Number(
                                trend.confidence || 0
                              ).toFixed(2)}
                              %
                            </td>

                            <td>

                              <span
                                style={{
                                  ...getRiskStyle(
                                    trend.risk_level
                                  ),
                                  padding:
                                    "4px 8px",
                                  borderRadius:
                                    "12px",
                                  fontWeight:
                                    "600"
                                }}
                              >
                                {trend.risk_level ||
                                  "Needs Review"}
                              </span>

                            </td>

                          </tr>

                        ))}

                    </tbody>

                  </table>

                </div>

              </>

            ) : (

              <div className="analytics-box">

                <p>
                  No health prediction history is
                  available for this patient yet.
                </p>

              </div>

            )}

          </div>


          {/* =========================================
              DISEASE PREDICTION REPORT
          ========================================= */}

          {predictionReport && (

            <div
              className="card"
              style={{
                gridColumn: "1 / -1"
              }}
            >

              <h3>

                <FaFileMedical />

                Disease Prediction Report

              </h3>


              <div className="analytics-box">

                <h4>
                  Patient Information
                </h4>

                <p>
                  <strong>
                    Name:
                  </strong>{" "}
                  {predictionReport.patient?.name}
                </p>

                <p>
                  <strong>
                    Email:
                  </strong>{" "}
                  {predictionReport.patient?.email ||
                    "Not available"}
                </p>

                <p>
                  <strong>
                    Age:
                  </strong>{" "}
                  {predictionReport.patient?.age ??
                    "Not provided"}
                </p>

                <p>
                  <strong>
                    Gender:
                  </strong>{" "}
                  {predictionReport.patient?.gender ||
                    "Not provided"}
                </p>


                <hr />


                <h4>
                  Clinical Information
                </h4>

                <p>
                  <strong>
                    Symptoms:
                  </strong>{" "}
                  {predictionReport
                    .clinical_information
                    ?.symptoms ||
                    "No symptoms recorded."}
                </p>

                <p>
                  <strong>
                    Medical History:
                  </strong>{" "}
                  {predictionReport
                    .clinical_information
                    ?.medical_history ||
                    "No medical history recorded."}
                </p>


                <hr />


                <h4>
                  AI Prediction
                </h4>

                <p>
                  <strong>
                    Predicted Disease:
                  </strong>{" "}
                  {predictionReport.prediction?.disease}
                </p>

                <p>
                  <strong>
                    Confidence:
                  </strong>{" "}
                  {Number(
                    predictionReport.prediction
                      ?.confidence || 0
                  ).toFixed(2)}
                  %
                </p>

                <p>
                  <strong>
                    Risk Level:
                  </strong>{" "}

                  <span
                    style={{
                      ...getRiskStyle(
                        predictionReport.prediction
                          ?.risk_level
                      ),
                      padding: "5px 10px",
                      borderRadius: "15px",
                      fontWeight: "700"
                    }}
                  >
                    {predictionReport.prediction
                      ?.risk_level ||
                      "Needs Review"}
                  </span>

                </p>


                <hr />


                <h4>
                  Treatment Suggestions
                </h4>

                <p>
                  {predictionReport.treatment ||
                    "No treatment suggestion available."}
                </p>


                <h4>
                  Advisory
                </h4>

                <p>
                  {predictionReport.advisory ||
                    "No advisory available."}
                </p>


                <h4>
                  Recommendation
                </h4>

                <p>
                  {predictionReport.recommendation ||
                    "No recommendation available."}
                </p>


                <div
                  style={{
                    marginTop: "15px",
                    padding: "12px",
                    background: "#fff7ed",
                    borderRadius: "8px",
                    color: "#9a3412"
                  }}
                >

                  <strong>
                    Medical Disclaimer:
                  </strong>

                  <p>
                    {predictionReport.disclaimer}
                  </p>

                </div>

              </div>

            </div>

          )}

        </div>

      </main>

    </div>

  );

}

export default DoctorDashboard;

