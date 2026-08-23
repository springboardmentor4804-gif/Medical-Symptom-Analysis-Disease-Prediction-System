import { useEffect, useState } from 'react'
import { FileText, Pill, Download, Calendar, Activity, User, TrendingUp, Users } from 'lucide-react'
import { Card, CardTitle } from '../components/med/Card'
import { Button } from '../components/med/Button'
import { RiskBadge } from '../components/med/Badge'
import { api, errorMessage } from '../lib/api'
import { TreatmentSummary } from '../components/med/ResultPanels'
import { viewOf, symptomNames } from '../lib/assessment'

function riskLevel(flag) {
  if (flag === 'HIGH PRIORITY') return 'high'
  if (flag === 'REVIEW') return 'medium'
  return 'low'
}

function scoreColor(score) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-rose-600'
}

export default function ProviderHistory() {
  const [allAssessments, setAllAssessments] = useState([])
  const [allReports, setAllReports] = useState([])
  const [allPrescriptions, setAllPrescriptions] = useState([])
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(null)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [assessmentsRes, reportsRes, prescriptionsRes] = await Promise.all([
        api.get('/all-assessments'),
        api.get('/provider-reports').catch(() => ({ data: [] })),
        api.get('/prescriptions').catch(() => ({ data: [] })),
      ])

      setAllAssessments(assessmentsRes.data)
      setAllReports(reportsRes.data)
      setAllPrescriptions(prescriptionsRes.data)

      // Extract unique patients
      const uniquePatients = {}
      assessmentsRes.data.forEach((assessment) => {
        if (!uniquePatients[assessment.user_id]) {
          uniquePatients[assessment.user_id] = {
            user_id: assessment.user_id,
            email: assessment.patient_email,
            assessmentCount: 0,
            reportCount: 0,
            prescriptionCount: 0,
          }
        }
        uniquePatients[assessment.user_id].assessmentCount++
      })

      // Count reports per patient
      reportsRes.data.forEach((report) => {
        if (uniquePatients[report.patient_id]) {
          uniquePatients[report.patient_id].reportCount++
        }
      })

      // Count prescriptions per patient
      prescriptionsRes.data.forEach((prescription) => {
        if (uniquePatients[prescription.patient_id]) {
          uniquePatients[prescription.patient_id].prescriptionCount++
        }
      })

      setPatients(Object.values(uniquePatients))
      setLoading(false)
    } catch (err) {
      setError(errorMessage(err, 'Failed to load data'))
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

  // Get selected patient's history
  const getPatientHistory = () => {
    if (!selectedPatient) return []

    const patientAssessments = allAssessments
      .filter(a => a.user_id === selectedPatient.user_id)
      .map(a => ({
        id: `assessment-${a.id}`,
        type: 'assessment',
        data: a,
        date: new Date(a.created_at),
      }))

    const patientReports = allReports
      .filter(r => r.patient_id === selectedPatient.user_id)
      .map(r => ({
        id: `report-${r.id}`,
        type: 'report',
        data: r,
        date: new Date(r.created_at),
      }))

    const patientPrescriptions = allPrescriptions
      .filter(p => p.patient_id === selectedPatient.user_id)
      .map(p => ({
        id: `prescription-${p.id}`,
        type: 'prescription',
        data: p,
        date: new Date(p.date_issued),
      }))

    const allItems = [...patientAssessments, ...patientReports, ...patientPrescriptions]

    return allItems
      .filter(item => filterType === 'all' || item.type === filterType)
      .sort((a, b) => b.date - a.date)
  }

  const patientHistory = getPatientHistory()

  if (loading) return <p className="text-sm text-slate-400">Loading patient data…</p>
  if (error) return <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Patient History</h1>
        <p className="mt-1 text-sm text-slate-600">
          View complete medical history for all your patients
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Selection Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardTitle icon={<Users className="h-5 w-5" />}>Select Patient</CardTitle>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {patients.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  No patients with assessments yet
                </p>
              ) : (
                patients.map((patient) => (
                  <div
                    key={patient.user_id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                      selectedPatient?.user_id === patient.user_id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-slate-600" />
                      <p className="font-medium text-slate-900 text-sm">{patient.email}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-600 ml-6">
                      <span>{patient.assessmentCount} assessment{patient.assessmentCount !== 1 ? 's' : ''}</span>
                      <span>{patient.reportCount} report{patient.reportCount !== 1 ? 's' : ''}</span>
                      <span>{patient.prescriptionCount} Rx</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Patient History */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedPatient ? (
            <Card hoverLift={false} className="p-12 text-center">
              <Users className="mx-auto h-16 w-16 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No Patient Selected</h3>
              <p className="mt-2 text-sm text-slate-600">
                Select a patient from the list to view their complete medical history
              </p>
            </Card>
          ) : (
            <>
              {/* Selected Patient Info */}
              <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">{selectedPatient.email}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Total: {selectedPatient.assessmentCount} assessment{selectedPatient.assessmentCount !== 1 ? 's' : ''}, {' '}
                      {selectedPatient.reportCount} report{selectedPatient.reportCount !== 1 ? 's' : ''}, {' '}
                      {selectedPatient.prescriptionCount} prescription{selectedPatient.prescriptionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="rounded-full bg-indigo-100 p-3">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </Card>

              {/* Filters */}
              <Card>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterType === 'all' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                  >
                    All ({patientHistory.length})
                  </Button>
                  <Button
                    variant={filterType === 'assessment' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilterType('assessment')}
                  >
                    Assessments ({selectedPatient.assessmentCount})
                  </Button>
                  <Button
                    variant={filterType === 'report' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilterType('report')}
                  >
                    Reports ({selectedPatient.reportCount})
                  </Button>
                  <Button
                    variant={filterType === 'prescription' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilterType('prescription')}
                  >
                    Prescriptions ({selectedPatient.prescriptionCount})
                  </Button>
                </div>
              </Card>

              {/* History Timeline */}
              {patientHistory.length === 0 ? (
                <Card hoverLift={false} className="p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-600">
                    No {filterType === 'all' ? 'history' : filterType + 's'} found for this patient
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {patientHistory.map((item) => {
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
                              <div className="flex items-center gap-3 mb-2">
                                <div className="rounded-full bg-indigo-100 p-2">
                                  <Activity className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">
                                    Assessment #{assessment.id}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <RiskBadge level={riskLevel(assessment.risk_flag)} size="sm" />
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                                <div>
                                  <p className="text-slate-600 text-xs">Health Score</p>
                                  <p className={`font-bold ${scoreColor(healthScore)}`}>
                                    {healthScore}/100
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-600 text-xs">Top Condition</p>
                                  <p className="text-slate-900 text-sm">{topDisease}</p>
                                </div>
                                <div className="sm:col-span-2">
                                  <p className="text-slate-600 text-xs mb-1">Symptoms ({symptoms.length})</p>
                                  <div className="flex flex-wrap gap-1">
                                    {symptoms.slice(0, 4).map((symptom, i) => (
                                      <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                        {symptom}
                                      </span>
                                    ))}
                                    {symptoms.length > 4 && (
                                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                        +{symptoms.length - 4}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Clinicians triaging from this list need the
                                    treatment source, not just the symptoms. */}
                                <TreatmentSummary view={view} className="sm:col-span-2 text-sm" />
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => downloadAssessment(assessment.id)}
                              disabled={downloading === `assessment-${assessment.id}`}
                            >
                              <Download className="h-3 w-3" />
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
                              <div className="flex items-center gap-3 mb-2">
                                <div className="rounded-full bg-emerald-100 p-2">
                                  <FileText className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">
                                    Treatment Report #{report.id}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>

                              <div className="text-sm text-slate-700">
                                <p className="text-xs text-slate-600">For Assessment #{report.assessment_id}</p>
                                <p className="mt-1">Clinical insights, treatment suggestions, health recommendations</p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => downloadProviderReport(report.id)}
                              disabled={downloading === `report-${report.id}`}
                            >
                              <Download className="h-3 w-3" />
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
                              <div className="flex items-center gap-3 mb-2">
                                <div className="rounded-full bg-purple-100 p-2">
                                  <Pill className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">
                                    Prescription #{prescription.id}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Issued on {item.date.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <div className="text-sm text-slate-700">
                                <p className="text-xs text-slate-600">
                                  Dr. {prescription.provider_name} • {prescription.clinic_name}
                                </p>
                                <p className="mt-1">
                                  {prescription.medications.length} medicine{prescription.medications.length !== 1 ? 's' : ''} prescribed
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => downloadPrescription(prescription.id)}
                              disabled={downloading === `prescription-${prescription.id}`}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      )
                    }

                    return null
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
