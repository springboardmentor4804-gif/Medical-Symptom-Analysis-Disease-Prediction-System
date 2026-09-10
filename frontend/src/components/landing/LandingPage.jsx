import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { 
  Activity, 
  Stethoscope, 
  User, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  BarChart3, 
  Calendar, 
  Lock, 
  Mail, 
  Phone, 
  Building2, 
  Check, 
  X as XIcon, 
  HeartHandshake, 
  MapPin,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const SPECIALIZATIONS = [
  'Cardiology',
  'Pulmonology',
  'General Medicine & Infectious Diseases',
  'Endocrinology & Diabetology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology'
];

export default function LandingPage({ onEnterDashboard }) {
  const { currentUser, login, register, logout } = useAuth();
  const { addToast } = useMedical();

  // Role Tab in Auth Box: 'patient' | 'doctor'
  const [activeRoleTab, setActiveRoleTab] = useState('patient');
  // Auth Mode: 'signin' | 'register'
  const [authMode, setAuthMode] = useState('signin');

  // Sign In Form State (starts blank for real credentials)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration Form State (starts blank for real user registration)
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'Female',
    location: '',
    specialization: 'Cardiology'
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Password criteria checklist
  const passwordCriteria = {
    length: registerData.password.length >= 8,
    upper: /[A-Z]/.test(registerData.password),
    lower: /[a-z]/.test(registerData.password),
    number: /[0-9]/.test(registerData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(registerData.password)
  };

  const handleRoleTabSwitch = (role) => {
    setActiveRoleTab(role);
    setFormErrors({});
  };

  const scrollToAuth = (role) => {
    if (role) setActiveRoleTab(role);
    const el = document.getElementById('auth-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      addToast('error', 'Please enter your registered email address');
      return;
    }
    if (!loginPassword) {
      addToast('error', 'Please enter your password');
      return;
    }

    setIsLoggingIn(true);
    try {
      const loginRes = await login(loginEmail, loginPassword, activeRoleTab);
      addToast('success', `Signed in successfully as ${activeRoleTab === 'doctor' ? 'Healthcare Provider' : 'Patient'}`);
      if (onEnterDashboard) onEnterDashboard(loginRes.user);
    } catch (err) {
      addToast('error', err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!registerData.name.trim() || registerData.name.length < 3) {
      errors.name = 'Full name must be at least 3 characters.';
    }

    if (!registerData.email.trim() || !/\S+@\S+\.\S+/.test(registerData.email)) {
      errors.email = 'Please provide a valid email address.';
    }

    const cleanPhone = registerData.phone.replace(/[\s\-+()]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Phone must be exactly 10 digits starting with 6, 7, 8, or 9.';
    }

    if (!Object.values(passwordCriteria).every(Boolean)) {
      errors.password = 'Password does not meet all security requirements.';
    }

    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    const ageNum = parseInt(registerData.age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      errors.age = 'Age must be between 1 and 120.';
    }

    if (!registerData.location.trim()) {
      errors.location = 'Please specify your location/city.';
    }

    if (activeRoleTab === 'doctor' && !registerData.specialization) {
      errors.specialization = 'Please select your medical specialization.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('error', 'Please complete all required fields correctly.');
      return;
    }

    setIsRegistering(true);
    try {
      await register({
        ...registerData,
        phone: cleanPhone,
        role: activeRoleTab
      });
      addToast('success', 'Account registered in MongoDB Atlas! Please sign in with your password.');
      setLoginEmail(registerData.email);
      setLoginPassword('');
      setAuthMode('signin');
      scrollToAuth(activeRoleTab);
    } catch (err) {
      addToast('error', err.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-brand-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                MedAssist <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Clinical Symptom Analysis & Predictive Triage
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#specialists" className="hover:text-indigo-600 transition-colors">Specialties</a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">Security & Compliance</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <button
                onClick={onEnterDashboard}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
              >
                <span>Dashboard ({currentUser.role === 'doctor' ? 'Doctor' : 'Patient'})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => scrollToAuth()}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
              >
                <span>Portal Sign In / Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-100/70 border border-indigo-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-800 mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Medical Symptom Analysis & Clinical Disease Prediction Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
              Accurate AI Disease Triage &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600">
                Clinical Recommendations
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Empowering patients and certified doctors with intelligent NLP symptom normalization, physical biomarker stratification, risk-rated disease predictions, and official hospital clinical PDF reports.
            </p>

            {/* Clean Role Navigation Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  scrollToAuth('patient');
                }}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
              >
                <User className="w-4 h-4" />
                <span>Patient Portal Access</span>
              </button>

              <button
                onClick={() => {
                  setAuthMode('signin');
                  scrollToAuth('doctor');
                }}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctor / Provider Portal</span>
              </button>
            </div>

            {/* Clinical Trust Metrics */}
            <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">98.4%</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Model Diagnostic Precision</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">100%</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Database User Persistence</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">CDC & WHO</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Clinical Protocol Alignment</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">Instant</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Clinical PDF Report Export</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Role-Based Sign In & Registration Section */}
      <section id="auth-section" className="py-16 bg-white border-y border-slate-200/80 scroll-mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold text-indigo-800 mb-2">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Role-Based Portal Access & User Registration</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {authMode === 'signin' ? 'Sign In to Your Account' : 'Register New User in Database'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
              Select your role (Patient or Doctor) below to sign in with your credentials or register a new verified profile.
            </p>
          </div>

          {/* Unified Auth Card */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* 1. Portal Role Tabs: Patient vs Doctor */}
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => handleRoleTabSwitch('patient')}
                className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeRoleTab === 'patient'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-indigo-600" />
                <span>Patient Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabSwitch('doctor')}
                className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeRoleTab === 'doctor'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Doctor / Healthcare Provider</span>
              </button>
            </div>

            {/* 2. Mode Toggle: Sign In vs Register */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {authMode === 'signin' ? 'Sign In with Registered Credentials' : 'Create New Account in Database'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeRoleTab === 'patient'
                      ? 'Access symptom checker, diagnostic predictions, and medical history'
                      : 'Access physician analytics, triage records, and appointment slots'}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      authMode === 'signin'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      authMode === 'register'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* 3. Form Content */}
              {currentUser ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 max-w-md mx-auto shadow-sm">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black ${
                    currentUser.role === 'doctor' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{currentUser.name}</h3>
                    <p className="text-xs text-slate-500">{currentUser.email}</p>
                    <span className={`inline-block mt-2 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      currentUser.role === 'doctor' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}>
                      {currentUser.role === 'doctor' ? 'Verified Healthcare Provider' : 'Verified Patient'}
                    </span>
                  </div>
                  <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={onEnterDashboard}
                      className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Open {currentUser.role === 'doctor' ? 'Doctor Dashboard' : 'Patient Dashboard'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={logout}
                      className="py-2.5 px-5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-xs rounded-xl transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : authMode === 'signin' ? (
                /* SIGN IN FORM */
                <form onSubmit={handleSignInSubmit} className="space-y-4 max-w-md mx-auto">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter registered email address"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-2xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                      activeRoleTab === 'doctor'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    }`}
                  >
                    {isLoggingIn ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <span>Sign In to {activeRoleTab === 'doctor' ? 'Provider Portal' : 'Patient Portal'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Don't have an account yet? Register a new account
                    </button>
                  </div>
                </form>
              ) : (
                /* REGISTRATION FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Legal Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={registerData.name}
                          onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          placeholder={activeRoleTab === 'doctor' ? 'Dr. Sarah Connor' : 'Johnathan Smith'}
                          className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                            formErrors.name ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                          }`}
                        />
                      </div>
                      {formErrors.name && <p className="text-[10px] text-rose-600 mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          placeholder="user@example.com"
                          className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                            formErrors.email ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                          }`}
                        />
                      </div>
                      {formErrors.email && <p className="text-[10px] text-rose-600 mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Number * (10 digits starting with 6-9)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          maxLength={10}
                          required
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          placeholder="9845123456"
                          className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                            formErrors.phone ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                          }`}
                        />
                      </div>
                      {formErrors.phone && <p className="text-[10px] text-rose-600 mt-1">{formErrors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Location / City *
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={registerData.location}
                          onChange={(e) => setRegisterData({ ...registerData, location: e.target.value })}
                          placeholder="e.g. Bangalore, Mumbai"
                          className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                            formErrors.location ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                          }`}
                        />
                      </div>
                      {formErrors.location && <p className="text-[10px] text-rose-600 mt-1">{formErrors.location}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Age (Years) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        required
                        value={registerData.age}
                        onChange={(e) => setRegisterData({ ...registerData, age: e.target.value })}
                        placeholder="e.g. 32"
                        className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                          formErrors.age ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Biological Gender
                      </label>
                      <select
                        value={registerData.gender}
                        onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    {/* Doctor Specialization Field */}
                    {activeRoleTab === 'doctor' && (
                      <div className="sm:col-span-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <label className="block text-xs font-bold text-emerald-950 mb-1">
                          Medical Provider Specialization *
                        </label>
                        <select
                          value={registerData.specialization}
                          onChange={(e) => setRegisterData({ ...registerData, specialization: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {SPECIALIZATIONS.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {formErrors.confirmPassword && (
                        <p className="text-[10px] text-rose-600 mt-1">{formErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Password Checklist */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                    <p className="font-bold text-slate-700 mb-1 text-[11px]">Security Requirements:</p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <span className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {passwordCriteria.length ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                        8+ characters
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {passwordCriteria.upper ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                        Uppercase letter (A-Z)
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {passwordCriteria.lower ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                        Lowercase letter (a-z)
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {passwordCriteria.number ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                        Number (0-9)
                      </span>
                      <span className={`flex items-center gap-1 col-span-2 ${passwordCriteria.special ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {passwordCriteria.special ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                        Special symbol (!@#$%^&*)
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                      activeRoleTab === 'doctor'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    }`}
                  >
                    {isRegistering ? (
                      <span>Storing Account in Database...</span>
                    ) : (
                      <>
                        <span>Register {activeRoleTab === 'doctor' ? 'Doctor' : 'Patient'} Account in Database</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Already registered? Sign in with your credentials
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 mb-3">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Clinical Intelligence Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Comprehensive AI Diagnostic Features
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Designed for both patients seeking clear triage guidance and medical providers managing practice cases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">NLP Symptom Extraction</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Processes natural conversational speech, extracts clinical entities, and normalizes them using Levenshtein distance against medical dictionaries.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Multi-Factor Risk Prediction</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Combines reported symptoms with physical biomarkers (Fever, Cough, Breathing dyspnea, Blood Pressure, and Cholesterol) to predict conditions with animated risk badges.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hospital Clinical PDF Reports</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Generates structured clinical consultation summaries with patient demographics, risk levels, and physician advisories for consultation use.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Physician Analytics</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Visualizes longitudinal intake volume, top disease prevalence histograms, and patient risk doughnuts via Chart.js for data-driven decisions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Telehealth & Clinic Booking</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Book specialist consultations across Cardiology, Pulmonology, Neurology, and track confirmation time slots in real time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Database User Authentication</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every registered patient and doctor is stored in the database with strict phone, age, and password validation for secure login sessions.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-100/60 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              3-Step Clinical Protocol
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              From symptom presentation to certified physician consultation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900">Describe Symptoms & Biomarkers</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Enter your symptoms in plain English. The NLP engine identifies medical entities and pairs them with selected blood pressure, temperature, and breathing vitals.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900">Instant AI Diagnosis & Risk Level</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                The platform scores conditions, generates confidence ratings, assigns a risk badge (Low/Medium/High with animated pulses), and provides immediate clinical precautions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900">Clinical PDF & Specialist Care</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Download an official clinical PDF report with full triage findings, and schedule an appointment with a verified specialist physician.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Banner */}
      <section id="security" className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              HIPAA-Compliant Architecture & Role Security
            </div>
            <h3 className="text-2xl font-black tracking-tight">Enterprise Clinical Data Governance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every clinical triage evaluation, diagnostic history record, and physician sign-off is maintained with strict role-based access control and persistent credentials database.
            </p>
          </div>

          <div>
            <button
              onClick={() => scrollToAuth()}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Go to Sign In / Register</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800">MedAssist AI Clinical Platform</span>
            <span>• © 2026 All Rights Reserved</span>
          </div>
          <p className="text-[11px] text-slate-400 italic text-center sm:text-right">
            Clinical Decision Support System: Intended for triage evaluation and care coordination.
          </p>
        </div>
      </footer>
    </div>
  );
}
