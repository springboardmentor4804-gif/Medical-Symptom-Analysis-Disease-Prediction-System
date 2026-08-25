import React, { useMemo, useState } from 'react'
import ActionsMenu from '../../components/ActionsMenu'

export default function SymptomAnalysis({ dashboardData }) {
  const history = dashboardData?.patient_history ?? []
  const patients = dashboardData?.patients ?? []
  const [searchText, setSearchText] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')

  const patientMap = useMemo(
    () => Object.fromEntries(patients.map((patient) => [patient.id, patient.name])),
    [patients]
  )

  const conditions = useMemo(
    () => Array.from(new Set(history.map((item) => item.disease || 'Unknown'))).sort(),
    [history]
  )

  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return history.filter((entry) => {
      const patientName = patientMap[entry.patient_id] || `Patient ${entry.patient_id}`
      const matchesSearch =
        !search ||
        patientName.toLowerCase().includes(search) ||
        String(entry.disease || '').toLowerCase().includes(search) ||
        String(entry.status || '').toLowerCase().includes(search)
      const matchesCondition = !selectedCondition || (entry.disease || 'Unknown') === selectedCondition
      return matchesSearch && matchesCondition
    })
  }, [history, patientMap, searchText, selectedCondition])

  const symptomSummary = useMemo(() => {
    const total = history.length
    const uniquePatients = new Set(history.map((item) => item.patient_id)).size
    const highUrgency = history.filter((item) => /critical|urgent|emergency|high/i.test(item.status || '')).length
    return {
      total,
      uniquePatients,
      uniqueConditions: conditions.length,
      highUrgency,
    }
  }, [history, conditions.length])

  const copyPatientId = async (patientId) => {
    try {
      await navigator.clipboard.writeText(String(patientId))
    } catch (error) {
      // ignore clipboard failures silently
    }
  }

  return (
    <div className="provider-history-page">
      <section className="history-overview-card card">
        <div className="overview-headline">
          <div>
            <span className="eyebrow">Symptom Analysis</span>
            <h2>Spot trends across patient symptoms and condition history.</h2>
            <p>Filter by condition, inspect urgent cases, and review provider symptom records from the current dashboard feed.</p>
          </div>
          <div className="overview-meta">
            <span className="badge">{filtered.length} matching records</span>
          </div>
        </div>

        <div className="history-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Total symptom entries</span>
            <strong>{symptomSummary.total}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Unique patients</span>
            <strong>{symptomSummary.uniquePatients}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Tracked conditions</span>
            <strong>{symptomSummary.uniqueConditions}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Urgent alerts</span>
            <strong>{symptomSummary.highUrgency}</strong>
          </div>
        </div>
      </section>

      <section className="history-controls card">
        <div className="history-filters">
          <label className="filter-field">
            Search symptoms
            <input
              type="search"
              placeholder="Search patient, condition, or status"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>

          <label className="filter-field">
            Condition filter
            <select value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)}>
              <option value="">All conditions</option>
              {conditions.map((condition) => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </label>

          <div className="filter-field" />

          <button className="text-button" type="button" onClick={() => { setSearchText(''); setSelectedCondition('') }}>
            Reset filters
          </button>
        </div>
      </section>

      <section className="history-table-card card">
        <div className="card-header history-table-header">
          <div>
            <h3>Symptom record breakdown</h3>
            <p className="muted">Live provider symptom data from the backend dashboard endpoint.</p>
          </div>
          <div className="header-actions">
            <span className="badge">{filtered.length} rows</span>
          </div>
        </div>

        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Date</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">No symptom records found.</td>
                </tr>
              ) : (
                filtered.map((item, index) => {
                  const patientName = patientMap[item.patient_id] || `Patient ${item.patient_id}`
                  return (
                    <tr key={`${item.patient_id}-${index}`}>
                      <td>
                        <div className="patient-cell">
                          <strong>{patientName}</strong>
                          <small>#{item.patient_id}</small>
                        </div>
                      </td>
                      <td>{item.disease || 'Unknown'}</td>
                      <td>
                        <span className={`status-pill ${/critical|urgent|emergency|high/i.test(item.status || '') ? 'danger' : /stable|resolved|recovered|good/i.test(item.status || '') ? 'success' : 'warning'}`}>
                          {item.status || 'Unknown'}
                        </span>
                      </td>
                      <td>{item.diagnosed_date || '—'}</td>
                      <td>{item.treatment ? item.treatment : 'No notes available'}</td>
                      <td>
                        <ActionsMenu
                          actions={[
                            {
                              label: 'Copy patient ID',
                              onClick: () => copyPatientId(item.patient_id),
                            },
                          ]}
                          ariaLabel={`Symptom actions for patient ${item.patient_id}`}
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
    </div>
  )
}
