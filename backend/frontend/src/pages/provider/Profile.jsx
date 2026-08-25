import React from 'react'

export default function ProviderProfile({ dashboardData }) {
  const profile = dashboardData?.provider_profile ?? {}
  const user = dashboardData?.user ?? {}

  return (
    <div className="provider-history-page">
      <section className="history-overview-card card">
        <div className="overview-headline">
          <div>
            <span className="eyebrow">Provider Profile</span>
            <h2>Healthcare provider details in a clean, clinical layout.</h2>
            <p>See your contact information, hospital affiliation, and professional credentials at a glance.</p>
          </div>
          <div className="overview-meta">
            <span className="badge">Provider details</span>
          </div>
        </div>

        <div className="history-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Name</span>
            <strong>{user.full_name || 'Not available'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Specialization</span>
            <strong>{profile.specialization || 'Not available'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Department</span>
            <strong>{profile.department || 'Not available'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Experience</span>
            <strong>{profile.years_experience ? `${profile.years_experience} years` : 'Not available'}</strong>
          </div>
        </div>
      </section>

      <section className="history-table-card card">
        <div className="card-header history-table-header">
          <div>
            <h3>Contact and credential details</h3>
            <p className="muted">Verified profile data from the current dashboard payload.</p>
          </div>
        </div>

        <div className="profile-grid" style={{ padding: '22px', gap: '20px' }}>
          <div className="summary-card">
            <span className="summary-label">Email</span>
            <strong>{user.email || '—'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Phone</span>
            <strong>{user.phone || '—'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Hospital</span>
            <strong>{profile.hospital_name || '—'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">License</span>
            <strong>{profile.license_number || '—'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Qualification</span>
            <strong>{profile.qualification || '—'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Provider role</span>
            <strong>{user.role || '—'}</strong>
          </div>
        </div>
      </section>
    </div>
  )
}
