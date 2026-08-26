import { useState } from 'react'
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import {
  SERIES_COLORS, TrendCard, TrendEmpty, shortDate, withinRange,
} from './common'

/**
 * Risk Score Trend Module.
 *
 * Chronic risk over time, in two modes:
 *
 *   composite    one line, the overall composite percentile
 *   condition    one line per chronic condition (diabetes, stroke, ...)
 *
 * The same component serves a patient looking at their own history and a
 * provider drilling into one patient - the only difference is which payload
 * is passed in, since both endpoints return the same shape.
 *
 * Panel scope is accepted but plotted as-is: a panel payload interleaves rows
 * from many patients, so the caption says so rather than implying one
 * person's trajectory.
 */
export function RiskScoreTrend({ data, dateRange, defaultMode = 'condition' }) {
  const [mode, setMode] = useState(defaultMode)

  const byCondition = data?.risk_trend_by_condition || { conditions: [], points: [] }
  const composite = withinRange(data?.risk_trend || [], dateRange)
  const conditionPoints = withinRange(byCondition.points || [], dateRange)
  const isPanel = data?.scope?.kind === 'panel'

  const hasCondition = byCondition.conditions?.length && conditionPoints.length >= 2
  const hasComposite = composite.filter((p) => p.composite_risk != null).length >= 2
  const active = mode === 'condition' && hasCondition ? 'condition' : 'composite'

  const toggle = (hasCondition && hasComposite) ? (
    <div className="flex gap-1 text-xs">
      {['condition', 'composite'].map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`rounded-full border px-2 py-0.5 font-medium ${
            active === m
              ? 'border-indigo-300 bg-indigo-100 text-indigo-800'
              : 'border-slate-200 bg-white text-slate-500'
          }`}
        >
          {m === 'condition' ? 'By condition' : 'Composite'}
        </button>
      ))}
    </div>
  ) : null

  let body
  if (!hasCondition && !hasComposite) {
    body = (
      <TrendEmpty message={
        (composite.length || conditionPoints.length)
          ? 'Only one assessment with a risk score so far — a trend needs at least two.'
          : 'Not enough history yet. Risk scores appear once an assessment includes the health profile.'
      } />
    )
  } else if (active === 'condition') {
    const rows = conditionPoints.map((p) => {
      const entry = { date: shortDate(p.date) }
      byCondition.conditions.forEach((c) => { entry[c.key] = p[c.key] })
      return entry
    })
    body = (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {byCondition.conditions.map((c, i) => (
            <Line
              key={c.key} type="monotone" dataKey={c.key} name={c.label}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={2} dot={{ r: 2 }} connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  } else {
    const rows = composite
      .filter((p) => p.composite_risk != null)
      .map((p) => ({ date: shortDate(p.date), risk: p.composite_risk }))
    body = (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="risk" name="Composite risk"
                stroke={SERIES_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <TrendCard
      title="Risk score trend"
      icon={<TrendingUp className="h-5 w-5" />}
      action={toggle}
      footnote={isPanel
        ? 'Panel scope: points come from many patients, so this is population activity rather than one person’s trajectory.'
        : 'Percentile against 1.1M CDC BRFSS respondents. Only assessments that included a health profile appear.'}
    >
      {body}
    </TrendCard>
  )
}
