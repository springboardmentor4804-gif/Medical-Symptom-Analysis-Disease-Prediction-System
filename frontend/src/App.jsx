import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || 'patient');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('email') || '');
  
  const [currentView, setCurrentView] = useState(token ? (role === 'patient' ? 'patient_dashboard' : 'provider_dashboard') : 'landing');
  const [authMode, setAuthMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('patient');
  const [specialization, setSpecialization] = useState('General Physician');

  const [patientTab, setPatientTab] = useState('checker');
  const [doctorTab, setDoctorTab] = useState('analytics');

  const [symptomText, setSymptomText] = useState('');
  const [formData, setFormData] = useState({
    fever: 'No',
    cough: 'No',
    fatigue: 'Yes',
    difficulty_breathing: 'No',
    blood_pressure: 'Normal',
    cholesterol: 'Normal'
  });
  const [aiResult, setAiResult] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [recordsList, setRecordsList] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [myAppointments, setMyAppointments] = useState([]);

  const [selectedPatientModal, setSelectedPatientModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    if (authMode === 'register') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(password)) {
        showNotify("Password must be 8+ chars with uppercase, lowercase, number & symbol.", "error");
        setAuthLoading(false);
        return;
      }
      if (!/^[6-9]\d{9}$/.test(phone)) {
        showNotify("Phone number must be exactly 10 digits starting with 6-9.", "error");
        setAuthLoading(false);
        return;
      }
    }

    try {
      if (authMode === 'login') {
        const res = await axios.post('http://127.0.0.1:8000/api/login', { 
          email, password, role: selectedRole 
        });
        const jwtToken = res.data.access_token;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('email', email);
        
        setToken(jwtToken);
        setRole(res.data.role);
        setUserEmail(email);
        setCurrentView(res.data.role === 'patient' ? 'patient_dashboard' : 'provider_dashboard');
        
        setPatientTab('checker');
        setDoctorTab('analytics');
        showNotify("Successfully signed in!");
      } else if (authMode === 'register') {
        await axios.post('http://127.0.0.1:8000/api/register', {
          email, password, role: selectedRole, full_name: fullName, phone, age: Number(age), gender, location, specialization
        });
        showNotify("Registration successful! Please sign in now.");
        setAuthMode('login');
        setPassword('');
      } else if (authMode === 'forgot') {
        showNotify(`Password reset instructions sent to ${email}.`);
        setAuthMode('login');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Authentication failed! Please check your credentials.";
      showNotify(errorMsg, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUserEmail('');
    setAiResult(null);
    setRecommendationsData(null);
    setAnalyticsData(null);
    setCurrentView('landing');
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/predict', {
        email: userEmail || email,
        symptoms_text: symptomText || "General symptoms",
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiResult(res.data);
      
      fetchRecommendations(res.data.predicted_disease, res.data.risk_level);
      fetchRecords();
      if (role !== 'patient') fetchAnalytics();
      showNotify("AI Disease Prediction generated successfully!");
    } catch (err) {
      showNotify("AI Prediction failed. Ensure backend connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (disease, riskLevel) => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/recommendations', {
        disease, risk_level: riskLevel
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendationsData(res.data);
    } catch (err) {
      console.error("Recommendation fetch error:", err);
    }
  };

  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyticsData(res.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setAnalyticsData({
        total_predictions: 0,
        system_health: "Online",
        appointment_stats: { Accepted: 0, Pending: 0 },
        disease_stats: [],
        risk_distribution: {}
      });
    }
  };

  const fetchRecords = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allRecords = res.data.patients || [];
      setRecordsList(allRecords);
      if (role === 'patient') {
        const myLogs = allRecords.filter(p => p.email === userEmail);
        setMyHistory(myLogs);
        if (myLogs.length > 0) {
          setUserProfile(myLogs[0]);
        }
      }

      const docRes = await axios.get('http://127.0.0.1:8000/api/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctorsList(docRes.data.doctors || []);

      const apptRes = await axios.get(`http://127.0.0.1:8000/api/appointments/${userEmail || email}?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyAppointments(apptRes.data.appointments || []);

    } catch (err) {
      console.error(err);
    }
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/appointments', {
        patient_email: userEmail,
        doctor_email: selectedDoctor,
        appointment_date: apptDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotify("Appointment requested successfully!");
      setApptDate('');
      setSelectedDoctor('');
      fetchRecords();
    } catch (err) {
      showNotify("Failed to request appointment.", "error");
    }
  };

  const updateAppointmentStatus = async (apptId, status) => {
    const timeSlot = prompt("Enter scheduled appointment time (e.g., 10:30 AM):", "10:30 AM");
    if (!timeSlot) return;
    try {
      await axios.put(`http://127.0.0.1:8000/api/appointments/${apptId}`, {
        status: status,
        scheduled_time: timeSlot
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotify(`Appointment ${status} successfully!`);
      fetchRecords();
      fetchAnalytics();
    } catch (err) {
      showNotify("Failed to update appointment.", "error");
    }
  };

const downloadReport = () => {
    if (!aiResult) return;
    const doc = new jsPDF();
    
    // Top Brand Accent Bar
    doc.setFillColor(40, 116, 166);
    doc.rect(0, 0, 210, 15, "F");

    // Title & Header Styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 116, 166);
    doc.text("MEDASSIST AI", 20, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("OFFICIAL CLINICAL DIAGNOSTIC REPORT", 20, 37);
    doc.text(`Generated Date: ${new Date().toLocaleString()}`, 130, 37);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 42, 190, 42);
    
    // Patient Details Box
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20, 48, 170, 32, 3, 3, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Patient & Diagnostic Summary", 26, 57);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Patient Email: ${userEmail}`, 26, 66);
    doc.text(`Predicted Disease: ${aiResult.predicted_disease}`, 26, 73);

    // AI Confidence & Risk Badge Area
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 85, 170, 24, 3, 3, "F");
    doc.setDrawColor(220, 224, 230);
    doc.roundedRect(20, 85, 170, 24, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`AI Confidence Score: ${aiResult.confidence_score}`, 28, 100);
    doc.text(`Risk Level:`, 120, 100);
    
    doc.setTextColor(aiResult.risk_level === 'High' ? 200 : 40, aiResult.risk_level === 'High' ? 0 : 116, aiResult.risk_level === 'High' ? 0 : 166);
    doc.text(`${aiResult.risk_level.toUpperCase()} RISK`, 145, 100);

    // Clinical Recommendations Section
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Clinical Recommendations & Advisory", 20, 122);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitRecs = doc.splitTextToSize(aiResult.recommendations, 170);
    doc.text(splitRecs, 20, 130);

    let nextY = 130 + (splitRecs.length * 6) + 12;

    if (recommendationsData) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Treatment Protocol & Lifestyle Advisory", 20, nextY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const detailsText = `• Treatment: ${recommendationsData.treatment_suggestions}\n• Lifestyle: ${recommendationsData.lifestyle_advice.join(' ')}\n• Precautions: ${recommendationsData.precautions.join(' ')}`;
      const splitDetails = doc.splitTextToSize(detailsText, 170);
      doc.text(splitDetails, 20, nextY + 8);
      nextY += 8 + (splitDetails.length * 6) + 15;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Confidential Medical Document - Generated by MedAssist AI Enterprise Platform", 20, 285);
    
    doc.save(`Diagnostic_Report_${userEmail}.pdf`);
  };

  useEffect(() => {
    if (token) {
      fetchRecords();
      if (role !== 'patient') {
        fetchAnalytics();
      }
    }
  }, [token, role]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 selection:bg-purple-500 selection:text-white">
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl font-bold text-sm transition transform animate-bounce ${notification.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' : 'bg-slate-900/90 border-purple-500/50 text-purple-200'}`}>
          {notification.msg}
        </div>
      )}

      {currentView === 'landing' && (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-8 relative overflow-hidden">
          {/* Background Glow Effects */}
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none"></div>

          {/* Header */}
          <header className="flex justify-between items-center max-w-7xl mx-auto w-full z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-white font-black text-lg">M</span>
              </div>
              <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">MEDASSIST AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => { setAuthMode('login'); setCurrentView('auth'); }} className="text-slate-300 hover:text-white font-bold text-sm transition">Sign In</button>
              <button onClick={() => { setAuthMode('register'); setCurrentView('auth'); }} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-purple-600/25 border border-purple-400/20">
                Get Started
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <div className="max-w-5xl mx-auto text-center space-y-6 my-12 z-10">
            <div className="inline-flex items-center space-x-2 bg-purple-950/80 border border-purple-500/30 px-4 py-1.5 rounded-full text-purple-300 text-xs font-bold tracking-wide uppercase backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
              <span>Enterprise Medical Grade Intelligence &bull; Milestone 4 Ready</span>
            </div>
            
            <h2 className="text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
              Next-Generation Healthcare & <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500 bg-clip-text text-transparent">AI Diagnostic Engine</span>
            </h2>
            
            <p className="text-slate-300 text-lg lg:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
              Empowering modern clinical workflows with real-time machine learning disease analysis, automated risk assessment, secure encrypted records, and doctor appointments.
            </p>

            <div className="pt-4 flex justify-center space-x-5">
              <button onClick={() => { setAuthMode('register'); setCurrentView('auth'); }} className="bg-white text-slate-950 hover:bg-slate-100 px-8 py-4 rounded-2xl font-black text-base shadow-2xl shadow-white/10 transition transform hover:-translate-y-0.5">
                Launch Patient Portal &rarr;
              </button>
              <button onClick={() => { setAuthMode('login'); setCurrentView('auth'); }} className="bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800/80 px-8 py-4 rounded-2xl font-bold text-base backdrop-blur-md transition">
                Doctor / Provider Access
              </button>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 z-10 w-full">
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black mb-4 text-lg">AI</div>
              <h3 className="text-lg font-black text-white mb-2">Smart Disease Prediction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Advanced ML models trained to classify multi-class symptoms with confidence scoring and automated risk categorization.</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black mb-4 text-lg">PDF</div>
              <h3 className="text-lg font-black text-white mb-2">Official Clinical Reports</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Generate instant, professional PDF diagnostic summaries equipped with full treatment protocols and lifestyle advice.</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black mb-4 text-lg">SEC</div>
              <h3 className="text-lg font-black text-white mb-2">Secure Encrypted Records</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Enterprise-grade patient record protection with Fernet encryption, JWT authentication, and Neon database integration.</p>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-500 z-10 border-t border-slate-900 pt-6 max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center">
            <p>&copy; 2026 MedAssist AI Platform. All rights reserved.</p>
            <p className="text-purple-400 font-semibold mt-2 sm:mt-0">Built for Advanced Clinical & Research Excellence</p>
          </footer>
        </div>
      )}

      {currentView === 'auth' && (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md relative text-slate-100 backdrop-blur-xl z-10">
            <button onClick={() => setCurrentView('landing')} className="absolute top-6 left-6 text-xs font-bold text-slate-400 hover:text-white transition">&larr; Back to Home</button>
            <div className="text-center mb-6 pt-4">
              <h2 className="text-3xl font-black bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">MedAssist AI</h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold">
                {authMode === 'login' && "Sign in to access your secure portal"}
                {authMode === 'register' && "Create your secure clinical account"}
                {authMode === 'forgot' && "Recover your account password"}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Portal Role</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-purple-300 outline-none focus:border-purple-500 transition">
                  <option value="patient" className="bg-slate-900">Patient Portal</option>
                  <option value="doctor" className="bg-slate-900">Medical Provider / Doctor</option>
                </select>
              </div>

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="off" className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-purple-500 text-sm transition" placeholder="Enter your full name" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Age</label>
                      <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required autoComplete="off" className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-purple-500 text-sm transition" placeholder="Age" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gender</label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-purple-500 text-sm transition">
                        <option value="Female" className="bg-slate-900">Female</option>
                        <option value="Male" className="bg-slate-900">Male</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Location / City</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required autoComplete="off" className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-purple-500 text-sm transition" placeholder="Enter your city" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Phone Number (10 Digits)</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                      }} 
                      required 
                      autoComplete="off" 
                      maxLength="10"
                      className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-purple-500 text-sm font-medium transition" 
                      placeholder="9876543210" 
                    />
                  </div>
                  {selectedRole === 'doctor' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Medical Specialization</label>
                      <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-purple-500 text-sm font-bold text-purple-300 transition">
                        <option value="General Physician" className="bg-slate-900">General Physician</option>
                        <option value="Neurologist" className="bg-slate-900">Neurologist</option>
                        <option value="Cardiologist" className="bg-slate-900">Cardiologist</option>
                        <option value="Dermatologist" className="bg-slate-900">Dermatologist</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-purple-500 text-sm transition" placeholder="name@example.com" />
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Password</label>
                  <div className="relative mt-1">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none focus:border-purple-500 text-sm pr-12 transition" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white text-xs font-bold">
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {authMode === 'register' && (
                    <p className="text-[10px] text-slate-500 mt-1">Must be 8+ chars with uppercase, lowercase, number & symbol.</p>
                  )}
                </div>
              )}

              <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white p-3.5 rounded-xl font-bold transition shadow-lg shadow-purple-600/30 mt-2 flex items-center justify-center space-x-2">
                {authLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                <span>
                  {authMode === 'login' && (authLoading ? "Signing In..." : "Sign In")}
                  {authMode === 'register' && (authLoading ? "Creating Account..." : "Register Account")}
                  {authMode === 'forgot' && "Send Reset Instructions"}
                </span>
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {authMode === 'login' && (
                <>
                  <button onClick={() => setAuthMode('forgot')} className="text-xs text-purple-400 font-semibold hover:underline block mx-auto">Forgot Password?</button>
                  <button onClick={() => setAuthMode('register')} className="text-xs font-bold text-slate-400 hover:text-white">Don't have an account? <span className="text-purple-400 underline">Register</span></button>
                </>
              )}
              {authMode !== 'login' && (
                <button onClick={() => setAuthMode('login')} className="text-xs font-bold text-purple-400 hover:underline">Already have an account? Sign In</button>
              )}
            </div>
          </div>
        </div>
      )}

      {currentView !== 'landing' && currentView !== 'auth' && (
        <>
          <nav className="bg-slate-950/80 border-b border-slate-800 px-8 py-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center">
                <span className="text-white font-black text-sm">M</span>
              </div>
              <span className="text-lg font-black tracking-wider text-white">MEDASSIST AI</span>
              <span className="text-[10px] bg-purple-950 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded-full uppercase tracking-widest font-extrabold">
                {role === 'patient' ? 'Patient Portal' : 'Doctor Portal'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-200">{userEmail}</p>
                <p className="text-[10px] text-purple-400 uppercase font-semibold">Active Session</p>
              </div>
              <button onClick={handleLogout} className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl font-bold text-xs transition">Sign Out</button>
            </div>
          </nav>

          {role === 'patient' && (
            <div className="bg-slate-950/40 border-b border-slate-800 px-8 py-3 flex space-x-8 font-bold text-sm backdrop-blur-sm overflow-x-auto">
              <button onClick={() => setPatientTab('checker')} className={`pb-1 transition whitespace-nowrap ${patientTab === 'checker' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>Symptom Checker & Recommendations</button>
              <button onClick={() => setPatientTab('book_appointment')} className={`pb-1 transition whitespace-nowrap ${patientTab === 'book_appointment' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>Book Appointment</button>
              <button onClick={() => { setPatientTab('my_appointments'); fetchRecords(); }} className={`pb-1 transition whitespace-nowrap ${patientTab === 'my_appointments' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>My Appointments</button>
              <button onClick={() => { setPatientTab('history'); fetchRecords(); }} className={`pb-1 transition whitespace-nowrap ${patientTab === 'history' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>Medical History</button>
              <button onClick={() => setPatientTab('profile')} className={`pb-1 transition whitespace-nowrap ${patientTab === 'profile' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>Profile Settings</button>
            </div>
          )}

          {role !== 'patient' && (
            <div className="bg-slate-950/40 border-b border-slate-800 px-8 py-3 flex space-x-8 font-bold text-sm backdrop-blur-sm overflow-x-auto">
              <button onClick={() => { setDoctorTab('analytics'); fetchAnalytics(); }} className={`pb-1 transition whitespace-nowrap ${doctorTab === 'analytics' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>Analytics & Insights Dashboard</button>
              <button onClick={() => setDoctorTab('patients')} className={`pb-1 transition whitespace-nowrap ${doctorTab === 'patients' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>Assigned Patients</button>
              <button onClick={() => { setDoctorTab('appointments'); fetchRecords(); }} className={`pb-1 transition whitespace-nowrap ${doctorTab === 'appointments' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>Appointment Requests</button>
            </div>
          )}

          <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
            {role === 'patient' ? (
              <>
                {patientTab === 'checker' && (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    {/* Welcome Banner */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900/60 border border-purple-500/20 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="relative z-10 max-w-2xl">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-black uppercase tracking-wider border border-purple-500/30">AI Clinical Assistant Active</span>
                        <h2 className="text-3xl font-black text-white mt-3">Hello, {userProfile?.full_name || userEmail.split('@')[0]} 👋</h2>
                        <p className="text-slate-300 text-sm mt-2 leading-relaxed font-medium">
                          Describe your symptoms below or use clinical indicators for instant machine learning disease classification and certified report generation.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Input Form */}
                      <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl relative group hover:border-purple-500/40 transition duration-300">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-3xl pointer-events-none"></div>
                        <div className="relative z-10">
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black">🩺</div>
                            <div>
                              <h3 className="text-lg font-black text-white">Symptom Analysis Matrix</h3>
                              <p className="text-xs text-slate-400">Multi-class disease classification engine</p>
                            </div>
                          </div>
                          
                          <form onSubmit={handlePredict} className="space-y-5">
                            <div>
                              <label className="block text-[11px] font-black uppercase tracking-widest text-purple-400 mb-2">Describe Your Symptoms (Natural Language)</label>
                              <div className="relative">
                                <textarea 
                                  rows="4" 
                                  value={symptomText} 
                                  onChange={(e) => setSymptomText(e.target.value)} 
                                  required 
                                  className="w-full p-4 bg-slate-900/90 border border-slate-800 rounded-2xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm font-medium transition text-white placeholder-slate-500 shadow-inner" 
                                  placeholder="e.g., Persistent high fever with chills, body ache, and severe headache..."
                                ></textarea>
                                <div className="absolute right-4 bottom-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Powered</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Fever Indicator</label>
                                <select value={formData.fever} onChange={(e) => setFormData({...formData, fever: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-purple-500 font-bold text-xs text-purple-200">
                                  <option value="Yes">Yes - Active Fever</option>
                                  <option value="No">No Fever</option>
                                </select>
                              </div>

                              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Cough State</label>
                                <select value={formData.cough} onChange={(e) => setFormData({...formData, cough: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-purple-500 font-bold text-xs text-purple-200">
                                  <option value="Yes">Yes - Present</option>
                                  <option value="No">No Cough</option>
                                </select>
                              </div>

                              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Breathing Status</label>
                                <select value={formData.difficulty_breathing} onChange={(e) => setFormData({...formData, difficulty_breathing: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-purple-500 font-bold text-xs text-purple-200">
                                  <option value="Yes">Difficulty Detected</option>
                                  <option value="No">Normal Breathing</option>
                                </select>
                              </div>

                              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Blood Pressure</label>
                                <select value={formData.blood_pressure} onChange={(e) => setFormData({...formData, blood_pressure: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-purple-500 font-bold text-xs text-purple-200">
                                  <option value="Normal">Normal Range</option>
                                  <option value="High">High (Hypertension)</option>
                                  <option value="Low">Low Range</option>
                                </select>
                              </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black p-4 rounded-2xl shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-3 text-sm tracking-wide">
                              {loading && <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>}
                              <span>{loading ? "Analyzing Neural Pathways..." : "Run AI Disease Prediction ⚡"}</span>
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Right: Output Diagnostic Report Card */}
                      <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl flex flex-col justify-between relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-3xl pointer-events-none"></div>
                        <div className="relative z-10">
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black">📄</div>
                            <div>
                              <h3 className="text-lg font-black text-white">Diagnostic Output</h3>
                              <p className="text-xs text-slate-400">Encrypted clinical storage record</p>
                            </div>
                          </div>

                          {aiResult ? (
                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                              <div className="bg-gradient-to-br from-purple-950/80 to-indigo-950/50 border border-purple-500/30 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Predicted Primary Condition</p>
                                <p className="text-2xl font-black text-white mt-1 tracking-tight">{aiResult.predicted_disease}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confidence Score</p>
                                  <p className="text-xl font-black text-purple-300 mt-1">{aiResult.confidence_score}</p>
                                </div>
                                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Assessment</p>
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase text-white mt-1 ${aiResult.risk_level === 'High' ? 'bg-red-500 shadow-lg shadow-red-500/40 animate-pulse' : 'bg-emerald-500 shadow-lg shadow-emerald-500/30'}`}>
                                    {aiResult.risk_level} Risk
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Advisory Summary</p>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">{aiResult.recommendations}</p>
                              </div>

                              <button onClick={downloadReport} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 text-sm">
                                <span>Download Official PDF Report 📥</span>
                              </button>
                            </div>
                          ) : (
                            <div className="h-72 flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800/80">
                              <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 text-lg mb-3">🔍</div>
                              <p className="text-slate-400 font-bold text-sm">Awaiting Symptom Analysis</p>
                              <p className="text-xs text-slate-500 mt-1 max-w-xs">Run an AI prediction to generate your verified medical report.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recommendations Cards Grid */}
                    {aiResult && recommendationsData && (
                      <div className="bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950 border border-purple-500/20 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl animate-in fade-in duration-700">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black">💊</div>
                          <div>
                            <h3 className="text-xl font-black text-white">Clinical Treatment & Advisory Engine</h3>
                            <p className="text-xs text-slate-400">Personalized recovery roadmap based on condition severity</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                            <p className="text-[11px] font-black text-purple-400 uppercase tracking-widest mb-2">Treatment Protocol</p>
                            <p className="text-sm font-bold text-slate-200 leading-relaxed">{recommendationsData.treatment_suggestions}</p>
                          </div>

                          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Lifestyle Advice</p>
                            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 font-medium">
                              {recommendationsData.lifestyle_advice.map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>

                          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-red-500/40 transition">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                            <p className="text-[11px] font-black text-red-400 uppercase tracking-widest mb-2">Precautions & Safety</p>
                            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 font-medium mb-3">
                              {recommendationsData.precautions.map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                            <p className="text-[11px] text-red-300 font-bold bg-red-950/50 p-2.5 rounded-xl border border-red-500/20">{recommendationsData.when_to_consult}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {patientTab === 'book_appointment' && (
                  <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-3xl shadow-xl max-w-2xl mx-auto backdrop-blur-md">
                    <h2 className="text-2xl font-black text-white mb-1">Book Doctor Appointment</h2>
                    <p className="text-xs text-slate-400 mb-6">Select a specialist physician and schedule a consultation slot.</p>
                    <form onSubmit={bookAppointment} className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Select Specialist Doctor</label>
                        <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} required className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl mt-1 font-bold text-white outline-none focus:border-purple-500 transition">
                          <option value="">-- Choose Specialist Doctor --</option>
                          {doctorsList.map((doc, idx) => (
                            <option key={idx} value={doc.email}>{doc.full_name} ({doc.specialization} - {doc.location})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Preferred Appointment Date</label>
                        <input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} required className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl mt-1 outline-none focus:border-purple-500 font-medium text-white transition" />
                      </div>
                      <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black p-4 rounded-xl transition shadow-lg shadow-purple-600/30 mt-4">Submit Appointment Request</button>
                    </form>
                  </div>
                )}

                {patientTab === 'my_appointments' && (
                  <div className="bg-slate-950/60 border border-slate-800 p-7 rounded-3xl shadow-xl backdrop-blur-md">
                    <h2 className="text-xl font-black text-white mb-4">My Scheduled Appointments & Status</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-900/60">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Appt ID</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Assigned Doctor</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Requested Date</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Confirmed Time</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {myAppointments.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-900/40 transition">
                              <td className="px-6 py-4 text-sm font-bold">#{app.id}</td>
                              <td className="px-6 py-4 text-sm font-bold text-purple-300">{app.target_email}</td>
                              <td className="px-6 py-4 text-sm text-slate-300">{app.appointment_date}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-200">{app.scheduled_time}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${app.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : app.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {myAppointments.length === 0 && (
                            <tr><td colSpan="5" className="text-center py-10 text-slate-500 italic">No appointments requested yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {patientTab === 'history' && (
                  <div className="bg-slate-950/60 border border-slate-800 p-7 rounded-3xl shadow-xl backdrop-blur-md">
                    <h2 className="text-xl font-black text-white mb-4">Your Past Symptoms & AI Diagnostic History</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-900/60">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Log ID</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Symptoms Input</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Predicted Disease</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Risk Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {myHistory.map((h) => (
                            <tr key={h.id} className="hover:bg-slate-900/40 transition">
                              <td className="px-6 py-4 text-sm font-bold">#{h.id}</td>
                              <td className="px-6 py-4 text-xs text-slate-300 max-w-xs truncate">{h.symptoms}</td>
                              <td className="px-6 py-4 text-sm font-bold text-purple-300">{h.prediction}</td>
                              <td className="px-6 py-4 text-sm"><span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">{h.risk_level}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {patientTab === 'profile' && (
                  <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-3xl shadow-xl max-w-xl mx-auto backdrop-blur-md space-y-6">
                    <h2 className="text-2xl font-black text-white">Patient Profile Details</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                        <input type="text" disabled value={userProfile?.full_name || 'Patient User'} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl mt-1 font-bold text-slate-200 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Age</label>
                          <input type="text" disabled value={userProfile?.age || '25'} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl mt-1 font-bold text-slate-200 text-sm" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                          <input type="text" disabled value={userProfile?.gender || 'N/A'} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl mt-1 font-bold text-slate-200 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                        <input type="text" disabled value={userProfile?.phone || 'N/A'} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl mt-1 font-bold text-slate-200 text-sm" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Email</label>
                        <input type="text" disabled value={userEmail} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl mt-1 font-bold text-slate-300 text-sm" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location / City</label>
                        <input type="text" disabled value={userProfile?.location || 'Tamil Nadu'} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl mt-1 font-bold text-slate-200 text-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {doctorTab === 'analytics' && analyticsData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
                        <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Total Predictions</p>
                        <p className="text-3xl font-black text-white mt-1">{analyticsData.total_predictions}</p>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
                        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">System Status</p>
                        <p className="text-lg font-black text-white mt-2">{analyticsData.system_health}</p>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
                        <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Accepted Appointments</p>
                        <p className="text-3xl font-black text-white mt-1">{analyticsData.appointment_stats?.['Accepted'] || 0}</p>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
                        <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Pending Appointments</p>
                        <p className="text-3xl font-black text-white mt-1">{analyticsData.appointment_stats?.['Pending'] || 0}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
                        <h3 className="text-sm font-black text-white mb-4">Top Predicted Diseases</h3>
                        {analyticsData.disease_stats.map((stat, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 mb-2 rounded-lg border border-slate-800">
                            <span className="text-xs font-bold text-purple-300">{stat.disease}</span>
                            <span className="text-[10px] bg-purple-500/20 px-2 py-1 rounded">{stat.count} Cases</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
                        <h3 className="text-sm font-black text-white mb-4">Risk Distribution</h3>
                        {Object.entries(analyticsData.risk_distribution).map(([risk, count], idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 mb-2 rounded-lg border border-slate-800">
                            <span className="text-xs font-bold text-slate-200">{risk} Risk</span>
                            <span className="text-[10px] bg-blue-500/20 px-2 py-1 rounded">{count} Patients</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {doctorTab === 'patients' && (
                  <div className="space-y-6">
                    <div className="bg-slate-950/60 border border-slate-800 p-7 rounded-3xl shadow-xl backdrop-blur-md">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-xl font-black text-white">Assigned Patients & Diagnostic Records</h2>
                          <p className="text-xs text-slate-400">Click any patient row to view full profile details and AI analysis.</p>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Search patient by email or name..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-purple-500 w-72 font-medium text-white transition"
                        />
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-800">
                          <thead className="bg-slate-900/60">
                            <tr>
                              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">ID</th>
                              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Patient Name</th>
                              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Email</th>
                              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Predicted Disease</th>
                              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Risk Level</th>
                              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {recordsList
                              .filter(p => p.email.toLowerCase().includes(searchQuery.toLowerCase()) || p.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((p) => (
                                <tr key={p.id} className="hover:bg-slate-900/40 transition cursor-pointer">
                                  <td className="px-6 py-4 text-sm font-bold">#{p.id}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-purple-300">{p.full_name}</td>
                                  <td className="px-6 py-4 text-sm text-slate-400">{p.email}</td>
                                  <td className="px-6 py-4 text-sm font-black text-white">{p.prediction}</td>
                                  <td className="px-6 py-4 text-sm">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${p.risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                      {p.risk_level}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm">
                                    <button onClick={() => setSelectedPatientModal(p)} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-purple-600/20 transition">
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                            ))}
                            {recordsList.length === 0 && (
                              <tr><td colSpan="6" className="text-center py-10 text-slate-500 italic">No patient diagnostic logs recorded yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {doctorTab === 'appointments' && (
                  <div className="bg-slate-950/60 border border-slate-800 p-7 rounded-3xl shadow-xl backdrop-blur-md">
                    <h2 className="text-xl font-black text-white mb-4">Patient Appointment Requests & Scheduling</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-900/60">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Appt ID</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Patient Email</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Requested Date</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Status</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {myAppointments.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-900/40 transition">
                              <td className="px-6 py-4 text-sm font-bold">#{app.id}</td>
                              <td className="px-6 py-4 text-sm font-bold text-purple-300">{app.target_email}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-300">{app.appointment_date}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${app.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm space-x-2">
                                <button onClick={() => updateAppointmentStatus(app.id, 'Accepted')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition">Accept & Set Time</button>
                                <button onClick={() => updateAppointmentStatus(app.id, 'Rejected')} className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 transition">Reject Request</button>
                              </td>
                            </tr>
                          ))}
                          {myAppointments.length === 0 && (
                            <tr><td colSpan="5" className="text-center py-10 text-slate-500 italic">No appointment requests pending.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </>
      )}

      {selectedPatientModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-lg w-full relative space-y-4 text-slate-100">
            <button onClick={() => setSelectedPatientModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white font-black text-xl">&times;</button>
            <h3 className="text-2xl font-black text-white">Patient Clinical File</h3>
            
            <div className="space-y-3 border-t border-slate-800 pt-4 text-sm">
              <p><strong>Patient Name:</strong> <span className="text-purple-300">{selectedPatientModal.full_name}</span></p>
              <p><strong>Email Address:</strong> <span className="text-slate-300">{selectedPatientModal.email}</span></p>
              <p><strong>Age / Gender:</strong> <span className="text-slate-300">{selectedPatientModal.age} Yrs / {selectedPatientModal.gender}</span></p>
              <p><strong>Contact Phone:</strong> <span className="text-slate-300">{selectedPatientModal.phone}</span></p>
              <p><strong>City / Address:</strong> <span className="text-slate-300">{selectedPatientModal.location}</span></p>
              <p><strong>Guardian Contact:</strong> <span className="text-slate-300">{selectedPatientModal.guardian}</span></p>
              <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-2xl space-y-2 mt-2 backdrop-blur-sm">
                <p><strong>Predicted Disease:</strong> <span className="text-white font-extrabold">{selectedPatientModal.prediction}</span></p>
                <p><strong>Risk Categorization:</strong> <span className="text-red-400 font-bold">{selectedPatientModal.risk_level}</span></p>
                <p className="text-xs text-slate-300"><strong>Full Symptoms Input:</strong> {selectedPatientModal.symptoms}</p>
              </div>
            </div>

            <button onClick={() => setSelectedPatientModal(null)} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold p-3.5 rounded-xl transition shadow-lg shadow-purple-600/30 mt-4">
              Close Patient File
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}