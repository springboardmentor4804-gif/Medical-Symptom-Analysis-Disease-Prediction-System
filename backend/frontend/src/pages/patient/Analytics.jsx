import React from 'react'
import OverviewCards from '../../components/OverviewCards'
import SampleTable from '../../components/SampleTable'

function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function polarPoint(angle, radius) {
  const radians = (angle * Math.PI) / 180
  return { x: 50 + radius * Math.cos(radians), y: 50 + radius * Math.sin(radians) }
}

function PieChart({ data, title }) {
  if (!data.length) return <div className="analytics-empty">No prediction data available yet.</div>
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const colors = ['#2563eb', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
  let angle = -90

  return (
    <div className="chart-container compact-pie-chart">
      <h4 className="chart-title">{title}</h4>
      <div className="pie-chart-layout">
        <svg viewBox="0 0 100 100" className="pie-chart-svg" role="img" aria-label={title}>
          {data.map((item, index) => {
            const sliceAngle = (item.count / total) * 360
            const start = polarPoint(angle, 34)
            const end = polarPoint(angle + sliceAngle, 34)
            const path = `M 50 50 L ${start.x} ${start.y} A 34 34 0 ${sliceAngle > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`
            angle += sliceAngle
            return <path key={item.disease} d={path} fill={colors[index % colors.length]} stroke="#fff" strokeWidth="1" />
          })}
          <circle cx="50" cy="50" r="13" fill="#fff" />
          <text x="50" y="48" textAnchor="middle" className="pie-total-value">{total}</text>
          <text x="50" y="58" textAnchor="middle" className="pie-total-label">Total</text>
        </svg>
        <div className="chart-legend pie-legend">
          {data.map((item, index) => (
            <div key={item.disease} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: colors[index % colors.length] }} />
              <span>{item.disease} ({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConfidenceDonut({ confidence }) {
  if (confidence == null) return <div className="analytics-empty">No data available</div>
  const percentage = Math.round(Math.max(0, Math.min(100, confidence)))
  const end = polarPoint(-90 + percentage * 3.6, 31)
  const largeArc = percentage > 50 ? 1 : 0
  const arc = percentage === 100
    ? 'M 50 19 A 31 31 0 1 1 49.99 19'
    : `M 50 19 A 31 31 0 ${largeArc} 1 ${end.x} ${end.y}`

  return (
    <div className="chart-container confidence-donut-chart">
      <h4 className="chart-title">Prediction Confidence</h4>
      <svg viewBox="0 0 100 100" className="confidence-donut-svg" role="img" aria-label={`Average prediction confidence ${percentage}%`}>
        <circle cx="50" cy="50" r="31" fill="none" stroke="#eaf1f8" strokeWidth="10" />
        {percentage > 0 && <path d={arc} fill="none" stroke="#2563eb" strokeWidth="10" strokeLinecap="round" />}
        <text x="50" y="48" textAnchor="middle" className="donut-center-value">{percentage}%</text>
        <text x="50" y="59" textAnchor="middle" className="donut-center-label">Average confidence</text>
      </svg>
      <p className="analytics-note">Based on recorded predictions</p>
    </div>
  )
}

function RiskScoreBars({ assessments, patientName }) {
  if (!assessments.length) return <div className="analytics-empty">Not enough data</div>
  const maxScore = Math.max(...assessments.map((item) => item.score), 1)

  return (
    <div className="chart-container score-bar-chart">
      <h4 className="chart-title">Risk Assessment Scores</h4>
      <div className="score-bar-list">
        {assessments.map((assessment, index) => (
          <div className="score-bar-row" key={`${assessment.date}-${index}`}>
            <div className="score-bar-label">
              <strong>{patientName}</strong>
              <span>{formatDate(assessment.date)}</span>
            </div>
            <div className="score-bar-track" title={`${assessment.score} risk score`}>
              <span style={{ width: `${(assessment.score / maxScore) * 100}%` }} />
            </div>
            <strong className="score-bar-value">{assessment.score}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthlyPredictionBars({ data }) {
  if (!data.length) return <div className="analytics-empty">Not enough data</div>
  const maxCount = Math.max(...data.map((item) => item.count), 1)

  return (
    <div className="chart-container monthly-bar-chart">
      <h4 className="chart-title">Prediction Trends</h4>
      <div className="monthly-bar-list">
        {data.map((item) => (
          <div className="monthly-bar-column" key={item.period}>
            <strong>{item.count}</strong>
            <div className="monthly-bar-track" title={`${item.count} predictions in ${item.label}`}>
              <span style={{ height: `${(item.count / maxCount) * 100}%` }} />
            </div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Donut Chart for Risk Distribution
function DonutChart({ riskCounts, title }) {
  const total = Object.values(riskCounts).reduce((sum, val) => sum + val, 0)
  if (!total) return <div className="analytics-empty">No data available</div>
  const colors = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444' }
  const labels = { low: 'Low', moderate: 'Moderate', high: 'High' }
  const riskOrder = ['low', 'moderate', 'high']
  
  let currentOffset = 0
  const slices = []
  const legendItems = []
  
  for (const risk of riskOrder) {
    const count = riskCounts[risk] || 0
    if (count > 0) {
      const percentage = (count / total) * 100
      slices.push(
        <circle
          key={`slice-${risk}`}
          cx="50"
          cy="50"
          r="24"
          fill="none"
          stroke={colors[risk]}
          strokeWidth="12"
          pathLength="100"
          strokeDasharray={`${percentage} ${100 - percentage}`}
          strokeDashoffset={-currentOffset}
          transform="rotate(-90 50 50)"
        />
      )
      
      legendItems.push({ risk: labels[risk], count, percentage, color: colors[risk] })
      currentOffset += percentage
    }
  }

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <svg viewBox="0 0 100 100" className="risk-donut-svg" role="img" aria-label={`${title}, ${total} total assessments`}>
        {slices}
      </svg>
      <div className="chart-summary">Total Assessments: <strong>{total}</strong></div>
      <div className="chart-legend risk-legend">
        {legendItems.map(item => (
          <div key={item.risk} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: item.color }} />
            <span>{item.risk}: {item.count} ({item.percentage.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Horizontal Bar Chart for Symptoms
function SymptomChart({ symptoms, title }) {
  if (symptoms.length === 0) return <div className="analytics-empty">No symptom data available yet.</div>
  
  const maxCount = Math.max(...symptoms.map(s => s.count), 1)
  const topSymptoms = symptoms.slice(0, 8)

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <div className="bar-chart-container">
        {topSymptoms.map((symptom, idx) => {
          const percentage = (symptom.count / maxCount) * 100
          const colors = ['accent1', 'accent2', 'orange']
          const colorClass = colors[idx % colors.length]
          return (
            <div key={symptom.symptom} className="bar-chart-item">
              <span className="bar-chart-label" title={symptom.symptom}>{symptom.symptom}</span>
              <div className={`bar-chart-bar ${colorClass}`}>
                <span style={{ width: `${percentage}%` }} />
              </div>
              <span className="bar-chart-value">{symptom.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Analytics({ dashboardData }){
  const medicalHistory = dashboardData?.medical_history ?? []
  const symptoms = dashboardData?.symptoms ?? []
  const predictions = dashboardData?.predictions ?? []
  const risk = dashboardData?.risk
  const riskHistory = dashboardData?.risk_history ?? []
  const reports = dashboardData?.reports ?? []
  const recommendations = dashboardData?.recommendations ?? []

  const predictionHistory = [...predictions].sort((a, b) => new Date(a.prediction_date) - new Date(b.prediction_date))
  const confidenceHistory = predictionHistory.filter((item) => item.confidence != null).map((item) => ({ value: item.confidence * 100, date: item.prediction_date }))
  const riskAssessments = [...riskHistory]
    .filter((item) => item.score != null && item.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((item) => ({ score: item.score, date: item.created_at }))

  // Count risk levels for donut chart
  const riskCounts = { low: 0, moderate: 0, high: 0 }
  riskHistory.forEach(item => {
    const level = (item.risk_level || '').toLowerCase()
    const normalizedLevel = level === 'medium' ? 'moderate' : level
    if (normalizedLevel in riskCounts) riskCounts[normalizedLevel]++
  })

  // Get symptom counts
  const symptomCounts = symptoms.reduce((acc, symptom) => {
    const existing = acc.find(s => s.symptom === symptom.symptom_name)
    if (existing) existing.count++
    else acc.push({ symptom: symptom.symptom_name, count: 1 })
    return acc
  }, []).sort((a, b) => b.count - a.count)

  // Get disease counts
  const diseaseCounts = predictions.reduce((acc, pred) => {
    const existing = acc.find(d => d.disease === pred.predicted_disease)
    if (existing) existing.count++
    else acc.push({ disease: pred.predicted_disease, count: 1 })
    return acc
  }, []).sort((a, b) => b.count - a.count)

  const monthlyPredictions = predictionHistory.reduce((months, prediction) => {
    const date = new Date(prediction.prediction_date)
    if (Number.isNaN(date.getTime())) return months
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months[key] = (months[key] || 0) + 1
    return months
  }, {})
  const monthlyEntries = Object.entries(monthlyPredictions).map(([period, count]) => ({
    period,
    count,
    label: new Date(`${period}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
  }))
  const averageConfidence = confidenceHistory.length
    ? confidenceHistory.reduce((sum, item) => sum + item.value, 0) / confidenceHistory.length
    : null

  const cards = [
    { title: 'History records', value: medicalHistory.length },
    { title: 'Symptoms tracked', value: symptoms.length },
    { title: 'Predictions made', value: predictions.length },
    { title: 'Risk status', value: risk?.risk_level || 'None' },
    { title: 'Reports', value: reports.length },
    { title: 'Recommendations', value: recommendations.length },
  ]

  const recentActivity = [
    ...symptoms.map((item) => ({ Date: item.entered_date, Event: item.symptom_name, Type: 'Symptom' })),
    ...predictions.map((item) => ({ Date: item.prediction_date, Event: item.predicted_disease, Type: 'Prediction' })),
    ...riskHistory.map((item) => ({ Date: item.created_at, Event: `${item.risk_level} risk (${item.score ?? 'N/A'})`, Type: 'Risk assessment' })),
    ...reports.map((item) => ({ Date: item.generated_at, Event: item.report_name, Type: 'Report' })),
  ].sort((a, b) => new Date(b.Date) - new Date(a.Date)).slice(0, 10)

  return (
    <div className="analytics-page">
      <OverviewCards items={cards} />
      {!predictions.length && !riskHistory.length && !symptoms.length && !reports.length ? (
        <div className="card trend-empty-state">No health history available yet</div>
      ) : (
        <div className="patient-trends-grid">
          <section className="card patient-trend-panel">
            <PieChart data={diseaseCounts.slice(0, 6)} title="Disease Prediction Counts" />
          </section>

          <section className="card patient-trend-panel">
            <div className="risk-confidence-layout">
              <div className="risk-distribution-section">
                <DonutChart riskCounts={riskCounts} title="Risk Level Distribution" />
              </div>
              <div className="confidence-section">
                <ConfidenceDonut confidence={averageConfidence} />
              </div>
            </div>
          </section>

          <section className="card patient-trend-panel">
            <MonthlyPredictionBars data={monthlyEntries} />
          </section>

          {symptomCounts.length > 0 && (
            <section className="card patient-trend-panel">
              <SymptomChart symptoms={symptomCounts} title="Frequently Reported Symptoms" />
            </section>
          )}

          <section className="card patient-trend-panel">
            <RiskScoreBars assessments={riskAssessments} patientName={dashboardData?.user?.full_name || 'Patient'} />
          </section>

          <section className="card patient-activity-panel">
            <div className="trend-card-header">
              <span className="trend-card-title">Recent Health Activity</span>
              <span className="trend-stat-badge">{recentActivity.length} records</span>
            </div>
            {recentActivity.length ? <SampleTable columns={["Date", "Type", "Event"]} rows={recentActivity.map((item) => ({ Date: formatDate(item.Date), Type: item.Type, Event: item.Event }))} /> : <div className="trend-empty">No activity available yet</div>}
          </section>
        </div>
      )}
    </div>
  )
}
