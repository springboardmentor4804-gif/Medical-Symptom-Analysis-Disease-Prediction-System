import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Stethoscope } from 'lucide-react'
import {
  SERIES_COLORS, TrendCard, TrendEmpty, shortDate, withinRange,
} from './common'

/**
 * Condition Prediction Trend Module.
 *
 * Which conditions were predicted, over time. Serves a patient's own
 * prediction history and a provider's panel-wide condition trends from the
 * same series - the backend buckets by day per condition either way.
 *
 * Two presentations, because they answer different questions:
 *
 *   line     how each condition's frequency moved over time
 *   ranked   which conditions dominate overall, ignoring time
 *
 * A single day of history cannot show a trend, so it falls back to ranked
 * rather than drawing a one-point line.
 */
export function ConditionPredictionTrend({ data, dateRange, defaultMode = 'line' }) {
  const [mode, setMode] = useState(defaultMode)

  const trend = data?.prediction_trend || { conditions: [], points: [] }
  const points = withinRange(trend.points || [], dateRange)
  const conditions = trend.conditions || []
  const ranked = data?.predictions_by_condition || []
  const isPanel = data?.scope?.kind === 'panel'

  const canPlotLine = conditions.length > 0 && points.length >= 2
  const active = mode === 'line' && canPlotLine ? 'line' : 'ranked'

  const toggle = (canPlotLine && ranked.length) ? (
    <div className="flex gap-1 text-xs">
      {['line', 'ranked'].map((m) => (
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
          {m === 'line' ? 'Over time' : 'Ranked'}
        </button>
      ))}
    </div>
  ) : null

  let body
  if (!conditions.length && !ranked.length) {
    body = <TrendEmpty message="Not enough history yet. Predictions appear here after your first assessment." />
  } else if (active === 'line') {
    const rows = points.map((p) => {
      const entry = { date: shortDate(p.date) }
      conditions.forEach((c) => { entry[c.key] = p[c.key] ?? 0 })
      return entry
    })
    body = (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {conditions.map((c, i) => (
            <Line key={c.key} type="monotone" dataKey={c.key} name={c.label}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2} dot={{ r: 2 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  } else {
    const rows = ranked.slice(0, 10).map((d) => ({
      label: d.label?.length > 22 ? `${d.label.slice(0, 21)}…` : d.label,
      count: d.count,
    }))
    body = (
      <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 30)}>
        <BarChart data={rows} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <TrendCard
      title="Condition prediction trend"
      icon={<Stethoscope className="h-5 w-5" />}
      action={toggle}
      footnote={isPanel
        ? 'Top-ranked prediction per assessment, across every patient in scope.'
        : 'Top-ranked prediction per assessment. Repeated prediction is not confirmation.'}
    >
      {body}
    </TrendCard>
  )
}
