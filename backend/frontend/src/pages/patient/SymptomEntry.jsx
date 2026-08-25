import React, { useEffect, useState } from 'react'
import { addPatientSymptoms, deletePatientSymptom, updatePatientSymptom, searchSymptoms } from '../../api/patient'

export default function SymptomEntry({ dashboardData, reloadDashboard }){
  const symptoms = dashboardData?.symptoms ?? []
  const symptomCount = symptoms.length
  const avgSeverity = symptomCount ? Math.round(symptoms.reduce((sum, item) => sum + (Number(item.severity) || 0), 0) / symptomCount) : 0
  const latestSymptom = symptoms[0]?.symptom_name || 'No entries yet'

  const [form, setForm] = useState({
    symptom_name: '',
    symptom_id: null,
    severity: '',
    duration: '',
    frequency: '',
    notes: '',
  })
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [status, setStatus] = useState(null)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    setStatus(null)
  }, [dashboardData])

  const handleQueryChange = async (event) => {
    const value = event.target.value
    setQuery(value)
    if (!value) {
      setSuggestions([])
      return
    }
    try {
      const results = await searchSymptoms(value)
      setSuggestions(results.results || [])
    } catch (error) {
      setSuggestions([])
    }
  }

  const handleSuggestionSelect = (symptom) => {
    setForm((prev) => ({
      ...prev,
      symptom_name: symptom.symptom_name,
      symptom_id: symptom.id,
    }))
    setQuery('')
    setSuggestions([])
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: 'pending', message: editId ? 'Updating symptom...' : 'Submitting symptom...' })
    try {
      const payload = {
        symptoms: [{
          symptom_id: form.symptom_id,
          symptom_name: form.symptom_name,
          severity: form.severity ? Number(form.severity) : undefined,
          duration: form.duration,
          frequency: form.frequency,
          notes: form.notes,
        }],
      }
      if (editId) {
        await updatePatientSymptom(editId, payload)
        setStatus({ type: 'success', message: 'Symptom updated.' })
      } else {
        await addPatientSymptoms(payload)
        setStatus({ type: 'success', message: 'Symptom submitted.' })
      }
      setForm({ symptom_name: '', symptom_id: null, severity: '', duration: '', frequency: '', notes: '' })
      setEditId(null)
      reloadDashboard?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to save symptom.' })
    }
  }

  const handleDelete = async (id) => {
    setStatus({ type: 'pending', message: 'Deleting symptom...' })
    try {
      await deletePatientSymptom(id)
      setStatus({ type: 'success', message: 'Symptom removed.' })
      reloadDashboard?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to delete symptom.' })
    }
  }

  const handleEdit = (item) => {
    setEditId(item.id)
    setForm({
      symptom_name: item.symptom_name,
      symptom_id: item.symptom_id,
      severity: item.severity || '',
      duration: item.duration || '',
      frequency: item.frequency || '',
      notes: item.notes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="symptom-page">
      <div className="symptom-hero card">
        <div>
          <span className="eyebrow">Symptom Tracker</span>
          <h2>Record symptoms with confidence</h2>
          <p>Submit new symptoms, refine existing entries, and keep health notes all in one premium patient workspace.</p>
        </div>
        <div className="hero-summary">
          <div className="summary-chip">
            <span className="summary-label">Tracked symptoms</span>
            <strong>{symptomCount}</strong>
          </div>
          <div className="summary-chip">
            <span className="summary-label">Average severity</span>
            <strong>{avgSeverity || 'N/A'}</strong>
          </div>
          <div className="summary-chip">
            <span className="summary-label">Latest entry</span>
            <strong>{latestSymptom}</strong>
          </div>
        </div>
      </div>

      <div className="symptom-grid">
        <section className="symptom-card card">
          <div className="card-header">
            <div>
              <h3>{editId ? 'Update symptom details' : 'Log a new symptom'}</h3>
              <p className="muted">Complete the form below to capture severity, duration, frequency, and context.</p>
            </div>
            <span className="badge">{editId ? 'Edit mode' : 'New entry'}</span>
          </div>

          {status && <div className={`status ${status.type}`}>{status.message}</div>}

          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="wide">
              Symptom name
              <input name="symptom_name" value={form.symptom_name} onChange={handleChange} placeholder="Example: headache" required />
            </label>
            <label className="wide">
              Search existing symptom
              <input value={query} onChange={handleQueryChange} placeholder="Search symptoms..." />
              {suggestions.length > 0 && (
                <div className="suggestions-list">
                  {suggestions.map((item) => (
                    <button type="button" key={item.id} onClick={() => handleSuggestionSelect(item)}>
                      {item.symptom_name}
                    </button>
                  ))}
                </div>
              )}
            </label>
            <label>
              Severity (1-10)
              <input type="number" min="1" max="10" name="severity" value={form.severity} onChange={handleChange} />
            </label>
            <label>
              Duration
              <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 2 days" />
            </label>
            <label>
              Frequency
              <input name="frequency" value={form.frequency} onChange={handleChange} placeholder="e.g. intermittent" />
            </label>
            <label className="wide">
              Notes
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Add helpful details or observations." />
            </label>
            <div className="form-actions wide">
              <button type="submit" className="primary-button">{editId ? 'Update Symptom' : 'Submit Symptom'}</button>
              {editId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditId(null)
                    setForm({ symptom_name: '', symptom_id: null, severity: '', duration: '', frequency: '', notes: '' })
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="symptom-card card">
          <div className="card-header">
            <div>
              <h3>Recent Symptoms</h3>
              <p className="muted">Review and manage the symptoms you have logged from your dashboard.</p>
            </div>
            <span className="badge">{symptomCount} entries</span>
          </div>

          {symptoms.length ? (
            <div className="symptom-list">
              {symptoms.map((item) => (
                <article className="symptom-row" key={item.id}>
                  <div>
                    <p className="row-title">{item.symptom_name}</p>
                    <p className="row-meta">{item.entered_date} · Severity {item.severity ?? '—'} · {item.duration || 'Duration unknown'}</p>
                  </div>
                  <div className="row-actions">
                    <button type="button" className="text-button" onClick={() => handleEdit(item)}>Edit</button>
                    <button type="button" className="text-button danger" onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">No symptoms submitted yet.</div>
          )}
        </section>
      </div>
    </div>
  )
}
