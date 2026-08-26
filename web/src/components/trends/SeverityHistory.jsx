import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from 'recharts'
import { Activity } from 'lucide-react'
import {
  SEVERITY_COLORS, SEVERITY_ORDER, TrendCard, TrendEmpty, shortDate,
  withinRange,
} from './common'

/**
 * Severity History Module.
 *
 * Two presentations of the same triage data:
 *
 *   totals    one bar per level - "how many assessments were Urgent"
 *   stacked   per-day stacked bars - "how the mix moved over time"
 *
 * Colours come from SEVERITY_COLORS, which mirrors the severity banner's
 * palette, so a level reads identically wherever it appears.
 *
 * All four levels are always present in the totals view even at zero, so the
 * axis does not reflow between visits and an absent level is visibly absent
 * rather than silently dropped.
 */
export function SeverityHistory({ data, dateRange, defaultMode = 'totals' }) {
  const [mode, setMode] = useState(defaultMode)

  const history = withinRange(data?.assessment_history || [], dateRange)
  const totalsFromPayload = data?.severity_history || []

  /* When a date window is applied the payload's precomputed totals no longer
     match it, so they are recomputed from the filtered rows. Without a window
     the payload totals are authoritative. */
  const windowed = Boolean(dateRange && (dateRange.from || dateRange.to))
  const totals = windowed
    ? SEVERITY_ORDER.map((level) => ({
        level,
        count: history.filter((r) => r.severity_level === level).length,
      }))
    : SEVERITY_ORDER.map((level) => ({
        level,
        count: (totalsFromPayload.find((r) => r.level === level)?.count) || 0,
      }))

  const graded = totals.reduce((sum, r) => sum + r.count, 0)

  /* Stacked-by-day, from the assessment timeline. */
  const perDay = {}
  history.forEach((r) => {
    if (!r.date || !r.severity_level) return
    const day = shortDate(r.date)
    perDay[day] = perDay[day] || { date: day }
    perDay[day][r.severity_level] = (perDay[day][r.severity_level] || 0) + 1
  })
  const stacked = Object.values(perDay)

  const toggle = stacked.length > 1 ? (
    <div className="flex gap-1 text-xs">
      {['totals', 'stacked'].map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`rounded-full border px-2 py-0.5 font-medium ${
            mode === m
              ? 'border-indigo-300 bg-indigo-100 text-indigo-800'
              : 'border-slate-200 bg-white text-slate-500'
          }`}
        >
          {m === 'totals' ? 'Totals' : 'Over time'}
        </button>
      ))}
    </div>
  ) : null

  const active = mode === 'stacked' && stacked.length > 1 ? 'stacked' : 'totals'

  let body
  if (!graded) {
    body = <TrendEmpty message="Not enough history yet. Severity levels appear once an assessment has been graded." />
  } else if (active === 'stacked') {
    body = (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={stacked}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {SEVERITY_ORDER.map((level) => (
            <Bar key={level} dataKey={level} stackId="sev"
                 fill={SEVERITY_COLORS[level]} name={level} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  } else {
    body = (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={totals}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="level" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {totals.map((row) => (
              <Cell key={row.level} fill={SEVERITY_COLORS[row.level]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <TrendCard
      title="Severity history"
      icon={<Activity className="h-5 w-5" />}
      action={toggle}
      footnote={`${graded} graded assessment${graded === 1 ? '' : 's'}. Colours match the triage banner.`}
    >
      {body}
    </TrendCard>
  )
}
