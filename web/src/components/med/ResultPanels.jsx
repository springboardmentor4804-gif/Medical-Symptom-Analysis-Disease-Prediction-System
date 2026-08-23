import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, CheckCircle2, HeartPulse, Info, Pill,
  ShieldAlert, Stethoscope, TrendingUp,
} from 'lucide-react'
import { Card, CardTitle } from './Card'
import { Badge } from './Badge'
import { cn } from '../../lib/utils'

/* ------------------------------------------------------------------ */
/* Shared styling                                                      */
/* ------------------------------------------------------------------ */

export const SEVERITY_STYLES = {
  EMERGENCY: {
    ring: 'border-red-300 bg-red-50', text: 'text-red-800', dot: 'bg-red-600',
    chip: 'bg-red-100 text-red-800 border-red-300', Icon: ShieldAlert,
  },
  URGENT: {
    ring: 'border-orange-300 bg-orange-50', text: 'text-orange-800', dot: 'bg-orange-500',
    chip: 'bg-orange-100 text-orange-800 border-orange-300', Icon: AlertTriangle,
  },
  MODERATE: {
    ring: 'border-amber-300 bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-800 border-amber-300', Icon: Info,
  },
  MILD: {
    ring: 'border-emerald-300 bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-300', Icon: CheckCircle2,
  },
}

