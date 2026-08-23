import { useEffect, useState } from 'react'
import { FileText, Download, Calendar, User, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardTitle } from '../components/med/Card'
import { Button } from '../components/med/Button'
import { api, errorMessage } from '../lib/api'

export default function ProviderReports() {
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = () => {
    setLoading(true)
    api.get('/my-provider-reports')
      .then((res) => {
        setReports(res.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(errorMessage(err, 'Failed to load provider reports'))
        setLoading(false)
      })
  }

  const handleDownload = async (reportId) => {
    setDownloading(reportId)
    try {
      const response = await api.get(`/provider-report/${reportId}/download`, {
        responseType: 'blob',
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `MedAssist_Provider_Report_${reportId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert(errorMessage(err, 'Failed to download report'))
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading reports…</p>
  if (error) return <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Provider Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          View and download treatment reports from your healthcare providers
        </p>
      </header>

      {reports.length === 0 ? (
        <Card hoverLift={false} className="p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Provider Reports Yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            Provider reports will appear here once your healthcare provider creates them based on your assessments.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Reports List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">All Reports ({reports.length})</h2>
            
            {reports.map((report) => (
              <Card
                key={report.id}
                className={`cursor-pointer transition ${
                  selectedReport?.id === report.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <p className="font-semibold text-slate-900">
                        Report #{report.id}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        report.risk_flag === 'HIGH PRIORITY'
                          ? 'bg-rose-100 text-rose-700'
                          : report.risk_flag === 'REVIEW'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {report.risk_flag}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{report.provider_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Assessment: {new Date(report.assessment_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(report.id)
                    }}
                    disabled={downloading === report.id}
                  >
                    <Download className="h-3 w-3" />
                    {downloading === report.id ? 'Downloading...' : 'PDF'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Report Details */}
          <div className="sticky top-6">
            {selectedReport ? (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle icon={<FileText className="h-5 w-5" />}>
                    Report Details
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(selectedReport.id)}
                    disabled={downloading === selectedReport.id}
                  >
                    <Download className="h-3 w-3" />
                    {downloading === selectedReport.id ? 'Downloading...' : 'Download PDF'}
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Provider Info */}
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      Healthcare Provider
                    </p>
                    <p className="text-sm font-medium text-slate-900">{selectedReport.provider_email}</p>
                    <p className="text-xs text-slate-600 capitalize">
                      {selectedReport.provider_role.replace('_', ' ')}
                    </p>
                  </div>

                  {/* Clinical Insights */}
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">Clinical Insights</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedReport.provider_insights}
                    </p>
                  </div>

                  {/* Treatment Suggestions */}
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Treatment Suggestions</p>
                    <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.treatment_suggestions}
                    </p>
                  </div>

                  {/* Health Recommendations */}
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-sm font-semibold text-emerald-900 mb-2">Health Recommendations</p>
                    <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.health_recommendations}
                    </p>
                  </div>

                  {/* Specialist Referral */}
                  {selectedReport.doctor_suggestions && (
                    <div className="rounded-lg bg-purple-50 p-3">
                      <p className="text-sm font-semibold text-purple-900 mb-2">Specialist Referral</p>
                      <p className="text-sm text-purple-800 leading-relaxed">
                        {selectedReport.doctor_suggestions}
                      </p>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {selectedReport.additional_notes && (
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Additional Notes</p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {selectedReport.additional_notes}
                      </p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="border-t border-slate-200 pt-3 text-xs text-slate-500 space-y-1">
                    <p>Report Created: {new Date(selectedReport.created_at).toLocaleString()}</p>
                    <p>Assessment Date: {new Date(selectedReport.assessment_date).toLocaleString()}</p>
                  </div>
                </div>
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
