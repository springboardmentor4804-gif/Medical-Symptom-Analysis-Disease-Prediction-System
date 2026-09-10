import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { Stethoscope, User, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onLoginSuccess }) {
  const { login } = useAuth();
  const { addToast } = useMedical();

  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      addToast('error', 'Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const loginResult = await login(email, password, role);
      addToast('success', `Signed in successfully as ${role === 'doctor' ? 'Healthcare Provider' : 'Patient'}`);
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess(loginResult.user);
      }
    } catch (err) {
      addToast('error', err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign In to MedAssist AI"
      subtitle="Access your secure medical dashboard and clinical records"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Toggle Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Select Portal Access Role
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
              Patient Portal
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
              Doctor / Provider
            </button>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Registered Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
        >
          {isLoading ? (
            <span>Signing In...</span>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Switch to Register */}
        <div className="text-center pt-2 text-xs text-slate-500">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Register new account
          </button>
        </div>
      </form>
    </Modal>
  );
}
