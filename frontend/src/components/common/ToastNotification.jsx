import React from 'react';
import { useMedical } from '../../context/MedicalContext.jsx';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotification() {
  const { toasts, removeToast } = useMedical();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        let borderClass = 'border-indigo-200 bg-white/95 text-slate-800 shadow-indigo-100/50';
        let Icon = Info;
        let iconColor = 'text-indigo-600';

        if (isSuccess) {
          borderClass = 'border-emerald-200 bg-white/95 text-slate-800 shadow-emerald-100/50';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-600';
        } else if (isError) {
          borderClass = 'border-rose-200 bg-white/95 text-slate-800 shadow-rose-100/50';
          Icon = AlertCircle;
          iconColor = 'text-rose-600';
        } else if (isWarning) {
          borderClass = 'border-amber-200 bg-white/95 text-slate-800 shadow-amber-100/50';
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 ${borderClass}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-medium text-slate-800">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
