import React, { useState, useEffect } from 'react';
import { db, CASES_UPDATED_EVENT } from './services/db';
import { SYMPTOM_CATEGORIES, predictDiseaseRisk } from './services/aiPredictor';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import PatientBio from './components/PatientDashboard/PatientBio';
import SymptomChecker from './components/PatientDashboard/SymptomChecker';
import RiskAssessment from './components/PatientDashboard/RiskAssessment';
import PatientHistory from './components/PatientDashboard/PatientHistory';
import DoctorAdvice from './components/PatientDashboard/DoctorAdvice';
import HealthRecommendations from './components/PatientDashboard/HealthRecommendations';
import DoctorProfile from './components/DoctorDashboard/DoctorProfile';
import CaseList from './components/DoctorDashboard/CaseList';
import CaseDetailModal from './components/DoctorDashboard/CaseDetailModal';
import DoctorHistory from './components/DoctorDashboard/DoctorHistory';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import ReportsAndTrendsView from './components/ReportsAndTrendsView';
import { UserCheck, Activity, History, Stethoscope, FileText, Search, FolderHeart, ShieldCheck, Pill, Cpu, Lightbulb, BarChart2 } from 'lucide-react';


export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Patient Tabs: 'symptoms' | 'risk' | 'history' | 'advice' | 'profile'
  // Doctor Tabs: 'queue' | 'profile' | 'history'
  // Admin Tabs: 'admin'
  const [activeTab, setActiveTab] = useState('symptoms');

  // Patient Symptom & Risk State
  const [selectedSymptomIds, setSelectedSymptomIds] = useState(['chest_pain', 'palpitations']);
  const [severity, setSeverity] = useState('Moderate');
  const [duration, setDuration] = useState('1-3 days');
  const [predictionResult, setPredictionResult] = useState(null);
  const [hasCalculatedRisk, setHasCalculatedRisk] = useState(false);

  // Doctor Case Review Modal
  const [selectedCaseForReview, setSelectedCaseForReview] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Clear initial cached session so app always opens to the Login page first
    db.logoutUser();
    setCurrentUser(null);
  }, []);


  useEffect(() => {
    const handleCaseSync = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener(CASES_UPDATED_EVENT, handleCaseSync);
    return () => {
      window.removeEventListener(CASES_UPDATED_EVENT, handleCaseSync);
    };
  }, []);

  const runInitialPrediction = async (symptomIds, userObj) => {
    const profile = db.getProfile(userObj?.id);
    const res = await db.predictRiskML({
      selectedSymptomIds: symptomIds,
      severity: 'Moderate',
      duration: '1-3 days',
      age: profile?.age || 30,
      chronicConditions: profile?.chronicConditions || ''
    });
    setPredictionResult(res);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else if (user.role === 'doctor') {
      setActiveTab('queue');
    } else {
      setActiveTab('symptoms');
      runInitialPrediction(selectedSymptomIds, user);
    }
  };

  const handleLogout = () => {
    db.logoutUser();
    setCurrentUser(null);
    setSelectedSymptomIds([]);
    setPredictionResult(null);
    setHasCalculatedRisk(false);
  };

  const handleSwitchAccount = () => {
    db.logoutUser();
    setCurrentUser(null);
  };

  const handleToggleSymptom = (id) => {
    let newSymptoms;
    if (selectedSymptomIds.includes(id)) {
      newSymptoms = selectedSymptomIds.filter(sId => sId !== id);
    } else {
      newSymptoms = [...selectedSymptomIds, id];
    }
    setSelectedSymptomIds(newSymptoms);
  };

  const getSelectedSymptomNames = (symptomIds = selectedSymptomIds) => {
    const names = [];
    SYMPTOM_CATEGORIES.forEach(cat => {
      cat.symptoms.forEach(sym => {
        if (symptomIds.includes(sym.id)) {
          names.push(sym.name);
        }
      });
    });
    return names;
  };

  // Submit Patient Disease Data & Execute Trained ML Prediction
  const handleSubmitPatientData = async () => {
    const profile = db.getProfile(currentUser?.id);
    const res = await db.predictRiskML({
      selectedSymptomIds,
      severity,
      duration,
      age: profile?.age || 30,
      chronicConditions: profile?.chronicConditions || ''
    });

    setPredictionResult(res);
    setHasCalculatedRisk(true);

    if (currentUser?.id) {
      const symptomNames = getSelectedSymptomNames();
      db.createCase({
        patientId: currentUser.id,
        patientName: `${currentUser.firstName} ${currentUser.lastName}`,
        patientAge: profile?.age || 30,
        patientGender: profile?.gender || 'Unspecified',
        symptoms: symptomNames.length > 0 ? symptomNames : ['General Symptoms'],
        severity,
        duration,
        riskScore: res.riskScore,
        riskLevel: res.riskLevel,
        predictedCondition: res.primaryCondition,
        summary: res.summary,
        specialty: res.recommendedSpecialty
      });
    }

    // Switch directly to Risk Assessment tab after submitting symptoms
    setActiveTab('risk');
  };

  const getDoctorStats = () => {
    if (!currentUser || currentUser.role !== 'doctor') return {};
    const doctorCases = db.getDoctorCases(currentUser.specialty);
    return {
      totalSpecialtyCases: doctorCases.length,
      pendingCount: doctorCases.filter(c => c.status === 'Pending').length,
      reviewedCount: doctorCases.filter(c => c.status === 'Reviewed').length
    };
  };

  if (!currentUser) {
    return (
      <div className="app-root">
        <Navbar currentUser={null} />
        <main className="auth-hero-background">
          <AuthModal onLoginSuccess={handleLoginSuccess} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />

      <main className="main-content">
        {/* Navigation Bar Tabs */}
        <div className="dashboard-navigation glass-panel">
          <div className="nav-tabs-list">
            {currentUser.role === 'admin' ? (
              <button
                className={`dash-tab ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <ShieldCheck size={18} />
                <span>Admin Dashboard & System Directory</span>
              </button>
            ) : currentUser.role === 'patient' ? (
              <>
                <button
                  className={`dash-tab ${activeTab === 'symptoms' ? 'active' : ''}`}
                  onClick={() => setActiveTab('symptoms')}
                >
                  <Search size={18} />
                  <span>Symptoms Input</span>
                </button>

                <button
                  className={`dash-tab ${activeTab === 'risk' ? 'active' : ''}`}
                  onClick={() => setActiveTab('risk')}
                >
                  <Cpu size={18} />
                  <span>Risk Assessment</span>
                </button>

                <button
                  className={`dash-tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <History size={18} />
                  <span>History</span>
                </button>

                <button
                  className={`dash-tab ${activeTab === 'advice' ? 'active' : ''}`}
                  onClick={() => setActiveTab('advice')}
                >
                  <Pill size={18} />
                  <span>Doctor Advice</span>
                </button>

                <button
                  className={`dash-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <UserCheck size={18} />
                  <span>Bio & Profile</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className={`dash-tab ${activeTab === 'queue' ? 'active' : ''}`}
                  onClick={() => setActiveTab('queue')}
                >
                  <FolderHeart size={18} />
                  <span>patient_cases</span>
                </button>

                <button
                  className={`dash-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <FileText size={18} />
                  <span>Doctor Profile</span>
                </button>

                <button
                  className={`dash-tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <History size={18} />
                  <span>Consultation History</span>
                </button>
              </>
            )}

            {/* Universal Reports & Trends Tab */}
            <button
              className={`dash-tab ${activeTab === 'reports_trends' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports_trends')}
              title="Official Diagnostic Reports & Healthcare Trends Visualizer"
            >
              <BarChart2 size={18} color="#06b6d4" />
              <span className="text-highlight">Reports & Trends</span>
            </button>

          </div>

          <div className="nav-right-indicator">
            <span className="live-indicator">
              <span className="dot pulse"></span>
              Live Sync
            </span>
          </div>
        </div>

        {/* --- ADMIN DASHBOARD --- */}
        {currentUser.role === 'admin' && (
          <div className="dashboard-view-container">
            <AdminDashboard currentUser={currentUser} key={refreshTrigger} />
          </div>
        )}

        {/* --- PATIENT DASHBOARD VIEWS --- */}
        {currentUser.role === 'patient' && (
          <div className="dashboard-view-container">
            {/* 1. SYMPTOMS INPUT SESSION */}
            {activeTab === 'symptoms' && (
              <div className="symptoms-session-layout">
                <SymptomChecker
                  selectedSymptomIds={selectedSymptomIds}
                  onToggleSymptom={handleToggleSymptom}
                  severity={severity}
                  onSeverityChange={setSeverity}
                  duration={duration}
                  onDurationChange={setDuration}
                  onSubmitPatientData={handleSubmitPatientData}
                />
              </div>
            )}

            {/* 2. RISK ASSESSMENT SESSION */}
            {activeTab === 'risk' && (
              <div className="risk-session-layout fade-in">
                <RiskAssessment
                  predictionResult={predictionResult}
                  currentUser={currentUser}
                  selectedSymptomNames={getSelectedSymptomNames()}
                  severity={severity}
                  duration={duration}
                  onCaseSubmitted={(newCase) => {
                    setRefreshTrigger(prev => prev + 1);
                    setActiveTab('history');
                  }}
                  onNavigateToHistory={() => setActiveTab('history')}

                />
              </div>
            )}

            {/* 3. HISTORY SESSION */}
            {activeTab === 'history' && (
              <PatientHistory currentUser={currentUser} key={refreshTrigger} />
            )}

            {/* 4. DOCTOR ADVICE SESSION */}
            {activeTab === 'advice' && (
              <DoctorAdvice currentUser={currentUser} key={refreshTrigger} />
            )}

            {/* 5. BIO & PROFILE SESSION */}
            {activeTab === 'profile' && (
              <PatientBio currentUser={currentUser} />
            )}
          </div>
        )}

        {/* --- DOCTOR DASHBOARD VIEWS --- */}
        {currentUser.role === 'doctor' && (
          <div className="dashboard-view-container">
            {activeTab === 'profile' && (
              <DoctorProfile currentUser={currentUser} stats={getDoctorStats()} key={refreshTrigger} />
            )}

            {activeTab === 'queue' && (
              <CaseList
                cases={db.getCases()}
                doctorSpecialty={currentUser.specialty || 'General Physician'}
                onSelectCase={(c) => setSelectedCaseForReview(c)}
                key={refreshTrigger}
              />
            )}

            {activeTab === 'history' && (
              <DoctorHistory currentUser={currentUser} key={refreshTrigger} />
            )}
          </div>
        )}

        {/* --- UNIVERSAL REPORTS & TRENDS VIEW --- */}
        {activeTab === 'reports_trends' && (
          <div className="dashboard-view-container">
            <ReportsAndTrendsView currentUser={currentUser} key={refreshTrigger} />
          </div>
        )}
      </main>


      {/* Doctor Review Modal */}
      {selectedCaseForReview && (
        <CaseDetailModal
          selectedCase={selectedCaseForReview}
          currentUser={currentUser}
          onClose={() => setSelectedCaseForReview(null)}
          onSuggestionSubmitted={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}
    </div>
  );
}
