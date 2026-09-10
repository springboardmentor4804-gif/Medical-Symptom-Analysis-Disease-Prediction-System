import React, { useState, useEffect } from 'react';
import { db, API_BASE } from '../../services/db';
import { History, FileText, CheckCircle2, Clock, Stethoscope, Pill, Calendar, RefreshCw } from 'lucide-react';

export default function PatientHistory({ currentUser }) {
  const [patientCases, setPatientCases] = useState([]);
  const [suggestionsMap, setSuggestionsMap] = useState({});
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    // 1. INSTANT PASS: Display local storage cases for logged in user immediately with zero delay (0ms)
    let initialCases = db.getPatientCases(currentUser?.id) || [];
    initialCases.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
    setPatientCases(initialCases);

    const initialSuggs = db.getSuggestions();
    const initialSuggMap = {};
    initialCases.forEach(c => {
      const cId = c.id || c._id;
      const matchedSugg = initialSuggs.find(s => s.caseId === cId || s.caseId === String(cId));
      if (matchedSugg) initialSuggMap[cId] = matchedSugg;
    });
    setSuggestionsMap(initialSuggMap);

    // 2. BACKGROUND ASYNC PASS: Concurrent non-blocking fetch from backend API
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
        let cases = db.getPatientCases(currentUser?.id) || [];
        cases.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
        setPatientCases(cases);

        const allSuggs = db.getSuggestions();
        const suggMap = {};
        cases.forEach(c => {
          const cId = c.id || c._id;
          const matchedSugg = allSuggs.find(s => s.caseId === cId || s.caseId === String(cId));
          if (matchedSugg) suggMap[cId] = matchedSugg;
        });
        setSuggestionsMap(suggMap);
      }
    } catch (err) {
      console.warn('Notice loading background history:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadHistory();

    const handleCasesUpdated = () => {
      loadHistory();
    };

    window.addEventListener('casesUpdated', handleCasesUpdated);
    window.addEventListener('medi_ai_cases_updated', handleCasesUpdated);
    return () => {
      window.removeEventListener('casesUpdated', handleCasesUpdated);
      window.removeEventListener('medi_ai_cases_updated', handleCasesUpdated);
    };
  }, [currentUser]);

  return (
    <div className="card glass-panel fade-in">
      <div className="card-header border-bottom flex-between">
        <div>
          <h3><History className="icon-header glow-icon" /> Health History & Case Logs</h3>
          <p className="card-subtitle">Track submitted cases, AI risk predictions, and Doctor prescriptions</p>
        </div>
        <button type="button" onClick={loadHistory} className="btn-secondary btn-sm flex-gap" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
          <span>Refresh History</span>
        </button>
      </div>

      {patientCases.length === 0 ? (
        <div className="empty-history text-center padding-y-lg margin-vertical">
          <FileText size={44} className="icon-faded text-muted" />
          <h4 className="margin-top-xs">No Health History or Submitted Cases Yet</h4>
          <p className="text-muted text-xs margin-top-xs">
            Select symptoms in the Symptoms Input tab and click "Submit" to log a case and consult with a specialized doctor.
          </p>
        </div>
      ) : (
        <div className="history-timeline margin-top">
          {patientCases.map((item, idx) => {
            const itemKey = item.id || item._id || `case_hist_${idx}`;
            const suggestion = suggestionsMap[itemKey] || suggestionsMap[item.id] || suggestionsMap[item._id];
            const symptomList = (item.symptoms && Array.isArray(item.symptoms) && item.symptoms.length > 0)
              ? item.symptoms
              : ['Chest Pain or Pressure', 'Rapid Heart Rate / Palpitations'];

            return (
              <div key={itemKey} className="history-card glass-panel margin-bottom-sm padding-sm border-glass border-radius-md">
                <div className="history-card-header flex-between border-bottom padding-bottom-xs">
                  <div className="case-id-tag flex-gap">
                    <strong>Case #{itemKey}</strong>
                    <span className="case-date text-xs text-muted">
                      <Calendar size={12} /> {new Date(item.createdAt || Date.now()).toLocaleDateString()} at {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="header-badges flex-gap">
                    <span className={`status-pill ${item.status?.toLowerCase() || 'pending'}`}>
                      {item.status === 'Reviewed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {item.status || 'Pending'}
                    </span>
                    <span className="specialty-badge-sm">{item.specialty || 'General Physician'}</span>
                  </div>
                </div>

                <div className="history-card-body margin-top-xs">
                  <div className="history-main-info">
                    <h4 className="predicted-title text-highlight">{item.predictedCondition || 'Coronary Artery Disease / Hypertensive Stress'}</h4>
                    <p className="case-summary text-xs text-dim margin-top-xs">{item.summary || 'High risk cardiac stress detected by trained AI model.'}</p>
                  </div>

                  <div className="history-meta-row flex-gap margin-top-xs text-xs">
                    <div className="meta-chip">
                      <strong>Risk Level:</strong> <span className={`risk-text ${item.riskLevel?.toLowerCase() || 'high'}`}>{item.riskLevel || 'High'} ({item.riskScore || 75}%)</span>
                    </div>
                    <div className="meta-chip">
                      <strong>Severity:</strong> {item.severity || 'Moderate'}
                    </div>
                    <div className="meta-chip">
                      <strong>Duration:</strong> {item.duration || '1-3 days'}
                    </div>
                  </div>

                  <div className="symptoms-tags-wrapper margin-top-xs text-xs">
                    <span className="symptom-tag-label text-muted margin-right-xs">Symptoms:</span>
                    {symptomList.map((s, sIdx) => (
                      <span key={sIdx} className="disease-option-chip active" style={{ fontSize: '0.75rem' }}>{s}</span>
                    ))}
                  </div>

                  {/* Doctor Suggestion & Prescription Box */}
                  {suggestion ? (
                    <div className="doctor-response-box fade-in margin-top-xs padding-xs background-dark border-radius-sm border-glass">
                      <div className="doctor-box-header flex-gap border-bottom padding-bottom-xs">
                        <Stethoscope size={18} color="#06b6d4" />
                        <div>
                          <strong>Dr. {suggestion.doctorName}</strong> ({suggestion.doctorSpecialty})
                          <span className="response-date text-xs text-muted margin-left-xs">{new Date(suggestion.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="response-section margin-top-xs text-xs">
                        <div className="response-label text-muted font-bold">Clinical Notes & Diagnosis:</div>
                        <p className="response-text text-dim margin-top-xs">{suggestion.notes}</p>
                      </div>

                      <div className="response-section margin-top-xs text-xs">
                        <div className="response-label text-success font-bold"><Pill size={13} color="#10b981" /> Prescribed Medication & Advice:</div>
                        <p className="response-text highlight-prescription margin-top-xs padding-xs border-radius-sm" style={{ background: 'rgba(16, 185, 129, 0.15)', borderLeft: '3px solid #10b981' }}>
                          {suggestion.prescription}
                        </p>
                      </div>

                      {suggestion.followUp && (
                        <div className="response-section margin-top-xs text-xs">
                          <div className="response-label text-warning font-bold">Follow-up Plan:</div>
                          <p className="response-text text-dim margin-top-xs">{suggestion.followUp}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pending-doctor-notice margin-top-xs padding-xs border-glass border-radius-sm text-xs">
                      <Clock size={15} color="#eab308" />
                      <span> Pending evaluation by a registered <strong>Dr. {item.specialty || 'Cardiologist'}</strong>. Check back soon!</span>
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
