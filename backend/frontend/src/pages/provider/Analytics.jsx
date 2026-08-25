import React from 'react'

export default function ProviderAnalytics({ dashboardData }){
  const predictions = dashboardData?.predictions ?? []
  const analytics = dashboardData?.analytics ?? {}
  const diseaseCounts = analytics.disease_prediction_counts ?? []
  const symptomCounts = analytics.symptom_counts ?? []
  const predictionTrends = analytics.prediction_trends ?? []
  const statusCounts = analytics.prediction_status ?? { approved: 0, pending: 0, rejected: 0 }
  const maxDiseaseCount = Math.max(...diseaseCounts.map((item) => item.count), 1)
  const topSymptoms = symptomCounts.slice(0, 5)
  const maxSymptomCount = Math.max(...topSymptoms.map((item) => item.count), 1)
  const maxTrendCount = Math.max(...predictionTrends.map((item) => item.count), 1)
  const confidence = Math.round((analytics.average_prediction_confidence ?? 0) * 100)
  const modelAccuracy = analytics.model_test_accuracy == null ? null : Math.round(analytics.model_test_accuracy * 100)

  return (
    <div className="provider-page">
      <section className="analytics-section-heading">
        <div>
          <span className="eyebrow">Provider analytics</span>
          <h2>Clinical intelligence overview</h2>
          <p>Prediction patterns, confidence, symptoms, and risk signals in one view.</p>
        </div>
        <span className="badge">{predictions.length} predictions</span>
      </section>

      <div className="analytics-stat-strip">
          <div className="card analytics-stat-card">
            <span className="panel-kicker">Patient reach</span>
            <strong>{analytics.total_patients_assessed ?? 0}</strong>
            <span>Total Patients Assessed</span>
          </div>
          <div className="card analytics-stat-card risk-stat">
            <span className="panel-kicker">Attention needed</span>
            <strong>{analytics.high_risk_cases?.count ?? 0}</strong>
            <span>High-Risk Patients</span>
          </div>
          <div className="card analytics-stat-card">
            <span className="panel-kicker">Offline evaluation</span>
            <strong>{modelAccuracy == null ? 'N/A' : `${modelAccuracy}%`}</strong>
            <span>Model Test Accuracy</span>
            <small>Held-out evaluation metric</small>
          </div>
          <div className="card analytics-stat-card confidence-stat">
            <span className="panel-kicker">Live predictions</span>
            <strong>{confidence}%</strong>
            <span>Average Prediction Confidence</span>
            <small>Mean confidence of recorded predictions</small>
          </div>
      </div>

      <section className="analytics-grid analytics-four-grid">
        <div className="card analytics-panel disease-panel">
          <div className="analytics-panel-header">
            <div>
              <span className="panel-kicker">Prediction mix</span>
              <h3>Disease-wise prediction counts</h3>
            </div>
            <span className="analytics-icon">Dx</span>
          </div>
          <div className="bar-list">
            {diseaseCounts.length === 0 ? <div className="analytics-empty">No prediction data yet.</div> : diseaseCounts.slice(0, 5).map((item) => (
              <div className="bar-item" key={item.disease}>
                <div className="bar-label"><strong>{item.disease}</strong><span>{item.count} · {item.percentage}%</span></div>
                <div className="analytics-bar"><span style={{width: `${(item.count / maxDiseaseCount) * 100}%`}} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <span className="panel-kicker">Model signal</span>
              <h3>Average Prediction Confidence</h3>
            </div>
            <strong className="confidence-value">{confidence}%</strong>
          </div>
          <div className="confidence-track"><span style={{width: `${confidence}%`}} /></div>
          <p className="analytics-note">Average confidence across all recorded disease predictions.</p>
          <div className="status-count-grid">
            <div><span className="status-dot approved" /><strong>{statusCounts.approved}</strong><small>Approved</small></div>
            <div><span className="status-dot pending" /><strong>{statusCounts.pending}</strong><small>Pending</small></div>
            <div><span className="status-dot rejected" /><strong>{statusCounts.rejected}</strong><small>Rejected</small></div>
          </div>
          <div className="status-distribution" aria-label="Prediction status distribution">
            {['approved', 'pending', 'rejected'].map((status) => {
              const total = statusCounts.approved + statusCounts.pending + statusCounts.rejected || 1
              return <span key={status} className={status} style={{width: `${(statusCounts[status] / total) * 100}%`}} />
            })}
          </div>
        </div>

        <div className="card analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <span className="panel-kicker">Patient signals</span>
              <h3>Frequently reported symptoms</h3>
            </div>
            <span className="analytics-icon">Sx</span>
          </div>
          <div className="bar-list">
            {topSymptoms.length === 0 ? <div className="analytics-empty">No symptom data yet.</div> : topSymptoms.map((item) => (
              <div className="bar-item" key={item.symptom}>
                <div className="bar-label"><strong>{item.symptom}</strong><span>{item.count}</span></div>
                <div className="analytics-bar teal"><span style={{width: `${(item.count / maxSymptomCount) * 100}%`}} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card analytics-panel trend-panel">
          <div className="analytics-panel-header">
            <div>
              <span className="panel-kicker">Longitudinal view</span>
              <h3>Prediction trends over time</h3>
            </div>
            <span className="analytics-icon">↗</span>
          </div>
          <div className="trend-chart">
            {predictionTrends.length === 0 ? <div className="analytics-empty">No trend data yet.</div> : predictionTrends.map((item) => (
              <div className="trend-column" key={item.period}>
                <strong>{item.count}</strong>
                <div className="trend-column-bar"><span style={{height: `${(item.count / maxTrendCount) * 100}%`}} /></div>
                <span>{item.period}</span>
              </div>
            ))}
          </div>
          <p className="analytics-note">Monthly prediction volume based on recorded prediction dates.</p>
        </div>

      </section>

      <section className="card analytics-insights-summary">
        <div className="analytics-summary-title">
          <span className="panel-kicker">Clinical summary</span>
          <h3>Healthcare Insights</h3>
        </div>
        <div className="analytics-summary-items">
          <div><span>Most predicted disease</span><strong>{analytics.most_common_disease || 'No data yet'}</strong></div>
          <div><span>Most common symptom</span><strong>{analytics.most_common_symptom || 'No data yet'}</strong></div>
          <div className="risk-summary"><span>High-risk patients</span><strong>{analytics.high_risk_cases?.count ?? 0}</strong></div>
        </div>
      </section>
    </div>
  )
}
