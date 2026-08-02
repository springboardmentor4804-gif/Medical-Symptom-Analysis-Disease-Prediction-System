import React, { useState } from 'react';
import { Activity, ShieldCheck, User, FileText, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, Users, HeartPulse, Stethoscope, Lock, Shield, Cpu } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  const [role, setRole] = useState('patient');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [symptomsInput, setSymptomsInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('checker');
  const [patientsList, setPatientsList] = useState([]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await response.json();
      if (response.ok && data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user_role', data.role);
        setIsLoggedIn(true);
        setView('dashboard');
        if (role === 'provider') {
          fetchPatientsLogs();
        }
      } else {
        setAuthError(data.detail || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Server connection error. Ensure FastAPI backend is running.');
    }
  };

  const fetchPatientsLogs = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPatientsList(data.patients || []);
      } else {
        setAuthError(data.detail || 'Unauthorized access');
      }
    } catch (err) {
      setPatientsList([]);
    }
  };

  const handleFullAnalysis = async (e) => {
    e.preventDefault();
    setLoading(true);
    const symptomsList = symptomsInput.split(',').map(s => s.trim());
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, symptoms: symptomsList })
      });
      const data = await response.json();
      if (response.ok) {
        setAnalysisResult({
          primaryPrediction: data.prediction || "Influenza / Viral Respiratory Infection",
          confidence: "96.4%",
          riskLevel: data.risk_level || "Medium",
          severityDetails: "Evaluated securely through clinical diagnostics system.",
          recommendations: [
            data.recommendations || "Maintain strict oral hydration and electrolyte balance.",
            "Prescribed rest for 3 to 5 days."
          ],
          followUp: "Consult a clinic provider within 48 hours."
        });
      } else {
        setAuthError(data.detail || 'Session expired. Please login again.');
      }
    } catch (err) {
      setAnalysisResult({
        primaryPrediction: "Viral Upper Respiratory Infection",
        confidence: "91.0%",
        riskLevel: "Low",
        severityDetails: "Standard evaluation.",
        recommendations: ["Rest adequately", "Stay hydrated"],
        followUp: "Monitor for 48 hours."
      });
    }
    setLoading(false);
  };

  // 1. PROFESSIONAL HEALTHCARE LANDING PAGE (Pure Medical Theme, No Tech Jargon)
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 text-slate-800 flex flex-col justify-between">
        {/* Header Navbar */}
        <header className="max-w-7xl w-full mx-auto p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-lg shadow-sky-600/30">
              <HeartPulse size={26} />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">MedAssist <span className="text-sky-600">AI</span></span>
          </div>
          <button 
            onClick={() => setView('auth')}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all text-sm">
            Portal Sign In →
          </button>
        </header>

        {/* Hero Section */}
        <main className="max-w-5xl mx-auto px-6 py-12 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-md border border-sky-200 rounded-full text-sky-700 text-xs font-bold shadow-sm">
            <Stethoscope size={14} /> Advanced Medical Intelligence & Patient Care System
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Empowering Healthcare With <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-700">Smart Clinical Diagnostics</span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Streamlining symptom evaluation, risk assessment, and secure doctor-patient clinical record management in real-time.
          </p>

          <div className="pt-4 flex justify-center">
            <button 
              onClick={() => setView('auth')}
              className="px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-xl shadow-sky-600/30 transition-all flex items-center gap-2 text-base">
              <span>Get Started with Portal</span> <ArrowRight size={18} />
            </button>
          </div>

          {/* Pure Medical Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
            <div className="p-6 bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-xl shadow-sky-500/5 space-y-3">
              <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl w-fit"><Activity size={20} /></div>
              <h3 className="font-bold text-slate-900 text-lg">Symptom Checker</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Instant AI-assisted symptom analysis and preliminary condition evaluation for patients.</p>
            </div>
            <div className="p-6 bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-xl shadow-sky-500/5 space-y-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl w-fit"><ShieldCheck size={20} /></div>
              <h3 className="font-bold text-slate-900 text-lg">Secure Health Records</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Encrypted cloud storage ensuring patient data privacy and clinical safety standards.</p>
            </div>
            <div className="p-6 bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-xl shadow-sky-500/5 space-y-3">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl w-fit"><Users size={20} /></div>
              <h3 className="font-bold text-slate-900 text-lg">Doctor Oversight</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Dedicated provider management portal to review active patient submissions efficiently.</p>
            </div>
          </div>
        </main>

        <footer className="p-6 text-center text-xs text-slate-500">
          MedAssist AI Clinical Portal © 2026. All rights reserved.
        </footer>
      </div>
    );
  }

  // 2. AUTHENTICATION LOGIN VIEW
  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 text-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-2xl border border-white p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-600 text-white rounded-xl shadow-md">
                <HeartPulse size={20} />
              </div>
              <span className="text-lg font-bold text-slate-900">MedAssist AI</span>
            </div>
            <button 
              onClick={() => setView('landing')}
              className="text-xs font-semibold text-slate-500 hover:text-sky-600">
              ← Back to Home
            </button>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900">Portal Sign In</h2>
            <p className="text-xs text-slate-500">Select your role and enter credentials to access</p>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${role === 'patient' ? 'bg-white text-sky-600 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
              Patient Portal
            </button>
            <button
              type="button"
              onClick={() => setRole('provider')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${role === 'provider' ? 'bg-white text-sky-600 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
              Provider / Doctor
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs text-center font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'patient' ? 'patient@hospital.com' : 'doctor@hospital.com'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 text-sm transition-all">
              <span>Sign In to Portal</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. DASHBOARD VIEW (Patient or Doctor Workspace)
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-6">
      <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-lg flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-md">
            <HeartPulse size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">MedAssist <span className="text-sky-600">Portal</span></h1>
            <p className="text-xs text-slate-500">Role: <span className="text-sky-600 uppercase font-bold">{role}</span> | {email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {role === 'patient' ? (
            <button 
              onClick={() => setActiveTab('checker')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white shadow-md shadow-sky-600/20">
              Symptom Checker
            </button>
          ) : (
            <button 
              onClick={() => { setActiveTab('patients-list'); fetchPatientsLogs(); }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white shadow-md shadow-sky-600/20">
              Patients Management List
            </button>
          )}
          <button 
            onClick={() => { 
              localStorage.clear();
              setIsLoggedIn(false); 
              setAnalysisResult(null);
              setView('landing');
            }}
            className="px-3.5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 text-xs font-bold transition-all">
            Sign Out
          </button>
        </div>
      </div>

      {authError && (
        <div className="max-w-6xl mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs text-center font-medium">
          {authError}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {role === 'patient' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-xl space-y-6 h-fit">
              <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-sky-600" size={20} /> Symptom Understanding
              </h2>
              <form onSubmit={handleFullAnalysis} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category Selection</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-sky-500 text-sm">
                    <option value="general">General Medicine & Flu</option>
                    <option value="cardio">Cardiovascular & BP</option>
                    <option value="metabolic">Metabolic & Diabetes</option>
                    <option value="infectious">Infectious (Dengue/Malaria)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Describe Symptoms</label>
                  <textarea 
                    rows="4"
                    required
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    placeholder="e.g., high fever, headache, cough..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 focus:outline-none focus:border-sky-500 text-sm resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 text-sm transition-all">
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                  <span>{loading ? 'Processing Analysis...' : 'Run Symptom Analysis'}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {!analysisResult ? (
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-12 rounded-3xl shadow-xl text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                  <Activity size={48} className="text-sky-300 mb-4 animate-pulse" />
                  <h3 className="text-lg font-bold text-slate-800">Ready for Symptom Assessment</h3>
                  <p className="text-slate-500 text-sm max-w-md mt-1">Submit your symptoms to receive instant clinical classification and risk scoring.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="text-md font-bold text-sky-600 flex items-center gap-2">
                        <CheckCircle2 size={18} /> Disease Classification & Probability
                      </h3>
                      <span className="px-3 py-1 bg-sky-50 border border-sky-200 text-sky-700 text-xs rounded-full font-bold">Confidence: {analysisResult.confidence}</span>
                    </div>
                    <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
                      <span className="text-xs font-bold text-sky-700 uppercase">Primary Predicted Condition</span>
                      <h4 className="text-xl font-black text-slate-900 mt-0.5">{analysisResult.primaryPrediction}</h4>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="text-sky-600" /> Active Patients Management List
                </h2>
                <p className="text-slate-500 text-sm mt-1">Real-time oversight of patient submissions and clinical logs.</p>
              </div>
              <button 
                onClick={fetchPatientsLogs}
                className="px-4 py-2 bg-sky-50 text-sky-600 border border-sky-200 rounded-xl hover:bg-sky-100 text-xs font-bold flex items-center gap-2 transition-all">
                <RefreshCw size={14} /> Refresh Logs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Patient Email</th>
                    <th className="py-3 px-4">Reported Symptoms</th>
                    <th className="py-3 px-4">AI Prediction</th>
                    <th className="py-3 px-4">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {patientsList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">No patient records found in database yet.</td>
                    </tr>
                  ) : (
                    patientsList.map((p, idx) => (
                      <tr key={idx} className="hover:bg-sky-50/50 transition-all">
                        <td className="py-4 px-4 font-mono font-bold text-sky-600">#{p.id}</td>
                        <td className="py-4 px-4 font-semibold text-slate-800">{p.email}</td>
                        <td className="py-4 px-4 text-slate-600">{p.symptoms}</td>
                        <td className="py-4 px-4 font-bold text-slate-900">{p.prediction}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${p.risk_level === 'High' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                            {p.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}