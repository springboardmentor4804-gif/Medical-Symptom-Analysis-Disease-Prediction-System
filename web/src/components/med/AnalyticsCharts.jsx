import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  Activity, PieChart as PieChartIcon, Stethoscope, TrendingUp,
} from 'lucide-react'
import { Card, CardTitle } from './Card'
import { cn } from '../../lib/utils'
/* Palette, empty state and date helpers come from the trend module library so
   there is one definition of "what colour is URGENT" in the codebase. */
import {
  BAND_COLORS, SERIES_COLORS, SEVERITY_COLORS, SEVERITY_ORDER, TrendEmpty,
  shortDate,
} from '../trends/common'

/* ------------------------------------------------------------------ */
/* Panel-level analytics charts                                        */
/* ------------------------------------------------------------------ */

/**
 * Charts that are NOT part of the reusable trend module library.
 *
 * The per-patient trend charts that used to live here have moved to
 * components/trends/, which both dashboards import. What remains is
 * panel-only: distribution and rate summaries that have no meaning for a
 * single patient, plus the scope caption used by every analytics view.
 */

const BAR_COLOR = SERIES_COLORS[0]
const LINE_COLOR = SERIES_COLORS[0]
const ESCALATED_COLOR = '#dc2626'

/** Which conditions are predicted most often across the panel. */
export function PredictionsByConditionChart({ data = [] }) {
  const rows = data.slice(0, 10).map((d) => ({
    label: d.label?.length > 22 ? `${d.label.slice(0, 21)}…` : d.label,
    count: d.count,
  }))

  return (
    <Card>
      <CardTitle icon={<Stethoscope className="h-5 w-5" />}>
        Predictions by condition
      </CardTitle>
      {!rows.length ? (
        <TrendEmpty message="No predictions in scope yet." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 30)}>
          <BarChart data={rows} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Top-ranked prediction per assessment — not every condition the model
        considered.
      </p>
    </Card>
  )
}

/** Composite risk band spread across the panel. */
export function RiskDistributionChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card>
      <CardTitle icon={<PieChartIcon className="h-5 w-5" />}>
        Risk level distribution
      </CardTitle>
      {!total ? (
        <TrendEmpty message="No risk bands in scope. Risk requires a health profile." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="band" outerRadius={85}
                 label={(d) => `${d.band} (${d.count})`}>
              {data.map((row) => (
                <Cell key={row.band} fill={BAND_COLORS[row.band] || BAR_COLOR} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Counted per assessment, so a frequently assessed patient contributes
        more than one row.
      </p>
    </Card>
  )
}

/** Assessment volume over time, with escalations overlaid. */
export function VolumeTrendChart({ data = [] }) {
  const rows = data.map((d) => ({
    date: shortDate(d.date),
    count: d.count,
    escalated: d.escalated,
  }))

  return (
    <Card>
      <CardTitle icon={<TrendingUp className="h-5 w-5" />}>
        Assessment volume over time
      </CardTitle>
      {rows.length < 2 ? (
        <TrendEmpty message="Not enough days of activity to plot a trend yet." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={LINE_COLOR}
                  strokeWidth={2} dot={{ r: 3 }} name="Assessments" />
            {/* Escalations on the same axis: the ratio is the signal, and a
                second axis would let a small count look like a large share. */}
            <Line type="monotone" dataKey="escalated" stroke={ESCALATED_COLOR}
                  strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2 }}
                  name="Urgent/Emergency" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

/**
 * Escalation rate.
 *
 * The numerator and denominator are shown alongside the percentage on
 * purpose: "50% escalated" from two assessments and from two hundred are very
 * different statements about a panel, and a bare rate hides which one it is.
 */
export function EscalationRateCard({ escalation }) {
  if (!escalation) return null
  const { escalated = 0, non_escalated = 0, total_graded = 0,
          rate_pct = 0, by_level = {} } = escalation
  const pct = Math.min(100, rate_pct)

  return (
    <Card>
      <CardTitle icon={<Activity className="h-5 w-5" />}>
        Severity escalation rate
      </CardTitle>

      {!total_graded ? (
        <TrendEmpty message="No graded assessments in scope yet." />
      ) : (
        <>
          <div className="mb-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-800">{rate_pct}%</span>
            <span className="pb-1 text-sm text-slate-500">
              {escalated} of {total_graded} assessments reached Urgent or Emergency
            </span>
          </div>

          <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-rose-500" style={{ width: `${pct}%` }} />
            <div className="bg-emerald-500" style={{ width: `${100 - pct}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SEVERITY_ORDER.map((level) => (
              <div key={level}
                   className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center">
                <div className="font-mono text-lg font-semibold"
                     style={{ color: SEVERITY_COLORS[level] }}>
                  {by_level[level] ?? 0}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  {level}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Reads both ways: panel acuity, and how readily the triage rules
            escalate. {non_escalated} stayed at Mild or Moderate.
          </p>
        </>
      )}
    </Card>
  )
}

/** Scope caption, so a chart is never read against the wrong population. */
export function ScopeBanner({ scope, summary, className }) {
  if (!scope) return null
  return (
    <div className={cn(
      'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-900',
      className,
    )}>
      <span className="font-semibold">{scope.label}</span>
      {scope.patient_count != null && (
        <span>{scope.patient_count} patient{scope.patient_count === 1 ? '' : 's'} in scope</span>
      )}
      {summary?.assessment_count != null && (
        <span>{summary.assessment_count} assessment{summary.assessment_count === 1 ? '' : 's'}</span>
      )}
      {summary?.latest_assessment && (
        <span>latest {String(summary.latest_assessment).slice(0, 10)}</span>
      )}
    </div>
  )
}
