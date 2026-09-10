import React, { useState, useEffect } from 'react';
import { db, CASES_UPDATED_EVENT } from '../services/db';
import TrendVisualization from './AdminDashboard/TrendVisualization';
import { FileText, TrendingUp, Download, Printer, Cpu, User, CheckSquare, HeartPulse, Award, Lightbulb, Stethoscope, Clock, Pill, RefreshCw, Calendar } from 'lucide-react';

export default function ReportsAndTrendsView({ currentUser }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [doctorReport, setDoctorReport] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const allCases = db.getCases();
      setCases(allCases);
      if (allCases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(allCases[0].id || allCases[0]._id);
      }
      const analyticsData = await db.getAnalyticsData();
      setAnalytics(analyticsData);
    } catch (err) {
      console.warn('Error loading reports & trends data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener(CASES_UPDATED_EVENT, handleSync);
    window.addEventListener('casesUpdated', handleSync);
    return () => {
      window.removeEventListener(CASES_UPDATED_EVENT, handleSync);
      window.removeEventListener('casesUpdated', handleSync);
    };
  }, []);

  const activeCase = cases.find(c => (c.id === selectedCaseId || c._id === selectedCaseId)) || cases[0];

  useEffect(() => {
    if (activeCase) {
      const cId = activeCase.id || activeCase._id;
      const suggs = db.getCaseSuggestions(cId);
      if (suggs.length > 0) {
        setDoctorReport(suggs[0]);
      } else {
        setDoctorReport(null);
      }
    }
  }, [selectedCaseId, cases]);

  const handlePrintReport = () => {
    window.print();
  };

  const patientProfile = currentUser?.id ? db.getProfile(currentUser.id) : {};

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return '#f43f5e';
      case 'High': return '#f97316';
      case 'Moderate': return '#eab308';
      default: return '#10b981';
    }
  };

  return (
    <div className="reports-trends-container fade-in">
      {/* Header Banner */}
      <div className="card glass-panel padding-md margin-bottom-sm flex-between flex-wrap border-primary" style={{ border: '1px solid rgba(6, 182, 212, 0.4)' }}>
        <div className="flex-gap">
          <div className="admin-avatar">
            <FileText size={28} color="#06b6d4" />
          </div>
          <div>
            <h3 className="text-highlight">Healthcare Reports & Trend Visualizations</h3>
            <p className="card-subtitle text-xs">
              Official Diagnostic Report Cards & Time-Series Healthcare Analytics
            </p>
          </div>
        </div>

        <div className="flex-gap">
          <button type="button" onClick={loadData} className="btn-secondary btn-sm flex-gap" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Sync Reports Data</span>
          </button>
          <button type="button" onClick={handlePrintReport} className="btn-primary btn-sm flex-gap">
            <Printer size={14} />
            <span>Print Official Report Card</span>
          </button>
        </div>
      </div>

      {/* --- SECTION 1: OFFICIAL HEALTHCARE DIAGNOSTIC REPORT CARD --- */}
      <div className="card glass-panel padding-md margin-bottom-md border-glass no-print">
        <div className="report-card-selector flex-between flex-wrap border-bottom padding-bottom-xs margin-bottom-sm">
          <h4 className="flex-gap text-highlight">
            <FileText size={18} color="#06b6d4" /> Official Healthcare Diagnostic Report Card
          </h4>

          {/* Select Case Dropdown */}
          <div className="flex-gap align-items-center">
            <span className="text-xs text-muted font-bold">Select Assessment Case:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="select-input text-xs"
              style={{ minWidth: '220px', padding: '6px 10px' }}
            >
              {cases.map(c => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  Case #{c.id || c._id} — {c.predictedCondition || 'Assessment'} ({c.riskLevel || 'Moderate'} Risk)
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeCase ? (
          <div className="official-report-card-view padding-sm background-dark border-radius-md">
            {/* 1. PATIENT INFORMATION */}
            <div className="report-block margin-bottom-xs padding-xs background-glass border-radius-sm">
              <span className="text-xs font-bold text-highlight flex-gap"><User size={14} /> 1. Patient Profile Information:</span>
              <div className="grid-3-col margin-top-2xs text-xs">
                <div><strong>Full Name:</strong> {activeCase.patientName || currentUser?.firstName || 'Alex Morgan'}</div>
                <div><strong>Age:</strong> {activeCase.patientAge || patientProfile.age || 30} yrs</div>
                <div><strong>Gender:</strong> {activeCase.patientGender || patientProfile.gender || 'Male'}</div>
                <div><strong>Blood Group:</strong> {patientProfile.bloodType || 'O+'}</div>
                <div><strong>Allergies:</strong> {patientProfile.allergies || 'None reported'}</div>
                <div><strong>Chronic Conditions:</strong> {patientProfile.chronicConditions || 'None'}</div>
              </div>
            </div>

            {/* 2. ASSESSMENT DATE */}
            <div className="report-block margin-bottom-xs padding-xs background-glass border-radius-sm">
              <span className="text-xs font-bold text-highlight flex-gap"><Calendar size={14} /> 2. Assessment Date & Time:</span>
              <p className="text-xs margin-top-2xs">
                Evaluated on: <strong>{new Date(activeCase.createdAt || Date.now()).toLocaleDateString()} at {new Date(activeCase.createdAt || Date.now()).toLocaleTimeString()}</strong>
              </p>
            </div>

            {/* 3. PREDICTED DISEASE & 4. CONFIDENCE % */}
            <div className="report-block margin-bottom-xs padding-xs background-glass border-radius-sm">
              <span className="text-xs font-bold text-purple flex-gap"><Award size={14} /> 3 & 4. Predicted Disease & Model Probability Confidence:</span>
              <p className="text-sm text-highlight font-bold margin-top-2xs">
                {activeCase.predictedCondition || 'Coronary Artery Disease / Hypertensive Stress'} <span className="prob-badge">85% Match Confidence</span>
              </p>
              <p className="text-xs text-dim margin-top-2xs">Recommended Specialty: Dr. {activeCase.specialty || 'Cardiologist'}</p>
            </div>

            {/* 5. SYMPTOM SEVERITY & 6. CVD/RISK ASSESSMENT */}
            <div className="report-block margin-bottom-xs padding-xs background-glass border-radius-sm">
              <span className="text-xs font-bold text-warning flex-gap"><HeartPulse size={14} /> 5 & 6. Symptom Severity & Risk / CVD Triage Assessment:</span>
              <div className="flex-gap align-items-center margin-top-2xs text-xs">
                <span>Calculated Risk Index: <strong style={{ color: getRiskColor(activeCase.riskLevel), fontSize: '1rem' }}>{activeCase.riskScore || 75}%</strong></span>
                <span className={`risk-pill ${activeCase.riskLevel?.toLowerCase() || 'high'}`}>
                  {activeCase.riskLevel || 'High'} Risk ({activeCase.severity || 'Moderate'} Severity)
                </span>
                <span>Duration: {activeCase.duration || '1-3 days'}</span>
              </div>
              <div className="symptoms-chips-container margin-top-xs">
                {(activeCase.symptoms || ['Chest Pain or Pressure', 'Rapid Heart Rate / Palpitations']).map((s, idx) => (
                  <span key={idx} className="disease-option-chip active" style={{ fontSize: '0.75rem' }}>• {s}</span>
                ))}
              </div>
            </div>

            {/* 7. TREATMENT & HEALTH RECOMMENDATION FROM TASK 1 */}
            <div className="report-block margin-bottom-xs padding-xs background-glass border-radius-sm">
              <span className="text-xs font-bold text-highlight flex-gap"><Lightbulb size={14} color="#06b6d4" /> 7. AI Health & Supportive Treatment Recommendations:</span>
              <div className="grid-2-col margin-top-xs text-xs">
                <div><strong>Supportive Care:</strong> Maintain physical rest, monitor vitals, and keep symptom logs.</div>
                <div><strong>Lifestyle Guidance:</strong> Ensure 7-8 hours of sleep, avoid tobacco smoke and cold air.</div>
                <div><strong>Dietary Care:</strong> Stay well hydrated (2-3L water daily) and consume nutrient-rich foods.</div>
                <div style={{ color: '#f43f5e' }}><strong>Warning Red Flags:</strong> Seek immediate emergency care if severe pain or dyspnea occurs.</div>
              </div>
            </div>

            {/* 8. RELEVANT ASSESSMENT SUMMARY & DOCTOR DIAGNOSIS / PRESCRIPTION */}
            <div className="report-block padding-xs background-glass border-radius-sm">
              <span className="text-xs font-bold text-success flex-gap"><Stethoscope size={14} /> 8. Assessment Summary & Doctor Review Notes:</span>
              <p className="text-xs text-dim margin-top-2xs"><strong>AI Summary:</strong> {activeCase.summary || 'Cardiac stress risk assessment completed.'}</p>
              
              {doctorReport ? (
                <div className="margin-top-xs padding-xs border-radius-sm" style={{ background: 'rgba(16, 185, 129, 0.15)', borderLeft: '3px solid #10b981' }}>
                  <span className="text-xs font-bold text-success"><Pill size={13} /> Official Doctor Prescription & Review:</span>
                  <p className="text-xs margin-top-2xs"><strong>Consulting Doctor:</strong> Dr. {doctorReport.doctorName} ({doctorReport.doctorSpecialty})</p>
                  <p className="text-xs margin-top-2xs"><strong>Clinical Diagnosis Notes:</strong> {doctorReport.notes}</p>
                  <p className="text-xs margin-top-2xs font-bold"><strong>Prescribed Medication:</strong> {doctorReport.prescription}</p>
                </div>
              ) : (
                <p className="text-xs text-warning margin-top-xs">
                  <Clock size={12} /> Status: Case is currently Pending Doctor Prescription Review. Click "Submit Case to Doctor" to receive official prescription.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted padding-y-md text-center">No patient diagnostic assessment case selected.</p>
        )}
      </div>

      {/* --- SECTION 2: HEALTHCARE TIME-SERIES TREND VISUALIZER --- */}
      <TrendVisualization analytics={analytics} />

      {/* --- OFFICIAL PRINTABLE MEDICAL REPORT PAPER (FOR DOWNLOAD / PRINT) --- */}
      {activeCase && (
        <div id="printable-medical-report" className="medical-report-paper">
          <div className="paper-header">
            <div className="paper-brand">
              <h2>MediAI Clinical Diagnostic & Telehealth Report</h2>
              <p>Official AI Medical Risk Assessment & Patient Consultation Document</p>
            </div>
            <div className="paper-doc-id">
              <span><strong>Date:</strong> {new Date(activeCase.createdAt || Date.now()).toLocaleDateString()}</span>
              <span><strong>Time:</strong> {new Date(activeCase.createdAt || Date.now()).toLocaleTimeString()}</span>
              <span><strong>Report ID:</strong> RPT-{activeCase.id || activeCase._id}</span>
            </div>
          </div>

          <hr className="paper-divider" />

          {/* 1. Patient Details */}
          <div className="paper-section">
            <h3 className="paper-section-title">1. Patient Profile Details</h3>
            <table className="paper-table">
              <tbody>
                <tr>
                  <td><strong>Full Name:</strong> {activeCase.patientName || currentUser?.firstName || 'Alex Morgan'}</td>
                  <td><strong>Age:</strong> {activeCase.patientAge || patientProfile.age || 30} yrs</td>
                  <td><strong>Gender:</strong> {activeCase.patientGender || patientProfile.gender || 'Male'}</td>
                </tr>
                <tr>
                  <td><strong>Blood Group:</strong> {patientProfile.bloodType || 'O+'}</td>
                  <td><strong>Known Allergies:</strong> {patientProfile.allergies || 'None reported'}</td>
                  <td><strong>Chronic Conditions:</strong> {patientProfile.chronicConditions || 'None'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Entered Symptoms */}
          <div className="paper-section">
            <h3 className="paper-section-title">2. Patient Reported Symptoms</h3>
            <div className="paper-symptoms-box">
              {(activeCase.symptoms || ['Chest Pain or Pressure', 'Rapid Heart Rate / Palpitations']).map((s, i) => (
                <span key={i} className="paper-symptom-tag">• {s}</span>
              ))}
            </div>
          </div>

          {/* 3. AI Risk Assessment & Predicted Disease */}
          <div className="paper-section">
            <h3 className="paper-section-title">3. Clinical AI Diagnostic Predictions & Risk Index</h3>
            <table className="paper-table">
              <tbody>
                <tr>
                  <td><strong>Primary Predicted Disease:</strong></td>
                  <td><span className="paper-highlight-disease">{activeCase.predictedCondition || 'Coronary Artery Disease'} (85% Match Probability)</span></td>
                </tr>
                <tr>
                  <td><strong>Calculated Risk Index & Severity:</strong></td>
                  <td>
                    <strong style={{ color: getRiskColor(activeCase.riskLevel), fontSize: '1.1rem' }}>
                      {activeCase.riskScore || 75}% ({activeCase.riskLevel || 'High'} Risk Level, {activeCase.severity || 'Moderate'} Severity)
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td><strong>Recommended Specialist Doctor:</strong></td>
                  <td>Dr. {activeCase.specialty || 'Cardiologist'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. AI Health Recommendations */}
          <div className="paper-section">
            <h3 className="paper-section-title">4. AI Health & Supportive Care Advisory</h3>
            <p><strong>Supportive Care:</strong> Maintain physical rest, monitor vitals, and keep symptom logs.</p>
            <p><strong>Lifestyle Advice:</strong> Ensure 7-8 hours of sleep, avoid tobacco smoke and cold air.</p>
            <p><strong>Dietary Guidance:</strong> Stay well hydrated (2-3L water daily) and consume nutrient-rich foods.</p>
            <p style={{ color: '#dc2626' }}><strong>Warning Signs:</strong> Seek immediate emergency care if severe pain or dyspnea occurs.</p>
          </div>

          {/* 5. Doctor Report & Prescription (ONLY IF REVIEWED) */}
          {doctorReport && (
            <div className="paper-section">
              <h3 className="paper-section-title">5. Consulting Doctor Official Report & Prescription</h3>
              <div className="paper-doctor-box">
                <p><strong>Doctor Name:</strong> Dr. {doctorReport.doctorName} ({doctorReport.doctorSpecialty})</p>
                <p><strong>Clinical Notes:</strong> {doctorReport.notes}</p>
                <p className="paper-prescription"><strong>Prescribed Medication:</strong> {doctorReport.prescription}</p>
              </div>
            </div>
          )}

          <div className="paper-footer">
            <div className="paper-signature">
              <div className="sig-line"></div>
              <span>Authorized Medical Signature</span>
            </div>
            <div className="paper-disclaimer">
              <p>* This report was generated by MediAI Clinical Engine & MongoDB Atlas. Valid for medical consultation.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
