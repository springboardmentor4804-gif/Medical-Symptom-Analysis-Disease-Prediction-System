/**
 * Health Trend Visualization Modules.
 *
 * A shared component library, not a page. Both the Patient Dashboard's
 * analytics section and the Provider Analytics Dashboard import from here, so
 * a chart has exactly one implementation regardless of who is looking at it.
 *
 * Every module takes the same props:
 *
 *   data       a scoped payload from /analytics/me, /analytics/panel or
 *              /analytics/patient/{id} - all three return one shape
 *   dateRange  optional { from, to } ISO date strings
 *
 * Scope is not a prop: it is read from `data.scope.kind`, so a caller cannot
 * mislabel a payload. ComparativePopulation goes further and keys off the
 * PRESENCE of aggregate data, which the API withholds from patients - see its
 * own docstring.
 */

export { RiskScoreTrend } from './RiskScoreTrend'
export { SeverityHistory } from './SeverityHistory'
export { SymptomFrequency } from './SymptomFrequency'
export { ConditionPredictionTrend } from './ConditionPredictionTrend'
export { VitalsTrend } from './VitalsTrend'
export { ComparativePopulation } from './ComparativePopulation'
export { AssessmentTimeline } from './AssessmentTimeline'

export {
  SEVERITY_COLORS, SEVERITY_ORDER, SERIES_COLORS, BAND_COLORS,
  TrendCard, TrendEmpty, isPatientScope, shortDate, withinRange,
} from './common'

import { RiskScoreTrend } from './RiskScoreTrend'
import { SeverityHistory } from './SeverityHistory'
import { SymptomFrequency } from './SymptomFrequency'
import { ConditionPredictionTrend } from './ConditionPredictionTrend'
import { VitalsTrend } from './VitalsTrend'
import { ComparativePopulation } from './ComparativePopulation'
import { AssessmentTimeline } from './AssessmentTimeline'

/**
 * The standard patient-scoped module set.
 *
 * Used by the patient's own dashboard AND by the provider drill-down, which
 * is what guarantees a provider sees exactly what the patient sees for that
 * person - plus ComparativePopulation, which appears only when the payload
 * carries panel aggregates.
 */
export function TrendModuleGrid({ data, dateRange }) {
  if (!data) return null
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RiskScoreTrend data={data} dateRange={dateRange} />
      <SeverityHistory data={data} dateRange={dateRange} />
      <SymptomFrequency data={data} dateRange={dateRange} />
      <ConditionPredictionTrend data={data} dateRange={dateRange} />
      <VitalsTrend data={data} dateRange={dateRange} />
      <ComparativePopulation data={data} dateRange={dateRange} />
      <AssessmentTimeline
        data={data.assessment_history}
        dateRange={dateRange}
        showPatient={data.scope?.kind === 'panel'}
      />
    </div>
  )
}
