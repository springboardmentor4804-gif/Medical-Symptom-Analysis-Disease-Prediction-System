import React from 'react'

// Donut Chart for Prediction Status Distribution
function StatusDonutChart({ statusCounts }) {
  const total = statusCounts.approved + statusCounts.pending + statusCounts.rejected
  if (!total) return <div className="analytics-empty">No data available</div>
  const statusOrder = ['approved', 'pending', 'rejected']
  const colors = { approved: '#10b981', pending: '#f59e0b', rejected: '#ef4444' }
  const labels = { approved: 'Approved', pending: 'Pending', rejected: 'Rejected' }
  
  let currentOffset = 0
  const slices = []
  const legendItems = []
  
  for (const status of statusOrder) {
    const count = statusCounts[status] || 0
    const percentage = (count / total) * 100
    if (count > 0) slices.push(
      <circle
        key={`slice-${status}`}
        className="provider-status-slice"
        cx="50"
        cy="50"
        r="29"
        fill="none"
        stroke={colors[status]}
        strokeWidth="11"
        pathLength="100"
        strokeDasharray={`${percentage} ${100 - percentage}`}
        strokeDashoffset={-currentOffset}
        transform="rotate(-90 50 50)"
      />
    )
    legendItems.push({ status: labels[status], count, percentage, color: colors[status] })
    currentOffset += percentage
  }

  return (
    <div className="chart-container">
      <h4 className="chart-title">Prediction Status Distribution</h4>
      <svg viewBox="0 0 100 100" className="provider-status-donut" role="img" aria-label={`Prediction status distribution, ${total} predictions`}>
        {slices}
        <text x="50" y="47" textAnchor="middle" className="donut-center-value">{total}</text>
        <text x="50" y="58" textAnchor="middle" className="donut-center-label">Total predictions</text>
      </svg>
      <div className="chart-legend provider-status-legend">
        {legendItems.map(item => (
          <div key={item.status} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: item.color }} />
            <span>{item.status}: {item.count} ({item.percentage.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Improved Bar Chart Component
function BarChartComponent({ data, title, maxItems = 5, colorClass = 'accent1' }) {
  if (data.length === 0) return <div className="analytics-empty">No data available yet.</div>
  
  const maxCount = Math.max(...data.map(item => item.count), 1)
  const displayData = data.slice(0, maxItems)

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <div className="bar-chart-container">
        {displayData.map((item) => {
          const percentage = (item.count / maxCount) * 100
          const label = item.disease || item.symptom
          return (
            <div key={label} className="bar-chart-item">
              <span className="bar-chart-label" title={label}>{label}</span>
              <div className={`bar-chart-bar ${colorClass}`}>
                <span style={{ width: `${percentage}%` }} />
              </div>
              <span className="bar-chart-value">{item.count}</span>
            </div>
          )
        })}
      </div>
      {data.length > maxItems && (
        <p className="analytics-note">Showing top {maxItems} of {data.length} items</p>
      )}
    </div>
  )
}

// Vertical Bar Chart for Prediction Trends
function TrendChartComponent({ data, title }) {
  if (data.length === 0) return <div className="analytics-empty">No trend data available yet.</div>
  
  const maxCount = Math.max(...data.map(item => item.count), 1)

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <div className="trend-chart">
        {data.map((item) => (
          <div className="trend-column" key={item.period}>
            <strong>{item.count}</strong>
            <div className="trend-column-bar"><span style={{ height: `${(item.count / maxCount) * 100}%` }} /></div>
            <span>{item.period}</span>
          </div>
        ))}
      </div>
      <p className="analytics-note">Monthly prediction volume based on recorded prediction dates</p>
    </div>
  )
}

export default function ProviderAnalytics({ dashboardData }){
  const predictions = dashboardData?.predictions ?? []
  const analytics = dashboardData?.analytics ?? {}
  const diseaseCounts = (analytics.disease_prediction_counts ?? []).sort((a, b) => b.count - a.count)
  const symptomCounts = (analytics.symptom_counts ?? []).sort((a, b) => b.count - a.count)
  const predictionTrends = analytics.prediction_trends ?? []
  const statusCounts = {
    approved: Number(analytics.prediction_status?.approved ?? 0),
    pending: Number(analytics.prediction_status?.pending ?? 0),
    rejected: Number(analytics.prediction_status?.rejected ?? 0),
  }
  const confidence = Math.round((analytics.average_prediction_confidence ?? 0) * 100)
  const modelAccuracy = analytics.model_test_accuracy == null ? null : Math.round(analytics.model_test_accuracy * 100)

  return (
    <div className="provider-page">
      <section className="analytics-section-heading">
        <div>
          <span className="eyebrow">Provider analytics</span>
          <h2>Clinical Intelligence Overview</h2>
          <p>Real-time prediction patterns, confidence metrics, symptom distribution, and risk signals across your patient population.</p>
        </div>
        <span className="badge">{predictions.length} predictions</span>
      </section>

      <div className="analytics-stat-strip">
        <div className="card analytics-stat-card">
          <span className="panel-kicker">Patient Reach</span>
          <strong>{analytics.total_patients_assessed ?? 0}</strong>
          <span>Total Patients Assessed</span>
        </div>
        <div className="card analytics-stat-card risk-stat">
          <span className="panel-kicker">Attention Needed</span>
          <strong>{analytics.high_risk_cases?.count ?? 0}</strong>
          <span>High-Risk Patients</span>
        </div>
        <div className="card analytics-stat-card">
          <span className="panel-kicker">Model Performance</span>
          <strong>{modelAccuracy == null ? 'N/A' : `${modelAccuracy}%`}</strong>
          <span>Test Accuracy (Offline)</span>
          <small>Held-out evaluation metric</small>
        </div>
        <div className="card analytics-stat-card confidence-stat">
          <span className="panel-kicker">Live Predictions</span>
          <strong>{confidence}%</strong>
          <span>Average Confidence</span>
          <small>Mean confidence of recorded predictions</small>
        </div>
      </div>

      <section className="analytics-grid analytics-four-grid">
        {/* Disease Prediction Counts */}
        <div className="card analytics-panel disease-panel">
          <div className="analytics-panel-header">
            <div>
              <span className="panel-kicker">Prediction Mix</span>
              <h3>Disease-wise Prediction Counts</h3>
            </div>
            <span className="analytics-icon">Dx</span>
          </div>
          <BarChartComponent data={diseaseCounts} title={null} maxItems={5} colorClass="accent1" />
        </div>

        {/* Prediction Status Donut Chart */}
        <div className="card analytics-panel">
          <StatusDonutChart statusCounts={statusCounts} />
        </div>

        {/* Frequently Reported Symptoms */}
        <div className="card analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <span className="panel-kicker">Patient Signals</span>
              <h3>Frequently Reported Symptoms</h3>
            </div>
            <span className="analytics-icon">Sx</span>
          </div>
          <BarChartComponent data={symptomCounts} title={null} maxItems={5} colorClass="accent2" />
        </div>

        {/* Prediction Trends Over Time */}
        <div className="card analytics-panel trend-panel">
          <TrendChartComponent data={predictionTrends} title="Prediction Trends Over Time" />
        </div>
      </section>

      {/* Clinical Summary */}
      <section className="card analytics-insights-summary">
        <div className="analytics-summary-title">
          <span className="panel-kicker">Clinical Summary</span>
          <h3>Healthcare Insights</h3>
        </div>
        <div className="analytics-summary-items">
          <div>
            <span>Most Predicted Disease</span>
            <strong>{analytics.most_common_disease || 'No data yet'}</strong>
          </div>
          <div>
            <span>Most Common Symptom</span>
            <strong>{analytics.most_common_symptom || 'No data yet'}</strong>
          </div>
          <div className="risk-summary">
            <span>High-Risk Patients Requiring Attention</span>
            <strong>{analytics.high_risk_cases?.count ?? 0}</strong>
          </div>
        </div>
      </section>

      {/* Additional Insights Section */}
      {(analytics.high_risk_cases?.cases || []).length > 0 && (
        <section className="card analytics-insights-summary">
          <div className="analytics-summary-title">
            <span className="panel-kicker">Alert</span>
            <h3>High-Risk Cases Requiring Review</h3>
          </div>
          <div className="insight-list">
            {analytics.high_risk_cases.cases.slice(0, 5).map((caseItem, idx) => (
              <div key={idx} className="insight-row risk-insight">
                <div>
                  <span>{caseItem.patient_name || `Patient ${caseItem.patient_id}`}</span>
                  <strong className="risk-level">{caseItem.risk_level}</strong>
                </div>
                <span>Risk Score: {caseItem.risk_score}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
