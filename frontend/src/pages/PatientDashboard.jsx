import "../styles/PatientDashboard.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FaHome,
  FaFileMedical,
  FaUser,
  FaSignOutAlt,
  FaHeartbeat,
  FaNotesMedical,
  FaLightbulb,
  FaFileAlt,
  FaSearch,
  FaHistory,
  FaTrash,
  FaEye,
  FaDownload,
  FaTimes,
  FaExclamationTriangle,
  FaStethoscope,
  FaClipboardCheck
} from "react-icons/fa";

function PatientDashboard() {

  const navigate = useNavigate();

  const userName = localStorage.getItem("name") || "Patient";
  const userRole = localStorage.getItem("role") || "patient";
  const userId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("email") || "";

  // =========================================
  // SYMPTOMS / PREDICTION
  // =========================================

  const [symptoms, setSymptoms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);

  // =========================================
  // REPORT
  // =========================================

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // =========================================
  // MEDICAL HISTORY
  // =========================================

  const [medicalHistory, setMedicalHistory] = useState("");

  // =========================================
  // PATIENT PROFILE
  // =========================================

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  // =========================================
  // LOADING STATES
  // =========================================

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [medicalHistoryLoading, setMedicalHistoryLoading] =
    useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // =========================================
  // ALL MODEL SYMPTOMS
  // =========================================

  const symptomList = [
    "itching",
    "skin_rash",
    "nodal_skin_eruptions",
    "continuous_sneezing",
    "shivering",
    "chills",
    "joint_pain",
    "stomach_pain",
    "acidity",
    "ulcers_on_tongue",
    "muscle_wasting",
    "vomiting",
    "burning_micturition",
    "spotting_urination",
    "fatigue",
    "weight_gain",
    "anxiety",
    "cold_hands_and_feets",
    "mood_swings",
    "weight_loss",
    "restlessness",
    "lethargy",
    "patches_in_throat",
    "irregular_sugar_level",
    "cough",
    "high_fever",
    "sunken_eyes",
    "breathlessness",
    "sweating",
    "dehydration",
    "indigestion",
    "headache",
    "yellowish_skin",
    "dark_urine",
    "nausea",
    "loss_of_appetite",
    "pain_behind_the_eyes",
    "back_pain",
    "constipation",
    "abdominal_pain",
    "diarrhoea",
    "mild_fever",
    "yellow_urine",
    "yellowing_of_eyes",
    "acute_liver_failure",
    "fluid_overload",
    "swelling_of_stomach",
    "swelled_lymph_nodes",
    "malaise",
    "blurred_and_distorted_vision",
    "phlegm",
    "throat_irritation",
    "redness_of_eyes",
    "sinus_pressure",
    "runny_nose",
    "congestion",
    "chest_pain",
    "weakness_in_limbs",
    "fast_heart_rate",
    "pain_during_bowel_movements",
    "pain_in_anal_region",
    "bloody_stool",
    "irritation_in_anus",
    "neck_pain",
    "dizziness",
    "cramps",
    "bruising",
    "obesity",
    "swollen_legs",
    "swollen_blood_vessels",
    "puffy_face_and_eyes",
    "enlarged_thyroid",
    "brittle_nails",
    "swollen_extremeties",
    "excessive_hunger",
    "extra_marital_contacts",
    "drying_and_tingling_lips",
    "slurred_speech",
    "knee_pain",
    "hip_joint_pain",
    "muscle_weakness",
    "stiff_neck",
    "swelling_joints",
    "movement_stiffness",
    "spinning_movements",
    "loss_of_balance",
    "unsteadiness",
    "weakness_of_one_body_side",
    "loss_of_smell",
    "bladder_discomfort",
    "foul_smell_of urine",
    "continuous_feel_of_urine",
    "passage_of_gases",
    "internal_itching",
    "toxic_look_(typhos)",
    "depression",
    "irritability",
    "muscle_pain",
    "altered_sensorium",
    "red_spots_over_body",
    "belly_pain",
    "abnormal_menstruation",
    "dischromic _patches",
    "watering_from_eyes",
    "increased_appetite",
    "polyuria",
    "family_history",
    "mucoid_sputum",
    "rusty_sputum",
    "lack_of_concentration",
    "visual_disturbances",
    "receiving_blood_transfusion",
    "receiving_unsterile_injections",
    "coma",
    "stomach_bleeding",
    "distention_of_abdomen",
    "history_of_alcohol_consumption",
    "fluid_overload.1",
    "blood_in_sputum",
    "prominent_veins_on_calf",
    "palpitations",
    "painful_walking",
    "pus_filled_pimples",
    "blackheads",
    "scurring",
    "skin_peeling",
    "silver_like_dusting",
    "small_dents_in_nails",
    "inflammatory_nails",
    "blister",
    "red_sore_around_nose",
    "yellow_crust_ooze"
  ];

  // =========================================
  // LOAD HISTORY
  // =========================================

  const loadHistory = async () => {

    if (!userId) return;

    setHistoryLoading(true);

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/prediction-history/${userId}`
      );

      if (!response.ok) {
        throw new Error("Unable to load prediction history.");
      }

      const data = await response.json();

      setHistory(data.history || []);

    } catch (error) {

      console.error("History error:", error);

    } finally {

      setHistoryLoading(false);

    }
  };

  // =========================================
  // LOAD REPORT
  // =========================================

  const loadReport = async (predictionId) => {

    setReportLoading(true);
    setShowReport(true);
    setReport(null);

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/prediction-report/${predictionId}`
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail || "Unable to load report."
        );

      }

      setReport(data.report);

    } catch (error) {

      console.error("Report error:", error);

      alert(
        error.message ||
        "Unable to load medical report."
      );

      setShowReport(false);

    } finally {

      setReportLoading(false);

    }
  };

  // =========================================
  // CLOSE REPORT
  // =========================================

  const closeReport = () => {

    setShowReport(false);
    setReport(null);

  };

  // =========================================
  // PRINT / SAVE PDF
  // =========================================

  const handleDownloadPDF = () => {

    window.print();

  };

  // =========================================
  // DELETE PREDICTION
  // =========================================

  const handleDeletePrediction = async (predictionId) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this prediction?"
    );

    if (!confirmed) return;

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/prediction-history/${predictionId}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail || "Unable to delete prediction."
        );

      }

      alert("Prediction deleted successfully.");

      await loadHistory();

      if (
        report?.report_id === predictionId
      ) {
        closeReport();
      }

    } catch (error) {

      console.error(
        "Delete prediction error:",
        error
      );

      alert(
        error.message ||
        "Unable to delete prediction."
      );

    }

  };

  // =========================================
  // LOAD MEDICAL HISTORY
  // =========================================

  const loadMedicalHistory = async () => {

    if (!userId) return;

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/medical-history/${userId}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load medical history."
        );
      }

      const data = await response.json();

      setMedicalHistory(
        data.medical_history || ""
      );

    } catch (error) {

      console.error(
        "Medical history error:",
        error
      );

    }

  };

  // =========================================
  // LOAD PATIENT PROFILE
  // =========================================

  const loadPatientProfile = async () => {

    if (!userId) return;

    setProfileLoading(true);

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/patient-profile/${userId}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load patient profile."
        );
      }

      const data = await response.json();

      const profile = data.profile || {};

      setAge(
        profile.age !== null &&
        profile.age !== undefined
          ? String(profile.age)
          : ""
      );

      setGender(profile.gender || "");
      setBloodGroup(
        profile.blood_group || ""
      );

    } catch (error) {

      console.error(
        "Patient profile error:",
        error
      );

    } finally {

      setProfileLoading(false);

    }

  };

  // =========================================
  // LOAD DATA
  // =========================================

  useEffect(() => {

    loadHistory();
    loadMedicalHistory();
    loadPatientProfile();

  }, [userId]);

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {

    localStorage.clear();

    navigate("/");

  };

  // =========================================
  // PROFILE NAVIGATION
  // =========================================

  const handleProfileClick = () => {

    const profileSection =
      document.getElementById(
        "patient-profile"
      );

    if (profileSection) {

      profileSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  };

  // =========================================
  // SYMPTOM SELECTION
  // =========================================

  const handleSymptomChange = (symptom) => {

    if (symptoms.includes(symptom)) {

      setSymptoms(
        symptoms.filter(
          (item) => item !== symptom
        )
      );

    } else {

      setSymptoms([
        ...symptoms,
        symptom
      ]);

    }

  };

  // =========================================
  // SEARCH
  // =========================================

  const filteredSymptoms =
    symptomList.filter((symptom) =>
      symptom
        .replaceAll("_", " ")
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
    );


// =========================================
// PREDICTION
// =========================================

const handlePrediction = async () => {

  if (symptoms.length === 0) {

    alert(
      "Please select at least one symptom."
    );

    return;

  }

  if (!userId) {

    alert(
      "User session not found. Please login again."
    );

    navigate("/login");

    return;

  }

  setLoading(true);
  setPrediction(null);

  try {

    const response = await fetch(
      "http://127.0.0.1:8000/predict-disease",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          user_id: Number(userId),
          symptoms: symptoms
        })

      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.detail || "Prediction failed."
      );

    }

    // =========================================
    // SHOW CURRENT PREDICTION
    // =========================================

    setPrediction(data);

    // =========================================
    // IMMEDIATELY UPDATE LATEST REPORT
    // =========================================

    const newHistoryItem = {
      id: data.prediction_id,
      predicted_disease: data.predicted_disease,
      confidence: data.confidence,
      risk_level: data.risk_level,
      created_at: data.created_at,
      recommendation: data.recommendation,
      treatment: data.treatment,
      advisory: data.advisory
    };

    setHistory((previousHistory) => [

      newHistoryItem,

      ...previousHistory.filter(
        (item) =>
          item.id !== data.prediction_id
      )

    ]);

    // =========================================
    // REFRESH HISTORY FROM DATABASE
    // =========================================

    await loadHistory();

  } catch (error) {

    console.error(
      "Prediction error:",
      error
    );

    alert(
      error.message ||
      "Unable to connect to the disease prediction server."
    );

  } finally {

    setLoading(false);

  }

};



  // =========================================
  // SAVE MEDICAL HISTORY
  // =========================================

  const handleSaveMedicalHistory = async () => {

    if (!userId) {

      alert(
        "User session not found. Please login again."
      );

      navigate("/login");

      return;

    }

    if (!medicalHistory.trim()) {

      alert(
        "Please enter your medical history."
      );

      return;

    }

    setMedicalHistoryLoading(true);

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/medical-history",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            user_id: Number(userId),
            medical_history:
              medicalHistory
          })

        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to save medical history."
        );

      }

      alert(
        "Medical history saved successfully."
      );

      await loadMedicalHistory();

    } catch (error) {

      console.error(
        "Save medical history error:",
        error
      );

      alert(
        error.message ||
        "Unable to save medical history."
      );

    } finally {

      setMedicalHistoryLoading(false);

    }

  };

  // =========================================
  // SAVE PROFILE
  // =========================================

  const handleSaveProfile = async () => {

    if (!userId) {

      alert(
        "User session not found. Please login again."
      );

      navigate("/login");

      return;

    }

    if (!age || Number(age) <= 0) {

      alert(
        "Please enter a valid age."
      );

      return;

    }

    if (!gender) {

      alert(
        "Please select your gender."
      );

      return;

    }

    if (!bloodGroup) {

      alert(
        "Please select your blood group."
      );

      return;

    }

    setProfileSaving(true);

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/patient-profile",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            user_id: Number(userId),
            age: Number(age),
            gender: gender,
            blood_group: bloodGroup
          })

        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to save patient profile."
        );

      }

      setAge(
        data.patient?.age !== undefined
          ? String(data.patient.age)
          : age
      );

      setGender(
        data.patient?.gender || gender
      );

      setBloodGroup(
        data.patient?.blood_group ||
        bloodGroup
      );

      alert(
        "Patient profile saved successfully."
      );

    } catch (error) {

      console.error(
        "Save profile error:",
        error
      );

      alert(
        error.message ||
        "Unable to save patient profile."
      );

    } finally {

      setProfileSaving(false);

    }

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

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  };

  // =========================================
  // FORMAT SYMPTOM
  // =========================================

  const formatSymptom = (symptom) => {

    return symptom
      .replaceAll("_", " ")
      .replace(/\s+/g, " ")
      .trim();

  };

  // =========================================
  // GET LATEST HISTORY
  // =========================================

  const latestHistory =
    history.length > 0
      ? history[0]
      : null;

  return (

    <div className="patient-container">

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
            {userName
              .charAt(0)
              .toUpperCase()}
          </div>

          <h3>
            {userName}
          </h3>

          <p>
            {userRole === "doctor"
              ? "Healthcare Provider"
              : "Patient Portal"}
          </p>

        </div>

        <ul>

          <li className="active">
            <FaHome />
            Dashboard
          </li>

          <li>
            <FaNotesMedical />
            Symptoms
          </li>

          <li>
            <FaFileMedical />
            Reports
          </li>

          <li onClick={handleProfileClick}>
            <FaUser />
            Profile
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

      <main className="content">

        <div className="dashboard-header">

          <h1>
            Good Afternoon, {userName} 👋
          </h1>

          <p>
            Welcome back! Manage your health records
            and monitor your symptoms.
          </p>

        </div>


        <div className="dashboard-grid">


          {/* =========================================
              SYMPTOMS
          ========================================= */}

          <div className="card">

            <h3>
              <FaNotesMedical />
              Select Symptoms
            </h3>

            <p className="symptom-description">
              Select all symptoms that you are experiencing.
            </p>

            <div className="symptom-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Search symptoms..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />

            </div>

            <div className="symptom-count">

              <span>
                {symptoms.length} symptom
                {symptoms.length !== 1
                  ? "s"
                  : ""} selected
              </span>

              {symptoms.length > 0 && (

                <button
                  type="button"
                  onClick={() =>
                    setSymptoms([])
                  }
                >
                  Clear All
                </button>

              )}

            </div>

            <div className="symptom-list">

              {filteredSymptoms.length > 0 ? (

                filteredSymptoms.map(
                  (symptom) => (

                    <label
                      key={symptom}
                      className="symptom-option"
                    >

                      <input
                        type="checkbox"
                        checked={symptoms.includes(
                          symptom
                        )}
                        onChange={() =>
                          handleSymptomChange(
                            symptom
                          )
                        }
                      />

                      <span>
                        {formatSymptom(
                          symptom
                        )}
                      </span>

                    </label>

                  )
                )

              ) : (

                <div className="no-symptoms">
                  No symptoms found.
                </div>

              )}

            </div>

            <button
              className="primary-btn"
              onClick={handlePrediction}
              disabled={loading}
            >
              {loading
                ? "Analyzing Symptoms..."
                : "Predict Disease"}
            </button>

          </div>


          {/* =========================================
              CURRENT PREDICTION
          ========================================= */}

          <div className="card">

            <h3>
              <FaHeartbeat />
              Disease Prediction
            </h3>

            {prediction ? (

              <div className="prediction-result">

                <div className="prediction-disease-label">
                  Predicted Disease
                </div>

                <h2 className="predicted-disease">
                  {prediction.predicted_disease}
                </h2>

                <div className="prediction-info-grid">

                  <div className="prediction-info-item">

                    <span>
                      Confidence
                    </span>

                    <strong>
                      {prediction.confidence}%
                    </strong>

                  </div>

                  <div className="prediction-info-item">

                    <span>
                      Risk Level
                    </span>

                    <strong>
                      {prediction.risk_level ||
                        "Needs Review"}
                    </strong>

                  </div>

                </div>

                <div className="result-section">

                  <h4>
                    <FaLightbulb />
                    Recommendation
                  </h4>

                  <p>
                    {prediction.recommendation ||
                      "No recommendation available."}
                  </p>

                </div>

                <div className="result-section">

                  <h4>
                    <FaStethoscope />
                    Treatment Suggestion
                  </h4>

                  <p>
                    {prediction.treatment ||
                      "Please consult a healthcare professional for appropriate treatment."}
                  </p>

                </div>

                <div className="result-section">

                  <h4>
                    <FaClipboardCheck />
                    Advisory
                  </h4>

                  <p>
                    {prediction.advisory ||
                      "Please monitor your symptoms and seek professional medical advice if they worsen."}
                  </p>

                </div>

                <button
                  type="button"
                  className="view-report-main-btn"
                  onClick={() =>
                    loadReport(
                      prediction.prediction_id
                    )
                  }
                >
                  <FaEye />
                  View Feedback / Full Report
                </button>

              </div>

            ) : (

              <div className="recommendation-box empty-result">

                <FaHeartbeat />

                <p>
                  Select your symptoms and click
                  <strong> Predict Disease </strong>
                  to receive your health assessment.
                </p>

              </div>

            )}

          </div>


          {/* =========================================
              PREDICTION HISTORY
          ========================================= */}

          <div className="card history-card">

            <h3>
              <FaHistory />
              Prediction History
            </h3>

            <p className="symptom-description">
              View your previous disease predictions
              and healthcare feedback.
            </p>

            {historyLoading ? (

              <div className="history-empty">
                Loading prediction history...
              </div>

            ) : history.length === 0 ? (

              <div className="history-empty">

                <FaHistory />

                <p>
                  No previous predictions found.
                </p>

                <span>
                  Your prediction history will appear here.
                </span>

              </div>

            ) : (

              <div className="history-list">

                {history.map(
                  (item, index) => (

                    <div
                      className="history-item"
                      key={item.id}
                    >

                      <div className="history-number">
                        {index + 1}
                      </div>

                      <div className="history-details">

                        <h4>
                          {item.predicted_disease}
                        </h4>

                        <p>
                          <FaFileMedical />
                          Prediction #{item.id}
                        </p>

                        <span>
                          🕒{" "}
                          {formatDateTime(
                            item.created_at
                          )}
                        </span>

                      </div>

                      <div className="history-actions">

                        <button
                          type="button"
                          className="history-view-btn"
                          onClick={() =>
                            loadReport(item.id)
                          }
                          title="View Feedback"
                        >
                          <FaEye />
                        </button>

                        <button
                          type="button"
                          className="delete-history-btn"
                          onClick={() =>
                            handleDeletePrediction(
                              item.id
                            )
                          }
                          title="Delete prediction"
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* =========================================
              MEDICAL HISTORY
          ========================================= */}

          <div className="card">

            <h3>
              <FaFileMedical />
              Medical History
            </h3>

            <textarea
              placeholder="Mention previous diseases, allergies, medications or surgeries..."
              rows="5"
              value={medicalHistory}
              onChange={(e) =>
                setMedicalHistory(
                  e.target.value
                )
              }
            />

            <button
              className="primary-btn"
              onClick={
                handleSaveMedicalHistory
              }
              disabled={
                medicalHistoryLoading
              }
            >
              {medicalHistoryLoading
                ? "Saving..."
                : "Save History"}
            </button>

          </div>


          {/* =========================================
              RECOMMENDATIONS
          ========================================= */}

          <div className="card">

            <h3>
              <FaLightbulb />
              Recommendations
            </h3>

            {prediction ? (

              <div className="recommendation-box">

                <div className="recommendation-heading">
                  Latest Health Recommendation
                </div>

                <p>
                  {prediction.recommendation ||
                    "No recommendation available."}
                </p>

                <div className="recommendation-divider" />

                <div className="recommendation-heading">
                  Advisory
                </div>

                <p>
                  {prediction.advisory ||
                    "No advisory available."}
                </p>

              </div>

            ) : latestHistory ? (

              <div className="recommendation-box">

                <div className="recommendation-heading">
                  Latest Prediction
                </div>

                <p>
                  Your latest prediction is{" "}
                  <strong>
                    {latestHistory.predicted_disease}
                  </strong>.
                </p>

                <p>
                  Click{" "}
                  <strong>
                    View Feedback
                  </strong>{" "}
                  in Prediction History to see
                  the complete recommendation,
                  treatment suggestion and advisory.
                </p>

              </div>

            ) : (

              <div className="recommendation-box empty-recommendation">

                <FaLightbulb />

                <p>
                  Your personalized recommendations
                  will appear here after you complete
                  a disease prediction.
                </p>

              </div>

            )}

          </div>


          {/* =========================================
              LATEST REPORT
          ========================================= */}

          <div className="card">

            <h3>
              <FaFileAlt />
              Latest Report
            </h3>

            {latestHistory ? (

              <div className="report-box">

                <p>
                  <strong>
                    Latest Prediction:
                  </strong>{" "}
                  {latestHistory.predicted_disease}
                </p>

                <p>
                  <strong>
                    Confidence:
                  </strong>{" "}
                  {latestHistory.confidence}%
                </p>

                <p>
                  <strong>
                    Risk Level:
                  </strong>{" "}
                  {latestHistory.risk_level ||
                    "Needs Review"}
                </p>

                <p>
                  <strong>
                    Date & Time:
                  </strong>{" "}
                  {formatDateTime(
                    latestHistory.created_at
                  )}
                </p>

                <button
                  type="button"
                  className="view-report-btn"
                  onClick={() =>
                    loadReport(
                      latestHistory.id
                    )
                  }
                >
                  <FaEye />
                  View Feedback
                </button>

              </div>

            ) : (

              <div className="report-box empty-report">

                <FaFileAlt />

                <p>
                  No report available yet.
                </p>

                <span>
                  Generate a prediction to create
                  your health report.
                </span>

              </div>

            )}

          </div>


          {/* =========================================
              PATIENT PROFILE
          ========================================= */}

          <div
            className="card patient-profile-card"
            id="patient-profile"
          >

            <h3>
              <FaUser />
              Patient Profile
            </h3>

            <p className="symptom-description">
              Keep your basic health information updated.
            </p>

            {profileLoading ? (

              <div className="profile-loading">
                Loading profile...
              </div>

            ) : (

              <>

                <div className="profile-form">

                  <div className="profile-field">

                    <label>
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={userName}
                      disabled
                    />

                  </div>

                  <div className="profile-field">

                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      value={userEmail}
                      disabled
                    />

                  </div>

                  <div className="profile-field">

                    <label>
                      Age
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Enter your age"
                      value={age}
                      onChange={(e) =>
                        setAge(e.target.value)
                      }
                    />

                  </div>

                  <div className="profile-field">

                    <label>
                      Gender
                    </label>

                    <select
                      value={gender}
                      onChange={(e) =>
                        setGender(e.target.value)
                      }
                    >

                      <option value="">
                        Select gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                  <div className="profile-field">

                    <label>
                      Blood Group
                    </label>

                    <select
                      value={bloodGroup}
                      onChange={(e) =>
                        setBloodGroup(
                          e.target.value
                        )
                      }
                    >

                      <option value="">
                        Select blood group
                      </option>

                      <option value="A+">
                        A+
                      </option>

                      <option value="A-">
                        A-
                      </option>

                      <option value="B+">
                        B+
                      </option>

                      <option value="B-">
                        B-
                      </option>

                      <option value="AB+">
                        AB+
                      </option>

                      <option value="AB-">
                        AB-
                      </option>

                      <option value="O+">
                        O+
                      </option>

                      <option value="O-">
                        O-
                      </option>

                    </select>

                  </div>

                </div>

                <button
                  className="primary-btn"
                  onClick={
                    handleSaveProfile
                  }
                  disabled={
                    profileSaving
                  }
                >
                  {profileSaving
                    ? "Saving Profile..."
                    : "Save Profile"}
                </button>

              </>

            )}

          </div>

        </div>

      </main>


      {/* =========================================
          MEDICAL REPORT MODAL
      ========================================= */}

      {showReport && (

        <div
          className="report-modal-overlay"
          onClick={(e) => {

            if (
              e.target.className ===
              "report-modal-overlay"
            ) {
              closeReport();
            }

          }}
        >

          <div className="medical-report-modal">

            <div className="report-modal-header">

              <div>

                <h2>
                  <FaFileMedical />
                  MedAssist AI Medical Report
                </h2>

                <p>
                  Healthcare Assessment Report
                </p>

              </div>

              <button
                type="button"
                className="report-close-btn"
                onClick={closeReport}
                title="Close report"
              >
                <FaTimes />
              </button>

            </div>


            {reportLoading ? (

              <div className="report-loading">

                <FaFileMedical />

                <h3>
                  Preparing your report...
                </h3>

                <p>
                  Please wait while your healthcare
                  assessment is loaded.
                </p>

              </div>

            ) : report ? (

              <>

                <div
                  className="medical-report-print"
                  id="medical-report"
                >

                  <div className="print-report-title">

                    <h1>
                      MedAssist AI
                    </h1>

                    <p>
                      Medical Prediction & Healthcare
                      Recommendation Report
                    </p>

                  </div>


                  {/* PATIENT INFORMATION */}

                  <div className="report-section">

                    <h3>
                      Patient Information
                    </h3>

                    <div className="report-info-grid">

                      <div>
                        <span>
                          Name
                        </span>

                        <strong>
                          {report.patient?.name ||
                            userName}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Email
                        </span>

                        <strong>
                          {report.patient?.email ||
                            userEmail}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Age
                        </span>

                        <strong>
                          {report.patient?.age ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Gender
                        </span>

                        <strong>
                          {report.patient?.gender ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Blood Group
                        </span>

                        <strong>
                          {report.patient?.blood_group ||
                            "Not provided"}
                        </strong>
                      </div>

                    </div>

                  </div>


                  {/* CLINICAL INFORMATION */}

                  <div className="report-section">

                    <h3>
                      Clinical Information
                    </h3>

                    <div className="report-text-box">

                      <p>
                        <strong>
                          Symptoms:
                        </strong>
                      </p>

                      <p>
                        {report.clinical_information
                          ?.symptoms ||
                          "No symptoms recorded."}
                      </p>

                    </div>

                    <div className="report-text-box">

                      <p>
                        <strong>
                          Medical History:
                        </strong>
                      </p>

                      <p>
                        {report.clinical_information
                          ?.medical_history ||
                          "No medical history recorded."}
                      </p>

                    </div>

                  </div>


                  {/* PREDICTION */}

                  <div className="report-section">

                    <h3>
                      Disease Prediction
                    </h3>

                    <div className="prediction-report-card">

                      <div>

                        <span>
                          Predicted Disease
                        </span>

                        <strong className="report-disease">
                          {report.prediction
                            ?.disease ||
                            "Not available"}
                        </strong>

                      </div>

                      <div>

                        <span>
                          Confidence
                        </span>

                        <strong>
                          {report.prediction
                            ?.confidence ?? 0}%
                        </strong>

                      </div>

                      <div>

                        <span>
                          Risk Level
                        </span>

                        <strong>
                          {report.prediction
                            ?.risk_level ||
                            "Needs Review"}
                        </strong>

                      </div>

                    </div>

                    <p className="report-date">
                      Prediction Date:{" "}
                      {formatDateTime(
                        report.prediction
                          ?.prediction_date
                      )}
                    </p>

                  </div>


                  {/* RECOMMENDATION */}

                  <div className="report-section">

                    <h3>
                      <FaLightbulb />
                      Recommendation
                    </h3>

                    <div className="report-advice-box">

                      {report.recommendation ||
                        "No recommendation available."}

                    </div>

                  </div>


                  {/* TREATMENT */}

                  <div className="report-section">

                    <h3>
                      <FaStethoscope />
                      Treatment Suggestion
                    </h3>

                    <div className="report-advice-box">

                      {report.treatment ||
                        "No treatment suggestion available."}

                    </div>

                  </div>


                  {/* ADVISORY */}

                  <div className="report-section">

                    <h3>
                      <FaClipboardCheck />
                      Health Advisory
                    </h3>

                    <div className="report-advice-box">

                      {report.advisory ||
                        "No advisory available."}

                    </div>

                  </div>


                  {/* DISCLAIMER */}

                  <div className="report-disclaimer">

                    <FaExclamationTriangle />

                    <div>

                      <strong>
                        Important Medical Notice
                      </strong>

                      <p>
                        {report.disclaimer ||
                          "This report is intended for preliminary informational purposes and should not replace professional medical evaluation."}
                      </p>

                    </div>

                  </div>

                </div>


                {/* REPORT ACTIONS */}

                <div className="report-modal-actions">

                  <button
                    type="button"
                    className="download-report-btn"
                    onClick={
                      handleDownloadPDF
                    }
                  >
                    <FaDownload />
                    Print / Save as PDF
                  </button>

                  <button
                    type="button"
                    className="close-report-action"
                    onClick={closeReport}
                  >
                    Close
                  </button>

                </div>

              </>

            ) : (

              <div className="report-loading">

                <p>
                  Unable to load the report.
                </p>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default PatientDashboard;