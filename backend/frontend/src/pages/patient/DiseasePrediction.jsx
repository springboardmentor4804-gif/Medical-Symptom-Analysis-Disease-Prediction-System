import React, { useState } from 'react'
import { runDiseasePrediction, searchSymptoms } from '../../api/patient'

export default function DiseasePrediction({ dashboardData, reloadDashboard }){
  const predictions = dashboardData?.predictions ?? []
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState(null)

  const handleSearchChange = async (event) => {
    const value = event.target.value
    setQuery(value)
    if (!value) {
      setSuggestions([])
      return
    }
    try {
      const res = await searchSymptoms(value)
      setSuggestions(res.results || [])
    } catch {
      setSuggestions([])
    }
  }

  const addSymptomTag = (symptom) => {
    if (!selectedSymptoms.some((item) => item.symptom_name === symptom.symptom_name)) {
      setSelectedSymptoms((prev) => [...prev, symptom])
    }
    setQuery('')
    setSuggestions([])
  }

  const removeSymptomTag = (name) => {
    setSelectedSymptoms((prev) => prev.filter((item) => item.symptom_name !== name))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedSymptoms.length) {
      setStatus({ type: 'error', message: 'Select at least one symptom for prediction.' })
      return
    }
    setStatus({ type: 'pending', message: 'Running prediction...' })
    try {
      const payload = {
        symptom_ids: selectedSymptoms.filter((item) => item.id).map((item) => item.id),
        symptom_names: selectedSymptoms.filter((item) => !item.id).map((item) => item.symptom_name),
      }
      const response = await runDiseasePrediction(payload)
      setResult(response)
      setStatus({ type: 'success', message: 'Prediction created.' })
      reloadDashboard?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to run prediction.' })
    }
  }

  const predictionCount = predictions.length
  const highestConfidence = predictions.reduce((max, item) => Math.max(max, item.confidence || 0), 0)
  const latestPrediction = predictions[0]
  const latestDisease = latestPrediction?.predicted_disease || 'No predictions yet'

  return (
    <div className="prediction-page">
      <section className="prediction-hero card">
        <div>
          <span className="eyebrow">Disease Prediction</span>
          <h2>Predict outcomes with symptom-driven intelligence</h2>
          <p>Enter the symptoms you are experiencing and get a quick, evidence-based prediction with confidence scoring.</p>
        </div>
        <div className="prediction-summary-grid">
          <div className="summary-box">
            <span className="summary-label">Total predictions</span>
            <strong>{predictionCount}</strong>
          </div>
          <div className="summary-box">
            <span className="summary-label">Best confidence</span>
            <strong>{highestConfidence ? `${(highestConfidence * 100).toFixed(0)}%` : 'N/A'}</strong>
          </div>
          <div className="summary-box">
            <span className="summary-label">Latest prediction</span>
            <strong>{latestDisease}</strong>
          </div>
        </div>
      </section>

      <div className="prediction-grid">
        <section className="card prediction-form-card">
          <div className="card-header">
            <div>
              <h3>Run a new prediction</h3>
              <p className="muted">Search symptoms, add them to your selection, and submit to see the latest suggestion.</p>
            </div>
            <span className="badge">AI-assisted</span>
          </div>

          {status && <div className={`status ${status.type}`}>{status.message}</div>}

          <form className="prediction-form" onSubmit={handleSubmit}>
            <label className="wide">
              Search symptoms
              <input value={query} onChange={handleSearchChange} placeholder="Search symptoms to predict" />
            </label>
            {suggestions.length > 0 && (
              <div className="suggestions-list suggestions-grid">
                {suggestions.map((item) => (
                  <button type="button" key={item.id} onClick={() => addSymptomTag(item)}>{item.symptom_name}</button>
                ))}
              </div>
            )}
            <label className="wide">
              Or add a new symptom
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a symptom name" />
            </label>

            <div className="tag-row">
              {selectedSymptoms.map((item) => (
                <span key={`${item.id ?? item.symptom_name}-${item.symptom_name}`} className="tag">
                  {item.symptom_name}
                  <button type="button" onClick={() => removeSymptomTag(item.symptom_name)}>×</button>
                </span>
              ))}
            </div>

            <button type="submit" className="primary-button">Run Prediction</button>
          </form>

          {result && (
            <div className="result-card result-highlight">
              <div className="result-title">Latest prediction</div>
              <div className="result-grid">
                <div>
                  <span>Prediction</span>
                  <strong>{result.predicted_disease}</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>{(result.confidence * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{result.prediction_date}</strong>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="card prediction-history-card">
          <div className="card-header">
            <div>
              <h3>Prediction History</h3>
              <p className="muted">Review your recent predictions and confidence levels.</p>
            </div>
          </div>

          {predictions.length ? (
            <div className="history-list">
              {predictions.map((prediction, idx) => (
                <article className="history-card" key={idx}>
                  <div>
                    <p className="history-title">{prediction.predicted_disease}</p>
                    <p className="history-meta">{prediction.prediction_date} • {(prediction.confidence * 100).toFixed(0)}% confidence</p>
                  </div>
                  <span className="badge">Result</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">No disease predictions available yet.</div>
          )}
        </section>
      </div>
    </div>
  )
}
