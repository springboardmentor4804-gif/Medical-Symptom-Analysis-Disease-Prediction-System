import { Card, CardTitle } from '../med/Card'

/* ------------------------------------------------------------------ */
/* Shared primitives for the trend module library                      */
/* ------------------------------------------------------------------ */

/**
 * Every trend module is parameterised the same way:
 *
 *   data        the scoped analytics payload from /analytics/*
 *   scope       'patient' | 'panel', taken from `data.scope.kind`
 *   dateRange   optional { from, to } ISO strings, applied by the module
 *
 * A module never fetches. The caller decides scope by choosing which endpoint
 * to hit, so the same component serves the patient dashboard and the provider
 * drill-down without modification.
 */

/**
 * Severity palette.
 *
 * Deliberately mirrors SEVERITY_STYLES in components/med/ResultPanels.jsx,
 * which is what the severity banner already uses, so a level cannot be one
 * colour on the banner and another on the chart. Values are literal hex
 * because Recharts fills are SVG attributes, not Tailwind classes.
 */
export const SEVERITY_COLORS = {
  MILD: '#10b981',      // emerald - matches SEVERITY_STYLES.MILD
  MODERATE: '#f59e0b',  // amber   - matches SEVERITY_STYLES.MODERATE
  URGENT: '#f97316',    // orange  - matches SEVERITY_STYLES.URGENT
  EMERGENCY: '#dc2626', // red     - matches SEVERITY_STYLES.EMERGENCY
}

export const SEVERITY_ORDER = ['MILD', 'MODERATE', 'URGENT', 'EMERGENCY']

/* Distinct series colours for multi-line charts. Ordered for contrast rather
   than by hue family, so adjacent series never look alike. */
export const SERIES_COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b',
  '#ec4899', '#7c3aed', '#14b8a6', '#f97316',
]

export const BAND_COLORS = {
  low: '#10b981',
  moderate: '#f59e0b',
  average: '#f59e0b',
  elevated: '#f97316',
  high: '#dc2626',
}

/**
 * Empty state.
 *
 * A chart with no series renders as an empty axis box, which reads as a broken
 * widget rather than as "no data yet". Every module routes through this
 * instead, and says what would make the chart appear.
 */
export function TrendEmpty({ message }) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

/** Uniform module frame, so all modules share one card/title treatment. */
export function TrendCard({ title, icon, action, footnote, children }) {
  return (
    <Card>
      <CardTitle icon={icon} action={action}>{title}</CardTitle>
      {children}
      {footnote && (
        <p className="mt-2 text-xs text-slate-500">{footnote}</p>
      )}
    </Card>
  )
}

/** MM-DD for a dense axis. */
export const shortDate = (iso) => (iso ? String(iso).slice(0, 10).slice(5) : '')

/**
 * Apply an optional { from, to } window to any point list carrying `date`.
 *
 * Centralised so every module filters identically - a symptom chart and a
 * risk chart showing "the last 30 days" must mean the same 30 days.
 */
export function withinRange(points, dateRange) {
  if (!dateRange || (!dateRange.from && !dateRange.to)) return points || []
  const from = dateRange.from ? String(dateRange.from).slice(0, 10) : null
  const to = dateRange.to ? String(dateRange.to).slice(0, 10) : null
  return (points || []).filter((p) => {
    const day = String(p.date || '').slice(0, 10)
    if (!day) return false
    if (from && day < from) return false
    if (to && day > to) return false
    return true
  })
}

/** True when this payload is a single patient rather than a panel. */
export const isPatientScope = (data) => data?.scope?.kind === 'patient'
