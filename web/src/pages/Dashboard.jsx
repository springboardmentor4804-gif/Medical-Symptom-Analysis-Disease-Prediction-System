import { useEffect, useState } from 'react'
import { Activity, Users, AlertTriangle, FileWarning, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { StatCard } from '../components/med/StatCard'
import { Card, CardTitle } from '../components/med/Card'
import { api, errorMessage } from '../lib/api'

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

  useEffect(() => {
    api.get('/analytics')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err, 'Could not load analytics')))
  }, [])

  if (error) return <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
  if (!data) return <p className="text-sm text-slate-400">Loading…</p>

  const riskData = Object.entries(data.risk_flag_distribution).map(([name, value]) => ({ name, value }))
  const diseaseData = data.top_predicted_diseases
  const trendData = data.assessments_per_day.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }))
  const genderData = Object.entries(data.gender_distribution).map(([name, value]) => ({ name, value }))
  const ageData = Object.entries(data.age_distribution).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Aggregate insights across all patient assessments</p>
      </header>

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
          <Card delay={0.2}>
            <CardTitle icon={<TrendingUp className="h-5 w-5" />}>Assessments (last 14 days)</CardTitle>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={BAR_COLOR} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

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

            <Card delay={0.3}>
              <CardTitle icon={<BarChart3 className="h-5 w-5" />}>Top Predicted Diseases</CardTitle>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={diseaseData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="disease" width={110} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
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
