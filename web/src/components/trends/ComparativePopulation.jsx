import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from 'recharts'
import { Users } from 'lucide-react'
import {
  SERIES_COLORS, TrendCard, TrendEmpty, shortDate, withinRange,
} from './common'

/**
 * Comparative Population Module — provider-only.
 *
 * Overlays one patient's composite risk against the panel average, for
 * context that a single line cannot give.
 *
 * SELF-HIDING BY CONSTRUCTION. The overlay needs `data.panel_baseline`, and
 * the API attaches that only on the clinical-gated endpoints - a patient
 * reading their own analytics never receives it (see `include_panel_baseline`
 * in services/analytics.py). So this returns null for a patient because the
 * aggregate data is genuinely absent, not because a prop was set correctly.
 * That is deliberate: a frontend flag can be passed wrongly, a missing
 * payload cannot leak.
 */
export function ComparativePopulation({ data, dateRange }) {
  const baseline = data?.panel_baseline
  const isPatientScope = data?.scope?.kind === 'patient'

  /* No baseline in the payload -> nothing to compare against, and for a
     patient that is the expected, correct outcome. Render nothing. */
  if (!baseline?.points?.length) return null

  /* A panel-scoped payload would be comparing the panel with itself. */
  if (!isPatientScope) return null

  const subject = withinRange(data?.risk_trend || [], dateRange)
    .filter((p) => p.composite_risk != null)
  const panelByDay = new Map(
    withinRange(baseline.points, dateRange)
      .map((p) => [String(p.date).slice(0, 10), p]))

  /* Join on calendar day: the patient's own points anchor the axis, and the
     panel average is looked up per day. Days the patient was not assessed are
     not invented - the comparison is only meaningful where both exist. */
  const rows = subject.map((p) => {
    const day = String(p.date).slice(0, 10)
    const panel = panelByDay.get(day)
    return {
      date: shortDate(p.date),
      patient: p.composite_risk,
      panel: panel ? panel.panel_avg_risk : null,
      sample: panel ? panel.sample_size : null,
    }
  })

  const comparable = rows.filter((r) => r.panel != null)
  const latest = comparable[comparable.length - 1]

  return (
    <TrendCard
      title="Compared with the panel"
      icon={<Users className="h-5 w-5" />}
      footnote={
        `Panel average across ${baseline.patients_in_baseline} patient`
        + `${baseline.patients_in_baseline === 1 ? '' : 's'}`
        + ` and ${baseline.assessments_in_baseline} assessments`
        + (baseline.overall_avg_risk != null
            ? `, overall mean ${baseline.overall_avg_risk}.` : '.')
        + ' Provider view only — patients are never shown other patients’ aggregates.'
      }
    >
      {comparable.length < 2 ? (
        <TrendEmpty message="Not enough overlapping history yet — this needs at least two days where both this patient and the panel were assessed." />
      ) : (
        <>
          {latest && (
            <p className="mb-2 text-sm text-slate-700">
              Latest: <strong>{latest.patient}</strong> vs panel average{' '}
              <strong>{latest.panel}</strong>
              {latest.patient > latest.panel
                ? ' — above the panel average.'
                : latest.patient < latest.panel
                  ? ' — below the panel average.'
                  : ' — level with the panel average.'}
            </p>
          )}
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="patient" name="This patient"
                    stroke={SERIES_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="panel" name="Panel average"
                    stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4"
                    dot={{ r: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </TrendCard>
  )
}