const BAND_STYLES = {
  high: 'bg-red-100 text-red-800 border-red-300',
  elevated: 'bg-orange-100 text-orange-800 border-orange-300',
  average: 'bg-amber-100 text-amber-800 border-amber-300',
  moderate: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

const pct = (v) => `${Math.round((v ?? 0) * 100)}%`

/* ------------------------------------------------------------------ */
/* Empty state — shown whenever a block reports available:false        */
/* ------------------------------------------------------------------ */

export function Unavailable({ reason, hint }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
      <p>{reason}</p>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Severity / triage banner                                         */
/* ------------------------------------------------------------------ */

export function TriageBanner({ severity }) {
  if (!severity) return null
  const s = SEVERITY_STYLES[severity.level] || SEVERITY_STYLES.MILD
  const { Icon } = s

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('rounded-2xl border-2 p-5 shadow-soft sm:p-6', s.ring)}
    >
      <div className="flex flex-wrap items-start gap-4">
        <Icon className={cn('h-8 w-8 shrink-0', s.text)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn('text-xl font-bold sm:text-2xl', s.text)}>
              {severity.level}
            </h2>
            <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', s.chip)}>
              score {severity.score?.toFixed(2)}
            </span>
          </div>
          <p className={cn('mt-1 text-base font-medium', s.text)}>{severity.action}</p>

          {severity.escalation_override && (
            <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm font-medium text-slate-800">
              <strong>Escalated:</strong> {severity.escalation_override}
            </p>
          )}

          {severity.critical_red_flags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {severity.critical_red_flags.map((f) => (
                <span key={f} className="rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                  ⚠ {f}
                </span>
              ))}
            </div>
          )}
          {severity.abnormal_vitals?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {severity.abnormal_vitals.map((v) => (
                <span key={v.vital} className="rounded-full border border-orange-300 bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                  {v.vital.replace(/_/g, ' ')} {v.value}{v.unit} ({v.direction}, normal {v.normal_range[0]}–{v.normal_range[1]})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* Component-by-component breakdown of how the severity score was reached. */
export function SeverityBreakdown({ severity }) {
  if (!severity?.components) return null
  const rows = Object.entries(severity.components)
    .sort((a, b) => b[1].contribution - a[1].contribution)

  return (
    <Card>
      <CardTitle icon={<Activity className="h-5 w-5" />}>How this was scored</CardTitle>
      <div className="space-y-3">
        {rows.map(([key, c]) => (
          <div key={key}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate-700">{c.label}</span>
              <span className="shrink-0 font-mono text-xs text-slate-500">
                {c.raw.toFixed(2)} × {c.weight} = <strong className="text-slate-800">{c.contribution.toFixed(3)}</strong>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(c.raw * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full bg-gradient-primary"
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        Rule-weighted and auditable by design — no dataset here carries labelled
        triage outcomes, so a learned severity model would be fitting noise.
        A red flag overrides the total score entirely.
      </p>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Differential diagnosis                                           */
/* ------------------------------------------------------------------ */

export function DiagnosisPanel({ diagnosis }) {
  if (!diagnosis?.available) {
    return (
      <Card>
        <CardTitle icon={<Stethoscope className="h-5 w-5" />}>Possible conditions</CardTitle>
        <Unavailable
          reason={diagnosis?.reason || 'No diagnosis available.'}
          hint="Try picking symptoms from the suggestion list so they match the model's vocabulary."
        />
      </Card>
    )
  }

  const { predictions, confidence, unmatched_symptoms: unmatched } = diagnosis
  const top = predictions[0]

  return (
    <Card>
      <CardTitle
        icon={<Stethoscope className="h-5 w-5" />}
        action={<Badge tone={confidence.label === 'High' ? 'teal' : 'muted'}>{confidence.label} confidence</Badge>}
      >
        Possible conditions
      </CardTitle>

      {/* Calibrated confidence: raw model probability is usually overconfident,
          so the empirically observed accuracy for this band is shown instead. */}
      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-indigo-900">
        {confidence.explanation}
        {confidence.calibrated != null && confidence.calibrated !== confidence.raw && (
          <span className="ml-1 text-indigo-700">
            (raw {pct(confidence.raw)} → calibrated {pct(confidence.calibrated)})
          </span>
        )}
      </div>

      <ol className="space-y-3">
        {predictions.map((p, i) => (
          <li
            key={p.disease}
            className={cn(
              'rounded-xl border p-3.5',
              i === 0 ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white'
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold capitalize text-slate-900">
                {i + 1}. {p.display_name || p.disease}
              </span>
              <span className="font-mono text-sm text-slate-600">{p.confidence_pct}%</span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(p.confidence_pct * 3, 100)}%` }}
                className={cn('h-full rounded-full', i === 0 ? 'bg-gradient-primary' : 'bg-slate-300')}
              />
            </div>

            {p.matched_symptoms?.length > 0 && (
              <p className="mt-2.5 text-xs text-slate-600">
                <span className="font-semibold text-emerald-700">Matches your symptoms:</span>{' '}
                {p.matched_symptoms.join(', ')}
              </p>
            )}
            {p.reference?.cures && (
              <p className="mt-1.5 text-xs text-slate-600">
                <span className="font-semibold">Typical care:</span> {p.reference.cures}
                {p.reference.doctor && <> · <span className="font-semibold">See:</span> {p.reference.doctor}</>}
              </p>
            )}
          </li>
        ))}
      </ol>

      {unmatched?.length > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Not recognised and therefore excluded from the prediction:{' '}
          <strong>{unmatched.join(', ')}</strong>
        </p>
      )}

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        Trained on a synthetically augmented symptom matrix — treat this as a
        shortlist to discuss with a clinician, not a diagnosis.
      </p>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Chronic risk                                                     */
/* ------------------------------------------------------------------ */

export function RiskPanel({ risk }) {
  if (!risk?.available) {
    return (
      <Card>
        <CardTitle icon={<HeartPulse className="h-5 w-5" />}>Chronic condition risk</CardTitle>
        <Unavailable
          reason={risk?.reason || 'No risk assessment available.'}
          hint="Chronic risk is screened from lifestyle and demographic inputs — complete the health profile step to enable it."
        />
      </Card>
    )
  }

  const ranked = Object.entries(risk.conditions).sort((a, b) => b[1].risk_score - a[1].risk_score)

  return (
    <Card>
      <CardTitle
        icon={<HeartPulse className="h-5 w-5" />}
        action={
          <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', BAND_STYLES[risk.composite.band])}>
            composite {risk.composite.score}/100
          </span>
        }
      >
        Chronic condition risk
      </CardTitle>

      {risk.profile_completeness < 1 && (
        <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Profile {pct(risk.profile_completeness)} complete — missing answers are handled
          natively by the model, but filling more of them narrows the estimate.
        </p>
      )}

      <div className="space-y-2.5">
        {ranked.map(([key, c]) => (
          <div key={key} className="rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-slate-800">{c.label}</span>
              <div className="flex items-center gap-2">
                {c.flagged && (
                  <span className="rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                    above screening threshold
                  </span>
                )}
                <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', BAND_STYLES[c.band])}>
                  {c.risk_score}/100 · {c.band}
                </span>
              </div>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.risk_score}%` }}
                transition={{ duration: 0.6 }}
                className={cn(
                  'h-full rounded-full',
                  c.band === 'high' ? 'bg-red-500'
                    : c.band === 'elevated' ? 'bg-orange-400'
                      : c.band === 'average' ? 'bg-amber-400' : 'bg-emerald-500'
                )}
              />
            </div>

            {c.drivers?.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                <TrendingUp className="mr-1 inline h-3 w-3" />
                Strongest predictors: {c.drivers.slice(0, 3).map((d) => d.label).join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {risk.note} Scores are percentiles against 1.1M CDC BRFSS respondents:
        “{ranked[0]?.[1].risk_score}/100” means this profile ranks above that
        share of surveyed US adults.
      </p>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Treatment                                                        */
/* ------------------------------------------------------------------ */

export function TreatmentPanel({ treatment }) {
  if (!treatment?.available) {
    return (
      <Card>
        <CardTitle icon={<Pill className="h-5 w-5" />}>Treatment options</CardTitle>
        <Unavailable reason={treatment?.reason || 'No treatment data available.'} />
        {treatment?.reference?.cures && (
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-semibold">General guidance:</span> {treatment.reference.cures}
          </p>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle icon={<Pill className="h-5 w-5" />}>
        Treatment options · {treatment.matched_condition}
      </CardTitle>

      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-1 pb-2 font-semibold">Drug</th>
              <th className="px-1 pb-2 text-right font-semibold" title="Blends outcome rating with how commonly it is used">Commonly used</th>
              <th className="px-1 pb-2 text-right font-semibold" title="Pure outcome rating, ignoring prevalence">Best rated</th>
              <th className="px-1 pb-2 text-right font-semibold">Satisfaction</th>
              <th className="px-1 pb-2 text-right font-semibold">Reviews</th>
            </tr>
          </thead>
          <tbody>
            {treatment.options.map((o) => (
              <tr key={o.drug} className="border-b border-slate-100 last:border-0">
                <td className="px-1 py-2 font-medium text-slate-800">{o.drug}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-600">#{o.rank}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-600">#{o.rank_by_rating}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-600">{pct(o.satisfaction_rate)}</td>
                <td className="px-1 py-2 text-right font-mono text-slate-400">{o.n_reviews.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Both orders are shown deliberately: the blended ranking is a
          statistical tie with a plain popularity baseline, so presenting it
          alone as authoritative would overstate what the model knows. */}
      <p className="mt-3 text-xs text-slate-500">{treatment.ranking_note}</p>
      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
        {treatment.disclaimer}
      </p>
    </Card>
  )
}
