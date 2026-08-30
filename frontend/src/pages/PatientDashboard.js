import { useEffect, useState } from "react";

function PatientDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [symptoms, setSymptoms] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [doctorName, setDoctorName] = useState("Dr. Sharma");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [consultationType, setConsultationType] = useState("Online");
  const [reason, setReason] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [showOtherDiseases, setShowOtherDiseases] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [reports, setReports] = useState([]);
  
  const [allergies, setAllergies] = useState("");
const [medications, setMedications] = useState("");
const [previousTreatments, setPreviousTreatments] = useState("");
const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    const loadMedicalHistory = async () => {
    try {
        const response = await fetch(
            `http://127.0.0.1:8000/medical-history/${encodeURIComponent(user.fullname)}`
        );

        if (response.ok) {
            const data = await response.json();
            setAllergies(data.allergies || "");
            setMedications(data.medications || "");
            setPreviousTreatments(data.previous_treatments || "");
        }
    } catch (error) {
        console.error("Error loading medical history:", error);
    }
};

loadMedicalHistory();
  const loadPredictionHistory = async () => {
    console.log("USER FROM LOCAL STORAGE:", user);

    if (!user?.fullname) {
      console.log("NO FULLNAME FOUND");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/predictions"
      );

      console.log("PREDICTIONS RESPONSE STATUS:", response.status);

      const data = await response.json();

      console.log("ALL PREDICTIONS FROM BACKEND:", data.predictions);
      console.log("LOGGED-IN NAME:", user.fullname);

      const patientPredictions = data.predictions.filter(
        (item) =>
          item.patient_name?.trim().toLowerCase() ===
          user.fullname?.trim().toLowerCase()
      );

      console.log("MATCHED PATIENT PREDICTIONS:", patientPredictions);

      setPredictionHistory(patientPredictions);

    } catch (error) {
      console.error("Prediction history error:", error);
    }
  };

  loadPredictionHistory();
}, [user]);
useEffect(() => {
  const loadReports = async () => {
    if (!user?.fullname) {
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/reports"
      );

      const data = await response.json();

      console.log("ALL REPORTS FROM BACKEND:", data.reports);

      const patientReports = data.reports.filter(
        (item) =>
          item.patient_name?.trim().toLowerCase() ===
          user.fullname?.trim().toLowerCase()
      );

      console.log("MATCHED PATIENT REPORTS:", patientReports);

      setReports(patientReports);

    } catch (error) {
      console.error("Reports loading error:", error);
    }
  };

  loadReports();
}, [user]);


  const handleUpload = async () => {
  if (!reportFile) {
    alert("Please select a file");
    return;
  }  

  const formData = new FormData();
  formData.append("patient_name", user?.fullname || "Patient");
  formData.append("file", reportFile);

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/upload-report",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    alert(data.message);
  } catch (error) {
    alert("Upload failed");
    console.log(error);
  }
};
  const handlePredict = async () => {
  if (!symptoms.trim()) {
    alert("Please enter symptoms");
    return;
  }

  const symptomArray = symptoms
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/ /g, "_"));
    if (symptomArray.length < 2) {
  alert("Please enter at least 2 symptoms for a reliable prediction");
  return;
}

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        patient_name: user?.fullname,
        symptoms: symptomArray,
      }),
      }
    );

    if (!response.ok) {
  throw new Error("Server error");
}

const data = await response.json();
console.log(data);
setPrediction(data);

    } catch (error) {
    alert("Prediction failed");
    console.log(error);
  }
};


