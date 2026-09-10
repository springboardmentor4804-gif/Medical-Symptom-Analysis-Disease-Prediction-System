import React, { useState, useEffect, useRef, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { MedicalProvider, useMedical } from './context/MedicalContext.jsx';

import LandingPage from './components/landing/LandingPage.jsx';
import LoginModal from './components/auth/LoginModal.jsx';
import RegisterModal from './components/auth/RegisterModal.jsx';
import Navbar from './components/common/Navbar.jsx';
import ToastNotification from './components/common/ToastNotification.jsx';

// Patient Components
import SymptomChecker from './components/patient/SymptomChecker.jsx';
import MedicalHistoryTable from './components/patient/MedicalHistoryTable.jsx';
import AppointmentBooking from './components/patient/AppointmentBooking.jsx';
import PatientAppointmentsList from './components/patient/PatientAppointmentsList.jsx';
import PatientProfile from './components/patient/PatientProfile.jsx';

// Doctor Components
import DoctorAnalytics from './components/doctor/DoctorAnalytics.jsx';
import PatientTriageTable from './components/doctor/PatientTriageTable.jsx';
import DoctorAppointmentsManager from './components/doctor/DoctorAppointmentsManager.jsx';
import DoctorProfile from './components/doctor/DoctorProfile.jsx';

import { ShieldCheck, Heart, AlertTriangle } from 'lucide-react';

// Robust Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-rose-200 shadow-xl text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Application Exception Handled</h2>
            <p className="text-xs text-slate-500 mb-4">
              An unexpected render error was safely intercepted to prevent application crash.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainLayout() {
  const { currentUser, isDoctor, isPatient } = useAuth();
  // If user is already authenticated with a valid token, stay on their dashboard upon refresh
  const [viewingLanding, setViewingLanding] = useState(() => {
    return !localStorage.getItem('medassist_token');
  });
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('medassist_active_tab');
    if (saved) return saved;
    return isDoctor ? 'analytics' : 'checker';
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Clear any legacy demo user session on initial load
  useEffect(() => {
    const saved = localStorage.getItem('medassist_user');
    if (saved && (saved.includes('sarah.jenkins') || saved.includes('dr.vance'))) {
      localStorage.removeItem('medassist_user');
      localStorage.removeItem('medassist_token');
      localStorage.removeItem('medassist_patient_logs');
      localStorage.removeItem('medassist_appointments');
      localStorage.removeItem('medassist_active_tab');
    }
  }, []);

  const patientValidTabs = ['checker', 'history', 'booking', 'appointments', 'profile'];
  const doctorValidTabs = ['analytics', 'patients', 'appointments', 'profile'];

  // Persist activeTab in localStorage
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('medassist_active_tab', activeTab);
    }
  }, [activeTab]);

  // Strictly enforce role-based activeTab boundaries
  useEffect(() => {
    if (isDoctor && !doctorValidTabs.includes(activeTab)) {
      setActiveTab('analytics');
    } else if (isPatient && !patientValidTabs.includes(activeTab)) {
      setActiveTab('checker');
    }
  }, [isDoctor, isPatient, activeTab]);

  // When a user logs in, immediately lead them into their role-specific dashboard
  const prevUserRef = useRef(currentUser);
  useEffect(() => {
    if (!prevUserRef.current && currentUser) {
      setViewingLanding(false);
      const defaultTab = currentUser.role === 'doctor' ? 'analytics' : 'checker';
      setActiveTab(defaultTab);
      localStorage.setItem('medassist_active_tab', defaultTab);
    }
    prevUserRef.current = currentUser;
  }, [currentUser]);

  // If user logs out, return to landing view
  useEffect(() => {
    if (!currentUser) {
      setViewingLanding(true);
      localStorage.removeItem('medassist_active_tab');
    }
  }, [currentUser]);

  // If viewing landing page or not authenticated, render the LandingPage
  if (viewingLanding || !currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <ToastNotification />
        <LandingPage
          onEnterDashboard={() => setViewingLanding(false)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
        />
        {/* Auth Modals available on landing page */}
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onSwitchToRegister={() => setIsRegisterOpen(true)}
          onLoginSuccess={() => setViewingLanding(false)}
        />
        <RegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onSwitchToLogin={() => setIsLoginOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Main Responsive Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onNavigateHome={() => setViewingLanding(true)}
      />

      {/* Floating Notification Toasts */}
      <ToastNotification />

      {/* Main Dynamic Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isPatient && (
          <>
            {activeTab === 'checker' && <SymptomChecker />}
            {activeTab === 'history' && <MedicalHistoryTable />}
            {activeTab === 'booking' && (
              <AppointmentBooking onBookingSuccess={() => setActiveTab('appointments')} />
            )}
            {activeTab === 'appointments' && (
              <PatientAppointmentsList onNavigateToBook={() => setActiveTab('booking')} />
            )}
            {activeTab === 'profile' && <PatientProfile />}
          </>
        )}

        {isDoctor && (
          <>
            {activeTab === 'analytics' && <DoctorAnalytics />}
            {activeTab === 'patients' && <PatientTriageTable />}
            {activeTab === 'appointments' && <DoctorAppointmentsManager />}
            {activeTab === 'profile' && <DoctorProfile />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-sm py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="font-semibold text-slate-700">MedAssist AI Clinical Systems</span>
            <span className="text-slate-300">|</span>
            <span>Enterprise Healthcare Edition</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">© 2026 MedAssist AI. All rights reserved.</span>
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              HIPAA & SOC-2 Certified Architecture
            </span>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => setIsRegisterOpen(true)}
        onLoginSuccess={() => setViewingLanding(false)}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => setIsLoginOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MedicalProvider>
          <MainLayout />
        </MedicalProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
