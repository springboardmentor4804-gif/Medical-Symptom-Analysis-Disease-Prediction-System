'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import DoctorReportModal from '../../../../components/DoctorReportModal';
import { api } from '../../../../lib/api';

export default function DoctorPatientHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id;

  const [symptoms, setSymptoms] = useState([]);
  const [patient, setPatient] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recommendation form state
  const [recFormData, setRecFormData] = useState({
    diagnosis: '',
    recommendations: '',
    prescription: '',
    status: 'Solved'
  });
  const [submittingRec, setSubmittingRec] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Doctor Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchPatientData = async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');

    try {
      const [patientList, history, recList, aiList, predData] = await Promise.all([
        api.get('/doctor/patients'),
        api.get(`/doctor/patients/${patientId}/symptoms`),
        api.get(`/doctor/patients/${patientId}/recommendations`),
        api.get(`/doctor/patients/${patientId}/ai-assist`).catch(() => []),
        api.get(`/doctor/patients/${patientId}/prediction`).catch(() => null),
      ]);

      const matchedPatient = patientList.find((item) => String(item.id) === String(patientId)) || null;
      setPatient(matchedPatient);
      setSymptoms(Array.isArray(history) ? history : []);
      setRecommendations(Array.isArray(recList) ? recList : []);
      setAiSuggestions(Array.isArray(aiList) ? aiList : []);
      setMlPrediction(predData);
    } catch (err) {
      setError(err.message || 'Failed to load patient history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const handleRecChange = (e) => {
    setRecFormData({ ...recFormData, [e.target.name]: e.target.value });
  };

  const handleRecSubmit = async (e) => {
    e.preventDefault();
    if (!recFormData.diagnosis.trim()) {
      setSubmitError('Please enter a diagnosis.');
      return;
    }

    setSubmittingRec(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const newRec = await api.post(`/doctor/patients/${patientId}/recommendations`, recFormData);
      setRecommendations([newRec, ...recommendations]);
      setSubmitSuccess(true);
      setRecFormData({
        diagnosis: '',
        recommendations: '',
        prescription: '',
        status: 'Solved'
      });
      fetchPatientData(); // Refresh case status
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit recommendation.');
    } finally {
      setSubmittingRec(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsReportModalOpen(true);
    setReportLoading(true);
    try {
      const report = await api.get(`/doctor/patients/${patientId}/report`);
      setReportData(report);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const fillDiagnosisFromAI = (diseaseName) => {
    setRecFormData((prev) => ({ ...prev, diagnosis: diseaseName }));
  };

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <div className="flex-1 px-4 sm:px-6 py-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <button
                type="button"
                onClick={() => router.push('/doctor')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline mb-2"
              >
                ← Back to Doctor Dashboard
              </button>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Patient Case Review & Treatment Plan</h1>
            </div>

            <button
              onClick={handleGenerateReport}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Generate Clinical Report
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Patient Info Card */}
          {patient && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Patient Demographics</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  patient.case_status === 'Solved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  Status: {patient.case_status || 'Pending Review'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-slate-500 uppercase font-semibold">Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{patient.name}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase font-semibold">Age / Gender</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{patient.age} yrs / {patient.gender}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-slate-500 uppercase font-semibold">Email</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">{patient.email}</span>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-sm">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">Pre-existing Medical History:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {patient.medical_history || 'No recorded chronic conditions or allergies.'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Symptoms & AI Diagnostics */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Reported Symptoms */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                  Reported Symptoms ({symptoms.length})
                </h3>
                {loading ? (
                  <div className="py-8 flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  </div>
                ) : symptoms.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No symptoms submitted yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {symptoms.map((s) => (
                      <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{s.symptom_name}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">{new Date(s.submitted_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RANDOMFOREST ML DISEASE PREDICTION CARD FOR DOCTORS */}
              {mlPrediction && (
                <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/80 to-indigo-50/40 dark:from-purple-950/40 dark:to-slate-900 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-300">
                        RandomForest AI Patient Prediction
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      ML Classifier
                    </span>
                  </div>

                  {/* Outcome Risk Score */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700 dark:text-slate-300">
                        Predicted Risk: {mlPrediction.prediction} Risk
                      </span>
                      <span className="text-purple-600 dark:text-purple-400 font-mono">
                        {mlPrediction.confidence}% Confidence
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          mlPrediction.prediction === 'Positive' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(mlPrediction.outcome_probability, 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Top Predicted Diseases */}
                  {mlPrediction.top_diseases && mlPrediction.top_diseases.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                        Top Predicted Diseases:
                      </span>
                      <div className="space-y-2">
                        {mlPrediction.top_diseases.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 text-xs flex items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.disease}</span>
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-semibold">{item.probability}% Probability</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => fillDiagnosisFromAI(item.disease)}
                              className="px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-semibold text-[10px] transition-colors shrink-0"
                            >
                              + Use as Diagnosis
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Diagnostic Assistant Widget */}
              <div className="rounded-2xl border border-teal-200 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 dark:from-teal-950/30 dark:to-slate-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-teal-600 text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 01-6.23-.693L4.2 13.9" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-extrabold text-teal-950 dark:text-teal-200 uppercase tracking-wide">
                    AI Diagnostic Assist
                  </h3>
                </div>
                <p className="text-xs text-teal-800 dark:text-teal-300 mb-4 leading-relaxed">
                  Calculated potential disease matches based on reference symptom dataset:
                </p>

                {aiSuggestions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No AI matches found.</p>
                ) : (
                  <div className="space-y-3">
                    {aiSuggestions.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/40 text-xs shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.disease}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                            {item.match_score}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-2">Matched: {item.matched_symptoms.join(', ')}</p>
                        <button
                          type="button"
                          onClick={() => fillDiagnosisFromAI(item.disease)}
                          className="w-full text-center py-1 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-semibold text-[11px] transition-colors"
                        >
                          + Use as Diagnosis
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Doctor Solve Case & Recommendation Form + Consultation History */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Solve Case Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Solve Case & Provide Doctor Recommendation</h3>
                </div>

                {submitSuccess && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    ✓ Recommendation and treatment plan saved successfully! Case status updated.
                  </div>
                )}

                {submitError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs font-semibold text-red-700 dark:text-red-300">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleRecSubmit} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Primary Diagnosis / Clinical Findings *
                    </label>
                    <input
                      type="text"
                      name="diagnosis"
                      required
                      value={recFormData.diagnosis}
                      onChange={handleRecChange}
                      placeholder="e.g. Acute Bronchitis, Migraine, Hypertension"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-950 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Doctor Recommendations & Lifestyle Advice
                    </label>
                    <textarea
                      name="recommendations"
                      rows={3}
                      value={recFormData.recommendations}
                      onChange={handleRecChange}
                      placeholder="e.g. Rest for 3 days, increase fluid intake, follow up in 1 week if symptoms persist..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-950 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Prescription / Medication Notes (Optional)
                    </label>
                    <textarea
                      name="prescription"
                      rows={2}
                      value={recFormData.prescription}
                      onChange={handleRecChange}
                      placeholder="e.g. Paracetamol 500mg - 1 tablet every 8 hours as needed."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-950 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 resize-none font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Update Case Status
                      </label>
                      <select
                        name="status"
                        value={recFormData.status}
                        onChange={handleRecChange}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-950 dark:text-slate-100 focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="Solved">Resolved / Case Solved</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Pending">Pending Evaluation</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={submittingRec}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                      >
                        {submittingRec ? 'Saving...' : '✓ Submit & Solve Case'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Consultation Recommendations History */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                  Doctor Consultation History ({recommendations.length})
                </h3>

                {recommendations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No clinical recommendations logged yet for this patient.</p>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-800">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{rec.doctor_name}</span>
                            <span className="text-xs text-teal-600 dark:text-teal-400 ml-2">({rec.doctor_specialty})</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">{rec.created_at}</span>
                        </div>

                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Diagnosis: </span>
                          <span className="font-extrabold text-teal-700 dark:text-teal-300">{rec.diagnosis}</span>
                        </div>

                        {rec.recommendations && (
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Recommendations:</span>
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">{rec.recommendations}</p>
                          </div>
                        )}

                        {rec.prescription && (
                          <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Prescription:</span>
                            <p className="font-mono text-slate-800 dark:text-slate-200 text-xs">{rec.prescription}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Doctor Clinical Report Modal */}
        <DoctorReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportData={reportData}
          loading={reportLoading}
        />
      </div>
    </ProtectedRoute>
  );
}