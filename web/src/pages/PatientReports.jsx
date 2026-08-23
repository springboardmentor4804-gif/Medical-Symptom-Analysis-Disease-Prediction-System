import { useEffect, useState } from 'react'
import { FileText, Download, Calendar, Activity, AlertCircle, TrendingUp } from 'lucide-react'
import { Card, CardTitle } from '../components/med/Card'
import { Button } from '../components/med/Button'
import { RiskBadge } from '../components/med/Badge'
import { api, errorMessage } from '../lib/api'
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

export default function PatientReports() {
  const [assessments, setAssessments] = useState([])
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = () => {
    setLoading(true)
    api.get('/history')
      .then((res) => {
        setAssessments(res.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(errorMessage(err, 'Failed to load assessments'))
        setLoading(false)
      })
  }

  const handleDownload = async (assessmentId) => {
    setDownloading(assessmentId)
    try {
      const response = await api.get(`/assessments/${assessmentId}/download`, {
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `MedAssist_Assessment_${assessmentId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      if (err.response?.status === 403) {
        alert("You don't have permission to download this assessment.")
      } else if (err.response?.status === 404) {
        alert("Assessment not found.")
      } else {
        alert(errorMessage(err, 'Failed to download report. Please try again.'))
      }
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading reports…</p>
  if (error) return <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">My Health Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          View and download detailed reports for all your symptom assessments
        </p>
      </header>

      {assessments.length === 0 ? (
        <Card hoverLift={false} className="p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Reports Yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            Complete a symptom check to generate your first health assessment report.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Reports List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              All Reports ({assessments.length})
            </h2>
            
            {assessments.slice().reverse().map((assessment) => {
              const view = viewOf(assessment.result)
              const healthScore = view.healthScore ?? 0
              const topDisease = view.topDisease || 'No condition matched'
              const symptoms = symptomNames(view)

              return (
                <Card
                  key={assessment.id}
                  className={`cursor-pointer transition ${
                    selectedAssessment?.id === assessment.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  onClick={() => setSelectedAssessment(assessment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Activity className="h-4 w-4 text-indigo-600" />
                        <p className="font-semibold text-slate-900">
                          Assessment #{assessment.id}
                        </p>
                        <RiskBadge level={riskLevel(assessment.risk_flag)} size="sm" />
                      </div>
                      
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(assessment.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" />
                          <span className={scoreColor(healthScore)}>
                            Health Score: {healthScore}/100
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3 w-3" />
                          <span>{topDisease}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''}: {symptoms.slice(0, 3).join(', ')}
                          {symptoms.length > 3 && '...'}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(assessment.id)
                      }}
                      disabled={downloading === assessment.id}
                    >
                      <Download className="h-3 w-3" />
                      {downloading === assessment.id ? 'Downloading...' : 'PDF'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Report Details */}
          <div className="sticky top-6">
            {selectedAssessment ? (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle icon={<FileText className="h-5 w-5" />}>
                    Report Details
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(selectedAssessment.id)}
                    disabled={downloading === selectedAssessment.id}
                  >
                    <Download className="h-3 w-3" />
                    {downloading === selectedAssessment.id ? 'Downloading...' : 'Download PDF'}
                  </Button>
                </div>

                {(() => {
                  const result = selectedAssessment.result
                  const input = selectedAssessment.input
                  const view = viewOf(result)
                  const healthScore = view.healthScore ?? 0
                  const topDiseases = view.diseases
                  const symptoms = symptomNames(view)

                  return (
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="rounded-lg bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Assessment Summary</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Report ID:</span>
                            <span className="font-medium">#{selectedAssessment.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Date:</span>
                            <span className="font-medium">
                              {new Date(selectedAssessment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Health Score:</span>
                            <span className={`font-bold ${scoreColor(healthScore)}`}>
                              {healthScore}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Risk Flag:</span>
                            <RiskBadge level={riskLevel(selectedAssessment.risk_flag)} size="sm" />
                          </div>
                        </div>
                      </div>

                      {/* Symptoms */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Reported Symptoms</h3>
                        <div className="flex flex-wrap gap-2">
                          {symptoms.map((symptom, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Top Predicted Conditions */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Predicted Conditions</h3>
                        <div className="space-y-2">
                          {topDiseases.slice(0, 5).map((disease, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700 capitalize">{disease.displayName}</span>
                              <span className="text-slate-500">{disease.confidencePct?.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk Assessment */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Risk Assessment</h3>
                        <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Severity Level:</span>
                            <span className="font-medium">{view.severityLevel || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Priority Score:</span>
                            <span className="font-medium">
                              {view.severityScore != null ? (view.severityScore * 100).toFixed(0) : '—'}%
                            </span>
                          </div>
                          {view.escalationReason && (
                            <div className="mt-2 rounded bg-rose-100 border border-rose-200 p-2">
                              <p className="text-xs text-rose-800 font-medium">
                                🚨 Escalated: {view.escalationReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Patient Info */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Patient Information</h3>
                        <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-sm">
                          {input.age != null && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Age:</span>
                              <span className="font-medium">{input.age} years</span>
                            </div>
                          )}
                          {input.gender && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Gender:</span>
                              <span className="font-medium">
                                {typeof input.gender === 'string' 
                                  ? input.gender.charAt(0).toUpperCase() + input.gender.slice(1)
                                  : input.gender}
                              </span>
                            </div>
                          )}
                          {input.blood_pressure && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Blood Pressure:</span>
                              <span className="font-medium">
                                {typeof input.blood_pressure === 'string'
                                  ? input.blood_pressure.charAt(0).toUpperCase() + input.blood_pressure.slice(1)
                                  : input.blood_pressure}
                              </span>
                            </div>
                          )}
                          {input.cholesterol_level && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Cholesterol:</span>
                              <span className="font-medium">
                                {typeof input.cholesterol_level === 'string'
                                  ? input.cholesterol_level.charAt(0).toUpperCase() + input.cholesterol_level.slice(1)
                                  : input.cholesterol_level}
                              </span>
                            </div>
                          )}
                          {input.lifestyle?.bmi && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">BMI:</span>
                              <span className="font-medium">{input.lifestyle.bmi}</span>
                            </div>
                          )}
                          {!input.age && !input.gender && !input.blood_pressure && !input.cholesterol_level && (
                            <p className="text-slate-500 text-center py-2">No patient information available</p>
                          )}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Recommendations</h3>
                        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                          <p className="mb-2">
                            <strong>Suggested Care:</strong> {view.suggestedCare || 'Consult with healthcare provider'}
                          </p>
                          {view.suggestedDoctor && (
                            <p>
                              <strong>Specialist:</strong> {view.suggestedDoctor}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </Card>
            ) : (
              <Card hoverLift={false} className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm text-slate-600">
                  Select a report to view details
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
