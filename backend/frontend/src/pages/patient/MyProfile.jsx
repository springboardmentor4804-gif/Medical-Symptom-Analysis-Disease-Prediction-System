import React, { useEffect, useState } from 'react'
import { updatePatientProfile } from '../../api/patient'

export default function MyProfile({ dashboardData, reloadDashboard }){
  const profile = dashboardData?.profile ?? {}
  const user = dashboardData?.user ?? {}
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    dob: '',
    age: '',
    gender: '',
    blood_group: '',
    height: '',
    weight: '',
    emergency_contact: '',
    existing_conditions: '',
    allergies: '',
  })
  const [status, setStatus] = useState(null)

  useEffect(() => {
    setForm({
      full_name: profile.full_name || user.full_name || '',
      phone: profile.phone || user.phone || '',
      dob: profile.dob || '',
      age: profile.age ?? '',
      gender: profile.gender || '',
      blood_group: profile.blood_group || '',
      height: profile.height ?? '',
      weight: profile.weight ?? '',
      emergency_contact: profile.emergency_contact || '',
      existing_conditions: profile.existing_conditions || '',
      allergies: profile.allergies || '',
    })
    setStatus(null)
  }, [dashboardData])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: 'pending', message: 'Saving profile...' })
    try {
      await updatePatientProfile(form)
      setStatus({ type: 'success', message: 'Profile updated successfully.' })
      reloadDashboard?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to update profile.' })
    }
  }

  return (
    <div className="profile-page">
      <section className="profile-hero card">
        <div>
          <span className="eyebrow">Patient Profile</span>
          <h2>Manage your health profile with clarity</h2>
          <p>Update your personal information and medical details to help your care team deliver more accurate recommendations and predictions.</p>
        </div>
        <div className="profile-stats">
          <div className="stat-box">
            <span>Blood group</span>
            <strong>{form.blood_group || 'Not set'}</strong>
          </div>
          <div className="stat-box">
            <span>Age</span>
            <strong>{form.age || 'N/A'}</strong>
          </div>
          <div className="stat-box">
            <span>Emergency contact</span>
            <strong>{form.emergency_contact || 'Not provided'}</strong>
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <section className="card profile-summary-card">
          <div className="card-header">
            <div>
              <h3>Profile overview</h3>
              <p className="muted">A quick summary of the details we have on record for you.</p>
            </div>
          </div>
          <div className="profile-details">
            <div className="detail-row">
              <span>Full name</span>
              <strong>{form.full_name || user.full_name || '—'}</strong>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <strong>{user.email || '—'}</strong>
            </div>
            <div className="detail-row">
              <span>Phone</span>
              <strong>{form.phone || '—'}</strong>
            </div>
            <div className="detail-row">
              <span>Gender</span>
              <strong>{form.gender || '—'}</strong>
            </div>
            <div className="detail-row">
              <span>Height</span>
              <strong>{form.height ? `${form.height} cm` : '—'}</strong>
            </div>
            <div className="detail-row">
              <span>Weight</span>
              <strong>{form.weight ? `${form.weight} kg` : '—'}</strong>
            </div>
          </div>
        </section>

        <section className="card profile-form-card">
          <div className="card-header">
            <div>
              <h3>Edit profile details</h3>
              <p className="muted">Keep your medical profile current for the best care and actionable analytics.</p>
            </div>
            <span className="badge">Secure</span>
          </div>

          {status && (
            <div className={`status ${status.type}`}>{status.message}</div>
          )}

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Full name
                <input name="full_name" value={form.full_name} onChange={handleChange} />
              </label>
              <label>
                Email
                <input value={user.email || ''} disabled />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={handleChange} />
              </label>
              <label>
                Date of birth
                <input type="date" name="dob" value={form.dob} onChange={handleChange} />
              </label>
              <label>
                Age
                <input type="number" name="age" value={form.age} onChange={handleChange} />
              </label>
              <label>
                Gender
                <input name="gender" value={form.gender} onChange={handleChange} />
              </label>
              <label>
                Blood group
                <input name="blood_group" value={form.blood_group} onChange={handleChange} />
              </label>
              <label>
                Height
                <input type="number" step="0.1" name="height" value={form.height} onChange={handleChange} />
              </label>
              <label>
                Weight
                <input type="number" step="0.1" name="weight" value={form.weight} onChange={handleChange} />
              </label>
              <label>
                Emergency contact
                <input name="emergency_contact" value={form.emergency_contact} onChange={handleChange} />
              </label>
              <label className="wide">
                Existing conditions
                <textarea name="existing_conditions" value={form.existing_conditions} onChange={handleChange} />
              </label>
              <label className="wide">
                Allergies
                <textarea name="allergies" value={form.allergies} onChange={handleChange} />
              </label>
            </div>
            <button type="submit" className="primary-button">Save Profile</button>
          </form>
        </section>
      </div>
    </div>
  )
}
