import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { 
  User, 
  Stethoscope, 
  Mail, 
  Phone, 
  Lock, 
  MapPin, 
  Calendar, 
  Check, 
  X as XIcon, 
  ShieldCheck, 
  Building2 
} from 'lucide-react';

const SPECIALIZATIONS = [
  'Cardiology',
  'Pulmonology',
  'General Medicine & Infectious Diseases',
  'Endocrinology & Diabetology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Psychiatry'
];

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const { register } = useAuth();
  const { addToast } = useMedical();

  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
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

  const [formErrors, setFormErrors] = useState({});

  // Password criteria tests
  const passwordCriteria = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name.trim() || formData.name.length < 3) {
      errors.name = 'Full name must be at least 3 characters.';
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please provide a valid email address.';
    }

    // 10-digit phone starting with 6-9
    const cleanPhone = formData.phone.replace(/[\s\-+()]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Phone must be exactly 10 digits starting with 6, 7, 8, or 9.';
    }

    // Password criteria check
    if (!Object.values(passwordCriteria).every(Boolean)) {
      errors.password = 'Password does not satisfy all security criteria.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      errors.age = 'Age must be between 1 and 120.';
    }

    if (!formData.location.trim()) {
      errors.location = 'Please enter your city/location.';
    }

    if (role === 'doctor' && !formData.specialization) {
      errors.specialization = 'Please select your medical specialization.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('error', 'Please resolve the highlighted validation errors.');
      return;
    }

    try {
      await register({
        ...formData,
        phone: cleanPhone,
        role
      });
      addToast('success', `Account created successfully in MongoDB Atlas! Please sign in.`);
      onClose();
      if (onSwitchToLogin) {
        onSwitchToLogin();
      }
    } catch (err) {
      addToast('error', err.message || 'Registration failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create MedAssist AI Account"
      subtitle="Register for clinical triage analysis, patient history tracking, or provider practice management"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Role Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Account Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'patient'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              Patient Account
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'doctor'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Doctor / Medical Provider
            </button>
          </div>
        </div>

        {/* Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Legal Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={role === 'doctor' ? 'Dr. Anita Sharma' : 'e.g. Jane Doe'}
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.name ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
            </div>
            {formErrors.name && <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="name@example.com"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.email ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
            </div>
            {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
          </div>
        </div>

        {/* Phone & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              10-Digit Mobile Number * (Starts with 6-9)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                maxLength={10}
                required
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="9845123456"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.phone ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
            </div>
            {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              City / Location *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g. Bangalore, Mumbai"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.location ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
            </div>
            {formErrors.location && <p className="text-[11px] text-rose-600 mt-1">{formErrors.location}</p>}
          </div>
        </div>

        {/* Age & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Age * (Years)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                min="1"
                max="120"
                required
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="e.g. 34"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.age ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
            </div>
            {formErrors.age && <p className="text-[11px] text-rose-600 mt-1">{formErrors.age}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biological Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other / Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* Doctor Conditional Fields: Specialization */}
        {role === 'doctor' && (
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Medical Provider Credentials
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical Specialization *
              </label>
              <select
                value={formData.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {SPECIALIZATIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.password ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.confirmPassword ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
            </div>
            {formErrors.confirmPassword && (
              <p className="text-[11px] text-rose-600 mt-1">{formErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Password Strength Checklist */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <p className="font-semibold text-slate-700 mb-1.5">Password Security Criteria:</p>
          <div className="grid grid-cols-2 gap-1.5">
            <span className={`flex items-center gap-1.5 ${passwordCriteria.length ? 'text-emerald-600' : 'text-slate-400'}`}>
              {passwordCriteria.length ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
              At least 8 characters
            </span>
            <span className={`flex items-center gap-1.5 ${passwordCriteria.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
              {passwordCriteria.upper ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
              One uppercase letter (A-Z)
            </span>
            <span className={`flex items-center gap-1.5 ${passwordCriteria.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
              {passwordCriteria.lower ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
              One lowercase letter (a-z)
            </span>
            <span className={`flex items-center gap-1.5 ${passwordCriteria.number ? 'text-emerald-600' : 'text-slate-400'}`}>
              {passwordCriteria.number ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
              One number (0-9)
            </span>
            <span className={`flex items-center gap-1.5 col-span-2 ${passwordCriteria.special ? 'text-emerald-600' : 'text-slate-400'}`}>
              {passwordCriteria.special ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
              One special symbol (!@#$%^&*)
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Create {role === 'doctor' ? 'Provider' : 'Patient'} Account</span>
        </button>

        {/* Switch to Login */}
        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToLogin();
            }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Sign in here
          </button>
        </div>
      </form>
    </Modal>
  );
}
