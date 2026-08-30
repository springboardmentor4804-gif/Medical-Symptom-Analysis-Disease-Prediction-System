'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

export default function PatientReportModal({ isOpen, onClose, reportData, loading }) {
  const handlePrint = async () => {
    try {
      await api.downloadFile('/patients/me/report', 'Vitals_AI_Clinical_Report.pdf');
    } catch (e) {
      window.print();
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:inset-auto">
          {/* Animated Glassmorphism Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 print:shadow-none print:border-none print:w-full print:max-w-none print:my-0 z-10"
          >
        
        {/* Top Header Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm">
              M
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">MedAssist AI Medical Report</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={loading || !reportData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body / Report Document */}
        <div className="p-6 sm:p-10 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-8">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-600"></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Compiling Medical Report...</p>
            </div>
          ) : reportData ? (
            <div id="printable-report" className="space-y-8 text-slate-900 dark:text-slate-100 print:text-black">
              
              {/* Document Official Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-300 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider print:border print:border-emerald-600">
                      Official Health Record
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 font-mono">
                      {reportData.report_id}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 print:text-black">
                    Patient Comprehensive Health Summary
                  </h1>
                </div>
                <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 print:text-black">MedAssist AI Health System</p>
                  <p>Generated: {reportData.generated_at}</p>
                </div>
              </div>

              {/* Patient Demographics Card */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:bg-slate-50 print:border-slate-300">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b pb-2 border-slate-200/80 dark:border-slate-800">
                  Patient Demographics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Full Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 print:text-black">{reportData.patient.name}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Age</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">{reportData.patient.age} yrs</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Gender</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">{reportData.patient.gender}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Account Email</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black truncate block">{reportData.patient.email}</span>
                  </div>
                </div>
              </div>

              {/* Medical History Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Patient Medical History & Pre-existing Conditions
                </h3>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-sm print:border-slate-300">
                  {reportData.patient.medical_history ? (
                    <p className="text-slate-800 dark:text-slate-200 print:text-black leading-relaxed whitespace-pre-line">
                      {reportData.patient.medical_history}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic text-xs">No prior medical history or chronic conditions recorded.</p>
                  )}
                </div>
              </div>

              {/* Recorded Symptoms Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Symptom Log History ({reportData.total_symptoms})
                  </h3>
                </div>
                {reportData.symptoms.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">
                    No symptoms submitted.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 print:bg-slate-100">
                        <tr>
                          <th className="py-2.5 px-4">#</th>
                          <th className="py-2.5 px-4">Symptom Description</th>
                          <th className="py-2.5 px-4 text-center">Occurrences / Frequency</th>
                          <th className="py-2.5 px-4 text-center">Duration / Onset</th>
                          <th className="py-2.5 px-4 text-right">Logged Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 print:divide-slate-200">
                        {reportData.symptoms.map((s, idx) => (
                          <tr key={s.id}>
                            <td className="py-2.5 px-4 text-slate-400 text-xs">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100 print:text-black">{s.symptom_name}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-purple-700 dark:text-purple-300 print:text-black">
                              {s.occurrence_count || 1} { (s.occurrence_count || 1) > 1 ? 'Times' : 'Time' }
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-600 dark:text-slate-400 text-xs print:text-black">
                              {s.duration_onset || 'Just today'}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-500 dark:text-slate-400 font-mono text-xs print:text-black">{formatDate(s.submitted_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* AI DISEASE & OUTCOME RISK PREDICTION CARD */}
              {reportData.ai_prediction && (
                <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-4 print:border-purple-600 print:bg-purple-50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-2 print:text-black">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 print:text-purple-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Health Risk & Disease Prediction Breakdown
                    </h4>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 print:border">
                      RandomForest ML Model
                    </span>
                  </div>

                  {/* Outcome Risk Meter */}
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400 print:text-purple-900">
                        AI Machine Learning Health Risk Analysis ({reportData.ai_prediction.model_name})
                      </span>
                      <h4 className="text-lg font-black text-purple-950 dark:text-purple-100 print:text-black">
                        Outcome Prediction: {reportData.ai_prediction.prediction} Risk ({reportData.ai_prediction.confidence}% Confidence)
                      </h4>
                    </div>

                    {reportData.ai_prediction.triage_level && (
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        reportData.ai_prediction.triage_level === 'CRITICAL EMERGENCY'
                          ? 'bg-rose-600 text-white border border-rose-700'
                          : reportData.ai_prediction.triage_level === 'SEVERE RISK'
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        Triage: {reportData.ai_prediction.triage_level}
                      </span>
                    )}
                  </div>

                  {/* EMERGENCY CARE DIRECTIVE & TIMEFRAME */}
                  {reportData.ai_prediction.emergency_action_directive && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-xs font-bold space-y-1 print:bg-white print:border-purple-300">
                      <span className="text-[10px] font-extrabold uppercase text-purple-600 dark:text-purple-400 block">
                        Recommended Action Directive ({reportData.ai_prediction.urgency_timeframe}):
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 print:text-black">
                        {reportData.ai_prediction.emergency_action_directive}
                      </p>
                    </div>
                  )}

                  {/* Outcome Probability Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Health Risk Outcome Score</span>
                      <span>{reportData.ai_prediction.outcome_probability}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-purple-200/60 dark:bg-purple-900/60 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full ${
                          reportData.ai_prediction.prediction === 'Positive' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(reportData.ai_prediction.outcome_probability, 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* MULTI-ORGAN SYSTEM RISK BREAKDOWN */}
                  {reportData.ai_prediction.organ_system_risks && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block print:text-black">
                        Multi-Organ System Risk Breakdown:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(reportData.ai_prediction.organ_system_risks).map(([sys, rPct]) => (
                          <div key={sys} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 text-xs print:bg-white print:border-purple-300">
                            <span className="text-slate-500 font-bold text-[10px] block">{sys}</span>
                            <span className={`font-mono text-xs font-black ${rPct >= 65 ? 'text-rose-600' : rPct >= 35 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {rPct}% Risk
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Predicted Diseases Table */}
                  {reportData.ai_prediction.top_diseases && reportData.ai_prediction.top_diseases.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block print:text-black">
                        Probable Condition Match Likelihood:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {reportData.ai_prediction.top_diseases.map((d, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 text-xs print:bg-white print:border-purple-300">
                            <span className="text-slate-400 font-mono text-[10px] block">Rank #{i + 1}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block truncate print:text-black">{d.disease}</span>
                            <span className="text-purple-600 dark:text-purple-400 font-mono text-[11px] font-semibold">{d.probability}% Match</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Measured Vital Readings Breakdown */}
                  {reportData.ai_prediction.vital_analysis && Object.keys(reportData.ai_prediction.vital_analysis).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block print:text-black">
                        Measured Quantitative Vital Signs:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(reportData.ai_prediction.vital_analysis).map(([k, v]) => (
                          <div key={k} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold print:bg-white print:border-slate-300">
                            <span className="text-slate-400 font-mono text-[9px] block uppercase">{k.replace('_', ' ')}</span>
                            <span className="text-slate-900 dark:text-slate-100 print:text-black">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed italic print:text-black">
                    {reportData.ai_prediction.message}
                  </p>
                </div>
              )}

              {/* Assessment Summary Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 print:border-emerald-600">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-1">
                  Health System Summary & Recommendation
                </h4>
                <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium print:text-black">
                  {reportData.health_status_summary}
                </p>
              </div>

              {/* Document Disclaimer */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center print:text-slate-600">
                This document is automatically generated by MedAssist AI for patient record keeping. It should be presented to a qualified medical practitioner for formal clinical evaluation.
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">
              Failed to load report data. Please try again.
            </div>
          )}
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            MedAssist AI Medical Health Report
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
