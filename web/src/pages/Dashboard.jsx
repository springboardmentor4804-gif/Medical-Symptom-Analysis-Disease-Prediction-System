import { useEffect, useState } from 'react'
import { Activity, Users, AlertTriangle, FileWarning, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { StatCard } from '../components/med/StatCard'
import { Card, CardTitle } from '../components/med/Card'
import { api, errorMessage } from '../lib/api'
import {
  EscalationRateCard, PredictionsByConditionChart,
  RiskDistributionChart, ScopeBanner, VolumeTrendChart,
} from '../components/med/AnalyticsCharts'
/* Shared trend module library. The panel view mounts the panel-scoped
   modules; the drill-down mounts the same grid a patient sees. */
import {
  ConditionPredictionTrend, SeverityHistory, SymptomFrequency,
  TrendModuleGrid,
} from '../components/trends'

const RISK_COLORS = {
  'HIGH PRIORITY': '#dc2626',
  REVIEW: '#f59e0b',
  LOW: '#16a34a',
}
const BAR_COLOR = '#4f46e5'
const PIE_FALLBACK = ['#4f46e5', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  /* Panel analytics from the shared aggregation layer, alongside the legacy
     /analytics payload the demographic charts below still read. */
  const [panel, setPanel] = useState(null)
  const [roster, setRoster] = useState([])
  /* Drill-down: which patient's own analytics to show, if any. */
  const [selectedId, setSelectedId] = useState('')
  const [patientData, setPatientData] = useState(null)
  const [patientError, setPatientError] = useState('')

  useEffect(() => {
    api.get('/analytics')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err, 'Could not load analytics')))

    api.get('/analytics/panel')
      .then((res) => setPanel(res.data))
      .catch(() => setPanel(null))

    api.get('/analytics/patients')
      .then((res) => setRoster(res.data.patients || []))
      .catch(() => setRoster([]))
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setPatientData(null)
      setPatientError('')
      return
    }
    setPatientData(null)
    /* Server-side scope check happens again in resolve_scope() - this request
       is refused for anyone whose role may not read another patient. */
    api.get(`/analytics/patient/${selectedId}`)
      .then((res) => setPatientData(res.data))
      .catch((err) => setPatientError(errorMessage(err, 'Could not load that patient')))
  }, [selectedId])

  if (error) return <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
  if (!data) return <p className="text-sm text-slate-400">Loading…</p>

  /* Only the demographic charts are still derived here. Volume-over-time and
     top-conditions moved to the shared trend modules, which read the
     /analytics/panel payload directly. */
  const riskData = Object.entries(data.risk_flag_distribution).map(([name, value]) => ({ name, value }))
  const genderData = Object.entries(data.gender_distribution).map(([name, value]) => ({ name, value }))
  const ageData = Object.entries(data.age_distribution).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Aggregate insights across all patient assessments</p>
      </header>

      {panel && <ScopeBanner scope={panel.scope} summary={panel.summary} />}

      {panel && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <PredictionsByConditionChart data={panel.predictions_by_condition} />
            <RiskDistributionChart data={panel.risk_distribution} />
            <VolumeTrendChart data={panel.volume_trend} />
            <EscalationRateCard escalation={panel.escalation} />
            {/* Same modules the patient view uses, over the panel payload. */}
            <ConditionPredictionTrend data={panel} />
            <SeverityHistory data={panel} />
            <SymptomFrequency data={panel} />
          </div>

          {/* ---- Drill-down ---- */}
          <Card>
            <CardTitle icon={<Users className="h-5 w-5" />}>
              Individual patient analytics
            </CardTitle>
            <p className="mb-3 text-sm text-slate-600">
              Select a patient to view their personal analytics. These are the
              same charts the patient sees on their own dashboard, from the
              same aggregation — not a separate provider-side calculation.
            </p>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Patient</span>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full max-w-md rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">— none selected —</option>
                {roster.map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.email} · {p.assessment_count} assessment
                    {p.assessment_count === 1 ? '' : 's'}
                    {p.latest_assessment ? ` · latest ${p.latest_assessment.slice(0, 10)}` : ''}
                  </option>
                ))}
              </select>
            </label>

            {!roster.length && (
              <p className="mt-2 text-xs text-slate-500">
                No patients with assessments in your scope yet.
              </p>
            )}

            {patientError && (
              <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {patientError}
              </div>
            )}
            {selectedId && !patientData && !patientError && (
              <p className="mt-3 text-sm text-slate-400">Loading patient…</p>
            )}
          </Card>

          {patientData && (
            <div className="space-y-4">
              <ScopeBanner scope={patientData.scope} summary={patientData.summary} />
              {/* Identical module grid to the patient's own dashboard, plus
                  ComparativePopulation, which appears only because this
                  clinical-gated payload carries the panel baseline. */}
              <TrendModuleGrid data={patientData} />
            </div>
          )}
        </>
      )}

      <h2 className="pt-2 text-lg font-semibold text-slate-800">
        Population overview
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Assessments" icon={<Activity className="h-5 w-5" />} tone="primary" delay={0}>
          <p className="text-3xl font-bold">{data.total_assessments}</p>
        </StatCard>
        <StatCard label="Total Patients" icon={<Users className="h-5 w-5" />} tone="green" delay={0.05}>
          <p className="text-3xl font-bold">{data.total_patients}</p>
        </StatCard>
        <StatCard label="High Priority" icon={<AlertTriangle className="h-5 w-5" />} tone="red" delay={0.1}>
          <p className="text-3xl font-bold">{data.risk_flag_distribution['HIGH PRIORITY'] || 0}</p>
        </StatCard>
        <StatCard label="Needs Review" icon={<FileWarning className="h-5 w-5" />} tone="amber" delay={0.15}>
          <p className="text-3xl font-bold">{data.risk_flag_distribution['REVIEW'] || 0}</p>
        </StatCard>
      </div>

      {data.total_assessments === 0 ? (
        <Card hoverLift={false} className="p-10 text-center">
          <BarChart3 className="mx-auto h-16 w-16 text-slate-300" />
          <p className="mt-4 text-sm text-slate-600">
            No assessments recorded yet — charts will populate as patients use the Symptom Checker.
          </p>
        </Card>
      ) : (
        <>
          {/* Volume-over-time and top-conditions now come from the shared
              trend modules above; only the demographic charts remain here,
              since they have no per-patient equivalent. */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card delay={0.25}>
              <CardTitle icon={<PieChartIcon className="h-5 w-5" />}>Risk Flag Distribution</CardTitle>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {riskData.map((entry) => (
                      <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card delay={0.35}>
              <CardTitle icon={<PieChartIcon className="h-5 w-5" />}>Gender Distribution</CardTitle>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {genderData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_FALLBACK[i % PIE_FALLBACK.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card delay={0.4}>
              <CardTitle icon={<BarChart3 className="h-5 w-5" />}>Age Distribution</CardTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
