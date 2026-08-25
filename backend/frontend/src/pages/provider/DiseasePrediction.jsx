import React, { useEffect, useMemo, useState } from 'react'
import ActionsMenu from '../../components/ActionsMenu'
import Modal from '../../components/Modal'
import { submitPredictionFeedback } from '../../api/patient'

export default function ProviderDiseasePrediction({ dashboardData }) {
  const predictions = dashboardData?.predictions ?? []
  const patients = dashboardData?.patients ?? []
  const [searchText, setSearchText] = useState('')
  const [confidenceFilter, setConfidenceFilter] = useState('')
  const [predictionsState, setPredictionsState] = useState(predictions)
  const [feedbackStatus, setFeedbackStatus] = useState(null)
  const [selectedPatientSymptoms, setSelectedPatientSymptoms] = useState([])
  const [selectedPatientName, setSelectedPatientName] = useState('')
  const [symptomModalOpen, setSymptomModalOpen] = useState(false)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [pendingDecision, setPendingDecision] = useState({ id: null, feedback: 'accept', comments: '' })

  useEffect(() => {
    setPredictionsState(predictions)
  }, [predictions])

  const patientMap = useMemo(
    () => Object.fromEntries(patients.map((patient) => [patient.id, patient.name])),
    [patients]
  )

  const symptomsByPatient = useMemo(
    () =>
      (dashboardData?.symptoms ?? []).reduce((map, symptom) => {
        const list = map[symptom.patient_id] || []
        list.push(symptom)
        map[symptom.patient_id] = list
        return map
      }, {}),
    [dashboardData?.symptoms]
  )

  const filteredPredictions = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return predictionsState.filter((item) => {
      const patientName = patientMap[item.patient_id] || `Patient ${item.patient_id}`
      const confidencePercent = item.confidence != null ? item.confidence * 100 : 0
      const matchesSearch =
        !search ||
        patientName.toLowerCase().includes(search) ||
        String(item.predicted_disease || '').toLowerCase().includes(search) ||
        String(item.provider_feedback || '').toLowerCase().includes(search)
      const matchesConfidence =
        !confidenceFilter ||
        (confidenceFilter === 'high' && confidencePercent >= 80) ||
        (confidenceFilter === 'medium' && confidencePercent >= 50 && confidencePercent < 80) ||
        (confidenceFilter === 'low' && confidencePercent < 50)
      return matchesSearch && matchesConfidence
    })
  }, [predictionsState, patientMap, searchText, confidenceFilter])

  const summary = useMemo(() => ({
    total: predictionsState.length,
    highConfidence: predictionsState.filter((item) => item.confidence != null && item.confidence >= 0.8).length,
    mediumConfidence: predictionsState.filter((item) => item.confidence != null && item.confidence >= 0.5 && item.confidence < 0.8).length,
    lowConfidence: predictionsState.filter((item) => item.confidence != null && item.confidence < 0.5).length,
  }), [predictionsState])

  const handlePredictionFeedback = async (predictionId, feedback, comments = '') => {
    setFeedbackStatus({ type: 'pending', message: `Submitting ${feedback} feedback...` })
    try {
      const response = await submitPredictionFeedback({ prediction_id: predictionId, feedback, comments })
      setPredictionsState((prev) =>
        prev.map((item) =>
          item.id === predictionId ? {
            ...item,
            provider_feedback: response.provider_feedback,
            status: response.status_value || response.provider_feedback,
            provider_comments: response.provider_comments || comments,
            feedback_date: response.feedback_date,
          } : item
        )
      )
      setFeedbackStatus({ type: 'success', message: `Feedback recorded: ${feedback}` })
    } catch (error) {
      setFeedbackStatus({ type: 'error', message: error.message || 'Unable to submit feedback.' })
    }
  }

  const openReviewModal = (predictionId, feedback) => {
    setPendingDecision({ id: predictionId, feedback, comments: '' })
    setCommentModalOpen(true)
  }

  const submitPendingDecision = async () => {
    if (!pendingDecision.id) return
    await handlePredictionFeedback(pendingDecision.id, pendingDecision.feedback, pendingDecision.comments)
    setCommentModalOpen(false)
    setPendingDecision({ id: null, feedback: 'accept', comments: '' })
  }

  const openSymptomModal = (patientId) => {
    const symptoms = symptomsByPatient[patientId] ?? []
    const patientName = patientMap[patientId] || `Patient ${patientId}`
    setSelectedPatientSymptoms(symptoms)
    setSelectedPatientName(patientName)
    setSymptomModalOpen(true)
  }

  const closeSymptomModal = () => {
    setSymptomModalOpen(false)
    setSelectedPatientSymptoms([])
    setSelectedPatientName('')
  }

  return (
    <div className="provider-history-page">
      <section className="history-overview-card card">
        <div className="overview-headline">
          <div>
            <span className="eyebrow">Disease Prediction</span>
            <h2>Track AI-driven risk signals for your patient population.</h2>
            <p>Review patient prediction confidence, spot high-risk cases, and act on front-line symptom data from the current backend feed.</p>
          </div>
          <div className="overview-meta">
            <span className="badge">{filteredPredictions.length} visible predictions</span>
          </div>
        </div>

        <div className="history-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Total predictions</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">High confidence</span>
            <strong>{summary.highConfidence}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Medium confidence</span>
            <strong>{summary.mediumConfidence}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Low confidence</span>
            <strong>{summary.lowConfidence}</strong>
          </div>
        </div>
      </section>

      <section className="history-controls card">
        <div className="history-filters">
          <label className="filter-field">
            Search predictions
            <input
              type="search"
              placeholder="Search patient or disease"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>

          <label className="filter-field">
            Confidence level
            <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)}>
              <option value="">All confidence levels</option>
              <option value="high">High (≥ 80%)</option>
              <option value="medium">Medium (50–79%)</option>
              <option value="low">Low (&lt; 50%)</option>
            </select>
          </label>

          <div className="filter-field" />

          <button className="text-button" type="button" onClick={() => { setSearchText(''); setConfidenceFilter('') }}>
            Reset filters
          </button>
        </div>
      </section>

      <section className="history-table-card card">
        <div className="card-header history-table-header">
          <div>
            <h3>Prediction results</h3>
            <p className="muted">AI predictions are pulled directly from the provider dashboard payload.</p>
          </div>
          <div className="header-actions">
            <span className="badge">{filteredPredictions.length} rows</span>
          </div>
        </div>

        {feedbackStatus && <div className={`status ${feedbackStatus.type}`}>{feedbackStatus.message}</div>}

        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Prediction</th>
                <th>Confidence</th>
                <th>Date</th>
                <th>Feedback</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPredictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">No predictions match the selected filters.</td>
                </tr>
              ) : (
                filteredPredictions.map((item, index) => {
                  const patientName = patientMap[item.patient_id] || `Patient ${item.patient_id}`
                  const confidencePercent = item.confidence != null ? `${Math.round(item.confidence * 100)}%` : 'N/A'
                  const confidenceClass = item.confidence != null
                    ? item.confidence >= 0.8 ? 'success' : item.confidence >= 0.5 ? 'warning' : 'danger'
                    : 'neutral'
                  const feedbackClass = item.provider_feedback === 'accept' ? 'success' : item.provider_feedback === 'reject' ? 'danger' : 'neutral'
                  const feedbackLabel = item.provider_feedback ? item.provider_feedback.toUpperCase() : 'Pending'
                  return (
                    <tr key={`${item.patient_id}-${index}`}>
                      <td>
                        <div className="patient-cell">
                          <strong>{patientName}</strong>
                          <small>#{item.patient_id}</small>
                        </div>
                      </td>
                      <td>{item.predicted_disease || 'Unknown'}</td>
                      <td>
                        <span className={`status-pill ${confidenceClass}`}>{confidencePercent}</span>
                      </td>
                      <td>{item.prediction_date || '—'}</td>
                      <td>
                        <span className={`status-pill ${feedbackClass}`}>{feedbackLabel}</span>
                      </td>
                      <td>
                        <ActionsMenu
                          actions={[
                            {
                              label: 'Accept prediction',
                              onClick: () => openReviewModal(item.id, 'accept'),
                            },
                            {
                              label: 'Reject prediction',
                              onClick: () => openReviewModal(item.id, 'reject'),
                            },
                            {
                              label: 'View symptoms',
                              onClick: () => openSymptomModal(item.patient_id),
                            },
                            {
                              label: 'Copy patient ID',
                              onClick: async () => {
                                try {
                                  await navigator.clipboard.writeText(String(item.patient_id))
                                } catch (error) {
                                  // ignore failure
                                }
                              },
                            },
                          ]}
                          ariaLabel={`Prediction actions for patient ${item.patient_id}`}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={symptomModalOpen} title={`Patient symptoms for ${selectedPatientName}`} onClose={closeSymptomModal}>
        {selectedPatientSymptoms.length === 0 ? (
          <div className="empty">No symptoms recorded for this patient.</div>
        ) : (
          <div className="symptom-list">
            <table className="modal-table">
              <thead>
                <tr>
                  <th>Symptom</th>
                  <th>Severity</th>
                  <th>Duration</th>
                  <th>Frequency</th>
                  <th>Notes</th>
                  <th>Entered</th>
                </tr>
              </thead>
              <tbody>
                {selectedPatientSymptoms.map((symptom) => (
                  <tr key={symptom.id || `${symptom.symptom_name}-${symptom.entered_date}`}>
                    <td>{symptom.symptom_name}</td>
                    <td>{symptom.severity || '—'}</td>
                    <td>{symptom.duration || '—'}</td>
                    <td>{symptom.frequency || '—'}</td>
                    <td>{symptom.notes || '—'}</td>
                    <td>{symptom.entered_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal open={commentModalOpen} title={`Review prediction: ${pendingDecision.feedback === 'accept' ? 'Approve' : 'Reject'}`} onClose={() => setCommentModalOpen(false)}>
        <div className="modal-form">
          <label>
            Provider comments
            <textarea
              rows={5}
              value={pendingDecision.comments}
              onChange={(e) => setPendingDecision((prev) => ({ ...prev, comments: e.target.value }))}
              placeholder="Add clinical comments, context, or follow-up guidance here..."
            />
          </label>
          <div className="form-actions">
            <button className="btn primary" type="button" onClick={submitPendingDecision}>
              {pendingDecision.feedback === 'accept' ? 'Approve prediction' : 'Reject prediction'}
            </button>
            <button className="btn outline" type="button" onClick={() => setCommentModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
