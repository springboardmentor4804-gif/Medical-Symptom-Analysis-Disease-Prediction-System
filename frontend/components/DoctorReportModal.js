import { motion, AnimatePresence } from 'framer-motion';

export default function DoctorReportModal({ isOpen, onClose, reportData, loading }) {
  const handlePrint = () => {
    window.print();
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
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-sm">
              Dr
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Clinical Consultation Report</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={loading || !reportData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
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
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 dark:border-teal-500/20 border-t-teal-600"></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Compiling Clinical Consultation Report...</p>
            </div>
          ) : reportData ? (
            <div id="printable-doctor-report" className="space-y-8 text-slate-900 dark:text-slate-100 print:text-black">
              
              {/* Document Official Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-300 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-1 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider print:border print:border-teal-600">
                      Medical Consultation Record
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 font-mono">
                      {reportData.report_id}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 print:text-black">
                    Clinical Evaluation & Diagnosis Report
                  </h1>
                </div>
                <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                  <p className="font-bold text-slate-900 dark:text-slate-100 print:text-black text-sm">{reportData.doctor.name}</p>
                  <p className="text-teal-600 dark:text-teal-400 font-semibold">{reportData.doctor.specialty}</p>
                  <p className="mt-1 text-[11px]">Date: {reportData.generated_at}</p>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:bg-slate-50 print:border-slate-300">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 border-b pb-2 border-slate-200/80 dark:border-slate-800">
                  Patient Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Patient Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 print:text-black">{reportData.patient.name}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Age / Gender</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">{reportData.patient.age} yrs / {reportData.patient.gender}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Patient Email</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">{reportData.patient.email}</span>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Pre-existing Conditions & Medical History
                </h3>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-xs sm:text-sm print:border-slate-300">
                  {reportData.patient.medical_history || 'No pre-existing conditions recorded.'}
                </div>
              </div>

              {/* Doctor's Diagnosis & Resolution */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider border-b pb-2 border-teal-200 dark:border-teal-900/50">
                  Clinical Diagnosis & Treatment Plan
                </h3>

                {reportData.latest_recommendation ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">Primary Diagnosis</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-600 text-white">
                          {reportData.latest_recommendation.status}
                        </span>
                      </div>
                      <p className="text-base font-extrabold text-teal-950 dark:text-teal-100 print:text-black">
                        {reportData.latest_recommendation.diagnosis}
                      </p>
                    </div>

                    {reportData.latest_recommendation.recommendations && (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 print:border-slate-300">
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Clinical Recommendations & Advice
                        </h4>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line print:text-black">
                          {reportData.latest_recommendation.recommendations}
                        </p>
                      </div>
                    )}

                    {reportData.latest_recommendation.prescription && (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 print:border-slate-300">
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Prescription / Medication Notes
                        </h4>
                        <p className="text-sm font-mono text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line print:text-black">
                          {reportData.latest_recommendation.prescription}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs italic">
                    No clinical recommendation or diagnosis recorded yet for this patient case.
                  </div>
                )}
              </div>

              {/* Logged Symptoms Summary */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Patient Reported Symptoms Log ({reportData.symptoms.length})
                </h3>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold print:bg-slate-100">
                      <tr>
                        <th className="py-2 px-3">Symptom Description</th>
                        <th className="py-2 px-3 text-center">Occurrences / Frequency</th>
                        <th className="py-2 px-3 text-center">Duration / Onset</th>
                        <th className="py-2 px-3 text-right">Date Logged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportData.symptoms.map((sym) => (
                        <tr key={sym.id}>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 print:text-black">{sym.symptom_name}</td>
                          <td className="py-2 px-3 text-center font-bold text-purple-700 dark:text-purple-300 print:text-black">
                            {sym.occurrence_count || 1} { (sym.occurrence_count || 1) > 1 ? 'Times' : 'Time' }
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 text-xs print:text-black">
                            {sym.duration_onset || 'Just today'}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500 dark:text-slate-400 font-mono">{sym.submitted_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

                  {/* Outcome Risk Meter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-purple-950 dark:text-purple-200 print:text-black">
                        Health Risk Outcome: {reportData.ai_prediction.prediction} Risk
                      </span>
                      <span className="text-purple-700 dark:text-purple-300 print:text-purple-900 font-mono">
                        {reportData.ai_prediction.confidence}% Confidence
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
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

                  <p className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed italic print:text-black">
                    {reportData.ai_prediction.message}
                  </p>
                </div>
              )}

              {/* Doctor Digital Signature Placeholder */}
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end print:border-slate-300 text-xs">
                <div>
                  <p className="text-slate-400">MedAssist AI Health System</p>
                  <p className="text-slate-500">Confidential Medical Document</p>
                </div>
                <div className="text-right">
                  <div className="w-40 border-b border-slate-400 mb-1"></div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 print:text-black">{reportData.doctor.name}</p>
                  <p className="text-slate-500 text-[11px]">Attending Physician Signature</p>
                </div>
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
            MedAssist AI Clinical Evaluation Document
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
