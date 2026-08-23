import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { cn } from '../../lib/utils'

const riskStyles = {
  LOW: {
    chip: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle2,
    label: 'Low',
  },
  REVIEW: {
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    label: 'Medium',
  },
  'HIGH PRIORITY': {
    chip: 'bg-red-50 text-red-700 border-red-200 glow-high',
    icon: ShieldAlert,
    label: 'High',
  },
}

export function RiskBadge({ level, size = 'md', className }) {
  const s = riskStyles[level] || riskStyles.LOW
  const Icon = s.icon

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
        s.chip,
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {s.label} risk
    </span>
  )
}

export function Badge({ children, tone = 'primary', className }) {
  const tones = {
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    muted: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
