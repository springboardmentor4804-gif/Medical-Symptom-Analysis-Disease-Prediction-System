import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'
import AdminUsers from './pages/AdminUsers'
import CreatePrescription from './pages/CreatePrescription'
import CreateProviderReport from './pages/CreateProviderReport'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Login from './pages/Login'
import PatientDashboard from './pages/PatientDashboard'
import PatientPrescriptions from './pages/PatientPrescriptions'
import PatientReports from './pages/PatientReports'
import Profile from './pages/Profile'
import ProviderHistory from './pages/ProviderHistory'
import ProviderProfileSetup from './pages/ProviderProfileSetup'
import ProviderReports from './pages/ProviderReports'
import RiskAssessment from './pages/RiskAssessment'
import Signup from './pages/Signup'
import SymptomChecker from './pages/SymptomChecker'
import TriageQueue from './pages/TriageQueue'

const ORG_ADMIN_ROLES = ['clinic_admin', 'hospital_admin', 'telemedicine_admin', 'org_admin']
const CLINICAL_STAFF_ROLES = ['nurse', 'provider', ...ORG_ADMIN_ROLES, 'admin']
const USER_MANAGER_ROLES = [...ORG_ADMIN_ROLES, 'admin']

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RequireRole({ roles, children }) {
  const { role } = useAuth()
  if (!roles.includes(role)) return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const { role } = useAuth()
  if (role === 'patient') return <Navigate to="/dashboard" replace />
  if (CLINICAL_STAFF_ROLES.includes(role)) return <Navigate to="/analytics" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/dashboard"
          element={
            <RequireRole roles={['patient']}>
              <PatientDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/checker"
          element={
            <RequireRole roles={['patient']}>
              <SymptomChecker />
            </RequireRole>
          }
        />
        <Route
          path="/history"
          element={
            <RequireRole roles={['patient']}>
              <History />
            </RequireRole>
          }
        />
        <Route
          path="/risk-assessment"
          element={
            <RequireRole roles={['patient']}>
              <RiskAssessment />
            </RequireRole>
          }
        />
        <Route
          path="/provider-reports"
          element={
            <RequireRole roles={['patient']}>
              <ProviderReports />
            </RequireRole>
          }
        />
        <Route
          path="/my-reports"
          element={
            <RequireRole roles={['patient']}>
              <PatientReports />
            </RequireRole>
          }
        />
        <Route
          path="/prescriptions"
          element={
            <RequireRole roles={['patient']}>
              <PatientPrescriptions />
            </RequireRole>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireRole roles={['patient']}>
              <Profile />
            </RequireRole>
          }
        />

        <Route
          path="/analytics"
          element={
            <RequireRole roles={CLINICAL_STAFF_ROLES}>
              <Dashboard />
            </RequireRole>
          }
        />
        <Route
          path="/patient-history"
          element={
            <RequireRole roles={CLINICAL_STAFF_ROLES}>
              <ProviderHistory />
            </RequireRole>
          }
        />
        <Route
          path="/create-report"
          element={
            <RequireRole roles={CLINICAL_STAFF_ROLES}>
              <CreateProviderReport />
            </RequireRole>
          }
        />
        <Route
          path="/practice-details"
          element={
            <RequireRole roles={CLINICAL_STAFF_ROLES}>
              <ProviderProfileSetup />
            </RequireRole>
          }
        />
        <Route
          path="/create-prescription"
          element={
            <RequireRole roles={CLINICAL_STAFF_ROLES}>
              <CreatePrescription />
            </RequireRole>
          }
        />
        <Route
          path="/triage"
          element={
            <RequireRole roles={CLINICAL_STAFF_ROLES}>
              <TriageQueue />
            </RequireRole>
          }
        />
        <Route
          path="/users"
          element={
            <RequireRole roles={USER_MANAGER_ROLES}>
              <AdminUsers />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
