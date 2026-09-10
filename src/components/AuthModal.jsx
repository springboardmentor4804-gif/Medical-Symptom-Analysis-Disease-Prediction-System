import React, { useState } from 'react';
import { db } from '../services/db';
import { Stethoscope, User, Lock, Mail, UserPlus, LogIn, AlertCircle, Sparkles, Award, Calendar } from 'lucide-react';

const DOCTOR_SPECIALTIES = [
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'General Physician',
  'Pediatrician',
  'Orthopedist',
  'Psychiatrist',
  'Pulmonologist'
];

export default function AuthModal({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    role: 'patient', // 'patient' | 'doctor' | 'admin'
    specialty: 'Cardiologist',
    experienceYears: '5',
    qualifications: 'MBBS, MD'
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      role,
      specialty: role === 'doctor' ? 'Cardiologist' : ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        if (!formData.firstName || !formData.lastName || !formData.username || !formData.password || !formData.email) {
          setError('Please fill out all required fields to register.');
          return;
        }

        if (formData.role === 'doctor' && (!formData.experienceYears || !formData.qualifications)) {
          setError('Please specify your Years of Experience and Medical Qualifications.');
          return;
        }

        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }

        db.registerUser(formData);
        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
          const user = db.loginUser(formData.username, formData.password);
          onLoginSuccess(user);
        }, 500);

      } else {
        // Login Flow
        if (!formData.username || !formData.password) {
          setError('Please enter your Username and Password.');
          return;
        }

        const user = db.loginUser(formData.username, formData.password);
        setSuccessMsg('Login successful! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(user);
        }, 400);
      }
    } catch (err) {
      setError(err.message || 'Authentication error. Please check your credentials.');
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card glass-panel fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <Sparkles className="brand-glow" size={30} />
          </div>
          <h2 className="heading-title">
            {mode === 'login' ? 'MediAI Sign In' : 'MediAI Registration'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Enter your username and password to log in'
              : 'Sign up first if you do not have an account'}
          </p>
        </div>

        {/* Mode Toggle Tabs: Sign In vs Sign Up */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
          >
            <UserPlus size={16} /> Sign Up First
          </button>
        </div>

        {error && (
          <div className="alert-banner alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner alert-success">
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'login' ? (
            <>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary btn-block btn-lg margin-top">
                <LogIn size={18} /> Sign In
              </button>

              <div className="demo-login-box margin-top-xs padding-xs background-dark border-radius-sm border-glass text-center">
                <span className="text-xs text-muted font-bold block margin-bottom-xs">⚡ Quick Demo Login:</span>
                <div className="flex-gap justify-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const user = db.loginUser('dr_sarah', 'password123');
                      if (user) onLoginSuccess(user);
                    }}
                    className="btn-secondary btn-xs flex-gap"
                  >
                    <Stethoscope size={13} color="#06b6d4" />
                    <span>Doctor Dashboard (Dr. Sarah)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const user = db.loginUser('alex_patient', 'password123');
                      if (user) onLoginSuccess(user);
                    }}
                    className="btn-secondary btn-xs flex-gap"
                  >
                    <User size={13} color="#10b981" />
                    <span>Patient Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const user = db.loginUser('admin', 'admin123');
                      if (user) onLoginSuccess(user);
                    }}
                    className="btn-secondary btn-xs flex-gap"
                  >
                    <Award size={13} color="#f59e0b" />
                    <span>Admin Dashboard</span>
                  </button>
                </div>
              </div>

              <div className="auth-switch-prompt text-center margin-top-sm">
                <span className="text-muted">Don't have an account yet? </span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setMode('signup'); setError(''); }}
                >
                  Sign Up / Register Here
                </button>
              </div>

            </>
          ) : (
            <>
              {/* Select Role */}
              <div className="form-group">
                <label className="form-label">Select Account Role</label>
                <div className="role-selector">
                  <button
                    type="button"
                    className={`role-card ${formData.role === 'patient' ? 'selected' : ''}`}
                    onClick={() => handleRoleChange('patient')}
                  >
                    <User size={22} />
                    <div className="role-title">Patient</div>
                    <div className="role-desc">Symptoms & Healthcare Workspace</div>
                  </button>

                  <button
                    type="button"
                    className={`role-card ${formData.role === 'doctor' ? 'selected' : ''}`}
                    onClick={() => handleRoleChange('doctor')}
                  >
                    <Stethoscope size={22} />
                    <div className="role-title">Doctor / Specialist</div>
                    <div className="role-desc">Specialist clinical queue</div>
                  </button>
                </div>
              </div>

              {/* Sub-options for Doctor Specialization, Experience, Qualifications */}
              {formData.role === 'doctor' && (
                <div className="doctor-signup-extra slide-down">
                  <div className="form-group">
                    <label className="form-label">Specialization / Role Sub-option</label>
                    <select
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                      className="form-input custom-select"
                    >
                      {DOCTOR_SPECIALTIES.map(spec => (
                        <option key={spec} value={spec}>
                          Dr. {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Years of Experience</label>
                      <div className="input-with-icon">
                        <Calendar size={18} className="input-icon" />
                        <input
                          type="number"
                          name="experienceYears"
                          placeholder="e.g. 10"
                          value={formData.experienceYears}
                          onChange={handleChange}
                          className="form-input"
                          min="0"
                          max="60"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Medical Qualifications</label>
                      <div className="input-with-icon">
                        <Award size={18} className="input-icon" />
                        <input
                          type="text"
                          name="qualifications"
                          placeholder="e.g. MBBS, MD, FACC"
                          value={formData.qualifications}
                          onChange={handleChange}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email (Gmail / Email)</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="yourname@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary btn-block btn-lg margin-top">
                <UserPlus size={18} /> Complete Sign Up
              </button>

              <div className="auth-switch-prompt text-center margin-top-sm">
                <span className="text-muted">Already registered? </span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setMode('login'); setError(''); }}
                >
                  Sign In to Your Account
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
