/**
 * Assessment view-model adapter.
 *
 * /assess returns the v2 shape, but assessments saved before the model rewrite
 * are still in the database in the v1 shape. Rather than migrate rows or
 * duplicate `result.disease_prediction?.top_possible_diseases?.[0]?...` chains
 * across six pages, every consumer reads through `viewOf(result)` and gets one
 * stable object regardless of which era the record came from.
 *
 * v2:  { schema_version, diagnosis, risk, severity, treatment, meta }
 * v1:  { disease_prediction, risk_assessment, symptom_analysis, care_plan,
 *        health_score, severity_analysis, recommendations }
 */

export function isV2(result) {
  return Boolean(result && result.schema_version && result.diagnosis)
}

const SEVERITY_TO_FLAG = {
  EMERGENCY: 'HIGH PRIORITY',
  URGENT: 'HIGH PRIORITY',
  MODERATE: 'REVIEW',
  MILD: 'LOW',
}

/** Legacy tiers used by v1's severity_analysis, mapped onto v2 levels. */
const LEGACY_TIER_TO_LEVEL = {
  emergency: 'EMERGENCY',
  critical: 'EMERGENCY',
  high: 'URGENT',
  severe: 'URGENT',
  moderate: 'MODERATE',
  medium: 'MODERATE',
  low: 'MILD',
  mild: 'MILD',
}

function emptyView() {
  return {
    version: 'unknown',
    topDisease: null,
    diseases: [],
    symptoms: [],
    symptomCount: 0,
    severityLevel: null,
    severityScore: null,
    severityAction: null,
    escalationReason: null,
    flag: 'LOW',
    healthScore: null,
    confidencePct: null,
    riskConditions: [],
    compositeRisk: null,
    treatments: [],
    suggestedCare: null,
    suggestedDoctor: null,
    disclaimer: '',
  }
}

export function viewOf(result) {
  if (!result) return emptyView()

  return isV2(result) ? viewV2(result) : viewV1(result)
}

/* ------------------------------------------------------------------ */

function viewV2(r) {
  const dx = r.diagnosis || {}
  const sev = r.severity || {}
  const risk = r.risk || {}
  const tx = r.treatment || {}
  const preds = dx.predictions || []

  const symptoms = (r.input?.symptoms || []).map((s) =>
    typeof s === 'string' ? { name: s, severity: 'moderate' } : s
  )

  return {
    version: 'v2',
    topDisease: preds[0]?.disease ?? null,
    diseases: preds.map((p) => ({
      name: p.disease,
      displayName: p.display_name || p.disease,
      confidencePct: p.confidence_pct,
      matchedSymptoms: p.matched_symptoms || [],
    })),
    symptoms,
    symptomCount: symptoms.length,

    severityLevel: sev.level ?? null,
    severityScore: sev.score ?? null,
    severityAction: sev.action ?? null,
    escalationReason: sev.escalation_override ?? null,
    criticalFlags: sev.critical_red_flags || [],
    flag: r.meta?.flag ?? SEVERITY_TO_FLAG[sev.level] ?? 'LOW',

    // Higher is better, consistently. v1 stored the inverse; see viewV1.
    healthScore: sev.score != null ? Math.round(100 - sev.score * 100) : null,
    confidencePct: dx.confidence?.display != null
      ? Math.round(dx.confidence.display * 100) : null,

    riskConditions: Object.entries(risk.conditions || {}).map(([key, c]) => ({
      key,
      label: c.label,
      probability: c.probability,
      riskScore: c.risk_score,
      band: c.band,
      flagged: c.flagged,
      drivers: c.drivers || [],
    })).sort((a, b) => b.riskScore - a.riskScore),
    compositeRisk: risk.composite?.score ?? null,
    compositeBand: risk.composite?.band ?? null,

    treatments: (tx.options || []).map((o) => ({
      drug: o.drug,
      rank: o.rank,
      rankByRating: o.rank_by_rating,
      satisfaction: o.satisfaction_rate,
      reviews: o.n_reviews,
    })),
    matchedCondition: tx.matched_condition ?? null,
    suggestedCare: tx.reference?.cures ?? null,
    suggestedDoctor: tx.reference?.doctor ?? null,

    caveats: r.meta?.caveats || [],
    disclaimer: r.disclaimer || '',
  }
}

function viewV1(r) {
  const dp = r.disease_prediction || {}
  const ra = r.risk_assessment || {}
  const sa = r.severity_analysis || {}
  const rec = r.recommendations || {}
  const top = dp.top_possible_diseases || []

  const rawSymptoms = r.symptom_analysis?.reported_symptoms || []
  const symptoms = rawSymptoms.map((s) =>
    typeof s === 'string' ? { name: s, severity: 'moderate' } : s
  )

  const level = LEGACY_TIER_TO_LEVEL[String(sa.severity_tier || '').toLowerCase()]
    || LEGACY_TIER_TO_LEVEL[String(ra.severity_level || '').toLowerCase()]
    || null

  // v1's `health_score` was the unified RISK score, i.e. higher was worse.
  // Invert it so a single trend line stays meaningful across both eras.
  const legacy = r.health_score ?? (ra.priority_score != null
    ? Math.round(ra.priority_score * 100) : null)

  return {
    version: 'v1',
    topDisease: top[0]?.disease_canonical ?? null,
    diseases: top.map((d) => ({
      name: d.disease_canonical,
      displayName: d.disease_canonical,
      confidencePct: d.confidence_pct,
      matchedSymptoms: [],
    })),
    symptoms,
    symptomCount: r.symptom_analysis?.symptom_count ?? symptoms.length,

    severityLevel: level,
    severityScore: ra.unified_risk_score != null ? ra.unified_risk_score / 100 : null,
    severityAction: sa.recommendations?.[0] ?? null,
    escalationReason: ra.emergency_reason ?? null,
    criticalFlags: ra.matched_red_flag_symptoms || [],
    flag: ra.flag ?? 'LOW',

    healthScore: legacy != null ? Math.round(100 - legacy) : null,
    confidencePct: dp.confidence_score != null
      ? Math.round(dp.confidence_score * 100) : null,

    riskConditions: (r.lifestyle_risk_screening || []).map((c) => ({
      key: c.condition,
      label: c.label || c.condition,
      probability: c.probability,
      riskScore: c.risk_percent ?? null,
      band: c.risk_level ?? null,
      flagged: Boolean(c.elevated),
      drivers: [],
    })),
    compositeRisk: null,
    compositeBand: null,

    treatments: [],
    matchedCondition: null,
    suggestedCare: rec.suggested_cures ?? null,
    suggestedDoctor: rec.suggested_doctor ?? null,

    caveats: [],
    disclaimer: r.disclaimer || '',
  }
}

/* ------------------------------------------------------------------ */
/* Presentation helpers                                                */
/* ------------------------------------------------------------------ */

export const SEVERITY_TONE = {
  EMERGENCY: 'bg-red-100 text-red-800 border-red-300',
  URGENT: 'bg-orange-100 text-orange-800 border-orange-300',
  MODERATE: 'bg-amber-100 text-amber-800 border-amber-300',
  MILD: 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

export const FLAG_TONE = {
  'HIGH PRIORITY': 'bg-red-100 text-red-800 border-red-300',
  REVIEW: 'bg-amber-100 text-amber-800 border-amber-300',
  LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

export function symptomNames(view) {
  return view.symptoms.map((s) => s.name)
}

export function titleCase(s) {
  if (!s) return ''
  return String(s).replace(/\b\w/g, (c) => c.toUpperCase())
}
