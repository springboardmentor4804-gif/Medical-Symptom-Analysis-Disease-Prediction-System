import React, { useState, useEffect } from 'react';
import { db, CASES_UPDATED_EVENT, API_BASE } from '../../services/db';
import { Stethoscope, Filter, Eye, Clock, CheckCircle2, AlertTriangle, User, RefreshCw } from 'lucide-react';

export default function CaseList({
  cases: initialCases,
  doctorSpecialty,
  onSelectCase
}) {
  const [cases, setCases] = useState(() => {
    const local = db.getCases();
    return (local && local.length > 0) ? local : (initialCases || []);
  });
  const [filterMode, setFilterMode] = useState('all');
  const [loading, setLoading] = useState(false);

  const refreshCases = async () => {
    // 1. INSTANT PASS (0ms): Synchronously display cached local cases immediately
    const localCases = db.getCases();
    if (localCases && localCases.length > 0) {
      setCases(localCases);
    }

    setLoading(true);
    try {
      // 2. BACKGROUND PASS: Asynchronous non-blocking fetch from backend API
      const apiCases = await fetch(`${API_BASE}/cases`).then(r => r.ok ? r.json() : []).catch(() => []);
      if (Array.isArray(apiCases) && apiCases.length > 0) {
        const currentLocal = db.getCases();
        const mergedMap = {};
        currentLocal.forEach(c => { const k = c.id || c._id; if (k) mergedMap[k] = c; });
        apiCases.forEach(c => { const k = c.id || c._id; if (k) mergedMap[k] = { ...mergedMap[k], ...c }; });
        const merged = Object.values(mergedMap);
        localStorage.setItem('medi_ai_cases', JSON.stringify(merged));
        setCases(merged);
      } else {
        const freshLocal = db.getCases();
        setCases(freshLocal);
      }
    } catch (err) {
      console.warn('Notice loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCases();

    const handleCaseUpdate = () => {
      refreshCases();
    };

    window.addEventListener(CASES_UPDATED_EVENT, handleCaseUpdate);
    window.addEventListener('casesUpdated', handleCaseUpdate);
    window.addEventListener('medi_ai_cases_updated', handleCaseUpdate);
    return () => {
      window.removeEventListener(CASES_UPDATED_EVENT, handleCaseUpdate);
      window.removeEventListener('casesUpdated', handleCaseUpdate);
      window.removeEventListener('medi_ai_cases_updated', handleCaseUpdate);
    };
  }, []);

  const filteredCases = cases.filter(c => {
    if (filterMode === 'specialty') {
      return c.specialty === doctorSpecialty || c.specialty === 'General Physician';
    }
    if (filterMode === 'pending') {
      return c.status === 'Pending';
    }
    if (filterMode === 'reviewed') {
      return c.status === 'Reviewed';
    }
    return true; // 'all'
  });

  return (
    <div className="card glass-panel fade-in">
      <div className="card-header border-bottom flex-between">
        <div>
          <h3 className="tab-title-text"><Stethoscope className="icon-header glow-icon" /> Patient Cases Queue</h3>
          <p className="card-subtitle">
            Live patient symptom submissions matched to <strong>Dr. {doctorSpecialty}</strong> & system network
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="filter-pill-group align-items-center flex-gap">
          <button onClick={refreshCases} className="btn-secondary btn-sm flex-gap" title="Sync Cases" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
            <span>Sync</span>
          </button>
          <button
            className={`filter-pill ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All Network Cases ({cases.length})
          </button>
          <button
            className={`filter-pill ${filterMode === 'specialty' ? 'active' : ''}`}
            onClick={() => setFilterMode('specialty')}
          >
            My Specialty ({doctorSpecialty})
          </button>
          <button
            className={`filter-pill ${filterMode === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterMode('pending')}
          >
            Pending ({cases.filter(c => c.status === 'Pending').length})
          </button>
          <button
            className={`filter-pill ${filterMode === 'reviewed' ? 'active' : ''}`}
            onClick={() => setFilterMode('reviewed')}
          >
            Reviewed ({cases.filter(c => c.status === 'Reviewed').length})
          </button>
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <div className="empty-cases text-center padding-y-lg margin-vertical">
          <Clock size={40} className="icon-faded text-muted" />
          <h4 className="margin-top-xs">No Patient Cases Active</h4>
          <p className="text-muted text-xs margin-top-xs">When a patient submits a case, it will immediately appear here in real time.</p>
        </div>
      ) : (
        <div className="cases-grid margin-top">
          {filteredCases.map(c => {
            const isMatch = c.specialty === doctorSpecialty || doctorSpecialty === 'General Physician';
            return (
              <div key={c.id} className={`case-card glass-panel margin-bottom-sm padding-sm border-radius-md ${isMatch ? 'specialty-match' : ''}`} style={{ border: isMatch ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
                <div className="case-card-top flex-between border-bottom padding-bottom-xs">
                  <div className="patient-quick flex-gap">
                    <User size={16} color="#06b6d4" />
                    <strong>{c.patientName}</strong> ({c.patientAge || 30} yrs, {c.patientGender || 'Male'})
                  </div>

                  <span className={`status-pill ${c.status?.toLowerCase() || 'pending'}`}>
                    {c.status === 'Reviewed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {c.status || 'Pending'}
                  </span>
                </div>

                <div className="case-card-middle margin-top-xs">
                  <div className="specialty-tag-row flex-between margin-bottom-xs text-xs">
                    <span className="specialty-badge-sm">{c.specialty}</span>
                    <span className={`risk-pill ${c.riskLevel?.toLowerCase() || 'moderate'}`}>
                      {c.riskLevel} ({c.riskScore}%)
                    </span>
                  </div>

                  <h4 className="predicted-cond text-highlight">{c.predictedCondition}</h4>
                  <p className="summary-snippet text-xs text-dim margin-top-xs">{c.summary}</p>

                  <div className="symptoms-preview margin-top-xs text-xs">
                    <strong className="text-muted">Reported Symptoms:</strong> {c.symptoms ? c.symptoms.join(', ') : 'General Symptoms'}
                  </div>
                  <div className="case-params-preview text-xs text-dim margin-top-xs">
                    <span>Severity: <strong>{c.severity}</strong></span> • <span>Duration: <strong>{c.duration}</strong></span>
                  </div>
                </div>

                <div className="case-card-bottom margin-top-xs padding-top-xs border-top flex-between">
                  <span className="case-time text-xs text-muted">
                    {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectCase(c)}
                    className="btn-primary btn-sm flex-gap"
                  >
                    <Eye size={14} />
                    <span>{c.status === 'Reviewed' ? 'View Review' : 'Review & Prescribe'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
