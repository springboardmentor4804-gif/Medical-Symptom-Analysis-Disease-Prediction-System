import React, { useState } from 'react';
import { Activity, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState('patient');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      setIsLoggedIn(true);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome, {role === 'patient' ? 'Patient' : 'Provider'}!</h2>
          <p className="text-slate-400 mb-6">Connected to MedAssist AI Backend & Database.</p>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold rounded-xl border border-red-500/30 transition-all">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400 mb-3">
            <Activity size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">MedAssist <span className="text-cyan-400">AI</span></h1>
          <p className="text-slate-400 text-sm mt-1">Smart Medical Triage & Diagnostics Portal</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => setRole('patient')}
            className={`py-2.5 rounded-xl text-sm font-medium transition-all ${role === 'patient' ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}>
            Patient
          </button>
          <button
            onClick={() => setRole('provider')}
            className={`py-2.5 rounded-xl text-sm font-medium transition-all ${role === 'provider' ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}>
            Provider
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="boss@medassist.ai"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all">
            <span>Sign In to Portal</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}