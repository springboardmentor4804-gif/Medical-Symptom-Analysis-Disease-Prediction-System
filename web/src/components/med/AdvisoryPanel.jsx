import { motion } from 'framer-motion'
import { Clock, HeartPulse, Info, Sparkles, TrendingUp } from 'lucide-react'
import { Card, CardTitle } from './Card'
import { Badge } from './Badge'
import { SEVERITY_STYLES } from './ResultPanels'
import { cn } from '../../lib/utils'

/* ------------------------------------------------------------------ */
/* Advisory features — standing guidance, below preventive care        */
/* ------------------------------------------------------------------ */

/**
 * Advisory Features is a DIFFERENT layer from Preventive Care, and the
 * sub-section titles are what carry that distinction to the reader:
 * Preventive Care answers "what do I do about this risk score now",
 * Advisory answers "what should I generally know or watch for over time".
 * Only `symptom_trend` can see across assessments at all.
 *
 * Each sub-section gets its own accent so the five are distinguishable at a
 * glance, and four of them carry a diagram. Every diagram is driven by a real
 * computed value - importance weights, session counts, age windows, symptom
 * overlap - never decoration. A section whose data cannot support its diagram
 * simply renders the list.
 */
const ADVISORY_SECTIONS = [
  {
    key: 'lifestyle_advisory', title: 'Lifestyle guidance', Icon: HeartPulse,
    blurb: 'Standing guidance for the factors driving your screening risk.',
    accent: 'border-rose-200 bg-rose-50/40',
    chip: 'bg-rose-100 text-rose-800 border-rose-300',
    bar: 'bg-rose-500', icon: 'text-rose-600',
  },
  {
    key: 'screening_reminders', title: 'Screening reminders', Icon: Clock,
    blurb: 'Age and risk-profile based, independent of this assessment.',
    accent: 'border-sky-200 bg-sky-50/40',
    chip: 'bg-sky-100 text-sky-800 border-sky-300',
    bar: 'bg-sky-500', icon: 'text-sky-600',
  },
  {
    key: 'symptom_trend', title: 'Patterns across your assessments', Icon: TrendingUp,
    blurb: 'Detected from your assessment history, not this session alone.',
    accent: 'border-violet-200 bg-violet-50/40',
    chip: 'bg-violet-100 text-violet-800 border-violet-300',
    bar: 'bg-violet-500', icon: 'text-violet-600',
  },
  {
    key: 'condition_education', title: 'About this condition', Icon: Info,
    blurb: 'Educational background, not treatment instructions.',
    accent: 'border-teal-200 bg-teal-50/40',
    chip: 'bg-teal-100 text-teal-800 border-teal-300',
    bar: 'bg-teal-500', icon: 'text-teal-600',
  },
  {
    key: 'behavioral_nudges', title: 'Suggested next steps', Icon: Sparkles,
    blurb: 'Tied to the specific risk factors the model computed.',
    accent: 'border-emerald-200 bg-emerald-50/40',
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    bar: 'bg-emerald-500', icon: 'text-emerald-600',
  },
]

/**
 * Relative contribution of each risk factor.
 *
 * Bars are scaled to the LARGEST factor in this patient's own set rather than
 * to an absolute axis: gradient-boosting importances are small fractions, and
 * an absolute scale renders every bar as an indistinguishable sliver. The raw
 * weight is printed alongside so the axis choice cannot mislead.
 */
