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
/* 4. Treatment - two-layer cascade                                     */
/* ------------------------------------------------------------------ */

/* The two layers mean genuinely different things and MUST NOT share a label.
   "mimic" is what clinicians actually prescribed during similar real
   admissions - hospital behaviour, but co-occurrence across every problem a
   patient had, not attribution to this diagnosis. "drug_reviews" is
   aggregated patient satisfaction, which is not efficacy or safety at all.
   Rendering both as one generic "Treatment options" table, as v2 did, invited
   the reader to trust them equally. */
const LAYER_PRESENTATION = {
  mimic: {
    title: 'Real hospital prescriptions',
    chip: 'bg-sky-100 text-sky-800 border-sky-300',
    banner: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  drug_reviews: {
    title: 'Patient-reported experience',
    chip: 'bg-violet-100 text-violet-800 border-violet-300',
    banner: 'border-violet-200 bg-violet-50 text-violet-900',
  },
  none: {
    title: 'No treatment data available for this condition',
    chip: 'bg-slate-100 text-slate-700 border-slate-300',
    banner: 'border-slate-200 bg-slate-50 text-slate-700',
  },
}

function MimicTable({ drugs }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-1 pb-2 font-semibold">Drug</th>
            <th className="px-1 pb-2 font-semibold">Class</th>
            <th className="px-1 pb-2 text-right font-semibold" title="Model confidence that this drug class applies">Class conf.</th>
            <th className="px-1 pb-2 text-right font-semibold" title="Model confidence in this specific drug within its class">Drug conf.</th>
          </tr>
        </thead>
        <tbody>
          {drugs.map((d) => (
            <tr key={`${d.drug_class}-${d.drug}`} className="border-b border-slate-100 last:border-0">
              <td className="px-1 py-2 font-medium text-slate-800">{d.drug}</td>
              <td className="px-1 py-2 capitalize text-slate-600">{d.drug_class}</td>
              <td className="px-1 py-2 text-right font-mono text-slate-600">{pct(d.class_confidence)}</td>
              <td className="px-1 py-2 text-right font-mono text-slate-400">
                {d.drug_confidence == null ? '—' : pct(d.drug_confidence)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReviewTable({ drugs }) {
  return (
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
          {drugs.map((o) => (
            <tr key={o.drug} className="border-b border-slate-100 last:border-0">
              <td className="px-1 py-2 font-medium text-slate-800">
                {o.drug}
                {o.mimic_confirmed && (
                  <span
                    className="ml-2 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700"
                    title="This drug also appears in real discharge notes mentioning this condition"
                  >
                    seen in hospital notes
                  </span>
                )}
              </td>
              <td className="px-1 py-2 text-right font-mono text-slate-600">#{o.rank}</td>
              <td className="px-1 py-2 text-right font-mono text-slate-600">#{o.rank_by_rating}</td>
              <td className="px-1 py-2 text-right font-mono text-slate-600">{pct(o.satisfaction_rate)}</td>
              <td className="px-1 py-2 text-right font-mono text-slate-400">{o.n_reviews.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TreatmentPanel({ treatment }) {
  const layer = treatment?.layer ?? 'none'
  const style = LAYER_PRESENTATION[layer] ?? LAYER_PRESENTATION.none
  const evidence = treatment?.evidence ?? {}
  const drugs = treatment?.drugs ?? []

  /* An empty panel is a correct answer, not a failure. Say so plainly rather
     than falling back to the nearest-matching condition's drug list. */
  if (layer === 'none' || drugs.length === 0) {
    return (
      <Card>
        <CardTitle icon={<Pill className="h-5 w-5" />}>Treatment options</CardTitle>
        <Unavailable reason={style.title} hint={evidence.caveat} />
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
      <CardTitle icon={<Pill className="h-5 w-5" />}>Treatment options</CardTitle>

      {/* The source label is the most important thing on this panel. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', style.chip)}>
          {style.title}
        </span>
        {treatment.condition && (
          <span className="text-xs text-slate-500">
            matched condition:{' '}
            <span className="font-medium text-slate-700">{treatment.condition}</span>
          </span>
        )}
      </div>

      {/* When the top-ranked condition has no treatment data the cascade asks
          down the differential. Whose drugs these are must be stated - a
          rank-3 drug list under a rank-1 heading would be worse than the empty
          panel it replaces. */}
      {treatment.is_alternate && (
        <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          These are for <span className="font-bold">{treatment.for_disease}</span>,
          ranked #{treatment.for_rank} in the differential — not for the
          top-ranked condition, which has no treatment data in either source.
        </p>
      )}

      {/* Layer A only: how much real-world evidence sits behind this panel. */}
      {layer === 'mimic' && (
        <p className="mb-3 text-xs text-slate-600">
          Drawn from <span className="font-semibold">{evidence.supporting_notes}</span> similar
          admissions · closest match{' '}
          <span className="font-mono font-semibold">{pct(evidence.best_similarity)}</span> similar
        </p>
      )}

      {layer === 'mimic' ? <MimicTable drugs={drugs} /> : <ReviewTable drugs={drugs} />}

      {layer === 'drug_reviews' && evidence.ranking_note && (
        /* Both orders are shown deliberately: the blended ranking is a
           statistical tie with a plain popularity baseline, so presenting it
           alone as authoritative would overstate what the model knows. */
        <p className="mt-3 text-xs text-slate-500">{evidence.ranking_note}</p>
      )}

      {/* Source-specific caveat, taken straight from the backend so the
          wording cannot drift from the layer that produced the numbers. */}
      <p className={cn('mt-3 rounded-lg border px-3 py-2 text-xs font-medium', style.banner)}>
        {evidence.caveat}
      </p>

      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
        Informational decision support for a clinician. Not a diagnosis and not a
        prescription.
      </p>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* 4b. Compact treatment summary (history / report listings)            */
/* ------------------------------------------------------------------ */

/**
 * Condensed treatment readout for places that list many assessments at once -
 * the history and provider-history pages - where a full TreatmentPanel table
 * would swamp the card.
 *
 * Takes a `viewOf()` view rather than the raw treatment block, because those
 * pages already normalise v1/v2/v3 records through it.
 *
 * It still names the SOURCE. That is the one thing this summary must not drop:
 * a bare list of drug names invites the reader to treat hospital
 * co-prescription and patient satisfaction ratings as the same evidence.
 */
export function TreatmentSummary({ view, className }) {
  const drugs = view?.treatments ?? []
  const layer = view?.treatmentLayer ?? 'none'
  const style = LAYER_PRESENTATION[layer] ?? LAYER_PRESENTATION.none

  if (!drugs.length) {
    return (
      <div className={className}>
        <p className="mb-1 font-medium text-slate-600">Treatment recommendations</p>
        <p className="text-xs text-slate-500">{style.title}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <p className="font-medium text-slate-600">Treatment recommendations</p>
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', style.chip)}>
          {style.title}
        </span>
        {view?.matchedCondition && (
          <span className="text-xs text-slate-500">· {view.matchedCondition}</span>
        )}
        {view?.treatmentIsAlternate && (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
            for {view.treatmentForDisease} (#{view.treatmentForRank})
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {drugs.slice(0, 6).map((d, i) => (
          <span
            key={`${d.drug}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
            title={d.drugClass ? `Class: ${d.drugClass}` : undefined}
          >
            <Pill className="h-3 w-3 text-slate-400" />
            {d.drug}
          </span>
        ))}
        {drugs.length > 6 && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            +{drugs.length - 6} more
          </span>
        )}
      </div>

      {view?.treatmentCaveat && (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
          {view.treatmentCaveat}
        </p>
      )}
    </div>
  )
}
