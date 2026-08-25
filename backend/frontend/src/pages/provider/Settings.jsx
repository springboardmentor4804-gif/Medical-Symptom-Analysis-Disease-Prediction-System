import React, { useState } from 'react'

export default function ProviderSettings({ dashboardData }) {
  const [notificationMode, setNotificationMode] = useState('email')
  const [dashboardRefresh, setDashboardRefresh] = useState('5min')
  const [dataScope, setDataScope] = useState('all')

  return (
    <div className="provider-history-page">
      <section className="history-overview-card card">
        <div className="overview-headline">
          <div>
            <span className="eyebrow">Provider Settings</span>
            <h2>Control reporting and dashboard behavior for your provider workspace.</h2>
            <p>Choose notification preferences and provider data refresh options without changing backend routes.</p>
          </div>
          <div className="overview-meta">
            <span className="badge">Personalize your workspace</span>
          </div>
        </div>

        <div className="history-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Notification mode</span>
            <strong>{notificationMode === 'email' ? 'Email alerts' : 'In-app alerts'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Refresh cadence</span>
            <strong>{dashboardRefresh === '5min' ? '5 minutes' : dashboardRefresh === '15min' ? '15 minutes' : '30 minutes'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Data scope</span>
            <strong>{dataScope === 'all' ? 'All patients' : 'Assigned patients'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Provider email</span>
            <strong>{dashboardData?.user?.email || 'Not set'}</strong>
          </div>
        </div>
      </section>

      <section className="history-controls card">
        <div className="history-filters">
          <label className="filter-field">
            Notification channel
            <select value={notificationMode} onChange={(e) => setNotificationMode(e.target.value)}>
              <option value="email">Email alerts</option>
              <option value="inapp">In-app notifications</option>
            </select>
          </label>

          <label className="filter-field">
            Refresh interval
            <select value={dashboardRefresh} onChange={(e) => setDashboardRefresh(e.target.value)}>
              <option value="5min">Every 5 minutes</option>
              <option value="15min">Every 15 minutes</option>
              <option value="30min">Every 30 minutes</option>
            </select>
          </label>

          <label className="filter-field">
            Data scope
            <select value={dataScope} onChange={(e) => setDataScope(e.target.value)}>
              <option value="all">All patients</option>
              <option value="assigned">Assigned patients</option>
            </select>
          </label>

          <button className="text-button" type="button" onClick={() => { setNotificationMode('email'); setDashboardRefresh('5min'); setDataScope('all') }}>
            Reset defaults
          </button>
        </div>
      </section>

      <section className="history-table-card card">
        <div className="card-header history-table-header">
          <div>
            <h3>Workspace controls</h3>
            <p className="muted">These settings are UI-only placeholders for provider preferences.</p>
          </div>
        </div>

        <div className="table-scroll">
          <div className="profile-grid" style={{ padding: '22px' }}>
            <div className="summary-card">
              <span className="summary-label">Notification mode</span>
              <strong>{notificationMode === 'email' ? 'Email' : 'In-app'}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Refresh cadence</span>
              <strong>{dashboardRefresh === '5min' ? '5 minutes' : dashboardRefresh === '15min' ? '15 minutes' : '30 minutes'}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Data scope</span>
              <strong>{dataScope === 'all' ? 'All patients' : 'Assigned patients'}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Help center</span>
              <strong>Provider support</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
