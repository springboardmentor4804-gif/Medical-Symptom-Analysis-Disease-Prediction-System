import React, { useState } from 'react';
import { db } from '../../services/db';
import { Stethoscope, Award, Calendar, FileText, CheckCircle2, AlertCircle, Edit2, Save, User } from 'lucide-react';

export default function DoctorProfile({ currentUser, stats, onProfileUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    experienceYears: currentUser.experienceYears || 10,
    qualifications: currentUser.qualifications || 'MBBS, MD',
    email: currentUser.email || ''
  });
  const [msg, setMsg] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      const updated = db.updateDoctorProfile(currentUser.id, {
        experienceYears: parseInt(formData.experienceYears) || 0,
        qualifications: formData.qualifications,
        email: formData.email
      });
      setIsEditing(false);
      setMsg('Doctor Profile details updated successfully!');
      setTimeout(() => setMsg(''), 3000);
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    }
  };

  return (
    <div className="card glass-panel doctor-profile-hero fade-in">
      <div className="card-header border-bottom">
        <div className="doctor-hero-content">
          <div className="doctor-avatar">
            <Stethoscope size={36} color="#06b6d4" />
          </div>
          <div className="doctor-meta">
            <div className="doctor-title-row">
              <h2>Dr. {currentUser.firstName} {currentUser.lastName}</h2>
              <span className="specialty-badge-large">
                {currentUser.specialty || 'General Physician'}
              </span>
            </div>
            <p className="doctor-sub">
              Licensed Telehealth Specialist | MediAI Clinical Network
            </p>
            <div className="doctor-email">
              <span>Email: {currentUser.email}</span> • <span>License ID: MD-{currentUser.id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`btn-sm ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
        >
          {isEditing ? 'Cancel' : <><Edit2 size={14} /> Edit Credentials</>}
        </button>
      </div>

      {msg && <div className="alert-banner alert-success">{msg}</div>}

      {/* Qualifications & Experience Display / Editor */}
      {!isEditing ? (
        <div className="doctor-credentials-banner margin-y">
          <div className="cred-box">
            <Calendar size={18} color="#06b6d4" />
            <div>
              <span className="cred-label">Years of Experience</span>
              <strong className="cred-value">{currentUser.experienceYears || 10} Years Clinical Practice</strong>
            </div>
          </div>

          <div className="cred-box">
            <Award size={18} color="#10b981" />
            <div>
              <span className="cred-label">Medical Qualifications & Degrees</span>
              <strong className="cred-value">{currentUser.qualifications || 'MBBS, MD (Specialist)'}</strong>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="doctor-edit-form margin-y glass-panel padding">
          <h4 className="margin-bottom-sm">Update Professional Credentials</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Years of Medical Experience</label>
              <input
                type="number"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleChange}
                className="form-input"
                min="0"
                max="60"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Medical Qualifications & Degrees</label>
              <input
                type="text"
                name="qualifications"
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="e.g. MBBS, MD (Cardiology), FACC"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-md margin-top-sm">
            <Save size={16} /> Save Credentials
          </button>
        </form>
      )}

      {/* Doctor Case Statistics */}
      <div className="doctor-stats-grid">
        <div className="doc-stat-card">
          <FileText size={20} color="#06b6d4" />
          <div className="stat-num">{stats.totalSpecialtyCases}</div>
          <div className="stat-lbl">Specialty Cases</div>
        </div>

        <div className="doc-stat-card warning">
          <AlertCircle size={20} color="#eab308" />
          <div className="stat-num">{stats.pendingCount}</div>
          <div className="stat-lbl">Pending Review</div>
        </div>

        <div className="doc-stat-card success">
          <CheckCircle2 size={20} color="#10b981" />
          <div className="stat-num">{stats.reviewedCount}</div>
          <div className="stat-lbl">Cases Resolved</div>
        </div>

        <div className="doc-stat-card purple">
          <Award size={20} color="#a855f7" />
          <div className="stat-num">98.5%</div>
          <div className="stat-lbl">Clinical Rating</div>
        </div>
      </div>
    </div>
  );
}
