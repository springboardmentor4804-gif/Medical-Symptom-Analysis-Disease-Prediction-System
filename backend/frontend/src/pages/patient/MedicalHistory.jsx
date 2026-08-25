import React, { useEffect, useState } from 'react'
import SampleTable from '../../components/SampleTable'
import { addMedicalHistory, deleteMedicalHistory } from '../../api/patient'

export default function MedicalHistory({ dashboardData, reloadDashboard }){
  const medicalHistory = dashboardData?.medical_history ?? []
  const historyCount = medicalHistory.length
  const distinctConditions = new Set(medicalHistory.map((item) => item.disease)).size
  const latestEntry = medicalHistory[0]
  const latestCondition = latestEntry?.disease || 'No recent condition'
  const latestDate = latestEntry?.diagnosed_date || 'Not available'

  const [form, setForm] = useState({
    disease: '',
    diagnosed_date: '',
    treatment: '',
    status: '',
    surgery: '',
    medications: '',
    allergies: '',
    family_history: '',
    ongoing_treatment: '',
  })
  const [status, setStatus] = useState(null)

  useEffect(() => {
    setStatus(null)
  }, [dashboardData])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: 'pending', message: 'Adding history item...' })
    try {
      await addMedicalHistory(form)
      setForm({
        disease: '',
        diagnosed_date: '',
        treatment: '',
        status: '',
        surgery: '',
        medications: '',
        allergies: '',
        family_history: '',
        ongoing_treatment: '',
      })
      setStatus({ type: 'success', message: 'Medical history added.' })
      reloadDashboard?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to add medical history.' })
    }
  }

  const handleDelete = async (id) => {
    setStatus({ type: 'pending', message: 'Removing item...' })
    try {
      await deleteMedicalHistory(id)
      setStatus({ type: 'success', message: 'History item removed.' })
      reloadDashboard?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to remove item.' })
    }
  }

  return (
    <div className="history-page">
      <section className="history-hero card">
        <div>
          <span className="eyebrow">Medical History</span>
          <h2>Keep a clear record of your condition history</h2>
          <p>Review diagnoses, treatments, and important care notes in one calm, easy-to-scan patient summary.</p>
        </div>
        <div className="history-summary-grid">
          <div className="summary-box">
            <span className="summary-label">Total records</span>
            <strong>{historyCount}</strong>
          </div>
          <div className="summary-box">
            <span className="summary-label">Unique conditions</span>
            <strong>{distinctConditions}</strong>
          </div>
          <div className="summary-box">
            <span className="summary-label">Latest diagnosis</span>
            <strong>{latestCondition}</strong>
            <small>{latestDate}</small>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Medical History</h3>
            <span className="badge">{medicalHistory.length} records</span>
          </div>
          <div className="panel-body">
            {status && <div className={`status ${status.type}`}>{status.message}</div>}
            <SampleTable
              columns={["Date","Condition","Status","Treatment","Actions"]}
              rows={medicalHistory.map((item) => ({
                Date: item.diagnosed_date,
                Condition: item.disease,
                Status: item.status,
                Treatment: item.treatment,
                Actions: item.id,
              }))}
            />
            {medicalHistory.length > 0 && (
              <div className="table-note">Use the action buttons below to remove entries.</div>
            )}
            <div className="recent-list">
              {medicalHistory.map((item) => (
                <div className="recent-item" key={item.id}>
                  <div>
                    <div className="item-title">{item.disease}</div>
                    <div className="item-meta">{item.diagnosed_date || 'Date unavailable'} • {item.status || 'Unknown status'}</div>
                  </div>
                  <button type="button" onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Add Medical History</h3>
          </div>
          <div className="panel-body">
            <form className="form-grid" onSubmit={handleSubmit}>
              <label>
                Condition
                <input name="disease" value={form.disease} onChange={handleChange} required />
              </label>
              <label>
                Diagnosed date
                <input type="date" name="diagnosed_date" value={form.diagnosed_date} onChange={handleChange} />
              </label>
              <label>
                Status
                <input name="status" value={form.status} onChange={handleChange} />
              </label>
              <label>
                Surgery
                <input name="surgery" value={form.surgery} onChange={handleChange} />
              </label>
              <label>
                Medications
                <input name="medications" value={form.medications} onChange={handleChange} />
              </label>
              <label>
                Allergies
                <input name="allergies" value={form.allergies} onChange={handleChange} />
              </label>
              <label className="wide">
                Treatment
                <textarea name="treatment" value={form.treatment} onChange={handleChange} />
              </label>
              <label className="wide">
                Family history
                <textarea name="family_history" value={form.family_history} onChange={handleChange} />
              </label>
              <label className="wide">
                Ongoing treatment
                <textarea name="ongoing_treatment" value={form.ongoing_treatment} onChange={handleChange} />
              </label>
              <button type="submit" className="primary-button">Add history</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
