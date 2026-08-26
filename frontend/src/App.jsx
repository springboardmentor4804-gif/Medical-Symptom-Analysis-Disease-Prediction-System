import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import AppShell from "./components/AppShell";

// Patient
import PatientLogin from "./pages/Patient/Login";
import PatientRegister from "./pages/Patient/Register";
import PatientDashboard from "./pages/Patient/Dashboard";
import PatientProfile from "./pages/Patient/Profile";
import PatientSymptoms from "./pages/Patient/Symptoms";
import DiseasePrediction from "./pages/Patient/DiseasePrediction";
import MedicalHistory from "./pages/Patient/MedicalHistory";
import Recommendations from "./pages/Patient/Recommendations";
import HealthReports from "./pages/Patient/HealthReports";
import SelectCaretaker from "./pages/Patient/SelectCaretaker";
import RiskAssessment from "./pages/Patient/RiskAssessment";
import Analytics from "./pages/Patient/Analytics";

// Caretaker
import CaretakerProfile from "./pages/caretaker/CaretakerProfile";
import CaretakerLogin from "./pages/caretaker/CaretakerLogin";
import CaretakerRegister from "./pages/caretaker/CaretakerRegister";
import CaretakerDashboard from "./pages/caretaker/CaretakerDashboard";
import AssignedPatients from "./pages/caretaker/AssignedPatients";
import PatientDetails from "./pages/caretaker/PatientDetails";


function App() {
    return (
        <Routes>

            <Route path="/" element={<Home />} />

            {/* Patient */}
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/register" element={<PatientRegister />} />
            <Route path="/caretaker/login" element={<CaretakerLogin />} />
            <Route path="/caretaker/register" element={<CaretakerRegister />} />

            <Route element={<AppShell />}>
                <Route path="/patient/dashboard" element={<PatientDashboard />} />
                <Route path="/patient/profile" element={<PatientProfile />} />
                <Route path="/patient/symptoms" element={<PatientSymptoms />} />
                <Route path="/patient/disease-prediction" element={<DiseasePrediction />}/>            
                <Route path="/patient/medical-history" element={<MedicalHistory />} />
                <Route path="/patient/recommendations" element={<Recommendations />} />
                <Route path="/patient/health-reports" element={<HealthReports />} />
                <Route path="/patient/select-caretaker" element={<SelectCaretaker />} />
                <Route path="/patient/analytics" element={<Analytics />} />
                <Route path="/patient/risk-assessment" element={<RiskAssessment />}/>
                <Route path="/caretaker/profile" element={<CaretakerProfile />}/>
                <Route path="/caretaker/dashboard" element={<CaretakerDashboard />} />
                <Route path="/caretaker/patients" element={<AssignedPatients />} />
                <Route path="/caretaker/patients/:id" element={<PatientDetails />} />
            </Route>

        </Routes>
    );
}

export default App;
