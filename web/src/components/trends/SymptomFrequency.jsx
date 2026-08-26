import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import {
  SERIES_COLORS, TrendCard, TrendEmpty, withinRange,
} from './common'

/**
 * Symptom Frequency Module.
 *
 * Most-reported symptoms, for one patient's history or aggregated across a
 * panel - the aggregation is identical either way, only the scope of rows
 * differs.
 *
 * When a date window is supplied the counts are recomputed from the
 * assessment timeline rather than reusing the payload's precomputed totals,
 * which cover the whole history. Reusing them would silently show all-time
 * counts under a "last 30 days" heading.
 */
export function SymptomFrequency({ data, dateRange, topN = 8 }) {
  const windowed = Boolean(dateRange && (dateRange.from || dateRange.to))
  const isPanel = data?.scope?.kind === 'panel'

  let rows
  let assessmentCount

  if (windowed) {
    const history = withinRange(data?.assessment_history || [], dateRange)
    assessmentCount = history.length
    const counts = {}
    history.forEach((r) => {
      /* The timeline carries a truncated symptom list per assessment, so a
         windowed view is necessarily a sample of the top few per check-in.
         Flagged in the footnote rather than presented as exhaustive. */
      new Set(r.symptoms || []).forEach((s) => {
        counts[s] = (counts[s] || 0) + 1
      })
    })
    rows = Object.entries(counts)
      .map(([symptom, count]) => ({
        symptom,
        count,
        pct: assessmentCount ? Math.round((100 * count) / assessmentCount) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN)
  } else {
    assessmentCount = data?.summary?.assessment_count ?? 0
    rows = (data?.symptom_frequency || []).slice(0, topN).map((d) => ({
      symptom: d.symptom,
      count: d.count,
      pct: d.pct_of_assessments,
    }))
  }

  const plot = rows.map((r) => ({
    ...r,
    label: r.symptom.length > 22 ? `${r.symptom.slice(0, 21)}…` : r.symptom,
  }))

  return (
    <TrendCard
      title="Symptom frequency"
      icon={<BarChart3 className="h-5 w-5" />}
      footnote={[
        'Counted once per assessment, so repeating a symptom in one submission does not inflate it.',
        isPanel ? 'Aggregated across every patient in scope.' : null,
        windowed ? 'Windowed view uses the top symptoms recorded per assessment, not the full list.' : null,
      ].filter(Boolean).join(' ')}
    >
      {!plot.length ? (
        <TrendEmpty message="Not enough history yet. Symptoms appear here after your first assessment." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, plot.length * 30)}>
          <BarChart data={plot} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v, n, item) => (
                n === 'count'
                  ? [`${v} of ${assessmentCount} assessments (${item.payload.pct}%)`, 'Reported in']
                  : v
              )}
            />
            <Bar dataKey="count" fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </TrendCard>
  )
}
