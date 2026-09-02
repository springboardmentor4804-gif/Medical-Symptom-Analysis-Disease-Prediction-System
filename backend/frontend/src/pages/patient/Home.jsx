import React from 'react'
import { useNavigate } from 'react-router-dom'
import OverviewCards from '../../components/OverviewCards'
import ActivityList from '../../components/ActivityList'
import SampleTable from '../../components/SampleTable'

export default function PatientHome({ dashboardData }){
  const navigate = useNavigate()
  const user = dashboardData?.user ?? {}
  const profile = dashboardData?.profile ?? {}
  const medicalHistory = dashboardData?.medical_history ?? []
  const symptoms = dashboardData?.symptoms ?? []
  const predictions = dashboardData?.predictions ?? []
  const risk = dashboardData?.risk
  const reports = dashboardData?.reports ?? []
  const recommendations = dashboardData?.recommendations ?? []
  const advisory = dashboardData?.healthcare_advisory

  const profileCompletion = profile.age ? 92 : 58
  const cards = [
    { title: 'Profile Completion', value: `${profileCompletion}%` },
    { title: 'Symptoms Submitted', value: symptoms.length },
    { title: 'Disease Predictions', value: predictions.length },
    { title: 'Risk Assessments', value: risk ? 1 : 0 },
    { title: 'Reports', value: reports.length },
    { title: 'Recommendations', value: recommendations.length },
  ]

  return (
    <div className="patient-home">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">Patient Overview</span>
          <h1>Welcome back, {user.full_name || 'Patient'}</h1>
          <p className="lead">Track your symptoms, review risk insights, and stay on top of your health with clear guidance.</p>
        </div>
        <div className="hero-actions">
          <button className="btn small" onClick={() => navigate('/dashboard/patient/profile')}>Update Profile</button>
          <button className="btn outline small" onClick={() => navigate('/dashboard/patient/reports')}>View Reports</button>
        </div>
      </div>

      <OverviewCards items={cards} />

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Latest Predictions</h3>
            <span className="badge">{predictions.length} items</span>
          </div>
          <div className="panel-body">
            {predictions.length ? (
              <ul className="recent-list">
                {predictions.slice(0, 5).map((item, idx) => (
                  <li className="recent-item" key={idx}>
                    <div className="item-title">{item.predicted_disease}</div>
                    <div className="item-meta">{(item.confidence * 100).toFixed(0)}% confidence • {new Date(item.prediction_date).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">No disease predictions available yet.</div>
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Recent Activity</h3>
            <span className="badge">{symptoms.length} symptoms</span>
          </div>
          <div className="panel-body">
            {symptoms.length ? (
              <ul className="recent-list">
                {symptoms.slice(0, 5).map((item, idx) => (
                  <li className="recent-item" key={idx}>
                    <div className="item-title">{item.symptom_name}</div>
                    <div className="item-meta">Recorded on {new Date(item.entered_date).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">No recent symptom activity. Add your first symptom entry to get started.</div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Risk Summary</h3>
          </div>
          <div className="panel-body">
            {risk ? (
              <div className="recent-list">
                <li className="recent-item">
                  <div className="item-title">Current Risk Level</div>
                  <div className="item-meta">{risk.risk_level} • Score {risk.score}</div>
                </li>
                <li className="recent-item">
                  <div className="item-title">Remarks</div>
                  <div className="item-meta">{risk.remarks}</div>
                </li>
              </div>
            ) : (
              <div className="empty-state">No risk assessment has been generated yet.</div>
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Recommendations</h3>
          </div>
          <div className="panel-body">
            {recommendations.length ? (
              <ul className="recent-list">
                {recommendations.slice(0, 5).map((item, idx) => (
                  <li className="recent-item" key={idx}>
                    <div className="item-title">{item.recommendation}</div>
                    <div className="item-meta">Medicine: {item.medicine}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">No recommendations are available yet.</div>
            )}
          </div>
        </div>
      </div>

      {advisory && (
        <section className="dashboard-panel healthcare-advisory-panel">
          <div className="panel-header">
            <div>
              <h3>Healthcare Advisory</h3>
              <p className="muted">Practical guidance based on your latest symptoms, prediction, and risk assessment.</p>
            </div>
            <span className="badge">Educational guidance</span>
          </div>
          <div className="advisory-grid">
            <div className="advisory-section"><h4>Preventive care</h4><ul>{advisory.preventive_care?.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div className="advisory-section"><h4>Lifestyle advice</h4><ul>{advisory.lifestyle_advice?.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div className="advisory-section"><h4>Follow-up guidance</h4><p>{advisory.follow_up_guidance}</p></div>
            <div className="advisory-section advisory-alert"><h4>When to seek care</h4><p>{advisory.when_to_seek_care}</p></div>
          </div>
          <p className="advisory-disclaimer">{advisory.disclaimer}</p>
        </section>
      )}
    </div>
  )
}
