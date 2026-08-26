import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import HealthcareProviderDashboard from "./pages/HealthcareProviderDashboard";

function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3ecff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "50px 40px",
          borderRadius: "24px",
          textAlign: "center",
          maxWidth: "700px",
          width: "100%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            width: "90px",
            height: "90px",
            margin: "0 auto 20px",
            borderRadius: "20px",
            background: "#ede9fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "42px",
          }}
        >
          🏥
        </div>

        <h1 style={{ color: "#1f2937", marginBottom: "12px" }}>
          MedAssist AI
        </h1>

        <p
          style={{
            fontSize: "1.25rem",
            color: "#4338ca",
            fontWeight: "600",
            marginBottom: "18px",
          }}
        >
          AI Medical Symptom Analysis & Disease Prediction System
        </p>

        <p style={{ color: "#4b5563", marginBottom: "30px" }}>
          Welcome to MedAssist AI
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          <a href="/register">
            <button
              style={{
                background: "#5b46c5",
                color: "white",
                border: "none",
                padding: "12px 26px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Register
            </button>
          </a>

          <a href="/login">
            <button
              style={{
                background: "white",
                color: "#5b46c5",
                border: "2px solid #5b46c5",
                padding: "12px 26px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Login
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route
         
  path="/healthcare-provider-dashboard"
  element={<HealthcareProviderDashboard />}
/>
      </Routes>
    </Router>
  );
}

export default App;