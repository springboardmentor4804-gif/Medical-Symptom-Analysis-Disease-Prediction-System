import { useEffect, useState } from 'react'
import { FileText, Pill, Download, Calendar, Activity, User as UserIcon, TrendingUp } from 'lucide-react'
import { Card, CardTitle } from '../components/med/Card'
import { Button } from '../components/med/Button'
import { RiskBadge } from '../components/med/Badge'
import { TreatmentSummary } from '../components/med/ResultPanels'
import { api, errorMessage } from '../lib/api'
import { viewOf, symptomNames } from '../lib/assessment'

const FLAG_BADGE_COLOR = {
  'HIGH PRIORITY': 'high',
  'REVIEW': 'medium',
  'LOW': 'low',
}

function riskLevel(flag) {
  return FLAG_BADGE_COLOR[flag] || 'low'
}

function scoreColor(score) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-rose-600'
}

export default function History() {
  const [assessments, setAssessments] = useState([])
  const [providerReports, setProviderReports] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(null)
  const [filterType, setFilterType] = useState('all') // all, assessments, reports, prescriptions
  const [sortBy, setSortBy] = useState('date-desc') // date-desc, date-asc

  useEffect(() => {
    fetchAllHistory()
  }, [])

  const fetchAllHistory = async () => {
    setLoading(true)
    try {
      const [assessmentsRes, reportsRes, prescriptionsRes] = await Promise.all([
        api.get('/history'),
        api.get('/my-provider-reports').catch(() => ({ data: [] })),
        api.get('/prescriptions/my-prescriptions').catch(() => ({ data: [] })),
      ])
      
      setAssessments(assessmentsRes.data)
      setProviderReports(reportsRes.data)
      setPrescriptions(prescriptionsRes.data)
      setLoading(false)
    } catch (err) {
      setError(errorMessage(err, 'Failed to load history'))
      setLoading(false)
    }
  }

  const downloadAssessment = async (id) => {
    setDownloading(`assessment-${id}`)
    try {
      const response = await api.get(`/assessments/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `MedAssist_Assessment_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      if (err.response?.status === 403) {
        alert("You don't have permission to download this assessment.")
      } else if (err.response?.status === 404) {
        alert("Assessment not found.")
      } else {
        alert(errorMessage(err, 'Failed to download assessment. Please try again.'))
      }
    } finally {
      setDownloading(null)
    }
  }

  const downloadProviderReport = async (id) => {
    setDownloading(`report-${id}`)
    try {
      const response = await api.get(`/provider-reports/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Provider_Report_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      if (err.response?.status === 403) {
        alert("You don't have permission to download this report.")
      } else if (err.response?.status === 404) {
        alert("Report not found.")
      } else {
        alert(errorMessage(err, 'Failed to download report. Please try again.'))
      }
    } finally {
      setDownloading(null)
    }
  }

  const downloadPrescription = async (id) => {
    setDownloading(`prescription-${id}`)
    try {
      const response = await api.get(`/prescriptions/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Prescription_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      if (err.response?.status === 403) {
        alert("You don't have permission to download this prescription.")
      } else if (err.response?.status === 404) {
        alert("Prescription not found.")
      } else {
        alert(errorMessage(err, 'Failed to download prescription. Please try again.'))
      }
    } finally {
      setDownloading(null)
    }
  }

  // Combine all history items with metadata
  const allHistoryItems = [
    ...assessments.map(a => ({
      id: `assessment-${a.id}`,
      type: 'assessment',
      data: a,
      date: new Date(a.created_at),
    })),
    ...providerReports.map(r => ({
      id: `report-${r.id}`,
      type: 'report',
      data: r,
      date: new Date(r.created_at),
    })),
    ...prescriptions.map(p => ({
      id: `prescription-${p.id}`,
      type: 'prescription',
      data: p,
      date: new Date(p.date_issued),
    })),
  ]

  // Filter and sort
  const filteredItems = allHistoryItems
    .filter(item => filterType === 'all' || item.type === filterType)
    .sort((a, b) => {
      if (sortBy === 'date-desc') return b.date - a.date
      return a.date - b.date
    })

  if (loading) return <p className="text-sm text-slate-400">Loading history…</p>
  if (error) return <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">My Complete Health History</h1>
        <p className="mt-1 text-sm text-slate-600">
          View all your assessments, provider reports, and prescriptions in one place
        </p>
      </header>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-100 p-3">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{assessments.length}</p>
              <p className="text-sm text-slate-600">Assessments</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-3">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{providerReports.length}</p>
              <p className="text-sm text-slate-600">Provider Reports</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-3">
              <Pill className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{prescriptions.length}</p>
              <p className="text-sm text-slate-600">Prescriptions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All ({allHistoryItems.length})
            </Button>
            <Button
              variant={filterType === 'assessment' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterType('assessment')}
            >
              Assessments ({assessments.length})
            </Button>
            <Button
              variant={filterType === 'report' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterType('report')}
            >
              Reports ({providerReports.length})
            </Button>
            <Button
              variant={filterType === 'prescription' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterType('prescription')}
            >
              Prescriptions ({prescriptions.length})
            </Button>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* History Timeline */}
      {filteredItems.length === 0 ? (
        <Card hoverLift={false} className="p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No History Found</h3>
          <p className="mt-2 text-sm text-slate-600">
            {filterType === 'all' 
              ? 'Your health history will appear here as you use the app.'
              : `No ${filterType}s found in your history.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            if (item.type === 'assessment') {
              const assessment = item.data
              const view = viewOf(assessment.result)
              const healthScore = view.healthScore ?? 0
              const topDisease = view.topDisease || 'No condition matched'
              const symptoms = symptomNames(view)

              return (
                <Card key={item.id} delay={0}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-full bg-indigo-100 p-2">
                          <Activity className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Symptom Assessment #{assessment.id}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <RiskBadge level={riskLevel(assessment.risk_flag)} size="sm" />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 text-sm">
                        <div>
                          <p className="text-slate-600 font-medium">Health Score</p>
                          <p className={`text-lg font-bold ${scoreColor(healthScore)}`}>
                            {healthScore}/100
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 font-medium">Top Condition</p>
                          <p className="text-slate-900">{topDisease}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-slate-600 font-medium mb-1">Symptoms</p>
                          <div className="flex flex-wrap gap-1">
                            {symptoms.slice(0, 5).map((symptom, i) => (
                              <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                {symptom}
                              </span>
                            ))}
                            {symptoms.length > 5 && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                +{symptoms.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* The saved assessment already carries the cascade
                            result; showing only symptoms and a top condition
                            hid the half of the record a clinician acts on. */}
                        <TreatmentSummary view={view} className="sm:col-span-2" />
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => downloadAssessment(assessment.id)}
                      disabled={downloading === `assessment-${assessment.id}`}
                    >
                      <Download className="h-3 w-3" />
                      {downloading === `assessment-${assessment.id}` ? 'Downloading...' : 'PDF'}
                    </Button>
                  </div>
                </Card>
              )
            }

            if (item.type === 'report') {
              const report = item.data

              return (
                <Card key={item.id} delay={0} className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-full bg-emerald-100 p-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Provider Treatment Report #{report.id}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm space-y-2">
                        <div>
                          <p className="text-slate-600 font-medium">From Healthcare Provider</p>
                          <p className="text-slate-900">Assessment #{report.assessment_id}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 font-medium">Includes</p>
                          <p className="text-slate-700">
                            Clinical insights, treatment suggestions, health recommendations
                            {report.doctor_suggestions && ', specialist referral'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => downloadProviderReport(report.id)}
                      disabled={downloading === `report-${report.id}`}
                    >
                      <Download className="h-3 w-3" />
                      {downloading === `report-${report.id}` ? 'Downloading...' : 'PDF'}
                    </Button>
                  </div>
                </Card>
              )
            }

            if (item.type === 'prescription') {
              const prescription = item.data

              return (
                <Card key={item.id} delay={0} className="bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-full bg-purple-100 p-2">
                          <Pill className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Prescription #{prescription.id}
                          </p>
                          <p className="text-xs text-slate-500">
                            Issued on {item.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm space-y-2">
                        <div>
                          <p className="text-slate-600 font-medium">Prescribed By</p>
                          <p className="text-slate-900">
                            Dr. {prescription.provider_name}, {prescription.provider_qualifications}
                          </p>
                          <p className="text-xs text-slate-600">{prescription.clinic_name}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 font-medium">Medications</p>
                          <p className="text-slate-700">
                            {prescription.medications.length} medicine{prescription.medications.length !== 1 ? 's' : ''} prescribed
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => downloadPrescription(prescription.id)}
                      disabled={downloading === `prescription-${prescription.id}`}
                    >
                      <Download className="h-3 w-3" />
                      {downloading === `prescription-${prescription.id}` ? 'Downloading...' : 'PDF'}
                    </Button>
                  </div>
                </Card>
              )
            }

            return null
          })}
        </div>
      )}
    </div>
  )
}
