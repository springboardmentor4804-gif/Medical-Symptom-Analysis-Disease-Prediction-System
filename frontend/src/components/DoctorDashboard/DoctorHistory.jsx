import React, { useState, useEffect } from 'react';
import { db, CASES_UPDATED_EVENT } from '../../services/db';
import { History, FileCheck, Calendar, User, Pill, Stethoscope, AlertCircle } from 'lucide-react';

export default function DoctorHistory({ currentUser }) {
  const [historyItems, setHistoryItems] = useState([]);

  const loadHistory = () => {
    if (currentUser?.id) {
      const items = db.getDoctorHistory(currentUser.id);
      setHistoryItems(items);
    }
  };

  useEffect(() => {
    loadHistory();

    const handleCasesUpdated = () => {
      loadHistory();
    };

    window.addEventListener('casesUpdated', handleCasesUpdated);
    window.addEventListener(CASES_UPDATED_EVENT, handleCasesUpdated);
    window.addEventListener('medi_ai_cases_updated', handleCasesUpdated);
    return () => {
      window.removeEventListener('casesUpdated', handleCasesUpdated);
      window.removeEventListener(CASES_UPDATED_EVENT, handleCasesUpdated);
      window.removeEventListener('medi_ai_cases_updated', handleCasesUpdated);
    };
  }, [currentUser]);

  return (
    <div className="card glass-panel fade-in">
      {/* Header Banner */}
      <div className="card-header border-bottom">
        <div>
          <h3><History className="icon-header glow-icon" /> Consultation & Prescription History</h3>
          <p className="card-subtitle">
            Log of all patient evaluations, medical notes, and prescriptions submitted by Dr. {currentUser?.lastName || 'Doctor'}
          </p>
        </div>
        <button type="button" onClick={loadHistory} className="btn-secondary btn-sm">
          Refresh History
        </button>
      </div>

      {/* --- EMPTY STATE (WHEN DOCTOR HAS NOT REVIEWED ANY PATIENTS YET) --- */}
      {historyItems.length === 0 ? (
        <div className="empty-history text-center padding-lg margin-vertical">
          <FileCheck size={48} className="icon-faded text-muted" />
          <h4 className="margin-top-xs">No Patient Prescriptions Reviewed Yet</h4>
          <p className="text-muted margin-top-xs">
            You have not submitted any prescriptions or clinical notes for patient cases yet.
          </p>
          <div className="alert-banner alert-info margin-top text-xs inline-block">
            <AlertCircle size={16} />
            <span>Go to the <strong>"Patient Cases"</strong> tab to evaluate pending cases and submit prescriptions.</span>
          </div>
        </div>
      ) : (
        /* --- LIST OF SUBMITTED PATIENT PRESCRIPTIONS & CONSULTATION CARDS --- */
        <div className="doctor-history-list margin-top">
          {historyItems.map(item => {
            const caseInfo = item.caseInfo;
            return (
              <div key={item.id} className="history-card glass-panel margin-bottom-sm padding-sm border-glass border-radius-md fade-in">
                {/* Header */}
                <div className="history-card-header flex-between border-bottom padding-bottom-xs">
                  <div className="case-id-tag flex-gap">
                    <User size={18} color="#06b6d4" />
                    <div>
                      <strong className="text-highlight">{caseInfo?.patientName || item.patientName || 'Patient Case'}</strong>
                      <span className="text-muted text-xs margin-left-xs">
                        ({caseInfo?.patientAge || 30} yrs, {caseInfo?.patientGender || 'Male'})
                      </span>
                    </div>
                  </div>

                  <div className="history-meta text-right">
                    <span className="specialty-badge-sm margin-right-xs">{item.doctorSpecialty || 'Specialist'}</span>
                    <span className="case-date text-xs text-muted">
                      <Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="history-card-body margin-top-xs">
                  {caseInfo && (
                    <div className="case-snapshot padding-xs background-dark border-radius-sm text-xs margin-bottom-xs">
                      <span className="text-muted">Diagnosis Snapshot:</span> <strong>{caseInfo.predictedCondition || 'Clinical Condition'}</strong> ({caseInfo.riskScore}% Risk) | 
                      <span className="text-muted"> Symptoms:</span> {caseInfo.symptoms?.join(', ')}
                    </div>
                  )}

                  {/* Doctor Diagnosis Notes */}
                  <div className="response-section margin-top-xs">
                    <div className="response-label text-xs text-muted flex-gap">
                      <Stethoscope size={14} color="#06b6d4" /> <strong>Your Clinical Diagnostic Notes:</strong>
                    </div>
                    <p className="response-text text-sm padding-xs">{item.notes}</p>
                  </div>

                  {/* Prescribed Medication */}
                  <div className="response-section margin-top-xs">
                    <div className="response-label text-xs text-muted flex-gap">
                      <Pill size={14} color="#10b981" /> <strong>Prescribed Medication & Treatment Plan:</strong>
                    </div>
                    <p className="response-text highlight-prescription text-sm padding-xs" style={{ background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981' }}>
                      {item.prescription}
                    </p>
                  </div>

                  {item.followUp && (
                    <div className="response-section margin-top-xs">
                      <div className="response-label text-xs text-muted">Follow-up Advice:</div>
                      <p className="response-text text-xs text-dim">{item.followUp}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
