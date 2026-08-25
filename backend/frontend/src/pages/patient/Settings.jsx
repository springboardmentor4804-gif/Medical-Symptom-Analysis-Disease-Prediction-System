import React, { useEffect, useState } from 'react'
import { updatePatientSettings } from '../../api/patient'

export default function Settings({ dashboardData, reloadDashboard }){
  const user = dashboardData?.user ?? {}
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
    notification_preferences: user.notification_preferences || '',
    profile_preferences: user.profile_preferences || '',
  })
  const [status, setStatus] = useState(null)

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      notification_preferences: user.notification_preferences || '',
      profile_preferences: user.profile_preferences || '',
    }))
    setStatus(null)
  }, [dashboardData])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.new_password && form.new_password !== form.confirm_password) {
      setStatus({ type: 'error', message: 'New password and confirmation do not match.' })
      return
    }

    setStatus({ type: 'pending', message: 'Saving settings...' })
    try {
      await updatePatientSettings({
        old_password: form.old_password || undefined,
        new_password: form.new_password || undefined,
        notification_preferences: form.notification_preferences,
        profile_preferences: form.profile_preferences,
      })
      setStatus({ type: 'success', message: 'Settings updated successfully.' })
      setForm((prev) => ({ ...prev, old_password: '', new_password: '', confirm_password: '' }))
      reloadDashboard?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to update settings.' })
    }
  }

  return (
    <div className="settings-page">
      <section className="settings-hero card">
        <div>
          <span className="eyebrow">Settings</span>
          <h2>Control your account and notification preferences</h2>
          <p>Update your security settings, notification preferences, and profile behavior in one secure dashboard.</p>
        </div>
        <div className="reports-summary">
          <div className="summary-box">
            <span className="summary-label">Email</span>
            <strong>{user.email || 'Not set'}</strong>
          </div>
        </div>
      </section>

      <section className="card settings-card">
        <div className="card-header">
          <div>
            <h3>Account settings</h3>
            <p className="muted">Manage passwords and notification settings securely.</p>
          </div>
        </div>

        <div className="card-body">
          {status && <div className={`status ${status.type}`}>{status.message}</div>}
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="wide">
              Current password
              <input type="password" name="old_password" value={form.old_password} onChange={handleChange} />
            </label>
            <label className="wide">
              New password
              <input type="password" name="new_password" value={form.new_password} onChange={handleChange} />
            </label>
            <label className="wide">
              Confirm new password
              <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} />
            </label>
            <label className="wide">
              Notification preferences
              <textarea name="notification_preferences" value={form.notification_preferences} onChange={handleChange} />
            </label>
            <label className="wide">
              Profile preferences
              <textarea name="profile_preferences" value={form.profile_preferences} onChange={handleChange} />
            </label>
            <button type="submit" className="primary-button">Save settings</button>
          </form>
        </div>
      </section>
    </div>
  )
}
