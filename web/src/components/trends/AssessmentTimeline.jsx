import { Clock } from 'lucide-react'
import { TrendCard, TrendEmpty, SEVERITY_COLORS, withinRange } from './common'

/**
 * Assessment History Module.
 *
 * A list rather than a chart, but it belongs with the trend modules: it is the
 * same scoped payload, the same date-window contract, and it is what a reader
 * checks a chart against. `showPatient` labels rows with a patient id, which
 * is only meaningful in panel scope.
 */
export function AssessmentTimeline({ data, dateRange, showPatient = false }) {
  const rows = withinRange(data || [], dateRange)

  return (
    <TrendCard title="Assessment history" icon={<Clock className="h-5 w-5" />}>
      {!rows.length ? (
        <TrendEmpty message="Not enough history yet. Your assessments will be listed here." />
      ) : (
        <ol className="space-y-2">
          {rows.slice(0, 12).map((row) => (
            <li key={row.assessment_id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="font-mono text-xs text-slate-500">
                {String(row.date || '').slice(0, 10)}
              </span>
              <span className="font-medium text-slate-800">
                {row.top_disease ? String(row.top_disease).replace(/\b\w/g, (c) => c.toUpperCase()) : 'No prediction'}
              </span>
              {row.confidence_pct != null && (
                <span className="font-mono text-xs text-slate-500">
                  {row.confidence_pct}%
                </span>
              )}
              {row.severity_level && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: SEVERITY_COLORS[row.severity_level] || '#64748b' }}
                >
                  {row.severity_level}
                </span>
              )}
              {showPatient && row.user_id != null && (
                <span className="font-mono text-[10px] text-slate-400">
                  patient #{row.user_id}
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500">
                {row.symptom_count} symptom{row.symptom_count === 1 ? '' : 's'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </TrendCard>
  )
}
