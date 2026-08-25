import React, { useMemo, useState } from 'react'

export default function ProviderReports({ dashboardData }) {
  const reports = dashboardData?.reports ?? []
  const [searchText, setSearchText] = useState('')
  const [withUrlOnly, setWithUrlOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const filteredReports = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return reports.filter((item) => {
      const matchesSearch =
        !search ||
        String(item.report_name || '').toLowerCase().includes(search) ||
        String(item.patient_id || '').toLowerCase().includes(search)
      const matchesUrl = !withUrlOnly || Boolean(item.report_url)
      const status = String(item.provider_status || item.status || 'pending').toLowerCase()
      const matchesStatus = !statusFilter || (statusFilter === 'completed' ? ['approved', 'rejected'].includes(status) : status === statusFilter)
      return matchesSearch && matchesUrl && matchesStatus
    })
  }, [reports, searchText, withUrlOnly, statusFilter])

  const summary = useMemo(() => ({
    total: reports.length,
    downloadable: reports.filter((item) => item.report_url).length,
    missing: reports.filter((item) => !item.report_url).length,
    recent: reports[0]?.generated_at || 'N/A',
    approved: reports.filter((item) => String(item.provider_status || item.status || '').toLowerCase() === 'approved').length,
    pending: reports.filter((item) => String(item.provider_status || item.status || 'pending').toLowerCase() === 'pending').length,
  }), [reports])

  return (
    <div className="provider-history-page">
      <section className="history-overview-card card">
        <div className="overview-headline">
          <div>
            <span className="eyebrow">Reports</span>
            <h2>Medical reports and documentation in a clean provider view.</h2>
            <p>Sort through generated reports, find download-ready records, and keep patient documentation visible.</p>
          </div>
          <div className="overview-meta">
            <span className="badge">{filteredReports.length} visible reports</span>
          </div>
        </div>

        <div className="history-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Total reports</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Download-ready</span>
            <strong>{summary.downloadable}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Missing downloads</span>
            <strong>{summary.missing}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Most recent</span>
            <strong>{summary.recent}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Approved</span>
            <strong>{summary.approved}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Pending review</span>
            <strong>{summary.pending}</strong>
          </div>
        </div>
      </section>

      <section className="history-controls card">
        <div className="history-filters">
          <label className="filter-field">
            Search reports
            <input
              type="search"
              placeholder="Search report name or patient ID"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>

          <label className="filter-field">
            Downloadable only
            <select value={withUrlOnly ? 'yes' : ''} onChange={(e) => setWithUrlOnly(e.target.value === 'yes')}>
              <option value="">Any</option>
              <option value="yes">Download available</option>
            </select>
          </label>

          <label className="filter-field">
            Report status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All reports</option>
              <option value="pending">Pending review</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <div className="filter-field" />

          <button className="text-button" type="button" onClick={() => { setSearchText(''); setWithUrlOnly(false); setStatusFilter('') }}>
            Reset filters
          </button>
        </div>
      </section>

      <section className="history-table-card card">
        <div className="card-header history-table-header">
          <div>
            <h3>Report library</h3>
            <p className="muted">All provider reports from the current dashboard payload.</p>
          </div>
          <div className="header-actions">
            <span className="badge">{filteredReports.length} records</span>
          </div>
        </div>

        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Report</th>
                <th>Prediction</th>
                <th>Generated</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">No reports match the current filters.</td>
                </tr>
              ) : (
                filteredReports.map((item, index) => (
                  <tr key={item.id || `${item.patient_id}-${item.report_name}-${index}`}>
                    <td>{item.patient_id}</td>
                    <td>
                      <div className="patient-cell">
                        <strong>{item.report_name || 'Unnamed report'}</strong>
                        <small>Report #{item.id} · {item.predicted_disease || 'No diagnosis recorded'}</small>
                      </div>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{item.predicted_disease || 'Pending prediction'}</strong>
                        <small>{item.confidence_score != null ? `${(item.confidence_score * 100).toFixed(1)}% confidence` : 'Confidence unavailable'}</small>
                      </div>
                    </td>
                    <td>{item.generated_at || 'Unknown'}</td>
                    <td>
                      <span className={`status-pill ${String(item.provider_status || item.status || '').toLowerCase() === 'approved' ? 'success' : 'warning'}`}>
                        {String(item.provider_status || item.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {item.report_url ? <a className="text-button" href={item.report_url} target="_blank" rel="noreferrer" download={`medassist-report-${item.prediction_id || item.id}.pdf`}>Download</a> : <span className="muted">Not ready</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
