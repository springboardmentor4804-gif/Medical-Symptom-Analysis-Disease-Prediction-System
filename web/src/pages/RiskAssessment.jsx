import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { Activity, HeartPulse, Shield, TrendingUp } from 'lucide-react'
import { Card, CardTitle } from '../components/med/Card'
import { StatCard } from '../components/med/StatCard'
import { Button } from '../components/med/Button'
import {
  DiagnosisPanel, RiskPanel, SeverityBreakdown, TreatmentPanel, TriageBanner,
  RecommendationPanel, PreventiveCarePanel, Unavailable,
} from '../components/med/ResultPanels'
import { AdvisoryPanel } from '../components/med/AdvisoryPanel'
import { api, errorMessage } from '../lib/api'
import { viewOf } from '../lib/assessment'

const BAND_COLOR = {
  high: '#ef4444',
  elevated: '#fb923c',
  average: '#fbbf24',
  moderate: '#fbbf24',
  low: '#10b981',
}

export default function RiskAssessment() {
  const [assessments, setAssessments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/history')
      .then((res) => setAssessments(res.data || []))
      .catch((err) => setError(errorMessage(err, 'Could not load risk assessment data')))
      .finally(() => setLoading(false))
  }, [])

  const latest = assessments.length ? assessments[assessments.length - 1] : null
  const result = latest?.result ?? null
  const view = useMemo(() => (result ? viewOf(result) : null), [result])

  const trend = useMemo(() => assessments.slice(-14).map((a) => {
    const v = viewOf(a.result)
    return {
      date: new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      health: v.healthScore,
      risk: v.compositeRisk,
    }
  }), [assessments])

  const conditionBars = useMemo(
    () => (view?.riskConditions ?? []).map((c) => ({
      name: c.label, score: c.riskScore, band: c.band, flagged: c.flagged,
    })),
    [view]
  )

  if (loading) return <p className="text-sm text-slate-400">Loading risk assessment…</p>
  if (error) return <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>

  if (!latest) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Risk assessment</h1>
          <p className="mt-1 text-sm text-slate-600">
            Chronic condition screening and triage from your latest assessment
          </p>
        </header>
        <Card hoverLift={false} className="p-12 text-center">
          <Shield className="mx-auto h-14 w-14 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No assessment data yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Run a symptom check and include the health profile step to see your
            chronic risk screening.
          </p>
          <Link to="/checker" className="mt-5 inline-block">
            <Button>Start an assessment</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const isLegacy = view.version === 'v1'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Risk assessment</h1>
          <p className="mt-1 text-sm text-slate-600">
            From your latest assessment ·{' '}
            {new Date(latest.created_at).toLocaleString()}
          </p>
        </div>
        <Link to="/checker"><Button variant="secondary">New assessment</Button></Link>
      </header>

      {isLegacy && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This assessment was produced by the previous model version, so the
          calibrated risk percentiles and treatment ranking below are not
          available for it. Run a new assessment to get the full analysis.
        </div>
      )}

      <TriageBanner severity={result.severity} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Health score" icon={<Activity className="h-5 w-5" />}>
          <p className="text-3xl font-bold">{view.healthScore ?? '—'}<span className="text-lg text-slate-400">/100</span></p>
          <p className="mt-1 text-xs text-slate-500">Higher is better</p>
        </StatCard>
        <StatCard label="Composite risk" icon={<HeartPulse className="h-5 w-5" />}>
          <p className="text-3xl font-bold">{view.compositeRisk ?? '—'}</p>
          <p className="mt-1 text-xs capitalize text-slate-500">{view.compositeBand || 'profile not supplied'}</p>
        </StatCard>
        <StatCard label="Triage level" icon={<Shield className="h-5 w-5" />}>
          <p className="text-2xl font-bold">{view.severityLevel || '—'}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{view.severityAction || ''}</p>
        </StatCard>
        <StatCard label="Conditions flagged" icon={<TrendingUp className="h-5 w-5" />}>
          <p className="text-3xl font-bold">{view.riskConditions.filter((c) => c.flagged).length}</p>
          <p className="mt-1 text-xs text-slate-500">of {view.riskConditions.length} screened</p>
        </StatCard>
      </div>

      {/* Per-condition percentiles. These are real calibrated values from the
          model - the previous version of this page substituted hardcoded
          5/35/75% placeholders whenever a value was missing. */}
      {conditionBars.length > 0 ? (
        <Card>
          <CardTitle icon={<HeartPulse className="h-5 w-5" />}>
            Chronic risk percentiles
          </CardTitle>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conditionBars} layout="vertical" margin={{ left: 20, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v, _n, p) => [`${v}/100 (${p.payload.band})`, 'Percentile']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {conditionBars.map((c) => (
                    <Cell key={c.name} fill={BAND_COLOR[c.band] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Percentile against 1.1M CDC BRFSS respondents — “80/100” means this
            profile ranks above 80% of surveyed US adults for that condition.
          </p>
        </Card>
      ) : (
        <Card>
          <CardTitle icon={<HeartPulse className="h-5 w-5" />}>Chronic risk percentiles</CardTitle>
          <Unavailable
            reason="No chronic risk screening in this assessment."
            hint="Chronic risk uses lifestyle and demographic inputs, not symptoms — complete the health profile step when running an assessment."
          />
        </Card>
      )}

      {trend.length > 1 && (
        <Card>
          <CardTitle icon={<TrendingUp className="h-5 w-5" />}>Trend</CardTitle>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: 4, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="health" name="Health score" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="risk" name="Composite risk" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <RiskPanel risk={result.risk} />
      <DiagnosisPanel diagnosis={result.diagnosis} />
      <TreatmentPanel treatment={result.treatment} />
      <RecommendationPanel recommendation={result.recommendation} />
          <PreventiveCarePanel recommendation={result.recommendation} />
          <AdvisoryPanel advisory={result.advisory} />
      <SeverityBreakdown severity={result.severity} />
    </div>
  )
}
