import { Card } from './Card'
import { cn } from '../../lib/utils'

export function StatCard({ label, icon, tone = 'primary', delay = 0, children, footer }) {
  const tones = {
    primary: 'bg-indigo-50 text-indigo-600',
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  }

  return (
    <Card delay={delay} className="flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', tones[tone])}>{icon}</span>
      </div>
      <div className="mt-3">{children}</div>
      {footer && <div className="mt-3 text-xs text-slate-500">{footer}</div>}
    </Card>
  )
}
