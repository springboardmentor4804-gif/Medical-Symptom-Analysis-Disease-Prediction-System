import { useEffect, useState } from "react";
function HealthcareProviderDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recommendation, setRecommendation] = useState("");
  const [savedRecommendation, setSavedRecommendation] = useState("");
  const [reports, setReports] = useState([]);
const [predictions, setPredictions] = useState([]);
const [appointments, setAppointments] = useState([]);

    useEffect(() => {
    async function loadPatients() {
      try {
        const response = await fetch("http://127.0.0.1:8000/patients");
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        console.error(error);
      }
    }

    async function loadPredictions() {
      try {
        const response = await fetch("http://127.0.0.1:8000/predictions");
        const data = await response.json();
        setPredictions(data.predictions || []);
      } catch (error) {
        console.error(error);
      }
    }
    async function loadReports() {
  try {
    const response = await fetch("http://127.0.0.1:8000/reports");
    const data = await response.json();
    setReports(data.reports || []);
  } catch (error) {
    console.error(error);
  }
}
async function loadAppointments() {
  try {
    const response = await fetch("http://127.0.0.1:8000/appointments");
    const data = await response.json();
    setAppointments(data.appointments || []);
  } catch (error) {
    console.error(error);
  }
}

   loadPatients();
loadPredictions();
loadReports();
loadAppointments();
}, []);

  const handleSave = () => {
    setSavedRecommendation(recommendation);
    alert("Recommendation saved successfully!");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #dbeafe, #e9d5ff)",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: "white",
          borderRadius: "28px",
          padding: "32px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.15)",
        }}
      >
        <h1 style={{ textAlign: "center", color: "#1e3a8a" }}>
          Healthcare Provider Dashboard
        </h1>

        {/* Patient Table */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "20px",
            padding: "24px",
            marginTop: "25px",
          }}
        >
          <h2 style={{ color: "#1f2937" }}>Registered Patients</h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "15px",
              background: "white",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ background: "#eef2ff" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Age</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
  {patients.map((patient) => (
    <tr key={patient.id}>
      <td style={tdStyle}>{patient.fullname}</td>
      <td style={tdStyle}>{patient.age}</td>
      <td style={tdStyle}>{patient.gender || "Not Provided"}</td>
      <td style={tdStyle}>{patient.phone}</td>
      <td style={tdStyle}>
        <button
          onClick={() => {
            setSelectedPatient(patient);
            setRecommendation("");
            setSavedRecommendation("");
          }}
          style={buttonStyle}
        >
          View
        </button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>

        {/* Patient Analysis Section */}
        {selectedPatient && (
          <div
            style={{
              marginTop: "30px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              padding: "24px",
            }}
          >
            <h2 style={{ color: "#1e3a8a" }}>
              Patient Analysis
            </h2>

            <p><strong>Name:</strong> {selectedPatient.fullname}</p>
            <p><strong>Age:</strong> {selectedPatient.age}</p>
            <p><strong>Gender:</strong> {selectedPatient.gender}</p>
            <p><strong>Phone:</strong> {selectedPatient.phone}</p>
            <p>
  <strong>Reported Symptoms:</strong> {
    predictions
      .filter(p => p.patient_name === selectedPatient.fullname)
      .slice(-1)[0]?.symptoms || "No symptoms recorded yet"
  }
</p>

<div
  style={{
    marginTop: "20px",
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "18px",
  }}
>
  <h3 style={{ color: "#1e3a8a", marginTop: 0 }}>
    Medical History / Prediction History
  </h3>


{predictions.filter((p) => p.patient_name === selectedPatient.fullname).length === 0 ? (
  <p>No prediction history available.</p>
) : (
  <div>
    <p>
  <strong>Reported Symptoms:</strong> {
    predictions
      .filter((p) => p.patient_name === selectedPatient.fullname)
      .slice(-1)[0]?.symptoms || "No symptoms recorded yet"
  }
</p>

    {predictions
      .filter((p) => p.patient_name === selectedPatient.fullname)
.map((p, index) => (
        <div
          key={index}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "12px",
          }}
        >
          <p><strong>Symptoms:</strong> {p.symptoms}</p>
          <p><strong>Predicted Disease:</strong> {p.predicted_disease}</p>
          <p><strong>Confidence:</strong> {p.confidence}%</p>
          <p><strong>Risk Level:</strong> {p.risk_level}</p>
        </div>
      ))}
  </div>
)}
</div>

{/* Medical History */}
<div
  style={{
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "18px",
    marginTop: "20px",
  }}
>
  <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>
    Medical History
  </h3>

  <p><strong>Allergies:</strong> No records available</p>
  <p><strong>Existing Diseases:</strong> No records available</p>
  <p><strong>Medications:</strong> No records available</p>
  <p><strong>Previous Treatments:</strong> No records available</p>
</div>



            {/* Uploaded Reports */}
            

<div
  style={{
    marginTop: "20px",
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "18px",
  }}
>
  <h3 style={{ color: "#1e3a8a", marginTop: 0 }}>Uploaded Reports</h3>

  {reports.filter(r => r.patient_name === selectedPatient.fullname).length === 0 ? (
    <p>No reports uploaded yet.</p>
  ) : (
    <ul>
      {reports
  .filter(r => r.patient_name === selectedPatient.fullname)
  .map((report, index) => (
    <li key={index}>
      <a
        href={`http://127.0.0.1:8000/uploads/${report.filename}`}
        target="_blank"
        rel="noreferrer"
        style={{
          color: "#2563eb",
          textDecoration: "underline",
          fontWeight: "600"
        }}
      >
        View {report.filename}
      </a>
    </li>
  ))}
    </ul>
  )}
</div>

<h3 style={{ marginTop: "20px" }}>
  Provider Recommendation
</h3>
{/* Appointment Details */}
<div
  style={{
    marginTop: "20px",
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "18px",
  }}
>
  <h3 style={{ color: "#1e3a8a", marginTop: 0 }}>
    Appointment Details
  </h3>

  {appointments.filter(a => a.patient_name === selectedPatient.fullname).length === 0 ? (
    <p>No appointments booked yet.</p>
  ) : (
    appointments
      .filter(a => a.patient_name === selectedPatient.fullname)
      .map((a, index) => (
        <div
          key={index}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "12px",
          }}
        >
          <p><strong>Doctor:</strong> {a.doctor_name}</p>
          <p><strong>Date:</strong> {a.appointment_date}</p>
          <p><strong>Time:</strong> {a.appointment_time}</p>
          <p><strong>Consultation:</strong> {a.consultation_type}</p>
          <p><strong>Reason:</strong> {a.reason}</p>
        </div>
      ))
  )}
</div>

            <textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="Enter healthcare advice, medications, tests, rest, hydration, or follow-up guidance..."
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid #cbd5e1",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />

            <button
              onClick={handleSave}
              style={{
                marginTop: "16px",
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Save Recommendation
            </button>

            {savedRecommendation && (
              <div
                style={{
                  marginTop: "20px",
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "14px",
                  padding: "16px",
                }}
              >
                <h4 style={{ marginTop: 0, color: "#166534" }}>
                  Saved Recommendation
                </h4>
                <p style={{ marginBottom: 0 }}>{savedRecommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  padding: "14px",
  textAlign: "left",
  color: "#3730a3",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #e5e7eb",
};

const buttonStyle = {
  background: "#5b46c5",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
};

export default HealthcareProviderDashboard;