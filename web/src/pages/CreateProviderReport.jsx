import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Send, ArrowLeft } from 'lucide-react'
import { Card, CardTitle } from '../components/med/Card'
import { Button } from '../components/med/Button'
import { api, errorMessage } from '../lib/api'
import { viewOf, symptomNames } from '../lib/assessment'

export default function CreateProviderReport() {
  const navigate = useNavigate()
  const [allAssessments, setAllAssessments] = useState([])
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [patientAssessments, setPatientAssessments] = useState([])
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [formData, setFormData] = useState({
    providerInsights: '',
    treatmentSuggestions: '',
    healthRecommendations: '',
    doctorSuggestions: '',
    additionalNotes: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetchingAssessments, setFetchingAssessments] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch all assessments from all patients
  useEffect(() => {
    setFetchingAssessments(true)
    api.get('/all-assessments')
      .then((res) => {
        setAllAssessments(res.data)
        
        // Extract unique patients
        const uniquePatients = {}
        res.data.forEach((assessment) => {
          if (!uniquePatients[assessment.user_id]) {
            uniquePatients[assessment.user_id] = {
              user_id: assessment.user_id,
              email: assessment.patient_email,
              assessmentCount: 0,
            }
          }
          uniquePatients[assessment.user_id].assessmentCount++
        })
        
        setPatients(Object.values(uniquePatients))
        setFetchingAssessments(false)
      })
      .catch((err) => {
        setError(errorMessage(err, 'Failed to load assessments'))
        setFetchingAssessments(false)
      })
  }, [])

  // Filter assessments when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const filtered = allAssessments.filter(a => a.user_id === parseInt(selectedPatient))
      setPatientAssessments(filtered)
      setSelectedAssessment('') // Reset assessment selection
    } else {
      setPatientAssessments([])
      setSelectedAssessment('')
    }
  }, [selectedPatient, allAssessments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedAssessment) {
      setError('Please select an assessment')
      return
    }

    setLoading(true)
    try {
      const assessment = patientAssessments.find(a => a.id === parseInt(selectedAssessment))
      
      await api.post('/provider-reports', {
        assessment_id: parseInt(selectedAssessment),
        patient_id: assessment.user_id,
        provider_insights: formData.providerInsights,
        treatment_suggestions: formData.treatmentSuggestions,
        health_recommendations: formData.healthRecommendations,
        doctor_suggestions: formData.doctorSuggestions || null,
        additional_notes: formData.additionalNotes || null,
      })

      setSuccess('Provider report created successfully! The patient can now view and download it.')
      
      // Reset form
      setFormData({
        providerInsights: '',
        treatmentSuggestions: '',
        healthRecommendations: '',
        doctorSuggestions: '',
        additionalNotes: '',
      })
      setSelectedPatient('')
      setSelectedAssessment('')
      
      // Redirect after 2 seconds
      setTimeout(() => navigate('/analytics'), 2000)
    } catch (err) {
      setError(errorMessage(err, 'Failed to create provider report'))
    } finally {
      setLoading(false)
    }
  }

  const selectedAssessmentData = patientAssessments.find(a => a.id === parseInt(selectedAssessment))
  const selectedPatientData = patients.find(p => p.user_id === parseInt(selectedPatient))

  if (fetchingAssessments) {
    return <p className="text-sm text-slate-400">Loading assessments…</p>
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button
          onClick={() => navigate('/analytics')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analytics
        </button>
      </header>

      <header>
        <h1 className="text-3xl font-bold text-slate-900">Create Treatment Report</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a professional treatment and health recommendation report for a patient
        </p>
      </header>

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient & Assessment Selection */}
        <Card>
          <CardTitle icon={<FileText className="h-5 w-5" />}>Select Patient & Assessment</CardTitle>
          
          <div className="space-y-4">
            {/* Step 1: Select Patient */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Step 1: Select Patient
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Choose a patient...</option>
                {patients.map((patient) => (
                  <option key={patient.user_id} value={patient.user_id}>
                    {patient.email} ({patient.assessmentCount} assessment{patient.assessmentCount !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Select the patient you want to create a report for
              </p>
            </div>

            {/* Show patient info when selected */}
            {selectedPatientData && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                <p className="text-sm font-medium text-indigo-900">
                  Selected Patient: {selectedPatientData.email}
                </p>
                <p className="text-xs text-indigo-700 mt-1">
                  {selectedPatientData.assessmentCount} total assessment{selectedPatientData.assessmentCount !== 1 ? 's' : ''} available
                </p>
              </div>
            )}

            {/* Step 2: Select Assessment (only shown after patient is selected) */}
            {selectedPatient && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Step 2: Select Assessment
                </label>
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Choose an assessment...</option>
                  {patientAssessments.map((assessment) => {
                    const view = viewOf(assessment.result)
                    const date = new Date(assessment.created_at).toLocaleDateString()
                    const time = new Date(assessment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    const topDisease = view.topDisease || 'Unknown'
                    const symptoms = symptomNames(view).slice(0, 3).join(', ')
                    
                    return (
                      <option key={assessment.id} value={assessment.id}>
                        #{assessment.id} | {date} {time} | {topDisease} | {symptoms}... | {assessment.risk_flag}
                      </option>
                    )
                  })}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Choose which assessment to base the report on
                </p>
              </div>
            )}

            {/* Assessment Summary */}
            {selectedAssessmentData && (
              <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-2">
                <p className="font-medium text-slate-900">Assessment Summary</p>
                <p className="text-slate-600">
                  <span className="font-medium">Assessment ID:</span> #{selectedAssessmentData.id}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Patient:</span> {selectedAssessmentData.patient_email}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Date:</span> {new Date(selectedAssessmentData.created_at).toLocaleString()}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Risk Flag:</span> <span className={`font-semibold ${
                    selectedAssessmentData.risk_flag === 'HIGH PRIORITY' ? 'text-rose-600' :
                    selectedAssessmentData.risk_flag === 'REVIEW' ? 'text-amber-600' :
                    'text-emerald-600'
                  }`}>{selectedAssessmentData.risk_flag}</span>
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Health Score:</span> {viewOf(selectedAssessmentData.result).healthScore ?? '—'}/100
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Severity:</span> {viewOf(selectedAssessmentData.result).severityLevel || '—'}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Symptoms:</span>{' '}
                  {symptomNames(viewOf(selectedAssessmentData.result)).join(', ')}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Top Predicted Condition:</span>{' '}
                  {viewOf(selectedAssessmentData.result).topDisease || 'N/A'}
                </p>
                {viewOf(selectedAssessmentData.result).escalationReason && (
                  <p className="text-xs text-rose-600 bg-rose-50 rounded px-2 py-1 mt-2 font-medium">
                    🚨 Escalated - {viewOf(selectedAssessmentData.result).escalationReason}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Provider Insights */}
        <Card>
          <CardTitle>Clinical Insights</CardTitle>
          <textarea
            value={formData.providerInsights}
            onChange={(e) => setFormData({ ...formData, providerInsights: e.target.value })}
            placeholder="Enter your clinical assessment and insights based on the patient's symptoms and test results..."
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </Card>

        {/* Treatment Suggestions */}
        <Card>
          <CardTitle>Treatment Suggestions</CardTitle>
          <textarea
            value={formData.treatmentSuggestions}
            onChange={(e) => setFormData({ ...formData, treatmentSuggestions: e.target.value })}
            placeholder="Provide specific treatment recommendations, medications, dosages, and treatment duration..."
            rows={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </Card>

        {/* Health Recommendations */}
        <Card>
          <CardTitle>Health & Lifestyle Recommendations</CardTitle>
          <textarea
            value={formData.healthRecommendations}
            onChange={(e) => setFormData({ ...formData, healthRecommendations: e.target.value })}
            placeholder="Provide lifestyle modifications, dietary recommendations, exercise guidelines, and preventive care advice..."
            rows={5}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </Card>

        {/* Specialist Referral */}
        <Card>
          <CardTitle>Specialist Referral (Optional)</CardTitle>
          <textarea
            value={formData.doctorSuggestions}
            onChange={(e) => setFormData({ ...formData, doctorSuggestions: e.target.value })}
            placeholder="If specialist consultation is needed, specify the type of specialist and reason for referral..."
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardTitle>Additional Notes (Optional)</CardTitle>
          <textarea
            value={formData.additionalNotes}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            placeholder="Any additional clinical notes, follow-up instructions, or important information..."
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/analytics')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedAssessment}
          >
            <Send className="h-4 w-4" />
            {loading ? 'Creating Report...' : 'Create & Send Report'}
          </Button>
        </div>
      </form>
    </div>
  )
}
