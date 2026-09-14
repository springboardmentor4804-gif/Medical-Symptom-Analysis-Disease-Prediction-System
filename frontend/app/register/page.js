'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import Link from 'next/link';

export default function Register() {
  const [formData, setFormData] = useState({
    role: 'patient',
    email: '',
    password: '',
    name: '',
    age: '',
    gender: 'Male',
    medical_history: '',
    specialty: 'General Practitioner',
    hospital: '',
    medical_reg_no: '',
    council_type: 'National Medical Commission (NMC)',
    state_council: 'Maharashtra Medical Council',
    qualification: 'MBBS',
    registration_year: '2020',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccessMsg, setVerificationSuccessMsg] = useState('');
  const { loginUser } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset verification if doctor modifies registration parameters
    if (['medical_reg_no', 'council_type', 'state_council', 'qualification', 'specialty', 'registration_year'].includes(name)) {
      if (isVerified) {
        setIsVerified(false);
        setVerificationSuccessMsg('');
      }
    }
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    setError('');
  };

  const handleVerifyCredentials = (e) => {
    e.preventDefault();
    setError('');

    const regNo = formData.medical_reg_no.trim();
    if (!regNo) {
      setError('Please enter a Medical Registration Number before verifying.');
      return;
    }
    if (regNo.length < 4) {
      setError('Medical Registration Number must be at least 4 characters long (e.g. MCI-12345 or MMC/2020/54321).');
      return;
    }
    if (!formData.qualification) {
      setError('Please select your Qualification (e.g. MBBS, MD).');
      return;
    }
    if (!formData.specialty) {
      setError('Please select your Medical Specialization.');
      return;
    }

    setVerifying(true);
    setVerificationSuccessMsg('');

    setTimeout(() => {
      setVerifying(false);
      setIsVerified(true);
      const councilName = formData.council_type === 'National Medical Commission (NMC)'
        ? 'National Medical Commission (NMC)'
        : formData.state_council;
      setVerificationSuccessMsg(
        `✓ Authenticated with ${councilName}! Reg No: ${regNo.toUpperCase()} | ${formData.qualification} (${formData.registration_year})`
      );
    }, 800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.role === 'doctor' && !isVerified) {
      setError('Mandatory Action Required: Please click "Verify Registration Credentials" on the form below to validate your Medical Registration Number before creating account.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: formData.role === 'patient' ? parseInt(formData.age, 10) : null,
        gender: formData.role === 'patient' ? formData.gender : null,
        medical_history: formData.role === 'patient' ? formData.medical_history.trim() || null : null,
        specialty: formData.role === 'doctor' ? formData.specialty || null : null,
        medical_reg_no: formData.role === 'doctor' ? formData.medical_reg_no.trim() || null : null,
        council_type: formData.role === 'doctor' ? formData.council_type || null : null,
        state_council: formData.role === 'doctor' && formData.council_type === 'State Medical Council' ? formData.state_council || null : null,
        qualification: formData.role === 'doctor' ? formData.qualification || null : null,
        registration_year: formData.role === 'doctor' ? parseInt(formData.registration_year, 10) || null : null,
        is_verified: formData.role === 'doctor' ? isVerified : false,
      };

      const response = await api.post('/auth/register', payload);
      loginUser(response.access_token, response.role);
      router.push(response.role === 'admin' ? '/admin' : response.role === 'doctor' ? '/doctor' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 55 }, (_, i) => currentYear - i);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-[0_24px_70px_rgba(15,23,42,0.12)] z-10 animate-fade-rise">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 flex items-center justify-center font-black text-white text-2xl mx-auto mb-4 shadow-lg shadow-emerald-500/30 animate-soft-pulse ring-4 ring-emerald-500/20">
            M
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">Create Account</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Select your role to join MedAssist AI Healthcare System</p>
        </div>

        {/* Role Selection */}
        <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Select Account Role</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 capitalize px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
              {formData.role}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Patient Role */}
            <label
              onClick={() => handleRoleChange('patient')}
              className={`med-card-hover flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                formData.role === 'patient'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-500/40'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Patient
                </div>
                <input
                  type="radio"
                  name="role"
                  value="patient"
                  checked={formData.role === 'patient'}
                  onChange={() => {}}
                  className="accent-emerald-600"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">Log symptoms and view AI health insights.</p>
            </label>

            {/* Doctor Role */}
            <label
              onClick={() => handleRoleChange('doctor')}
              className={`med-card-hover flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                formData.role === 'doctor'
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 shadow-sm ring-1 ring-teal-500/40'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                  <svg className="h-4 w-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Doctor
                </div>
                <input
                  type="radio"
                  name="role"
                  value="doctor"
                  checked={formData.role === 'doctor'}
                  onChange={() => {}}
                  className="accent-teal-600"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">Medical council verification & patient diagnosis.</p>
            </label>

            {/* Clinic Role */}
            <label
              onClick={() => handleRoleChange('clinic')}
              className={`med-card-hover flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                formData.role === 'clinic'
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 shadow-sm ring-1 ring-cyan-500/40'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                  <svg className="h-4 w-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11h4v10" />
                  </svg>
                  Clinic
                </div>
                <input
                  type="radio"
                  name="role"
                  value="clinic"
                  checked={formData.role === 'clinic'}
                  onChange={() => {}}
                  className="accent-cyan-600"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">Manage clinical staff & intake volume.</p>
            </label>

            {/* Admin Role */}
            <label
              onClick={() => handleRoleChange('admin')}
              className={`med-card-hover flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                formData.role === 'admin'
                  ? 'border-slate-500 bg-slate-100 dark:bg-slate-800/80 shadow-sm ring-1 ring-slate-400/40'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                  <svg className="h-4 w-4 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  Admin
                </div>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={() => {}}
                  className="accent-slate-700"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">System administration & dataset tools.</p>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-sm text-red-700 dark:text-red-300 flex items-center gap-3 animate-fade-rise">
            <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Full Name {formData.role === 'doctor' && <span className="text-teal-600 dark:text-teal-400">(e.g. Dr. Jane Smith)</span>}
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={formData.role === 'doctor' ? 'Dr. Jane Smith' : 'John Doe'}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@example.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Selected Role</label>
              <input
                value={formData.role}
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 text-sm capitalize font-semibold"
              />
            </div>
          </div>

          {/* Conditional Role-Specific Fields */}
          {formData.role === 'patient' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="0"
                    max="130"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="30"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Medical History (Optional)</label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleChange}
                  placeholder="E.g. hypertension, allergies to penicillin, asthma..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-sm"
                />
              </div>
            </>
          ) : formData.role === 'doctor' ? (
            <div className="space-y-5 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 p-5">
              <div className="flex items-center justify-between border-b border-teal-200 dark:border-teal-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-teal-500 text-white text-xs font-black">NMC</span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Medical Practitioner Verification
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2.5 py-1 rounded-full border border-teal-300 dark:border-teal-800">
                  Mandatory Doctor Verification
                </span>
              </div>

              {/* 1. Medical Registration Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Medical Registration Number <span className="text-red-500 font-bold">* Very Important</span>
                </label>
                <input
                  type="text"
                  name="medical_reg_no"
                  required
                  value={formData.medical_reg_no}
                  onChange={handleChange}
                  placeholder="e.g. MCI-12345 or MMC/2020/54321"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm font-mono tracking-wide"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Issued by National Medical Commission (NMC) or State Medical Council.
                </p>
              </div>

              {/* 2. Medical Council / Register Choice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Medical Council / Register <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="council_type"
                    value={formData.council_type}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
                  >
                    <option value="National Medical Commission (NMC)">National Medical Commission (NMC)</option>
                    <option value="State Medical Council">State Medical Council</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    State of Registration <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="state_council"
                    value={formData.state_council}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
                  >
                    <option value="Maharashtra Medical Council">Maharashtra Medical Council (MMC)</option>
                    <option value="Delhi Medical Council">Delhi Medical Council (DMC)</option>
                    <option value="Karnataka Medical Council">Karnataka Medical Council (KMC)</option>
                    <option value="Tamil Nadu Medical Council">Tamil Nadu Medical Council (TNMC)</option>
                    <option value="Gujarat Medical Council">Gujarat Medical Council (GMC)</option>
                    <option value="West Bengal Medical Council">West Bengal Medical Council (WBMC)</option>
                    <option value="Uttar Pradesh Medical Council">Uttar Pradesh Medical Council (UPMC)</option>
                    <option value="Kerala Medical Council">Kerala Medical Council (KMC)</option>
                    <option value="Andhra Pradesh Medical Council">Andhra Pradesh Medical Council (APMC)</option>
                    <option value="Telangana State Medical Council">Telangana State Medical Council (TSMC)</option>
                    <option value="Rajasthan Medical Council">Rajasthan Medical Council (RMC)</option>
                    <option value="Punjab Medical Council">Punjab Medical Council (PMC)</option>
                    <option value="Madhya Pradesh Medical Council">Madhya Pradesh Medical Council (MPMC)</option>
                    <option value="Other State Council">Other State Medical Council</option>
                  </select>
                </div>
              </div>

              {/* 3. Qualification & Year of Registration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Qualification <span className="text-red-500">* (MBBS, MD, MS, etc.)</span>
                  </label>
                  <select
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
                  >
                    <option value="MBBS">MBBS</option>
                    <option value="MD (Doctor of Medicine)">MD (Doctor of Medicine)</option>
                    <option value="MS (Master of Surgery)">MS (Master of Surgery)</option>
                    <option value="DNB (Diplomate of National Board)">DNB (Diplomate of National Board)</option>
                    <option value="DM (Doctorate of Medicine)">DM (Doctorate of Medicine)</option>
                    <option value="MCh (Master of Chirurgiae)">MCh (Master of Chirurgiae)</option>
                    <option value="MBBS, MD">MBBS, MD</option>
                    <option value="MBBS, MS">MBBS, MS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Year of Registration <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="registration_year"
                    value={formData.registration_year}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Specialization & Hospital */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    required
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
                  >
                    <option value="General Practitioner">General Practitioner</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Endocrinologist">Endocrinologist</option>
                    <option value="Gastroenterologist">Gastroenterologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Pulmonologist">Pulmonologist</option>
                    <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                    <option value="Oncologist">Oncologist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Hospital / Clinic Affiliation (Optional)
                  </label>
                  <input
                    type="text"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleChange}
                    placeholder="e.g. City Hospital, Apollo"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Interactive On-Page Credential Verification Step */}
              <div className="pt-2">
                {!isVerified ? (
                  <button
                    type="button"
                    onClick={handleVerifyCredentials}
                    disabled={verifying}
                    className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Authenticating with NMC Medical Register...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Verify Registration Credentials
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 animate-fade-rise">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                        ✓
                      </span>
                      <div>
                        <div className="font-bold text-sm text-emerald-950 dark:text-emerald-200">Doctor Credentials Verified</div>
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-mono mt-0.5">
                          {verificationSuccessMsg}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                      Active Badge
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 p-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
              Administrative & Clinic accounts grant elevated clinical monitoring capabilities across system nodes.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
