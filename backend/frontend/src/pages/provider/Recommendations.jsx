import React, { useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import { reviewRecommendation } from '../../api/patient'

function statusClass(status) {
  const normalized = String(status || 'pending').toLowerCase()
  if (normalized === 'approved') return 'success'
  if (normalized === 'rejected') return 'danger'
  return 'warning'
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function ProviderRecommendations({ dashboardData }) {
  const recommendations = dashboardData?.recommendations ?? []
  const patients = dashboardData?.patients ?? []
  const predictions = dashboardData?.predictions ?? []
  const risks = dashboardData?.risks ?? []

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pendingDecision, setPendingDecision] = useState({ id: null, status: 'approved', comments: '' })
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState(null)
  const [recommendationsState, setRecommendationsState] = useState(recommendations)

  const patientMap = useMemo(
    () => Object.fromEntries(patients.map((patient) => [patient.id, patient])),
    [patients]
  )

  const predictionMap = useMemo(
    () => Object.fromEntries(predictions.map((prediction) => [prediction.id, prediction])),
    [predictions]
  )

  const riskMap = useMemo(
    () => {
      const map = {}
      for (const item of risks) {
        map[item.patient_id] = item
      }
      return map
    },
    [risks]
  )

  const predictionsByPatient = useMemo(() => {
    const map = {}
    for (const prediction of predictions) {
      const list = map[prediction.patient_id] || []
      list.push(prediction)
      map[prediction.patient_id] = list
    }
    for (const patientId of Object.keys(map)) {
      map[patientId].sort((a, b) => new Date(b.prediction_date || 0) - new Date(a.prediction_date || 0))
    }
    return map
  }, [predictions])

  const recommendationGroups = useMemo(() => {
    const groups = new Map()

    for (const recommendation of recommendationsState) {
      const patientId = recommendation.patient_id
      const prediction =
        recommendation.prediction_id && predictionMap[recommendation.prediction_id]
          ? predictionMap[recommendation.prediction_id]
          : (predictionsByPatient[patientId] || [])[0] || null

      const key = `${patientId}:${recommendation.prediction_id ?? prediction?.id ?? 'manual'}`
      if (!groups.has(key)) {
        groups.set(key, {
          patientId,
          patient: patientMap[patientId] || null,
          prediction,
          risk: riskMap[patientId] || null,
          recommendations: [],
        })
      }

      groups.get(key).recommendations.push(recommendation)
    }

    return Array.from(groups.values()).sort((a, b) => {
      const timeA = a.recommendations[0]?.created_at || a.prediction?.prediction_date || 0
      const timeB = b.recommendations[0]?.created_at || b.prediction?.prediction_date || 0
      return new Date(timeB) - new Date(timeA)
    })
  }, [recommendationsState, patientMap, predictionMap, predictionsByPatient, riskMap])

  const filteredGroups = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return recommendationGroups.filter((group) => {
      const patientName = group.patient?.name || `Patient ${group.patientId}`
      const predictionDisease = group.prediction?.predicted_disease || '—'
      const matchesSearch =
        !search ||
        patientName.toLowerCase().includes(search) ||
        String(group.patientId).includes(search) ||
        predictionDisease.toLowerCase().includes(search) ||
        group.recommendations.some(
          (item) =>
            String(item.recommendation || '').toLowerCase().includes(search) ||
            String(item.medicine || '').toLowerCase().includes(search)
        )
      const matchesStatus =
        statusFilter === 'all' ||
        group.recommendations.some((item) => String(item.status || 'pending').toLowerCase() === statusFilter)
      return matchesSearch && matchesStatus
    })
  }, [recommendationGroups, searchText, statusFilter])

  const openReviewModal = (recommendation) => {
    setPendingDecision({
      id: recommendation.id,
      status: recommendation.status === 'approved' ? 'approved' : 'approved',
      comments: recommendation.provider_comments || '',
    })
    setReviewModalOpen(true)
  }

  const submitReview = async () => {
    if (!pendingDecision.id) return
    setFeedbackStatus({ type: 'pending', message: 'Updating recommendation...' })
    try {
      const response = await reviewRecommendation({
        recommendation_id: pendingDecision.id,
        status: pendingDecision.status,
        provider_comments: pendingDecision.comments,
      })
      setRecommendationsState((prev) =>
        prev.map((item) =>
          item.id === pendingDecision.id
            ? {
                ...item,
                status: response.status,
                provider_comments: response.provider_comments || pendingDecision.comments,
              }
            : item
        )
      )
      setFeedbackStatus({ type: 'success', message: `Recommendation ${response.status}` })
      setReviewModalOpen(false)
      setPendingDecision({ id: null, status: 'approved', comments: '' })
    } catch (error) {
      setFeedbackStatus({ type: 'error', message: error.message || 'Unable to update recommendation.' })
    }
  }

  const totalRecommendations = recommendationsState.length
  const pendingCount = recommendationsState.filter((item) => !item.status || item.status === 'pending').length
  const approvedCount = recommendationsState.filter((item) => item.status === 'approved').length
  const rejectedCount = recommendationsState.filter((item) => item.status === 'rejected').length

  return (
    <div className="provider-history-page">
      <section className="history-overview-card card">
        <div className="overview-headline">
          <div>
            <span className="eyebrow">Recommendations</span>
            <h2>Patient care plans and AI guidance</h2>
            <p>
              Review personalized recommendations grouped by each patient and prediction so clinical decisions are easier to assess.
            </p>
          </div>
          <div className="overview-meta">
            <span className="badge">{filteredGroups.length} patient reviews</span>
          </div>
        </div>

        <div className="history-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Total recommendations</span>
            <strong>{totalRecommendations}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Pending review</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Approved</span>
            <strong>{approvedCount}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Rejected</span>
            <strong>{rejectedCount}</strong>
          </div>
        </div>
      </section>

      <section className="history-controls card">
        <div className="history-filters">
          <label className="filter-field">
            Search patient or recommendation
            <input
              type="search"
              placeholder="Search patient, disease, or guidance"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>

          <label className="filter-field">
            Recommendation status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <div className="filter-field" />

          <button className="text-button" type="button" onClick={() => { setSearchText(''); setStatusFilter('all') }}>
            Reset filters
          </button>
        </div>
      </section>

      {feedbackStatus && <div className={`status ${feedbackStatus.type}`}>{feedbackStatus.message}</div>}

      <section className="recommendation-groups-wrap">
        {filteredGroups.length === 0 ? (
          <div className="empty-state">No recommendations match the current review filters.</div>
        ) : (
          filteredGroups.map((group, groupIndex) => {
            const prediction = group.prediction
            const patientName = group.patient?.name || `Patient ${group.patientId}`
            const confidence = prediction?.confidence != null ? `${Math.round(prediction.confidence * 100)}%` : 'N/A'
            const riskLevel = group.risk?.risk_level || 'Not available'
            const approvalStatus = prediction?.provider_feedback || prediction?.status || 'pending'

            return (
              <div key={`${group.patientId}-${prediction?.id || groupIndex}`} className="recommendation-group card">
                <div className="group-header">
                  <div>
                    <span className="eyebrow quiet">Patient</span>
                    <h3>{patientName}</h3>
                  </div>
                  <div className="group-summary-grid">
                    <div className="mini-stat">
                      <span>Patient ID</span>
                      <strong>{group.patientId}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Predicted disease</span>
                      <strong>{prediction?.predicted_disease || '—'}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Confidence</span>
                      <strong>{confidence}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Risk level</span>
                      <strong>{riskLevel}</strong>
                    </div>
                    <div className="mini-stat">
                      <span>Approval status</span>
                      <strong className={`compact-status ${statusClass(approvalStatus)}`}>{String(approvalStatus).toUpperCase()}</strong>
                    </div>
                  </div>
                </div>

                <div className="recommendation-list">
                  {group.recommendations.map((item) => {
                    const isPending = !item.status || item.status === 'pending'
                    const statusValue = String(item.status || 'pending').toUpperCase()

                    return (
                      <article className="recommendation-card" key={item.id}>
                        <div className="recommendation-card-header">
                          <div className="recommendation-title-wrap">
                            <span className="recommendation-type-pill">{item.recommendation_type || item.medicine || 'General'}</span>
                            <h4>{item.medicine || 'General Care Guidance'}</h4>
                          </div>
                          <span className={`status-pill ${statusClass(item.status)}`}>{statusValue}</span>
                        </div>

                        <p className="recommendation-text">{item.recommendation || 'No recommendation details provided.'}</p>

                        <div className="recommendation-meta-row">
                          <span>Created: {formatDate(item.created_at)}</span>
                          <span>{item.provider_comments ? `Note: ${item.provider_comments}` : 'Awaiting clinical notes'}</span>
                        </div>

                        {isPending ? (
                          <div className="recommendation-actions">
                            <button
                              type="button"
                              className="btn primary"
                              onClick={() => {
                                setPendingDecision({
                                  id: item.id,
                                  status: 'approved',
                                  comments: item.provider_comments || '',
                                })
                                setReviewModalOpen(true)
                              }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn secondary"
                              onClick={() => {
                                setPendingDecision({
                                  id: item.id,
                                  status: 'rejected',
                                  comments: item.provider_comments || '',
                                })
                                setReviewModalOpen(true)
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="recommendation-actions locked">
                            <span>Decision already recorded</span>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </section>

      <Modal open={reviewModalOpen} title="Review recommendation" onClose={() => setReviewModalOpen(false)}>
        <div className="form-grid">
          <label className="field">
            Decision
            <select value={pendingDecision.status} onChange={(e) => setPendingDecision((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>
          </label>
          <label className="field">
            Provider comments
            <textarea
              value={pendingDecision.comments}
              onChange={(e) => setPendingDecision((prev) => ({ ...prev, comments: e.target.value }))}
              rows={4}
            />
          </label>
          <div className="button-row">
            <button className="btn primary" type="button" onClick={submitReview}>Save decision</button>
            <button className="btn secondary" type="button" onClick={() => setReviewModalOpen(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
