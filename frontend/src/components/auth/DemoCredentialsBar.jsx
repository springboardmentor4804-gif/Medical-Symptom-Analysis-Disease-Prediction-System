import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Stethoscope, User, ArrowRightLeft, Sparkles, ShieldCheck } from 'lucide-react';

export default function DemoCredentialsBar({ onOpenLogin, onOpenRegister }) {
  const { currentUser, switchRole, isDoctor, isPatient } = useAuth();

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-brand-900 to-purple-900 text-white text-xs px-4 py-2.5 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300">
            <Sparkles className="w-3 h-3" />
          </span>
          <span className="font-medium text-indigo-200">
            Enterprise RBAC Mode:
          </span>
          <span className="bg-white/10 px-2 py-0.5 rounded text-white font-semibold flex items-center gap-1.5">
            {isDoctor ? (
              <>
                <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                Dr. Marcus Vance (Physician Portal)
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-indigo-300" />
                Sarah Jenkins (Patient Portal)
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-indigo-200 hidden sm:inline">Quick Role Switch:</span>
          {isDoctor ? (
            <button
              onClick={() => switchRole('patient')}
              className="flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 px-2.5 py-1 rounded-lg text-white font-medium transition-all shadow-sm hover:shadow"
            >
              <User className="w-3.5 h-3.5" />
              Switch to Patient View
            </button>
          ) : (
            <button
              onClick={() => switchRole('doctor')}
              className="flex items-center gap-1.5 bg-emerald-600/80 hover:bg-emerald-600 px-2.5 py-1 rounded-lg text-white font-medium transition-all shadow-sm hover:shadow"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Switch to Doctor View
            </button>
          )}

          <button
            onClick={onOpenLogin}
            className="text-indigo-200 hover:text-white underline underline-offset-2 ml-1"
          >
            Custom Sign In
          </button>
          <span className="text-indigo-400">•</span>
          <button
            onClick={onOpenRegister}
            className="bg-white text-indigo-900 hover:bg-indigo-50 px-2.5 py-1 rounded-lg font-semibold transition-colors"
          >
            New Account
          </button>
        </div>
      </div>
    </div>
  );
}