function FactorWeightBars({ items, barClass }) {
  const max = Math.max(...items.map((i) => i.importance || 0), 0.0001)
  return (
    <div className="mb-3 space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate text-xs text-slate-600" title={item.factor}>
            {item.factor}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(6, ((item.importance || 0) / max) * 100)}%` }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={cn('h-full rounded-full', barClass)}
            />
          </div>
          <span className="w-14 shrink-0 text-right font-mono text-[10px] text-slate-500">
            {(item.importance ?? 0).toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Age timeline: which screening windows the patient has entered, and where
 * they sit on each. Drawn from `from_age` / `to_age` / `patient_age`, so an
 * entered window reads as entered rather than as another sentence.
 */
function ScreeningTimeline({ items }) {
  const age = items[0]?.patient_age
  if (age == null) return null

  const MIN = 18
  const MAX = 80
  const pos = (a) => ((Math.min(Math.max(a, MIN), MAX) - MIN) / (MAX - MIN)) * 100

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium text-slate-600">Screening windows by age</span>
        <span className="font-mono text-[10px] text-slate-500">you are {age}</span>
      </div>

      <div className="space-y-1.5">
        {items.map((item, i) => {
          const left = pos(item.from_age ?? MIN)
          const right = pos(item.to_age ?? MAX)
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-[11px] capitalize text-slate-600">
                {String(item.key || '').replace(/_/g, ' ')}
              </span>
              <div className="relative h-2.5 flex-1 rounded-full bg-slate-100">
                <div
                  className="absolute inset-y-0 rounded-full bg-sky-400"
                  style={{ left: `${left}%`, width: `${Math.max(2, right - left)}%` }}
                />
                <div
                  className="absolute -top-0.5 h-3.5 w-0.5 rounded bg-slate-800"
                  style={{ left: `${pos(age)}%` }}
                  title={`Your age: ${age}`}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-[10px] text-slate-500">
                {item.from_age}
                {item.to_age ? `–${item.to_age}` : '+'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-slate-400">
        <span>{MIN}</span><span>40</span><span>60</span><span>{MAX}+</span>
      </div>
    </div>
  )
}

/**
 * "3 of your last 4 assessments" as filled dots. The ratio is the finding,
 * and a row of dots carries it faster than re-reading the sentence.
 */
function SessionDots({ count, total, dotClass }) {
  if (!count || !total) return null
  return (
    <span className="ml-1 inline-flex items-center gap-1 align-middle">
      {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
        <span
          key={i}
          className={cn('h-2 w-2 rounded-full', i < count ? dotClass : 'bg-slate-200')}
        />
      ))}
      <span className="ml-0.5 font-mono text-[10px] text-slate-500">
        {count}/{total}
      </span>
    </span>
  )
}

/* Node colours as literal hex, deliberately NOT derived from SEVERITY_STYLES
   at runtime. Tailwind only emits classes it can see in the source, so
   building `fill-emerald-500` from `bg-emerald-500` with .replace() produces a
   class that was never generated and the dots render unfilled. These values
   mirror the SEVERITY_STYLES palette; keep them in step with it. */
const SEVERITY_HEX = {
  MILD: '#10b981',
  MODERATE: '#f59e0b',
  URGENT: '#f97316',
  EMERGENCY: '#dc2626',
}

/**
 * Severity direction as a step line.
 *
 * Ranks mirror the triage vocabulary, so the trend cannot disagree with the
 * banner above it.
 */
function SeveritySparkline({ advisory }) {
  /* The advisory sentence carries the sequence as "MILD → MODERATE → URGENT". */
  const levels = String(advisory || '')
    .split('→')
    .map((s) => s.trim().replace(/[^A-Z]/g, ''))
    .filter((s) => SEVERITY_STYLES[s])
  if (levels.length < 2) return null

  const RANK = { MILD: 1, MODERATE: 2, URGENT: 3, EMERGENCY: 4 }
  const W = 180
  const H = 40
  const step = W / Math.max(1, levels.length - 1)
  const y = (lvl) => H - 6 - ((RANK[lvl] - 1) / 3) * (H - 14)
  const points = levels.map((l, i) => `${i * step},${y(l)}`).join(' ')

  return (
    <svg
      width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mt-1.5"
      role="img" aria-label={`Severity trend: ${levels.join(' then ')}`}
    >
      <polyline
        points={points} fill="none" stroke="#8b5cf6" strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
      />
      {levels.map((l, i) => (
        <circle
          key={i} cx={i * step} cy={y(l)} r="3.5"
          fill={SEVERITY_HEX[l] || '#8b5cf6'}
        />
      ))}
    </svg>
  )
}

/**
 * How much of the condition's typical symptom profile this patient matched.
 * Both numbers come from the disease model, so the ring is a real ratio and
 * not an illustration.
 */
function MatchRing({ matched, total }) {
  if (!total) return null
  const R = 20
  const CIRC = 2 * Math.PI * R
  const frac = Math.min(1, (matched || 0) / total)

  return (
    <div className="flex items-center gap-2">
      <svg
        width="52" height="52" viewBox="0 0 52 52" role="img"
        aria-label={`${matched} of ${total} typical symptoms matched`}
      >
        <circle cx="26" cy="26" r={R} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="26" cy="26" r={R} fill="none" stroke="#14b8a6" strokeWidth="6"
          strokeDasharray={`${CIRC * frac} ${CIRC}`} strokeLinecap="round"
          transform="rotate(-90 26 26)"
        />
        <text
          x="26" y="30" textAnchor="middle" className="fill-slate-700"
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          {matched}/{total}
        </text>
      </svg>
      <span className="text-xs text-slate-500">
        of the typical symptom profile matched
      </span>
    </div>
  )
}

export function AdvisoryPanel({ advisory }) {
  if (!advisory) return null

  /* Sub-sections that produced nothing are listed compactly with their reason
     rather than hidden entirely - "no history yet" is useful information, and
     silently omitting it reads as a missing feature. */
  const shown = ADVISORY_SECTIONS.filter((s) => advisory[s.key]?.available)
  const omitted = ADVISORY_SECTIONS.filter(
    (s) => advisory[s.key] && !advisory[s.key].available)

  if (!shown.length && !omitted.length) return null

  return (
    <Card>
      <CardTitle
        icon={<Info className="h-5 w-5" />}
        action={(
          <Badge tone="muted">
            {shown.length} of {ADVISORY_SECTIONS.length} available
          </Badge>
        )}
      >
        Advisory features
      </CardTitle>
      <p className="mb-4 text-sm text-slate-600">
        General health guidance and longer-term patterns — distinct from the
        assessment-specific advice above.
      </p>

      <div className="space-y-4">
        {shown.map(({ key, title, blurb, Icon, accent, chip, bar, icon }) => {
          const section = advisory[key]
          const items = section.items || []
          const isEducation = key === 'condition_education'
          const profile = isEducation ? items.find((i) => i.typical_count) : null

          return (
            <div key={key} className={cn('rounded-xl border p-4', accent)}>
              <div className="mb-1 flex items-center gap-2">
                <Icon className={cn('h-4 w-4 shrink-0', icon)} />
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                <span className={cn(
                  'ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                  chip,
                )}>
                  {items.length}
                </span>
              </div>
              <p className="mb-3 text-xs text-slate-500">{blurb}</p>

              {/* Diagram, where this section's data supports one. */}
              {key === 'lifestyle_advisory' && items.some((i) => i.importance) && (
                <FactorWeightBars items={items} barClass={bar} />
              )}
              {key === 'screening_reminders' && <ScreeningTimeline items={items} />}
              {profile && (
                <div className="mb-3">
                  <MatchRing matched={profile.matched_count} total={profile.typical_count} />
                </div>
              )}

              {isEducation && section.heading && (
                <p className="mb-1.5 text-sm font-medium text-slate-700">
                  {section.heading}
                </p>
              )}

              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-700">
                    {item.factor && <span className="font-medium">{item.factor}: </span>}
                    {item.title && <span className="font-medium">{item.title}: </span>}
                    {item.subject && <span className="font-medium">{item.subject}: </span>}
                    {item.advisory || item.nudge || item.text}

                    {item.count > 0 && item.of_sessions > 0 && (
                      <SessionDots
                        count={item.count} total={item.of_sessions} dotClass={bar}
                      />
                    )}
                    {item.type === 'severity_trend' && (
                      <SeveritySparkline advisory={item.advisory} />
                    )}

                    {item.standing_guidance && (
                      <span className="block text-xs text-slate-500">
                        {item.standing_guidance}
                      </span>
                    )}

                    {/* Which flagged conditions this factor drives - the audit
                        trail back to the risk model, as chips rather than a
                        comma list so the count is visible at a glance. */}
                    {item.drives?.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {item.drives.map((d) => (
                          <span key={d} className={cn(
                            'rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
                            chip,
                          )}>
                            {d}
                          </span>
                        ))}
                      </span>
                    )}
                    {item.applies_because && (
                      <span className="block text-xs text-slate-500">
                        Applies because: {item.applies_because}
                      </span>
                    )}

                    {/* Provenance. Every advisory item must be traceable to a
                        specific upstream data point, so the source is shown. */}
                    {item.source && (
                      <span className="ml-1 font-mono text-[10px] uppercase tracking-wide text-slate-400">
                        {item.source}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {section.closing_note && (
                <p className="mt-2 text-xs italic text-slate-500">
                  {section.closing_note}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {omitted.length > 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <p className="mb-1 text-xs font-semibold text-slate-600">
            Not available yet
          </p>
          <ul className="space-y-1">
            {omitted.map(({ key, title, Icon }) => (
              <li key={key} className="flex items-start gap-1.5 text-xs text-slate-500">
                <Icon className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                <span>
                  <span className="font-medium">{title}:</span>{' '}
                  {advisory[key].reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {advisory.disclaimer && (
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs italic text-slate-500">
          {advisory.disclaimer}
        </p>
      )}
    </Card>
  )
}
