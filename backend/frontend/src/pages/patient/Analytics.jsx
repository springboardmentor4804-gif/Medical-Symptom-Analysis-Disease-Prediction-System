import React from 'react'
import OverviewCards from '../../components/OverviewCards'
import SampleTable from '../../components/SampleTable'

function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function LineChart({ values, color, label }) {
  if (!values.length) return <div className="trend-empty">No health history available yet</div>
  const max = Math.max(...values, 1)
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${100 - (value / max) * 82 - 9}`).join(' ')

  return (
    <div className="patient-line-chart">
      <svg viewBox="0 0 100 100" role="img" aria-label={label} preserveAspectRatio="none">
        <line x1="0" y1="91" x2="100" y2="91" className="chart-axis" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {values.map((value, index) => {
          const [x, y] = points.split(' ')[index].split(',')
          return <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={color} vectorEffect="non-scaling-stroke" />
        })}
      </svg>
      <div className="chart-labels"><span>{formatDate(values[0].date)}</span><span>{formatDate(values[values.length - 1].date)}</span></div>
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
  const riskScoreHistory = [...riskHistory]
    .filter((item) => item.score != null)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((item) => ({ value: item.score, date: item.created_at }))

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
  const maxMonthlyCount = Math.max(...monthlyEntries.map((item) => item.count), 1)

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
          <section className="card patient-trend-panel patient-prediction-history">
            <div className="trend-panel-heading"><div><span className="panel-kicker">Disease history</span><h3>Disease predictions over time</h3></div><span className="trend-count">{predictions.length}</span></div>
            {predictionHistory.length ? (
              <div className="prediction-history-list">
                {predictionHistory.map((prediction) => (
                  <div className="prediction-history-row" key={prediction.id}>
                    <span className="prediction-history-date">{formatDate(prediction.prediction_date)}</span>
                    <strong>{prediction.predicted_disease || 'Unknown disease'}</strong>
                    <span>{prediction.confidence == null ? 'N/A' : `${Math.round(prediction.confidence * 100)}% confidence`}</span>
                  </div>
                ))}
              </div>
            ) : <div className="trend-empty">No health history available yet</div>}
          </section>

          <section className="card patient-trend-panel">
            <div className="trend-panel-heading"><div><span className="panel-kicker">Model signal</span><h3>Prediction confidence</h3></div></div>
            <LineChart values={confidenceHistory} color="#2563eb" label="Prediction confidence over time" />
          </section>

          <section className="card patient-trend-panel">
            <div className="trend-panel-heading"><div><span className="panel-kicker">Risk history</span><h3>Risk assessment over time</h3></div></div>
            <LineChart values={riskScoreHistory} color="#e07a32" label="Risk assessment score over time" />
          </section>

          <section className="card patient-trend-panel">
            <div className="trend-panel-heading"><div><span className="panel-kicker">Monthly volume</span><h3>Predictions by month</h3></div></div>
            {monthlyEntries.length ? (
              <div className="patient-monthly-chart">
                {monthlyEntries.map((item) => <div className="patient-month-column" key={item.period}><strong>{item.count}</strong><div className="patient-month-bar"><span style={{ height: `${(item.count / maxMonthlyCount) * 100}%` }} /></div><small>{item.label}</small></div>)}
              </div>
            ) : <div className="trend-empty">No health history available yet</div>}
          </section>

          <section className="card patient-trend-panel patient-activity-panel">
            <div className="trend-panel-heading"><div><span className="panel-kicker">Timeline</span><h3>Recent health activity</h3></div></div>
            {recentActivity.length ? <SampleTable columns={["Date", "Type", "Event"]} rows={recentActivity.map((item) => ({ Date: formatDate(item.Date), Type: item.Type, Event: item.Event }))} /> : <div className="trend-empty">No health history available yet</div>}
          </section>
        </div>
      )}
    </div>
  )
}