const handleDownloadReport = async () => {
  if (!prediction) {
    alert("Please predict a disease first");
    return;
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/generate-report",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_name: user?.fullname || "Patient",
          symptoms: symptoms
            .split(",")
            .map((s) => s.trim()),
        }),
      }
    );

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${user?.fullname || "Patient"}.pdf`;

    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    alert("Report generation failed");
    console.log(error);
  }
};

const handleAppointment = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/book-appointment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_name: user?.fullname,
          doctor_name: doctorName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          consultation_type: consultationType,
          reason: reason,
        }),
      }
    );

    const data = await response.json();
    alert(data.message);
  } catch (error) {
    alert("Appointment booking failed");
    console.log(error);
  }
};
const handleSaveMedicalHistory = async () => {
  if (!user?.fullname) {
    alert("Patient information not found");
    return;
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/medical-history",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_name: user.fullname,
          allergies: allergies,
          medications: medications,
          previous_treatments: previousTreatments,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      alert("Medical history saved successfully!");
    } else {
      console.error("Medical history error:", data);
      alert("Failed to save medical history");
    }
  } catch (error) {
    console.error("Medical history save error:", error);
    alert("Error saving medical history");
  }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #7c6ac8, #9f8ee3)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
          background: "#ffffff",
          borderRadius: "28px",
          display: "flex",
          overflow: "hidden",
          boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: "220px",
            background: "#f7f5ff",
            padding: "25px 18px",
            borderRight: "1px solid #ece8ff",
          }}
        >
          <h2
            style={{
              color: "#5b46c5",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            🏥 MedAssist AI
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
  <button
    style={activePage === "dashboard" ? navBtnActive : navBtn}
    onClick={() => setActivePage("dashboard")}
  >
    Dashboard
  </button>

  <button
    style={activePage === "medical-history" ? navBtnActive : navBtn}
    onClick={() => setActivePage("medical-history")}
  >
    Medical History
  </button>

  <button
    style={activePage === "reports" ? navBtnActive : navBtn}
    onClick={() => setActivePage("reports")}
  >
    Reports
  </button>

  <button
    style={activePage === "settings" ? navBtnActive : navBtn}
    onClick={() => setActivePage("settings")}
  >
    Settings
  </button>
</div>

          <button
            style={{
              ...navBtn,
              marginTop: "40px",
              background: "#fff",
              color: "#d32f2f",
            }}
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "30px" }}>
          {activePage === "dashboard" && (
            <>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
              flexWrap: "wrap",
              gap: "15px",
            }}
          >
            <div>
              <h1 style={{ margin: 0, color: "#1f2937" }}>Dashboard</h1>
              <p style={{ color: "#6b7280", marginTop: "6px" }}>
                Welcome back, {user?.fullname}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "#f8fafc",
                padding: "10px 14px",
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  background: "#c7b8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#fff",
                }}
              >
                {user?.fullname?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: "600" }}>{user?.fullname}</div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Patient
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #ece6ff, #f6f2ff)",
              borderRadius: "22px",
              padding: "24px",
              marginBottom: "25px",
              border: "1px solid #e5ddff",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#3b2f7a" }}>
              Welcome to MedAssist AI
            </h2>
            <p style={{ color: "#4b5563", lineHeight: 1.6, marginBottom: 0 }}>
              Manage your health records, symptoms, and medical reports in one
              secure place. This dashboard is part of the Milestone 1 healthcare
              workflow setup.
            </p>
          </div>

          {/* Top Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginBottom: "25px",
            }}
          >
            <InfoCard title="Age" value={user?.age || "--"} />
            <InfoCard title="Gender" value={user?.gender || "Not Provided"} />
            <InfoCard title="Phone" value={user?.phone || "--"} />
          </div>

          {/* Symptom Section */}
          <SectionCard title="Enter Symptoms">
            <textarea
              placeholder="Enter your symptoms here..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid #d1d5db",
                resize: "vertical",
                fontSize: "15px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />

            <button
  onClick={handlePredict}
  style={{
    marginTop: "15px",
    background: "#4f46e5",
    color: "white",
    padding: "12px 22px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
  }}
>
  Predict Disease
</button>

{prediction && (
  <div
    style={{
      marginTop: "20px",
      background: "#f8fafc",
      border: "1px solid #cbd5e1",
      borderRadius: "18px",
      padding: "20px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    }}
  >
    <h3
      style={{
        color: "#1e3a8a",
        marginTop: 0,
        marginBottom: "14px",
      }}
    >
      🩺 Prediction Result
    </h3>

    <p>
      <strong>Most Likely Disease:</strong>{" "}
      {prediction["Predicted Disease"]}
    </p>

    <p>
      <strong>Confidence:</strong>{" "}
      {prediction["Confidence"]}%
    </p>

    <p>
      <strong>Risk Level:</strong>{" "}
      {prediction["Risk Level"]}
    </p>

    <p>
      <strong>Symptoms Entered:</strong>{" "}
      {prediction["Symptoms Entered"]}
    </p>

    <p style={{ color: "#475569" }}>
      {prediction["Confidence"] >= 70
        ? "High confidence prediction"
        : prediction["Confidence"] >= 40
        ? "Moderate confidence prediction"
        : "Low confidence prediction — please consult a healthcare professional."}
    </p>

    {prediction["Disease Information"] && (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "18px",
          marginTop: "18px",
        }}
      >
        <h4>📖 About the Disease</h4>

        <p>
          <strong>About:</strong>{" "}
          {prediction["Disease Information"]["About"]}
        </p>

        <p>
          <strong>Common Symptoms:</strong>{" "}
          {prediction["Disease Information"]["Common Symptoms"]}
        </p>

        <p>
          <strong>General Recommendation:</strong>{" "}
          {prediction["Disease Information"]["Basic Recommendation"]}
        </p>
      </div>
    )}

    {prediction["Healthcare Recommendations"] && (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "18px",
          marginTop: "18px",
        }}
      >
        <h4>💡 Healthcare Recommendations</h4>

        <p>
          <strong>💊 Treatment / Management:</strong><br />
          {prediction["Healthcare Recommendations"]["Treatment"]}
        </p>

        <p>
          <strong>🛡️ Preventive Care:</strong><br />
          {prediction["Healthcare Recommendations"]["Preventive Care"]}
        </p>

        <p>
          <strong>📅 Follow-up Advice:</strong><br />
          {prediction["Healthcare Recommendations"]["Follow-up Advice"]}
        </p>
      </div>
    )}

    {prediction["Other Possible Diseases"] &&
      prediction["Other Possible Diseases"].length > 0 && (
        <>
          <button
            onClick={() =>
              setShowOtherDiseases(!showOtherDiseases)
            }
            style={{
              background: "transparent",
              color: "#2563eb",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              padding: "8px 0",
              marginTop: "18px",
            }}
          >
            {showOtherDiseases
              ? "▲ Hide Other Possible Diseases"
              : "▼ View Other Possible Diseases"}
          </button>

          {showOtherDiseases && (
            <div
              style={{
                background: "#ffffff",
                padding: "15px",
                borderRadius: "10px",
                marginTop: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h4>Other Possible Diseases</h4>

              {prediction["Other Possible Diseases"].map(
                (disease, index) => (
                  <p key={index}>
                    <strong>{disease["Disease"]}</strong>
                    {" — "}
                    {disease["Confidence"]}%
                  </p>
                )
              )}
            </div>
          )}
        </>
      )}

    <button
      onClick={handleDownloadReport}
      style={{
        background: "#2563eb",
        color: "white",
        padding: "10px 18px",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        marginTop: "18px",
      }}
    >
      📄 Download Report
    </button>
  </div>
)}

</SectionCard>



{/* Doctor Appointment Section */}
<SectionCard title="📅 Book Doctor Appointment">

  <label>Doctor</label>
  <select
    value={doctorName}
    onChange={(e) => setDoctorName(e.target.value)}
    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
  >
    <option>Dr. Sharma</option>
    <option>Dr. Mehta</option>
    <option>Dr. Rao</option>
  </select>

  <br /><br />

  <label>Date</label>
  <input
    type="date"
    value={appointmentDate}
    onChange={(e) => setAppointmentDate(e.target.value)}
    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
  />

  <br /><br />

  <label>Time</label>
  <input
    type="time"
    value={appointmentTime}
    onChange={(e) => setAppointmentTime(e.target.value)}
    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
  />

  <br /><br />

  <label>Consultation Type</label>
  <select
    value={consultationType}
    onChange={(e) => setConsultationType(e.target.value)}
    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
  >
    <option>Online</option>
    <option>In-person</option>
  </select>

  <br /><br />

  <label>Reason for Visit</label>
  <textarea
    value={reason}
    onChange={(e) => setReason(e.target.value)}
    placeholder="Describe your health issue"
    style={{
      width: "100%",
      minHeight: "80px",
      padding: "10px",
      borderRadius: "8px",
    }}
  />

  <br /><br />

  <button
    onClick={handleAppointment}
    style={{
      background: "#2563eb",
      color: "white",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    Book Appointment
  </button>
</SectionCard>
</>
  )}

{/* ================= MEDICAL HISTORY ================= */}
{activePage === "medical-history" && (
  <div id="medical-history">
    <SectionCard title="Medical History">

      <label>
        <strong>Allergies</strong>
      </label>

      <input
        type="text"
        placeholder="Enter allergies"
        value={allergies}
        onChange={(e) => setAllergies(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "6px",
          marginBottom: "12px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          boxSizing: "border-box",
        }}
      />

      <label>
        <strong>Medications</strong>
      </label>

      <input
        type="text"
        placeholder="Enter current medications"
        value={medications}
        onChange={(e) => setMedications(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "6px",
          marginBottom: "12px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          boxSizing: "border-box",
        }}
      />

      <label>
        <strong>Previous Treatments</strong>
      </label>

      <textarea
        placeholder="Enter previous treatments"
        value={previousTreatments}
        onChange={(e) => setPreviousTreatments(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "6px",
          marginBottom: "12px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          boxSizing: "border-box",
          minHeight: "80px",
        }}
      />

      <button
        onClick={handleSaveMedicalHistory}
        style={{
          marginTop: "5px",
          background: "#0f766e",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        Save Medical History
      </button>

      <HistoryRow
        label="Existing Diseases"
        value={
          predictionHistory.length > 0
            ? [
                ...new Set(
                  predictionHistory.map(
                    (item) => item.predicted_disease
                  )
                ),
              ].join(", ")
            : "No records available"
        }
      />

    </SectionCard>
  </div>
)}


{/* ================= REPORTS ================= */}
{activePage === "reports" && (
  <div id="reports">
    <SectionCard title="Medical Reports">

      <div
        style={{
          border: "2px dashed #cbd5e1",
          borderRadius: "16px",
          padding: "25px",
          textAlign: "center",
          background: "#fafafa",
        }}
      >
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          Upload PDF, JPG, or PNG medical reports
        </p>

        <input
          type="file"
          onChange={(e) => setReportFile(e.target.files[0])}
          style={{ marginBottom: "15px" }}
        />

        <br />

        <button
          onClick={handleUpload}
          style={{
            background: "#0f766e",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Upload Report
        </button>

        {reports.length === 0 ? (
          <p style={{ marginTop: "12px", color: "#64748b" }}>
            No reports uploaded yet.
          </p>
        ) : (
          <div style={{ marginTop: "15px" }}>
            <h4>Uploaded Reports</h4>

            {reports.map((report, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  marginBottom: "10px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span>📄 {report.filename}</span>

                <a
                  href={`http://127.0.0.1:8000/uploads/${encodeURIComponent(
                    report.filename
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#2563eb",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  View Report
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

    </SectionCard>
  </div>
)}


