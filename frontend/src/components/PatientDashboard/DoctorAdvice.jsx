import React, { useState, useEffect } from 'react';
import { db, API_BASE } from '../../services/db';
import { Stethoscope, Pill, Calendar, Clock, FileText, CheckCircle2, UserCheck, AlertCircle, Download, Printer, Award, HeartPulse, User, CheckSquare, RefreshCw } from 'lucide-react';

export default function DoctorAdvice({ currentUser }) {
  const [adviceList, setAdviceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const patientProfile = currentUser?.id ? db.getProfile(currentUser.id) : {};

  const loadAdvice = async () => {
    // 1. INSTANT PASS: Display local storage advice immediately (0ms)
    const renderList = (casesArr, suggsArr) => {
      const myCases = db.getPatientCases(currentUser?.id) || [];
      const list = [];
      suggsArr.forEach(sugg => {
        const matchedCase = myCases.find(c => c.id === sugg.caseId || c._id === sugg.caseId);
        if (matchedCase) {
          list.push({
            caseInfo: matchedCase,
            suggestion: sugg
          });
        }
      });
      return list;
    };

    setAdviceList(renderList(db.getCases(), db.getSuggestions()));

    // 2. BACKGROUND ASYNC PASS: Non-blocking fetch from backend API
    setLoading(true);
    try {
      const [apiCases, apiSuggs] = await Promise.all([
        fetch(`${API_BASE}/cases`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/suggestions`).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      let updated = false;

      if (Array.isArray(apiCases) && apiCases.length > 0) {
        const localCases = db.getCases();
        const mergedMap = {};
        localCases.forEach(c => { const k = c.id || c._id; if (k) mergedMap[k] = c; });
        apiCases.forEach(c => { const k = c.id || c._id; if (k) mergedMap[k] = { ...mergedMap[k], ...c }; });
        localStorage.setItem('medi_ai_cases', JSON.stringify(Object.values(mergedMap)));
        updated = true;
      }

      if (Array.isArray(apiSuggs) && apiSuggs.length > 0) {
        const localSuggs = db.getSuggestions();
        const mergedMap = {};
        localSuggs.forEach(s => { const k = s.id || s._id; if (k) mergedMap[k] = s; });
        apiSuggs.forEach(s => { const k = s.id || s._id; if (k) mergedMap[k] = { ...mergedMap[k], ...s }; });
        localStorage.setItem('medi_ai_suggestions', JSON.stringify(Object.values(mergedMap)));
        updated = true;
      }

      if (updated) {
        const cases = db.getCases();
        const suggestions = db.getSuggestions();
        setAdviceList(renderList(cases, suggestions));
      }
    } catch (err) {
      console.warn('Notice loading background advice:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAdvice();
    
    const handleCasesUpdated = () => {
      loadAdvice();
    };
    window.addEventListener('casesUpdated', handleCasesUpdated);
    return () => {
      window.removeEventListener('casesUpdated', handleCasesUpdated);
    };
  }, [currentUser]);

  const handlePrintAdvice = () => {
    window.print();
  };

  return (
    <div className="card glass-panel fade-in">
      <div className="card-header border-bottom flex-between">
        <div>
          <h3><Stethoscope className="icon-header glow-icon" /> Doctor Advice & Prescriptions</h3>
          <p className="card-subtitle">Official medical advice, patient profile, given symptoms, AI predictions, and doctor prescriptions</p>
        </div>
        <button type="button" onClick={loadAdvice} className="btn-secondary btn-sm flex-gap" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
          <span>Refresh Advice</span>
        </button>
      </div>

      {adviceList.length === 0 ? (
        <div className="empty-history text-center padding-y-lg margin-vertical">
          <FileText size={44} className="icon-faded text-muted" />
          <h4 className="margin-top-xs">No Doctor Advice History</h4>
          <p className="text-muted text-xs margin-top-xs">
            No doctor advice or prescription history logged yet.<br />
            Select symptoms in the Symptoms Input tab and click "Submit" to consult with a specialized doctor.
          </p>
        </div>
      ) : (
        <div className="doctor-advice-grid margin-top">
          {adviceList.map(item => (
            <div key={item.suggestion.id} className="official-doctor-report-card glass-panel margin-bottom fade-in padding-md border-glass border-radius-md" style={{ border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              {/* Header & Download Action */}
              <div className="report-card-header border-bottom padding-bottom-xs flex-between">
                <div className="doc-report-title flex-gap">
                  <Stethoscope size={24} color="#06b6d4" />
                  <div>
                    <h4 className="doc-name text-highlight">Official Doctor Consultation Report</h4>
                    <span className="doc-name-subtitle text-xs text-muted">
                      Case #{item.caseInfo.id} • Reviewed by <strong>Dr. {item.suggestion.doctorName}</strong> ({item.suggestion.doctorSpecialty})
                    </span>
                  </div>
                </div>

                <div className="flex-gap">
                  <span className="report-date-pill text-xs">
                    <Calendar size={12} /> {new Date(item.suggestion.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={handlePrintAdvice}
                    className="btn-primary btn-sm no-print flex-gap"
                    title="Download or Print Doctor Consultation Report"
                  >
                    <Download size={14} />
                    <span>Download Report</span>
                  </button>
                </div>
              </div>

              <div className="report-card-body margin-top-xs">
                {/* 1. PATIENT DETAILS */}
                <div className="report-section margin-top-xs padding-xs background-dark border-radius-sm">
                  <span className="report-section-label" style={{ color: '#06b6d4' }}>
                    <User size={15} /> 1. Patient Profile Details:
                  </span>
                  <div className="grid-3-col margin-top-xs text-xs">
                    <div><strong>Full Name:</strong> {currentUser?.firstName || 'Alex'} {currentUser?.lastName || 'Morgan'}</div>
                    <div><strong>Age:</strong> {patientProfile.age || item.caseInfo.patientAge || 30} yrs</div>
                    <div><strong>Gender:</strong> {patientProfile.gender || item.caseInfo.patientGender || 'Male'}</div>
                    <div><strong>Blood Group:</strong> {patientProfile.bloodType || 'O+'}</div>
                    <div><strong>Contact Phone:</strong> {patientProfile.phone || 'Not specified'}</div>
                    <div><strong>Emergency Contact:</strong> {patientProfile.emergencyContact || 'Not specified'}</div>
                  </div>
                </div>

                {/* 2. DOCTOR DETAILS */}
                <div className="report-section margin-top-xs padding-xs background-dark border-radius-sm">
                  <span className="report-section-label" style={{ color: '#a855f7' }}>
                    <Stethoscope size={15} /> 2. Consulting Doctor Details:
                  </span>
                  <div className="grid-3-col margin-top-xs text-xs">
                    <div><strong>Doctor Name:</strong> Dr. {item.suggestion.doctorName}</div>
                    <div><strong>Specialty:</strong> {item.suggestion.doctorSpecialty} Specialist</div>
                    <div><strong>Consultation Date:</strong> {new Date(item.suggestion.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* 3. GIVEN SYMPTOMS */}
                <div className="report-section margin-top-xs">
                  <span className="report-section-label" style={{ color: '#10b981' }}>
                    <CheckSquare size={15} /> 3. Symptoms Entered by Patient:
                  </span>
                  <div className="symptoms-chips-container margin-top-xs">
                    {item.caseInfo.symptoms && item.caseInfo.symptoms.length > 0 ? (
                      item.caseInfo.symptoms.map((s, i) => (
                        <span key={i} className="disease-option-chip active" style={{ fontSize: '0.78rem' }}>
                          • {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-dim text-xs">General Symptoms</span>
                    )}
                  </div>
                </div>

                {/* 4. AI PREDICTED DISEASE */}
                <div className="report-section margin-top-xs">
                  <span className="report-section-label" style={{ color: '#f59e0b' }}>
                    <Award size={15} /> 4. AI Predicted Disease & Risk Index:
                  </span>
                  <div className="padding-xs background-dark border-radius-sm margin-top-xs text-xs">
                    <p className="text-sm">
                      <strong>AI Predicted Condition:</strong> <span className="text-highlight font-bold">{item.caseInfo.predictedCondition}</span>
                    </p>
                    <p className="margin-top-xs">
                      <strong>Calculated Risk Index:</strong> <span className={`risk-pill ${item.caseInfo.riskLevel?.toLowerCase() || 'moderate'}`}>{item.caseInfo.riskScore}% ({item.caseInfo.riskLevel} Risk)</span>
                    </p>
                  </div>
                </div>

                {/* 5. DOCTOR ADVICE & PRESCRIPTION */}
                <div className="report-section margin-top-xs border-top padding-top-xs">
                  <span className="report-section-label" style={{ color: '#06b6d4' }}>
                    <FileText size={15} color="#06b6d4" /> 5. Doctor Diagnostic Clinical Impression & Notes:
                  </span>
                  <p className="report-text-content text-xs margin-top-xs padding-xs background-glass border-radius-sm">
                    {item.suggestion.notes}
                  </p>

                  <span className="report-section-label margin-top-xs" style={{ color: '#10b981' }}>
                    <Pill size={15} color="#10b981" /> Prescribed Medication & Treatment Plan:
                  </span>
                  <div className="margin-top-xs padding-xs highlight-prescription border-radius-sm" style={{ background: 'rgba(16, 185, 129, 0.15)', borderLeft: '3px solid #10b981' }}>
                    <p className="text-xs font-bold text-success">{item.suggestion.prescription}</p>
                  </div>

                  {item.suggestion.followUp && (
                    <div className="margin-top-xs">
                      <span className="report-section-label" style={{ color: '#eab308' }}>
                        <Clock size={14} color="#eab308" /> Follow-up Instructions:
                      </span>
                      <p className="report-text-content text-xs text-dim margin-top-xs">{item.suggestion.followUp}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer Download Action */}
                <div className="report-card-footer margin-top padding-top-xs border-top flex-between no-print">
                  <span className="text-xs text-muted">MediAI Clinical Telehealth Engine & MongoDB Atlas</span>
                  <button
                    type="button"
                    onClick={handlePrintAdvice}
                    className="btn-primary btn-md flex-gap"
                  >
                    <Download size={16} />
                    <span>Download Doctor Report (PDF / Print)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
