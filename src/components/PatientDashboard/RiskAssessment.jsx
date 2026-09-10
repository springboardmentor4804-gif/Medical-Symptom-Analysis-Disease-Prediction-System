import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, CheckCircle, Send, Stethoscope, Activity, ShieldAlert, FileText, Pill, Calendar, Clock, ChevronDown, ChevronUp, Download, Printer, Info, User, Award, CheckSquare, Phone, HeartPulse, Lightbulb, Compass, Utensils } from 'lucide-react';
import { db } from '../../services/db';

export default function RiskAssessment({
  predictionResult,
  currentUser,
  selectedSymptomNames = [],
  severity,
  duration,
  onCaseSubmitted,
  onNavigateToHistory
}) {

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [activeSubmittedCaseId, setActiveSubmittedCaseId] = useState(null);
  const [doctorReport, setDoctorReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [fetchedRecs, setFetchedRecs] = useState(null);
  const [previousCasePrediction, setPreviousCasePrediction] = useState(null);

  // Get patient profile details strictly from saved DB Profile
  const patientProfile = currentUser?.id ? db.getProfile(currentUser.id) : {};

  // Auto-load previous case assessment data if predictionResult is not passed
  useEffect(() => {
    if (!predictionResult || predictionResult.riskScore === 0) {
      let cases = currentUser?.id ? db.getPatientCases(currentUser.id) : [];
      if (cases.length > 0) {
        const latest = cases[0];
        setPreviousCasePrediction({
          riskScore: latest.riskScore || 75,
          riskLevel: latest.riskLevel || 'High',
          severity: latest.severity || 'Moderate',
          primaryCondition: latest.predictedCondition || 'Coronary Artery Disease / Hypertensive Stress',
          predictedDisease: latest.predictedCondition || 'Coronary Artery Disease / Hypertensive Stress',
          recommendedSpecialty: latest.specialty || 'Cardiologist',
          modelProbability: 85,
          matchedConditions: [
            { condition: latest.predictedCondition || 'Coronary Artery Disease / Hypertensive Stress', matchPercentage: 85, specialty: latest.specialty || 'Cardiologist' }
          ],
          urgency: latest.riskLevel === 'High' ? 'Prompt Specialist Consultation' : 'Schedule Doctor Appointment',
          summary: latest.summary || 'Previous diagnostic case analysis loaded.',
          symptoms: latest.symptoms || ['Chest Pain or Pressure', 'Rapid Heart Rate / Palpitations']
        });
        if (latest.id || latest._id) {
          setActiveSubmittedCaseId(latest.id || latest._id);
        }
      }
    }
  }, [predictionResult, currentUser]);

  // Check if a doctor has submitted a review specifically for activeSubmittedCaseId
  useEffect(() => {
    if (activeSubmittedCaseId) {
      const suggs = db.getCaseSuggestions(activeSubmittedCaseId);
      if (suggs.length > 0) {
        const patientCases = db.getCases();
        const matchedCase = patientCases.find(c => c.id === activeSubmittedCaseId || c._id === activeSubmittedCaseId);
        setDoctorReport({
          caseInfo: matchedCase,
          suggestion: suggs[0]
        });
      } else {
        setDoctorReport(null);
      }
    } else {
      setDoctorReport(null);
    }
  }, [activeSubmittedCaseId, currentUser, submitSuccess]);

  const activePrediction = (predictionResult && predictionResult.riskScore > 0)
    ? predictionResult
    : previousCasePrediction;

  const displaySymptomNames = (selectedSymptomNames && selectedSymptomNames.length > 0)
    ? selectedSymptomNames
    : (activePrediction?.symptoms || ['Chest Pain or Pressure', 'Rapid Heart Rate / Palpitations']);

  // Ensure health recommendations are always loaded/fetched if missing
  useEffect(() => {
    if (activePrediction && activePrediction.primaryCondition) {
      if (activePrediction.recommendations) {
        setFetchedRecs(activePrediction.recommendations);
      } else {
        db.getRecommendations({
          predictedDisease: activePrediction.primaryCondition,
          riskLevel: activePrediction.riskLevel || 'Moderate',
          severity: severity || activePrediction.severity || 'Moderate',
          selectedSymptomIds: displaySymptomNames
        }).then(recs => {
          if (recs) setFetchedRecs(recs);
        });
      }
    }
  }, [activePrediction, displaySymptomNames, severity]);

  if (!activePrediction || activePrediction.riskScore === 0) {
    return (
      <div className="card glass-panel fade-in text-center empty-assessment">
        <Cpu size={48} className="icon-faded" />
        <h4>AI Risk Assessment & Diagnostic Report</h4>
        <p className="text-muted">Enter symptoms or select disease options on the left and click "Submit".</p>
      </div>
    );
  }

  const {
    riskScore,
    riskLevel,
    severity: resSeverity = severity || activePrediction.severity || 'Moderate',
    primaryCondition,
    recommendedSpecialty,
    modelProbability = 85,
    matchedConditions = [],
    urgency,
    warnings = [],
    disclaimer = "⚠️ Disclaimer: This AI prediction is an informational risk assessment and not an official medical diagnosis. Please consult a doctor for official clinical diagnosis.",
    summary
  } = activePrediction;

  const defaultRecs = {
    primaryCare: "Maintain physical rest, keep a log of your symptoms and temperature, and consult a qualified physician.",
    lifestyleAdvice: "Ensure 7-8 hours of quality sleep daily. Avoid overexertion, tobacco smoke, and sudden cold air exposure.",
    dietaryGuidance: "Maintain good hydration (2-3 liters of clean water daily) and consume balanced, nutrient-rich foods.",
    warningSigns: "Seek prompt medical consultation if symptoms persist, worsen, or cause severe discomfort.",
    urgencyAlert: `Advisory for ${primaryCondition || 'Condition'}: Follow supportive care guidelines below.`,
    disclaimer: "AI-Generated Health Advisory: Supportive wellness guidance (Not an official medical prescription)."
  };

  const recommendations = fetchedRecs || activePrediction.recommendations || defaultRecs;

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return '#f43f5e';
      case 'High': return '#f97316';
      case 'Moderate': return '#eab308';
      default: return '#10b981';
    }
  };

  const handleCaseSubmit = () => {
    setSubmitting(true);
    setSubmitSuccess('');

    try {
      const profile = db.getProfile(currentUser.id);
      const newCase = db.createCase({
        patientId: currentUser.id,
        patientName: `${currentUser.firstName} ${currentUser.lastName}`,
        patientAge: profile.age || 30,
        patientGender: profile.gender || 'Male',
        symptoms: displaySymptomNames,
        severity: resSeverity,
        duration: duration || '1-3 days',
        riskScore,
        riskLevel,
        predictedCondition: primaryCondition,
        summary,
        specialty: recommendedSpecialty
      });

      setActiveSubmittedCaseId(newCase.id || newCase._id);
      setSubmitSuccess(`Case #${newCase.id || newCase._id} successfully submitted to Dr. ${recommendedSpecialty}! Case is now visible in patient_cases.`);
      if (onCaseSubmitted) onCaseSubmitted(newCase);
    } catch (err) {
      alert('Failed to submit case: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <div className="card glass-panel fade-in highlight-card">
      {/* Header Banner */}
      <div className="card-header border-bottom flex-wrap">
        <div>
          <h3><Cpu className="icon-header glow-icon" /> AI Risk Assessment & Predictions</h3>
          <p className="card-subtitle">Real-time Risk Index, Entered Symptoms, Predicted Disease & Diagnostic Report</p>
        </div>

        <div className="header-actions flex-gap">
          <span className={`urgency-badge ${riskLevel.toLowerCase()}`}>
            {urgency}
          </span>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="btn-secondary btn-md no-print"
            title="Download / Print Diagnostic Report Paper"
          >
            <Download size={16} color="#06b6d4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="alert-banner alert-success margin-top-xs no-print flex-between flex-wrap">
          <div className="flex-gap">
            <CheckCircle size={18} />
            <span>{submitSuccess}</span>
          </div>
          {onNavigateToHistory && (
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="btn-primary btn-sm flex-gap"
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}
            >
              <span>View Case in History →</span>
            </button>
          )}
        </div>
      )}


      {/* --- MEDICAL DIAGNOSIS DISCLAIMER BANNER --- */}
      <div className="disclaimer-banner margin-top-xs no-print">
        <Info size={18} className="info-icon" />
        <span>{disclaimer}</span>
      </div>

      {/* --- SECTION 1: RISK INDEX & MODEL PREDICTION --- */}
      <div className="risk-display-hero no-print">
        {/* Risk Index Gauge */}
        <div className="gauge-container">
          <svg className="gauge-svg" viewBox="0 0 100 100">
            <circle className="gauge-bg" cx="50" cy="50" r="42" />
            <circle
              className="gauge-progress"
              cx="50"
              cy="50"
              r="42"
              stroke={getRiskColor(riskLevel)}
              strokeDasharray="264"
              strokeDashoffset={264 - (264 * riskScore) / 100}
            />
          </svg>
          <div className="gauge-text">
            <span className="score-num" style={{ color: getRiskColor(riskLevel) }}>{riskScore}%</span>
            <span className="score-label">Risk Index</span>
          </div>
        </div>

        {/* Predicted Disease & Model Probability */}
        <div className="risk-summary-details">
          <div className="level-heading flex-wrap">
            <span className="level-title">Assessed Risk & Severity:</span>
            <span className={`risk-pill ${riskLevel.toLowerCase()}`} style={{ backgroundColor: `${getRiskColor(riskLevel)}22`, color: getRiskColor(riskLevel), borderColor: getRiskColor(riskLevel) }}>
              {riskLevel} Risk ({resSeverity} Severity)
            </span>
          </div>

          <div className="primary-diagnosis margin-top-xs">
            <span className="label-tiny">Primary Predicted Disease Condition</span>
            <h4 className="condition-name text-highlight">
              {primaryCondition} <span className="prob-badge">{modelProbability}% Probability</span>
            </h4>
          </div>

          <div className="specialty-recommendation margin-top-xs">
            <Stethoscope size={16} color="#06b6d4" />
            <span>Target Specialist: <strong>Dr. {recommendedSpecialty}</strong></span>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: ENTERED SYMPTOMS LIST --- */}
      <div className="entered-symptoms-section margin-top border-glass padding-sm border-radius-md no-print">
        <h5 className="section-title text-muted margin-bottom-xs">
          📌 Symptoms Entered by Patient ({displaySymptomNames.length}):
        </h5>
        <div className="symptoms-chips-container">
          {displaySymptomNames.length === 0 ? (
            <span className="text-dim text-xs">General Symptoms</span>
          ) : (
            displaySymptomNames.map((sym, idx) => (
              <span key={idx} className="disease-option-chip active">
                {sym}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="warning-box margin-top-xs no-print">
          {warnings.map((w, idx) => (
            <div key={idx} className="warning-item">
              <ShieldAlert size={18} className="warning-icon" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* --- SECTION 3: AI HEALTH & TREATMENT RECOMMENDATIONS ADVISORY CARD --- */}
      {recommendations && (
        <div className="health-recommendations-card margin-top-xs padding-sm border-glass border-radius-md no-print" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
          <h5 className="section-title flex-gap text-highlight" style={{ color: '#06b6d4' }}>
            <Lightbulb size={18} color="#06b6d4" /> AI Health & Supportive Treatment Recommendations
          </h5>

          {recommendations.urgencyAlert && (
            <div className="alert-banner alert-info margin-top-xs text-xs">
              <Info size={14} />
              <span>{recommendations.urgencyAlert}</span>
            </div>
          )}

          <div className="grid-2-col margin-top-xs text-xs">
            {/* Primary Self Care */}
            <div className="rec-box padding-xs background-dark border-radius-sm">
              <span className="font-bold flex-gap" style={{ color: '#10b981' }}>
                <Pill size={14} /> Supportive Self-Care & Relief:
              </span>
              <p className="margin-top-xs text-dim">{recommendations.primaryCare}</p>
            </div>

            {/* Lifestyle Advice */}
            <div className="rec-box padding-xs background-dark border-radius-sm">
              <span className="font-bold flex-gap" style={{ color: '#a855f7' }}>
                <Compass size={14} /> Lifestyle & Environment Adjustments:
              </span>
              <p className="margin-top-xs text-dim">{recommendations.lifestyleAdvice}</p>
            </div>

            {/* Dietary Guidance */}
            <div className="rec-box padding-xs background-dark border-radius-sm">
              <span className="font-bold flex-gap" style={{ color: '#f59e0b' }}>
                <Utensils size={14} /> Dietary Guidance & Hydration:
              </span>
              <p className="margin-top-xs text-dim">{recommendations.dietaryGuidance}</p>
            </div>

            {/* Red Flag Warning Signs */}
            <div className="rec-box padding-xs background-dark border-radius-sm">
              <span className="font-bold flex-gap" style={{ color: '#f43f5e' }}>
                <AlertTriangle size={14} /> Red-Flag Warning Signs:
              </span>
              <p className="margin-top-xs text-dim">{recommendations.warningSigns}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION 3.5: AI HEALTH ADVISORY DOSSIER CARD (TASK 4 ADVISORY WORKFLOW) --- */}
      {activePrediction?.healthAdvisory && (
        <div className="health-advisory-dossier-card margin-top-xs padding-sm border-glass border-radius-md no-print" style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.35)' }}>
          <h5 className="section-title flex-gap text-highlight" style={{ color: '#a855f7' }}>
            <Stethoscope size={18} color="#a855f7" /> {activePrediction.healthAdvisory.advisoryTitle || 'AI Health Advisory Dossier'}
          </h5>

          <p className="text-2xs text-muted margin-top-2xs font-bold" style={{ color: '#eab308' }}>
            {activePrediction.healthAdvisory.disclaimer}
          </p>

          <div className="grid-2-col margin-top-xs text-xs gap-xs">
            <div className="padding-xs background-dark border-radius-sm">
              <strong style={{ color: '#a855f7' }}>Clinical Triage Pathway & Action Step:</strong>
              <p className="margin-top-2xs font-bold text-warning">{activePrediction.healthAdvisory.triageCategory}</p>
              <p className="margin-top-2xs text-dim">{activePrediction.healthAdvisory.recommendedActionStep}</p>
            </div>

            <div className="padding-xs background-dark border-radius-sm">
              <strong style={{ color: '#06b6d4' }}>Recommended Vitals & Parameters Monitoring:</strong>
              <ul className="margin-top-2xs text-dim" style={{ paddingLeft: '1rem', margin: 0 }}>
                {(activePrediction.healthAdvisory.monitoringParameters || []).map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}


      {/* Differential Matches */}
      <div className="matched-conditions-section margin-top-xs no-print">
        <h5 className="section-title"><Activity size={16} /> Differential Disease Probabilities</h5>
        <div className="condition-bars">
          {matchedConditions.map((cond, idx) => (
            <div key={idx} className="condition-bar-item">
              <div className="condition-bar-header">
                <span className="cond-name">{cond.condition}</span>
                <span className="cond-pct">{cond.matchPercentage}% probability</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${cond.matchPercentage}%`, backgroundColor: getRiskColor(riskLevel) }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECTION 4: ACTION BUTTONS --- */}
      <div className="action-buttons-group margin-top padding-top border-top flex-gap no-print">
        {/* SUBMIT BUTTON */}
        <button
          type="button"
          onClick={handleCaseSubmit}
          disabled={submitting}
          className="btn-success btn-lg flex-1 pulse-glow"
        >
          <Send size={18} /> {submitting ? 'Submitting...' : `Submit Case to Dr. ${recommendedSpecialty}`}
        </button>

        {/* VIEW REPORT CARD BUTTON */}
        <button
          type="button"
          onClick={() => setShowReportModal(!showReportModal)}
          className="btn-secondary btn-lg flex-1"
        >
          <FileText size={18} color="#06b6d4" />
          <span>{showReportModal ? 'Hide Report Card' : 'View Report Card'}</span>
          {showReportModal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* DOWNLOAD REPORT BUTTON */}
        <button
          type="button"
          onClick={handleDownloadReport}
          className="btn-primary btn-lg flex-1"
        >
          <Printer size={18} />
          <span>Download Report Card</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* --- ON-SCREEN DISPLAY REPORT CARD (VISIBLE WHEN CLICKING VIEW REPORT CARD) --- */}
      {/* ===================================================================== */}
      {showReportModal && (
        <div className="doctor-report-dropdown-container margin-top slide-down no-print">
          <div className="official-doctor-report-card glass-panel fade-in padding-md border-primary" style={{ border: '1px solid rgba(6, 182, 212, 0.4)' }}>
            {/* Card Header & Download Button */}
            <div className="report-card-header border-bottom padding-bottom-xs flex-between">
              <div className="doc-report-title">
                <FileText size={24} color="#06b6d4" />
                <div>
                  <h4 style={{ color: '#06b6d4' }}>MediAI Patient Diagnostic Report Card</h4>
                  <span className="doc-name-subtitle">
                    Official AI Medical Assessment & Patient Profile Summary
                  </span>
                </div>
              </div>

              <div className="flex-gap">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="btn-primary btn-sm flex-gap"
                  title="Download or Print this Medical Report Card"
                >
                  <Download size={14} />
                  <span>Download / Print Report</span>
                </button>
              </div>
            </div>

            {/* Card Body */}
            <div className="report-card-body margin-top-xs">
              {/* 1. DETAILS OF PERSON */}
              <div className="report-section margin-top-xs padding-xs background-dark border-radius-sm">
                <span className="report-section-label" style={{ color: '#06b6d4' }}>
                  <User size={15} /> 1. Patient Profile Details:
                </span>
                <div className="grid-3-col margin-top-xs text-xs">
                  <div><strong>Full Name:</strong> {currentUser?.firstName || 'Alex'} {currentUser?.lastName || 'Morgan'}</div>
                  <div><strong>Age:</strong> {patientProfile.age || 30} yrs</div>
                  <div><strong>Gender:</strong> {patientProfile.gender || 'Male'}</div>
                  <div><strong>Blood Group:</strong> {patientProfile.bloodType || 'O+'}</div>
                  <div><strong>Contact Phone:</strong> {patientProfile.phone || 'Not specified'}</div>
                  <div><strong>Emergency Contact:</strong> {patientProfile.emergencyContact || 'Not specified'}</div>
                  <div><strong>Allergies:</strong> {patientProfile.allergies || 'None reported'}</div>
                  <div className="col-span-2"><strong>Chronic Conditions:</strong> {patientProfile.chronicConditions || 'None'}</div>
                </div>
              </div>

              {/* 2. GIVEN SYMPTOMS */}
              <div className="report-section margin-top-xs">
                <span className="report-section-label" style={{ color: '#10b981' }}>
                  <CheckSquare size={15} /> 2. Symptoms Entered by Patient ({displaySymptomNames.length}):
                </span>
                <div className="symptoms-chips-container margin-top-xs">
                  {displaySymptomNames.length === 0 ? (
                    <span className="text-dim text-xs">General Symptoms</span>
                  ) : (
                    displaySymptomNames.map((s, i) => (
                      <span key={i} className="disease-option-chip active" style={{ fontSize: '0.78rem' }}>
                        • {s}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* 3. AI RISK ASSESSMENT */}
              <div className="report-section margin-top-xs">
                <span className="report-section-label" style={{ color: '#f59e0b' }}>
                  <HeartPulse size={15} /> 3. AI Risk Assessment & Triage Index:
                </span>
                <div className="padding-xs background-dark border-radius-sm margin-top-xs text-xs">
                  <p>
                    Calculated Risk Index: <strong style={{ color: getRiskColor(riskLevel), fontSize: '1rem' }}>{riskScore}%</strong> —{' '}
                    <span className={`risk-pill ${riskLevel.toLowerCase()}`}>
                      {riskLevel} Risk ({resSeverity} Severity)
                    </span>
                  </p>
                  <p className="margin-top-xs"><strong>Triage Urgency Level:</strong> {urgency}</p>
                  <p className="margin-top-xs"><strong>Recommended Specialist:</strong> Dr. {recommendedSpecialty}</p>
                </div>
              </div>

              {/* 4. WHAT AI PREDICTED AS DISEASE */}
              <div className="report-section margin-top-xs">
                <span className="report-section-label" style={{ color: '#a855f7' }}>
                  <Award size={15} /> 4. AI Predicted Primary Disease & Probabilities:
                </span>
                <div className="padding-xs background-dark border-radius-sm margin-top-xs text-xs">
                  <p className="text-sm text-highlight margin-bottom-xs">
                    <strong>Primary Predicted Disease:</strong> <span className="text-highlight font-bold">{primaryCondition}</span> ({modelProbability}% Match Probability)
                  </p>
                  <span className="text-muted text-xs">Differential Disease Matches:</span>
                  <ul className="margin-top-xs text-xs" style={{ paddingLeft: '1.2rem' }}>
                    {matchedConditions.map((c, idx) => (
                      <li key={idx}>
                        <strong>{c.condition}</strong>: {c.matchPercentage}% confidence (Specialty: {c.specialty})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. AI HEALTH & SUPPORTIVE TREATMENT RECOMMENDATIONS */}
              {recommendations && (
                <div className="report-section margin-top-xs">
                  <span className="report-section-label" style={{ color: '#06b6d4' }}>
                    <Lightbulb size={15} /> 5. AI Health & Supportive Treatment Advisory:
                  </span>
                  <div className="padding-xs background-dark border-radius-sm margin-top-xs text-xs">
                    <p><strong>Supportive Care:</strong> {recommendations.primaryCare}</p>
                    <p className="margin-top-xs"><strong>Lifestyle & Environment:</strong> {recommendations.lifestyleAdvice}</p>
                    <p className="margin-top-xs"><strong>Dietary Guidance:</strong> {recommendations.dietaryGuidance}</p>
                    <p className="margin-top-xs" style={{ color: '#f43f5e' }}><strong>Warning Red Flags:</strong> {recommendations.warningSigns}</p>
                  </div>
                </div>
              )}

              {/* 6. DOCTOR REVIEW & PRESCRIPTION (ONLY APPEARS AFTER DOCTOR HAS REVIEWED THIS SPECIFIC CASE) */}
              {doctorReport ? (
                <div className="report-section margin-top-xs border-top padding-top-xs">
                  <span className="report-section-label" style={{ color: '#06b6d4' }}>
                    <Stethoscope size={15} /> 6. Official Doctor Review & Prescribed Medication (Case #{activeSubmittedCaseId}):
                  </span>
                  <p className="report-text-content text-xs margin-top-xs">
                    <strong>Consulting Doctor:</strong> Dr. {doctorReport.suggestion.doctorName} ({doctorReport.suggestion.doctorSpecialty})<br />
                    <strong>Clinical Diagnosis Notes:</strong> {doctorReport.suggestion.notes}
                  </p>
                  <div className="margin-top-xs padding-xs highlight-prescription border-radius-sm" style={{ background: 'rgba(16, 185, 129, 0.15)', borderLeft: '3px solid #10b981' }}>
                    <span className="text-xs font-bold text-success"><Pill size={13} /> Prescribed Medication & Treatment Plan:</span>
                    <p className="text-xs margin-top-xs">{doctorReport.suggestion.prescription}</p>
                  </div>
                </div>
              ) : (
                <div className="pending-doctor-report-notice margin-top-xs padding-xs text-center border-glass border-radius-md">
                  <Clock size={16} color="#eab308" />
                  <span style={{ fontSize: '0.82rem' }}>
                    Doctor Consultation Status: <strong>{activeSubmittedCaseId ? `Pending review by Dr. ${recommendedSpecialty} (Case #${activeSubmittedCaseId})` : `Not Submitted to Doctor Yet`}</strong>.<br />
                    Click "Submit Case to Dr. {recommendedSpecialty}" above to send your case for official doctor prescription review.
                  </span>
                </div>
              )}

              {/* Card Footer Download Action */}
              <div className="report-card-footer margin-top padding-top-xs border-top flex-between no-print">
                <span className="text-xs text-muted">MediAI Clinical Engine & MongoDB Atlas</span>
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="btn-primary btn-md flex-gap"
                >
                  <Download size={16} />
                  <span>Download Full Report Card (PDF / Print)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* --- OFFICIAL PRINTABLE MEDICAL REPORT PAPER (FOR DOWNLOAD / PRINT) --- */}
      {/* ===================================================================== */}
      <div id="printable-medical-report" className="medical-report-paper">
        {/* Paper Header */}
        <div className="paper-header">
          <div className="paper-brand">
            <h2>MediAI Clinical Diagnostic & Telehealth Report</h2>
            <p>Official AI Medical Risk Assessment & Patient Consultation Document</p>
          </div>
          <div className="paper-doc-id">
            <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
            <span><strong>Time:</strong> {new Date().toLocaleTimeString()}</span>
            <span><strong>Report ID:</strong> RPT-{Date.now().toString().slice(-6)}</span>
          </div>
        </div>

        <hr className="paper-divider" />

        {/* 1. Patient Details */}
        <div className="paper-section">
          <h3 className="paper-section-title">1. Patient Profile Details</h3>
          <table className="paper-table">
            <tbody>
              <tr>
                <td><strong>Full Name:</strong> {currentUser?.firstName || 'Alex'} {currentUser?.lastName || 'Morgan'}</td>
                <td><strong>Age:</strong> {patientProfile.age || 30} yrs</td>
                <td><strong>Gender:</strong> {patientProfile.gender || 'Male'}</td>
              </tr>
              <tr>
                <td><strong>Blood Group:</strong> {patientProfile.bloodType || 'O+'}</td>
                <td><strong>Contact Phone:</strong> {patientProfile.phone || 'Not specified'}</td>
                <td><strong>Emergency Contact:</strong> {patientProfile.emergencyContact || 'Not specified'}</td>
              </tr>
              <tr>
                <td><strong>Known Allergies:</strong> {patientProfile.allergies || 'None reported'}</td>
                <td colSpan="2"><strong>Chronic Conditions:</strong> {patientProfile.chronicConditions || 'None'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Entered Symptoms */}
        <div className="paper-section">
          <h3 className="paper-section-title">2. Patient Reported Symptoms</h3>
          <div className="paper-symptoms-box">
            {displaySymptomNames.map((s, i) => (
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
                <td><span className="paper-highlight-disease">{primaryCondition} ({modelProbability}% Probability)</span></td>
              </tr>
              <tr>
                <td><strong>Calculated Risk Index & Severity:</strong></td>
                <td>
                  <strong style={{ color: getRiskColor(riskLevel), fontSize: '1.1rem' }}>
                    {riskScore}% ({riskLevel} Risk Level, {resSeverity} Severity)
                  </strong>
                </td>
              </tr>
              <tr>
                <td><strong>Recommended Specialist Doctor:</strong></td>
                <td>Dr. {recommendedSpecialty}</td>
              </tr>
              <tr>
                <td><strong>Triage Urgency:</strong></td>
                <td>{urgency}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. AI Health Recommendations */}
        {recommendations && (
          <div className="paper-section">
            <h3 className="paper-section-title">4. AI Health & Supportive Care Advisory</h3>
            <p><strong>Supportive Care:</strong> {recommendations.primaryCare}</p>
            <p><strong>Lifestyle Advice:</strong> {recommendations.lifestyleAdvice}</p>
            <p><strong>Dietary Guidance:</strong> {recommendations.dietaryGuidance}</p>
            <p style={{ color: '#dc2626' }}><strong>Warning Signs:</strong> {recommendations.warningSigns}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="paper-sub-box margin-top-xs" style={{ background: '#fffbe8', border: '1px solid #fef08a', padding: '8px', fontSize: '0.78rem' }}>
          <p><strong>Disclaimer:</strong> {disclaimer}</p>
        </div>

        {/* 5. Doctor Report & Prescription (ONLY IF REVIEWED SPECIFICALLY FOR THIS CASE) */}
        {doctorReport && (
          <div className="paper-section">
            <h3 className="paper-section-title">5. Consulting Doctor Official Report & Prescription</h3>
            <div className="paper-doctor-box">
              <p><strong>Doctor Name:</strong> Dr. {doctorReport.suggestion.doctorName} ({doctorReport.suggestion.doctorSpecialty})</p>
              <p><strong>Clinical Notes:</strong> {doctorReport.suggestion.notes}</p>
              <p className="paper-prescription"><strong>Prescribed Medication:</strong> {doctorReport.suggestion.prescription}</p>
            </div>
          </div>
        )}

        {/* Paper Footer */}
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
    </div>
  );
}
