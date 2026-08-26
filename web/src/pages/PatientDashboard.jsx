import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, TrendingUp, FileText, Plus, AlertTriangle, File, Pill, BarChart3 } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StatCard } from '../components/med/StatCard'
import { Card, CardTitle } from '../components/med/Card'
import { Button } from '../components/med/Button'
import { RiskBadge } from '../components/med/Badge'
import { api, errorMessage } from '../lib/api'
import { ScopeBanner } from '../components/med/AnalyticsCharts'
/* Shared trend module library - the same components the provider dashboard
   renders, so a chart cannot mean two different things by role. */
import { TrendModuleGrid } from '../components/trends'

function scoreAccent(score) {
  if (score === null || score === undefined) return 'primary'
  if (score >= 70) return 'green'
  if (score >= 40) return 'amber'
  return 'red'
}

function riskLevel(flag) {
  if (flag === 'HIGH PRIORITY') return 'high'
  if (flag === 'REVIEW') return 'medium'
  return 'low'
}

export default function PatientDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [providerReportsCount, setProviderReportsCount] = useState(0)
  const [prescriptionsCount, setPrescriptionsCount] = useState(0)
  /* Analytics is an expanded section of this dashboard rather than a separate
     page, and it is lazy: the aggregation is only fetched when the patient
     opens it, so the default dashboard load is unchanged. */
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [analyticsError, setAnalyticsError] = useState('')

  useEffect(() => {
    api.get('/me/summary')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err, 'Could not load your dashboard')))
    
    // Fetch provider reports count
    api.get('/my-provider-reports')
      .then((res) => setProviderReportsCount(res.data.length))
      .catch(() => setProviderReportsCount(0))
    
    // Fetch prescriptions count
    api.get('/prescriptions/my-prescriptions')
      .then((res) => setPrescriptionsCount(res.data.length))
      .catch(() => setPrescriptionsCount(0))
  }, [])

  useEffect(() => {
    if (!showAnalytics || analytics) return
    /* /analytics/me is pinned server-side to the caller's own id - see
       resolve_scope(). There is no patient_id to pass, by design. */
    api.get('/analytics/me')
      .then((res) => setAnalytics(res.data))
      .catch((err) => setAnalyticsError(errorMessage(err, 'Could not load your analytics')))
  }, [showAnalytics, analytics])

  if (error) return <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
  if (!data) return <p className="text-sm text-slate-400">Loading…</p>

  const trend = data.health_score_trend.map((t) => ({ date: t.date.slice(5), score: t.health_score }))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Health Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Track your health assessments and trends</p>
        </div>
        <Link to="/checker">
          <Button className="pulse-cta">
            <Plus className="h-4 w-4" />
            New Symptom Check
          </Button>
        </Link>
      </header>

      {data.total_assessments === 0 ? (
        <Card hoverLift={false} className="p-12 text-center">
          <Activity className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No assessments yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            Start your health journey by running your first symptom check.
          </p>
          <Link to="/checker">
            <Button className="mt-6">Run your first check</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Latest Health Score"
              icon={<Activity className="h-5 w-5" />}
              tone={scoreAccent(data.latest_health_score)}
              delay={0}
            >
              <p className="text-3xl font-bold">{data.latest_health_score}/100</p>
            </StatCard>
            <StatCard
              label="Latest Risk Flag"
              icon={<TrendingUp className="h-5 w-5" />}
              tone={scoreAccent(data.latest_health_score)}
              delay={0.05}
            >
              <RiskBadge level={riskLevel(data.latest_risk_flag)} />
            </StatCard>
            <StatCard
              label="Total Assessments"
              icon={<FileText className="h-5 w-5" />}
              tone="primary"
              delay={0.1}
            >
              <p className="text-3xl font-bold">{data.total_assessments}</p>
            </StatCard>
          </div>

          {/* Provider Reports Card */}
          {providerReportsCount > 0 && (
            <Card delay={0.15} className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-indigo-100 p-3">
                    <File className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      You have {providerReportsCount} new provider {providerReportsCount === 1 ? 'report' : 'reports'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Your healthcare provider has sent you treatment recommendations
                    </p>
                  </div>
                </div>
                <Link to="/provider-reports">
                  <Button>View Reports</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Prescriptions Card */}
          {prescriptionsCount > 0 && (
            <Card delay={0.2} className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-3">
                    <Pill className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      You have {prescriptionsCount} {prescriptionsCount === 1 ? 'prescription' : 'prescriptions'}
                    </p>
                    <p className="text-sm text-slate-600">
                      View and download your prescriptions
                    </p>
                  </div>
                </div>
                <Link to="/prescriptions">
                  <Button>View Prescriptions</Button>
                </Link>
              </div>
            </Card>
          )}

          {trend.length > 1 && (
            <Card delay={0.15}>
              <CardTitle icon={<TrendingUp className="h-5 w-5" />}>Health Score Trend</CardTitle>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card delay={0.2}>
            <CardTitle icon={<FileText className="h-5 w-5" />}>Recent Assessments</CardTitle>
            <ul className="divide-y divide-slate-100">
              {data.recent_assessments.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <RiskBadge level={riskLevel(a.risk_flag)} size="sm" />
                    <span className="text-sm text-slate-700">{a.top_disease || 'No condition matched'}</span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(a.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
            <Link to="/history" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
              View full history →
            </Link>
          </Card>
        </>
      )}

      {/* ---- Analytics ---- */}
      <Card delay={0.25}>
        <button
          type="button"
          onClick={() => setShowAnalytics((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2.5">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <span className="text-base font-semibold sm:text-lg">Analytics</span>
            <span className="text-xs text-slate-500">
              your trends across all past check-ins
            </span>
          </span>
          <span className={`text-slate-400 transition-transform ${showAnalytics ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {showAnalytics && (
          <div className="mt-4 space-y-4">
            {analyticsError && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {analyticsError}
              </div>
            )}
            {!analytics && !analyticsError && (
              <p className="text-sm text-slate-400">Loading analytics…</p>
            )}
            {analytics && (
              <>
                <ScopeBanner scope={analytics.scope} summary={analytics.summary} />
                <TrendModuleGrid data={analytics} />
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
