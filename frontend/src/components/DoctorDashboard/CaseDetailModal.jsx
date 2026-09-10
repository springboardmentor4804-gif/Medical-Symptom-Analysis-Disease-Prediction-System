import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { X, Stethoscope, User, AlertTriangle, Send, Pill, FileText, Calendar, CheckCircle } from 'lucide-react';

export default function CaseDetailModal({ selectedCase, currentUser, onClose, onSuggestionSubmitted }) {
  const [patientProfile, setPatientProfile] = useState(null);
  const [existingSuggestions, setExistingSuggestions] = useState([]);
  const [form, setForm] = useState({
    notes: '',
    prescription: '',
    followUp: 'Follow up in 3 to 5 days if symptoms persist or worsen.'
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (selectedCase) {
      // Load patient bio
      const p = db.getProfile(selectedCase.patientId);
      setPatientProfile(p);

      // Load existing doctor suggestions
      const suggs = db.getCaseSuggestions(selectedCase.id);
      setExistingSuggestions(suggs);

      if (suggs.length > 0) {
        setForm({
          notes: suggs[0].notes,
          prescription: suggs[0].prescription,
          followUp: suggs[0].followUp || ''
        });
      }
    }
  }, [selectedCase]);

  if (!selectedCase) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.notes || !form.prescription) {
      alert('Please fill in both Clinical Notes and Prescription / Advice.');
      return;
    }

    setSubmitting(true);
    try {
      const newSugg = db.addDoctorSuggestion({
        caseId: selectedCase.id,
        doctorId: currentUser.id,
        doctorName: `Dr. ${currentUser.firstName} ${currentUser.lastName}`,
        doctorSpecialty: currentUser.specialty || 'General Physician',
        notes: form.notes,
        prescription: form.prescription,
        followUp: form.followUp
      });

      setMsg('Doctor clinical suggestion and prescription saved successfully!');
      setTimeout(() => {
        onSuggestionSubmitted(newSugg);
        onClose();
      }, 1200);
    } catch (err) {
      alert('Error submitting suggestion: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel modal-lg fade-in">
        <div className="modal-header border-bottom">
          <div>
            <h3><Stethoscope className="icon-header" /> Case Review - #{selectedCase.id}</h3>
            <p className="modal-subtitle">Patient: <strong>{selectedCase.patientName}</strong> ({selectedCase.patientAge} yrs, {selectedCase.patientGender})</p>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        {msg && (
          <div className="alert-banner alert-success">
            <CheckCircle size={18} />
            <span>{msg}</span>
          </div>
        )}

        <div className="modal-body">
          {/* Patient Health Profile Context */}
          <div className="patient-context-box">
            <h5 className="context-title"><User size={16} /> Patient Medical Profile</h5>
            <div className="profile-pills">
              <span><strong>Age:</strong> {selectedCase.patientAge}</span>
              <span><strong>Blood:</strong> {patientProfile?.bloodType || 'O+'}</span>
              <span><strong>Allergies:</strong> {patientProfile?.allergies || 'None'}</span>
              <span><strong>Chronic Conditions:</strong> {patientProfile?.chronicConditions || 'None'}</span>
            </div>
          </div>

          {/* AI Case Summary & Symptoms */}
          <div className="case-details-summary">
            <div className="detail-meta-row">
              <span className={`risk-pill ${selectedCase.riskLevel.toLowerCase()}`}>
                AI Risk Score: {selectedCase.riskScore}% ({selectedCase.riskLevel})
              </span>
              <span className="specialty-badge">Target Specialty: {selectedCase.specialty}</span>
              <span className="time-badge"><Calendar size={12} /> {new Date(selectedCase.createdAt).toLocaleString()}</span>
            </div>

            <div className="detail-section">
              <h6>AI Predicted Condition</h6>
              <p className="detail-pred-cond">{selectedCase.predictedCondition}</p>
            </div>

            <div className="detail-section">
              <h6>Reported Symptoms & Parameters</h6>
              <div className="symptom-tag-list">
                {selectedCase.symptoms.map((sym, idx) => (
                  <span key={idx} className="symptom-tag">{sym}</span>
                ))}
              </div>
              <p className="symptom-meta-text">
                Severity: <strong>{selectedCase.severity}</strong> | Duration: <strong>{selectedCase.duration}</strong>
              </p>
            </div>

            <div className="detail-section">
              <h6>Clinical Case Summary</h6>
              <p className="summary-box">{selectedCase.summary}</p>
            </div>
          </div>

          {/* AI Health Advisory Dossier (Task 4 Advisory Workflow Integration) */}
          {selectedCase.healthAdvisory && (
            <div className="health-advisory-dossier-card margin-top-sm margin-bottom-sm padding-sm border-glass border-radius-md" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.35)' }}>
              <h5 className="section-title text-highlight font-bold flex-gap" style={{ color: '#06b6d4' }}>
                <Stethoscope size={18} color="#06b6d4" /> {selectedCase.healthAdvisory.advisoryTitle || 'AI Health Advisory Dossier'}
              </h5>
              
              <p className="text-2xs text-muted margin-top-2xs font-bold" style={{ color: '#f59e0b' }}>
                {selectedCase.healthAdvisory.disclaimer}
              </p>

              <div className="grid-2-col margin-top-xs text-xs gap-xs">
                <div className="padding-xs background-dark border-radius-sm">
                  <strong className="text-highlight">Clinical Triage Urgency:</strong>
                  <p className="margin-top-2xs font-bold text-warning">{selectedCase.healthAdvisory.triageCategory}</p>
                  <p className="margin-top-2xs text-dim">{selectedCase.healthAdvisory.recommendedActionStep}</p>
                </div>

                <div className="padding-xs background-dark border-radius-sm">
                  <strong className="text-highlight">Recommended Vital Parameters Monitoring:</strong>
                  <ul className="margin-top-2xs text-dim" style={{ paddingLeft: '1rem', margin: 0 }}>
                    {(selectedCase.healthAdvisory.monitoringParameters || []).map((mParam, mIdx) => (
                      <li key={mIdx}>{mParam}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Doctor Input Form */}

          <form onSubmit={handleSubmit} className="doctor-input-form border-top">
            <h5 className="form-section-title">
              <Stethoscope size={18} color="#06b6d4" /> Doctor Clinical Recommendation & Prescription
            </h5>

            <div className="form-group">
              <label className="form-label">Clinical Impression & Diagnostic Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Provide your medical assessment, differential diagnosis, and clinical recommendations..."
                className="form-input text-area"
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label"><Pill size={16} color="#10b981" /> Prescribed Treatment / Medication & Dosages</label>
              <textarea
                value={form.prescription}
                onChange={(e) => setForm({ ...form, prescription: e.target.value })}
                placeholder="List recommended medications, lifestyle adjustments, diagnostic tests (e.g. ECG, Lab tests), or referrals..."
                className="form-input text-area"
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Follow-up Instructions & Timeline</label>
              <input
                type="text"
                value={form.followUp}
                onChange={(e) => setForm({ ...form, followUp: e.target.value })}
                placeholder="e.g. Schedule follow-up in 3 days or go to ER if chest pain worsens"
                className="form-input"
              />
            </div>

            <div className="modal-footer space-between">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary btn-lg">
                <Send size={18} /> {submitting ? 'Saving...' : 'Submit Doctor Prescription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
