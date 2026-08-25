import React, { useState, useEffect } from 'react'
import { runRiskAssessment } from '../../api/patient'

export default function RiskAssessment({ dashboardData, reloadDashboard }){
  const risk = dashboardData?.risk
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(risk || null)

  useEffect(() => {
    setStatus(null)
    setResult(risk || null)
  }, [dashboardData, risk])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: 'pending', message: 'Assessing risk...' })
    try {
      const response = await runRiskAssessment({ notes })
      setResult(response)
      setStatus({ type: 'success', message: 'Risk assessment completed.' })
      reloadDashboard?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to assess risk.' })
    }
  }

  const activeRisk = result || risk

  return (
    <div className="risk-page">
      <section className="risk-hero card">
        <div>
          <span className="eyebrow">Risk Assessment</span>
          <h2>Understand your health risk at a glance</h2>
          <p>Review your current risk profile, add context, and re-run assessments to stay on top of your wellness trends.</p>
        </div>
        <div className="risk-hero-summary">
          <div className="summary-box">
            <span className="summary-label">Current level</span>
            <strong>{activeRisk?.risk_level || 'Unknown'}</strong>
          </div>
          <div className="summary-box">
            <span className="summary-label">Risk score</span>
            <strong>{activeRisk?.score ?? '—'}</strong>
          </div>
          <div className="summary-box">
            <span className="summary-label">Remarks</span>
            <strong>{activeRisk?.remarks || 'No assessment yet'}</strong>
          </div>
        </div>
      </section>

      <div className="risk-grid">
        <section className="card risk-panel-card">
          <div className="card-header">
            <div>
              <h3>Review and re-run</h3>
              <p className="muted">Provide optional notes for your provider and refresh your risk profile.</p>
            </div>
          </div>

          {status && <div className={`status ${status.type}`}>{status.message}</div>}

          <form className="risk-form" onSubmit={handleSubmit}>
            <label className="wide">
              Notes for assessment
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for your provider" />
            </label>
            <button type="submit" className="primary-button">Re-run risk assessment</button>
          </form>
        </section>

        <section className="card risk-result-card">
          <div className="card-header">
            <div>
              <h3>Latest result</h3>
              <p className="muted">Your most recent risk output is shown here.</p>
            </div>
          </div>

          {activeRisk ? (
            <div className="result-card result-highlight">
              <div className="result-grid">
                <div>
                  <span>Risk level</span>
                  <strong>{activeRisk.risk_level}</strong>
                </div>
                <div>
                  <span>Score</span>
                  <strong>{activeRisk.score}</strong>
                </div>
                <div>
                  <span>Remarks</span>
                  <strong>{activeRisk.remarks}</strong>
                </div>
              </div>

              <div className="risk-factors">
                <h4>Main factors</h4>
                <ul>
                  {(activeRisk.factors || []).map((factor) => (
                    <li key={factor}>{factor}</li>
                  ))}
                </ul>
              </div>

              {activeRisk.warning && (
                <div className="warning-box">
                  <strong>Warning:</strong> {activeRisk.warning}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">Run a risk assessment to see results.</div>
          )}
        </section>
      </div>
    </div>
  )
}
