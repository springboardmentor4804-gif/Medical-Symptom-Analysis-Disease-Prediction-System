import { useState } from 'react'
import {
  CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts'
import { HeartPulse } from 'lucide-react'
import {
  SERIES_COLORS, TrendCard, TrendEmpty, shortDate, withinRange,
} from './common'

const OUT_OF_RANGE = '#dc2626'

/**
 * Vitals Trend Module.
 *
 * One vital at a time, plotted against the normal range from
 * severity_config.json. The shaded band and the dashed bounds come from the
 * artifact via the API - they are never restated here, so the chart cannot
 * disagree with the severity engine's own abnormal-vital detection.
 *
 * Out-of-range readings are marked in red on top of the line, so a breach is
 * visible without reading the axis.
 */
export function VitalsTrend({ data, dateRange }) {
  const trend = data?.vitals_trend || { vitals: [], points: [] }
  const vitals = trend.vitals || []
  const [selected, setSelected] = useState(null)

  const points = withinRange(trend.points || [], dateRange)
  const active = vitals.find((v) => v.key === selected) || vitals[0]

  if (!vitals.length || !points.length) {
    return (
      <TrendCard title="Vitals trend" icon={<HeartPulse className="h-5 w-5" />}>
        <TrendEmpty message="No vitals recorded yet. Add heart rate, blood pressure, temperature, respiratory rate or SpO₂ in the Vitals step of an assessment." />
      </TrendCard>
    )
  }

  const rows = points
    .filter((p) => p[active.key] != null)
    .map((p) => ({
      date: shortDate(p.date),
      value: p[active.key],
      out: Boolean(p[`${active.key}_out`]),
    }))

  const breaches = rows.filter((r) => r.out)
  const values = rows.map((r) => r.value)
  /* Axis must include the normal band as well as the readings, otherwise a
     series entirely inside range renders with the band off-screen. */
  const lo = Math.min(...values, active.low ?? Infinity)
  const hi = Math.max(...values, active.high ?? -Infinity)
  const pad = Math.max(2, (hi - lo) * 0.15)

  const picker = vitals.length > 1 ? (
    <select
      value={active.key}
      onChange={(e) => setSelected(e.target.value)}
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs capitalize"
    >
      {vitals.map((v) => (
        <option key={v.key} value={v.key}>{v.label}</option>
      ))}
    </select>
  ) : null

  return (
    <TrendCard
      title="Vitals trend"
      icon={<HeartPulse className="h-5 w-5" />}
      action={picker}
      footnote={
        `Normal range ${active.low}–${active.high} ${active.unit || ''}`.trim()
        + ` (from severity_config.json).`
        + (breaches.length
            ? ` ${breaches.length} reading${breaches.length === 1 ? '' : 's'} outside range, marked red.`
            : ' All readings within range.')
      }
    >
      {rows.length < 2 ? (
        <TrendEmpty message={`Only ${rows.length} ${active.label} reading so far — a trend needs at least two.`} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[Math.floor(lo - pad), Math.ceil(hi + pad)]}
                   tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v} ${active.unit || ''}`.trim(), active.label]} />

            {/* Normal band, straight from the artifact. */}
            {active.low != null && active.high != null && (
              <ReferenceArea y1={active.low} y2={active.high}
                             fill="#10b981" fillOpacity={0.12} />
            )}
            {active.low != null && (
              <ReferenceLine y={active.low} stroke="#94a3b8"
                             strokeDasharray="4 3" />
            )}
            {active.high != null && (
              <ReferenceLine y={active.high} stroke="#94a3b8"
                             strokeDasharray="4 3" />
            )}

            <Line
              type="monotone" dataKey="value" name={active.label}
              stroke={SERIES_COLORS[1]} strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload, index } = props
                return (
                  <circle
                    key={index}
                    cx={cx} cy={cy} r={payload.out ? 5 : 3}
                    fill={payload.out ? OUT_OF_RANGE : SERIES_COLORS[1]}
                    stroke="white" strokeWidth={payload.out ? 1.5 : 0}
                  />
                )
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </TrendCard>
  )
}
