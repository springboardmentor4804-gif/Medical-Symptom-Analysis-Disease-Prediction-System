import React, { useState } from 'react'

export default function Reports({ dashboardData }){
  const reports = dashboardData?.reports ?? []
  const [selectedReportId, setSelectedReportId] = useState(null)

  const selectedReport = reports.find((item) => item.id === selectedReportId)
  const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Pending'

  return (
    <div className="reports-page">
      <section className="reports-hero card">
        <div>
          <span className="eyebrow">Reports</span>
          <h2>Track every prediction report in one secure place</h2>
          <p>Each prediction has its own report record. Pending reports remain visible until a provider reviews them.</p>
        </div>
        <div className="reports-summary">
          <div className="summary-box">
            <span className="summary-label">Total reports</span>
            <strong>{reports.length}</strong>
          </div>
        </div>
      </section>

      <section className="card reports-card">
        <div className="card-header">
          <div>
            <h3>Your reports</h3>
            <p className="muted">Open any report to view its complete prediction and provider review details.</p>
          </div>
        </div>

        <div className="card-body">
          {reports.length ? (
            <div className="history-list">
              {reports.map((item) => (
                <article className="history-card" key={item.id} onClick={() => setSelectedReportId(item.id)} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && setSelectedReportId(item.id)}>
                  <div>
                    <p className="history-title">Report #{item.id}</p>
                    <p className="history-meta">{formatDate(item.generated_at)} · {item.predicted_disease || 'Prediction pending'}</p>
                  </div>
                  <span className={`status-pill ${item.provider_status === 'approved' ? 'success' : item.provider_status === 'rejected' ? 'danger' : 'warning'}`}>{item.provider_status || 'Pending'}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">No prediction reports are available yet.</div>
          )}
        </div>
      </section>

      {selectedReport && (
        <section className="card reports-card report-detail-card">
          <div className="card-header">
            <div>
              <span className="eyebrow">Prediction report</span>
              <h3>{selectedReport.report_name || `Report #${selectedReport.id}`}</h3>
              <p className="muted">Prediction #{selectedReport.prediction_id || 'N/A'} · {formatDate(selectedReport.generated_at)}</p>
            </div>
            <div className="report-detail-actions">
              {selectedReport.report_url && <a className="primary-button" href={selectedReport.report_url} target="_blank" rel="noreferrer" download={`medassist-report-${selectedReport.prediction_id || selectedReport.id}.pdf`}>Download Report</a>}
              <button className="text-button" type="button" onClick={() => setSelectedReportId(null)}>Close</button>
            </div>
          </div>
          <div className="report-detail-grid">
            <div className="report-section"><h4>Prediction</h4><div className="report-detail-row"><strong>Predicted disease</strong><span>{selectedReport.predicted_disease || 'Not available'}</span></div><div className="report-detail-row"><strong>Confidence score</strong><span>{selectedReport.confidence_score != null ? `${(selectedReport.confidence_score * 100).toFixed(1)}%` : 'Not available'}</span></div></div>
            <div className="report-section"><h4>Symptoms</h4><p>{(selectedReport.symptoms || []).join(', ') || 'Not available'}</p></div>
            <div className="report-section"><h4>Risk assessment</h4><p>{selectedReport.risk_assessment || 'Not available'}</p></div>
            <div className="report-section"><h4>Provider review</h4><div className="report-detail-row"><strong>Approval status</strong><span>{selectedReport.provider_status || 'Pending'}</span></div><p>{selectedReport.provider_comments || 'No comments provided.'}</p></div>
            <div className="report-section report-section-wide"><h4>Recommendations</h4><p>{selectedReport.recommendations || 'Not available'}</p></div>
            {selectedReport.healthcare_advisory && <div className="report-section report-section-wide"><h4>Healthcare Advisory</h4><div className="advisory-report-grid"><div><strong>Preventive care</strong><ul>{selectedReport.healthcare_advisory.preventive_care?.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>Lifestyle advice</strong><ul>{selectedReport.healthcare_advisory.lifestyle_advice?.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>Follow-up guidance</strong><p>{selectedReport.healthcare_advisory.follow_up_guidance}</p></div><div><strong>When to seek care</strong><p>{selectedReport.healthcare_advisory.when_to_seek_care}</p></div></div><p className="advisory-disclaimer">{selectedReport.healthcare_advisory.disclaimer}</p></div>}
          </div>
        </section>
      )}
    </div>
  )
}
