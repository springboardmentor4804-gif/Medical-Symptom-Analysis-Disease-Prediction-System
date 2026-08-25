import React, { useMemo, useState } from 'react'
import ActionsMenu from '../../components/ActionsMenu'

export default function ProviderRiskAssessment({ dashboardData }) {
  const risks = dashboardData?.risks ?? []
  const patients = dashboardData?.patients ?? []
  const [searchText, setSearchText] = useState('')
  const [riskFilter, setRiskFilter] = useState('')

  const patientMap = useMemo(
    () => Object.fromEntries(patients.map((patient) => [patient.id, patient.name])),
    [patients]
  )

  const riskCategories = useMemo(
    () => Array.from(new Set(risks.map((item) => item.risk_level || 'Unknown'))).sort(),
    [risks]
  )

  const filteredRisks = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return risks.filter((item) => {
      const patientName = patientMap[item.patient_id] || `Patient ${item.patient_id}`
      const matchesSearch =
        !search ||
        patientName.toLowerCase().includes(search) ||
        String(item.risk_level || '').toLowerCase().includes(search) ||
        String(item.remarks || '').toLowerCase().includes(search)
      const matchesRisk = !riskFilter || (item.risk_level || 'Unknown') === riskFilter
      return matchesSearch && matchesRisk
    })
  }, [risks, patientMap, searchText, riskFilter])

  const summary = useMemo(() => ({
    total: risks.length,
    highRisk: risks.filter((item) => /high|critical|urgent/i.test(item.risk_level || '')).length,
    mediumRisk: risks.filter((item) => /medium|moderate/i.test(item.risk_level || '')).length,
    lowRisk: risks.filter((item) => /low|minimal/i.test(item.risk_level || '')).length,
  }), [risks])

  const riskClass = (riskLevel) => {
    if (/high|critical|urgent/i.test(riskLevel)) return 'danger'
    if (/medium|moderate/i.test(riskLevel)) return 'warning'
    if (/low|minimal/i.test(riskLevel)) return 'success'
    return 'neutral'
  }

  return (
    <div className="provider-history-page">
      <section className="history-overview-card card">
        <div className="overview-headline">
          <div>
            <span className="eyebrow">Risk Assessment</span>
            <h2>Assess patient risk from the provider dashboard feed.</h2>
            <p>Filter risk levels, review risk scores, and see which patients need closer follow-up.</p>
          </div>
          <div className="overview-meta">
            <span className="badge">{filteredRisks.length} visible records</span>
          </div>
        </div>

        <div className="history-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Total risk records</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">High risk</span>
            <strong>{summary.highRisk}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Medium risk</span>
            <strong>{summary.mediumRisk}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Low risk</span>
            <strong>{summary.lowRisk}</strong>
          </div>
        </div>
      </section>

      <section className="history-controls card">
        <div className="history-filters">
          <label className="filter-field">
            Search risk records
            <input
              type="search"
              placeholder="Search patient, risk level, or remarks"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>

          <label className="filter-field">
            Risk level
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="">All risk levels</option>
              {riskCategories.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </label>

          <div className="filter-field" />

          <button className="text-button" type="button" onClick={() => { setSearchText(''); setRiskFilter('') }}>
            Reset filters
          </button>
        </div>
      </section>

      <section className="history-table-card card">
        <div className="card-header history-table-header">
          <div>
            <h3>Risk assessment details</h3>
            <p className="muted">Live risk assessment data from the provider dashboard API.</p>
          </div>
          <div className="header-actions">
            <span className="badge">{filteredRisks.length} rows</span>
          </div>
        </div>

        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Risk level</th>
                <th>Score</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">No risk assessments match the current filters.</td>
                </tr>
              ) : (
                filteredRisks.map((item, index) => {
                  const patientName = patientMap[item.patient_id] || `Patient ${item.patient_id}`
                  return (
                    <tr key={`${item.patient_id}-${index}`}>
                      <td>
                        <div className="patient-cell">
                          <strong>{patientName}</strong>
                          <small>#{item.patient_id}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${riskClass(item.risk_level)}`}>
                          {item.risk_level || 'Unknown'}
                        </span>
                      </td>
                      <td>{item.score != null ? item.score : '–'}</td>
                      <td>{item.remarks || 'No remarks'}</td>
                      <td>
                        <ActionsMenu
                          actions={[
                            {
                              label: 'Copy patient ID',
                              onClick: async () => {
                                try {
                                  await navigator.clipboard.writeText(String(item.patient_id))
                                } catch (error) {
                                  // ignore
                                }
                              },
                            },
                          ]}
                          ariaLabel={`Risk actions for patient ${item.patient_id}`}
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
