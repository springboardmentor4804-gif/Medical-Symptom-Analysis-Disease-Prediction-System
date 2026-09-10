import React from 'react';
import { AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';

export default function RiskBadge({ level = 'Low', size = 'md', pulse = true, showIcon = true }) {
  const normalized = (level || 'Low').toLowerCase();

  const config = {
    high: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      icon: AlertCircle,
      pulseClass: pulse ? 'high-risk-pulse ring-2 ring-rose-400/50' : '',
      label: 'High Clinical Risk'
    },
    medium: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      pulseClass: '',
      label: 'Medium Risk'
    },
    low: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
      pulseClass: '',
      label: 'Low Risk'
    }
  };

  const current = config[normalized] || config.low;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm font-bold gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all ${current.bg} ${current.pulseClass} ${sizeClasses[size] || sizeClasses.md}`}
    >
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      <span>{current.label}</span>
    </span>
  );
}
