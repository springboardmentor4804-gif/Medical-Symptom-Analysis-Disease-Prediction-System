import React, { useMemo, useState } from 'react'
import ActionsMenu from '../../components/ActionsMenu'
import Modal from '../../components/Modal'

const statusClass = (status = '') => {
  const normalized = String(status).toLowerCase()
  if (/critical|urgent|emergency|high/.test(normalized)) return 'danger'
  if (/stable|recovered|resolved|completed|good/.test(normalized)) return 'success'
  if (/pending|in progress|under review|monitoring|active/.test(normalized)) return 'warning'
  return 'neutral'
}

export default function PatientHistory({ dashboardData }) {
  const history = dashboardData?.patient_history ?? []
  const patients = dashboardData?.patients ?? []
  const patientMap = useMemo(
    () => Object.fromEntries(patients.map((p) => [p.id, p.name])),
    [patients]
  )

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [timelinePatientId, setTimelinePatientId] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')

  const statusOptions = useMemo(
    () => Array.from(new Set(history.map((item) => item.status).filter(Boolean))),
    [history]
  )

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const patientName = patientMap[item.patient_id] || `Patient ${item.patient_id}`
      const search = searchText.trim().toLowerCase()
      const matchesSearch =
        !search ||
        patientName.toLowerCase().includes(search) ||
        String(item.disease || '').toLowerCase().includes(search) ||
        String(item.treatment || '').toLowerCase().includes(search) ||
        String(item.status || '').toLowerCase().includes(search)
      const matchesStatus = !statusFilter || (item.status || '').toLowerCase() === statusFilter.toLowerCase()
      const matchesPatient = !selectedPatientId || String(item.patient_id) === String(selectedPatientId)
      return matchesSearch && matchesStatus && matchesPatient
    })
  }, [history, patientMap, searchText, statusFilter, selectedPatientId])

  const timelineEntries = useMemo(
    () => history.filter((entry) => entry.patient_id === timelinePatientId),
    [history, timelinePatientId]
  )

  const summary = useMemo(() => {
    const uniquePatients = new Set(history.map((item) => item.patient_id)).size
    const uniqueConditions = new Set(history.map((item) => String(item.disease || '').toLowerCase())).size
    const newest = history[0]
    return {
      totalEntries: history.length,
      uniquePatients,
      uniqueConditions,
      latestDiagnosis: newest ? `${newest.disease || 'Unknown condition'} • ${newest.diagnosed_date || 'Date unavailable'}` : 'No records available',
    }
  }, [history])

  const openTimeline = (patientId) => {
    setTimelinePatientId(patientId)
    setTimelineOpen(true)
    setStatusMessage('')
  }

  const copyPatientId = async (patientId) => {
    try {
      await navigator.clipboard.writeText(String(patientId))
      setStatusMessage(`Patient ID ${patientId} copied to clipboard.`)
    } catch (error) {
      setStatusMessage('Unable to copy ID in this browser.')
    }
    window.setTimeout(() => setStatusMessage(''), 2600)
  }

  return (
    <div className="provider-history-page">
      <section className="history-overview-card card">
        <div className="overview-headline">
          <div>
            <span className="eyebrow">Patient History</span>
            <h2>Review provider records in an EHR-style clinical dashboard.</h2>
            <p>Search through patient conditions, filter by status, and inspect care timelines without changing the backend.</p>
          </div>
          <div className="overview-meta">
            <span className="badge">{filteredHistory.length} filtered records</span>
          </div>
        </div>

        <div className="history-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Total history entries</span>
            <strong>{summary.totalEntries}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Patients covered</span>
            <strong>{summary.uniquePatients}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Conditions tracked</span>
            <strong>{summary.uniqueConditions}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Most recent diagnosis</span>
            <strong>{summary.latestDiagnosis}</strong>
          </div>
        </div>
      </section>

      <section className="history-controls card">
        <div className="history-filters">
          <label className="filter-field">
            Search records
            <input
              type="search"
              placeholder="Search patient, condition, treatment, status"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>

          <label className="filter-field">
            Filter status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            Filter patient
            <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
              <option value="">All patients</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name || `Patient ${patient.id}`}</option>
              ))}
            </select>
          </label>

          <button className="text-button" type="button" onClick={() => { setSearchText(''); setStatusFilter(''); setSelectedPatientId('') }}>
            Clear filters
          </button>
        </div>
      </section>

      <section className="history-table-card card">
        <div className="card-header history-table-header">
          <div>
            <h3>Patient history details</h3>
            <p className="muted">Rows reflect live provider dashboard data from the current backend feed.</p>
          </div>
          <div className="header-actions">
            <span className="badge">{filteredHistory.length} records</span>
          </div>
        </div>

        {statusMessage && <div className="status success">{statusMessage}</div>}

        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Condition</th>
                <th>Date</th>
                <th>Status</th>
                <th>Treatment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">No records match the current filters.</td>
                </tr>
              ) : (
                filteredHistory.map((item, index) => {
                  const patientName = patientMap[item.patient_id] || `Patient ${item.patient_id}`
                  return (
                    <tr key={`${item.patient_id}-${index}`}>
                      <td>
                        <div className="patient-cell">
                          <strong>{patientName}</strong>
                          <small>#{item.patient_id}</small>
                        </div>
                      </td>
                      <td>{item.disease || 'Unknown condition'}</td>
                      <td>{item.diagnosed_date || '—'}</td>
                      <td>
                        <span className={`status-pill ${statusClass(item.status)}`}>
                          {item.status || 'Unknown'}
                        </span>
                      </td>
                      <td>{item.treatment || 'No treatment details'}</td>
                      <td>
                        <ActionsMenu
                          actions={[
                            {
                              label: 'View patient timeline',
                              onClick: () => openTimeline(item.patient_id),
                            },
                            {
                              label: 'Copy patient ID',
                              onClick: () => copyPatientId(item.patient_id),
                            },
                          ]}
                          ariaLabel={`Actions for patient ${item.patient_id}`}
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

      <Modal
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        title={`Timeline • ${patientMap[timelinePatientId] || `Patient ${timelinePatientId}`}`}
        fullScreen
      >
        <div className="timeline-panel">
          <div className="timeline-header">
            <div>
              <h3>Patient care timeline</h3>
              <p className="muted">Review recent condition entries and treatment notes for this patient.</p>
            </div>
          </div>
          {timelineEntries.length === 0 ? (
            <div className="empty-state">No timeline records are available for this patient.</div>
          ) : (
            <div className="timeline-list">
              {timelineEntries.map((entry, index) => (
                <div className="timeline-entry" key={`${entry.patient_id}-${index}`}>
                  <div className="timeline-marker" />
                  <div>
                    <div className="timeline-title">{entry.disease || 'Condition not recorded'}</div>
                    <div className="timeline-meta">{entry.diagnosed_date || 'Date unavailable'}</div>
                    <div className="timeline-status-row">
                      <span className={`status-pill ${statusClass(entry.status)}`}>{entry.status || 'Unknown'}</span>
                    </div>
                    <p>{entry.treatment || 'Treatment notes unavailable.'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
