import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { UserCheck, Save, Edit2, ShieldAlert, Heart, Activity, Phone } from 'lucide-react';

export default function PatientBio({ currentUser }) {
  const [profile, setProfile] = useState({
    age: 30,
    gender: 'Male',
    bloodType: 'O+',
    allergies: 'None',
    chronicConditions: 'None',
    phone: '',
    emergencyContact: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      const p = db.getProfile(currentUser.id);
      setProfile(p);
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleGenderSelect = (selectedGender) => {
    setProfile({
      ...profile,
      gender: selectedGender
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    db.updateProfile(currentUser.id, profile);
    setIsEditing(false);
    setSavedMsg('Profile details updated successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="card glass-panel fade-in">
      <div className="card-header border-bottom">
        <div>
          <h3><UserCheck className="icon-header glow-icon" /> Patient Bio & Health Profile Details</h3>
          <p className="card-subtitle">Manage your personal medical details, gender, age, emergency contacts, and medical history</p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`btn-sm ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
        >
          {isEditing ? 'Cancel' : <><Edit2 size={14} /> Edit Profile</>}
        </button>
      </div>

      {savedMsg && <div className="alert-banner alert-success">{savedMsg}</div>}

      {!isEditing ? (
        <div className="bio-grid-view">
          <div className="bio-stat-box">
            <span className="stat-label">Full Name</span>
            <span className="stat-value">{currentUser?.firstName} {currentUser?.lastName}</span>
          </div>
          <div className="bio-stat-box">
            <span className="stat-label">Age</span>
            <span className="stat-value">{profile.age} yrs</span>
          </div>
          <div className="bio-stat-box">
            <span className="stat-label">Gender</span>
            <span className="stat-value text-highlight" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              {profile.gender}
            </span>
          </div>
          <div className="bio-stat-box">
            <span className="stat-label"><Heart size={14} color="#f43f5e" /> Blood Type</span>
            <span className="stat-value badge-pill blood">{profile.bloodType}</span>
          </div>

          <div className="bio-stat-box full-width">
            <span className="stat-label"><ShieldAlert size={14} color="#eab308" /> Known Allergies</span>
            <p className="stat-text">{profile.allergies || 'No allergies recorded'}</p>
          </div>

          <div className="bio-stat-box full-width">
            <span className="stat-label"><Activity size={14} color="#06b6d4" /> Chronic Conditions & Medical History</span>
            <p className="stat-text">{profile.chronicConditions || 'No pre-existing conditions reported'}</p>
          </div>

          <div className="bio-stat-box full-width">
            <span className="stat-label"><Phone size={14} /> Contact Phone & Emergency Contact</span>
            <p className="stat-text">
              Phone: <strong>{profile.phone || 'Not specified'}</strong> | Emergency Contact: <strong>{profile.emergencyContact || 'Not specified'}</strong>
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="bio-edit-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="age"
                value={profile.age}
                onChange={handleChange}
                className="form-input"
                min="1"
                max="120"
                required
              />
            </div>

            {/* GENDER SELECTOR (EXPLICIT MALE / FEMALE OPTIONS) */}
            <div className="form-group">
              <label className="form-label">Gender Selection</label>
              <div className="gender-radio-group flex-gap margin-top-xs">
                <button
                  type="button"
                  onClick={() => handleGenderSelect('Male')}
                  className={`btn-sm flex-1 ${profile.gender === 'Male' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 12px', fontWeight: 'bold' }}
                >
                  ♂️ Male
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderSelect('Female')}
                  className={`btn-sm flex-1 ${profile.gender === 'Female' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 12px', fontWeight: 'bold' }}
                >
                  ♀️ Female
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Blood Type</label>
              <select name="bloodType" value={profile.bloodType} onChange={handleChange} className="form-input custom-select">
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Known Allergies</label>
            <input
              type="text"
              name="allergies"
              value={profile.allergies}
              onChange={handleChange}
              placeholder="e.g. Penicillin, Peanuts, Latex"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pre-existing Medical History & Chronic Conditions</label>
            <textarea
              name="chronicConditions"
              value={profile.chronicConditions}
              onChange={handleChange}
              placeholder="e.g. Type 2 Diabetes, Asthma, High Blood Pressure..."
              className="form-input text-area"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Phone Number</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact Details</label>
              <input
                type="text"
                name="emergencyContact"
                value={profile.emergencyContact}
                onChange={handleChange}
                placeholder="Name & Contact Phone"
                className="form-input"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary btn-md margin-top-xs">
            <Save size={16} /> Save Medical Profile
          </button>
        </form>
      )}
    </div>
  );
}