{/* ================= SETTINGS ================= */}
{activePage === "settings" && (
  <div id="settings">
    <SectionCard title="Settings">
      <p style={{ color: "#64748b" }}>
        Settings will be available here.
      </p>
    </SectionCard>
  </div>
)}

        </div>
      </div>
    </div>
  );
}

/* Small reusable components */

function InfoCard({ title, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "18px",
        border: "1px solid #eef0f4",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ color: "#6b7280", fontSize: "14px" }}>
        {title}
      </div>

      <div
        style={{
          marginTop: "8px",
          fontSize: "20px",
          fontWeight: "700",
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "22px",
        padding: "22px",
        marginBottom: "24px",
        border: "1px solid #eef0f4",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "16px",
          color: "#1f2937",
        }}
      >
        {title}
      </h3>

      {children}
    </div>
  );
}

function HistoryRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid #f1f5f9",
        gap: "15px",
      }}
    >
      <strong style={{ color: "#374151" }}>
        {label}:
      </strong>

      <span
        style={{
          color: "#64748b",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const navBtn = {
  background: "transparent",
  border: "none",
  padding: "12px 14px",
  borderRadius: "12px",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "15px",
  color: "#374151",
};

const navBtnActive = {
  ...navBtn,
  background: "#5b46c5",
  color: "white",
};

export default PatientDashboard;