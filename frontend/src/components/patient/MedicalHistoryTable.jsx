import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import RiskBadge from '../common/RiskBadge.jsx';
import { generateClinicalPdfReport } from '../../services/pdfReportGenerator.js';
import { Download, Search, History, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function MedicalHistoryTable({ onSelectLog }) {
  const { currentUser } = useAuth();
  const { patientLogs, addToast } = useMedical();
  const [search, setSearch] = useState('');

  // Filter logs for current user (or show sample logs for demo patient)
  const userLogs = patientLogs.filter(
    (log) => log.patientId === currentUser?.id || log.patientName === currentUser?.name
  );

  const filteredLogs = userLogs.filter((log) => {
    const q = search.toLowerCase();
    return (
      (log.predictedDisease || '').toLowerCase().includes(q) ||
      (log.rawInput || '').toLowerCase().includes(q) ||
      (log.riskLevel || '').toLowerCase().includes(q) ||
      (log.date || '').includes(q)
    );
  });

  const handleDownloadLogPdf = (e, log) => {
    e.stopPropagation();
    try {
      generateClinicalPdfReport({
        patient: currentUser,
        diagnosticResult: {
          disease: log.predictedDisease,
          diseaseCategory: log.diseaseCategory || 'Clinical Triage',
          confidence: log.confidence,
          riskLevel: log.riskLevel,
          treatmentAdvisory: log.treatmentAdvisory || {}
        },
        symptomsList: log.symptoms || [],
        indicators: log.indicators || {}
      });
      addToast('success', `Exported clinical PDF for ${log.predictedDisease}`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Diagnostic History & Triage Records
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete longitudinal log of AI symptom assessments, clinical risk evaluations, and physician reviews
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search condition, risk..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No Past Diagnostic Records Found</h3>
          <p className="text-xs text-slate-500">
            Use the Symptom Checker to run an AI-assisted evaluation and save your first clinical record.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Evaluation Date</th>
                  <th className="py-3.5 px-4">Reported Symptoms & Indicators</th>
                  <th className="py-3.5 px-4">Predicted Condition</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4">Physician Status</th>
                  <th className="py-3.5 px-4 text-right">PDF Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                    onClick={() => onSelectLog && onSelectLog(log)}
                  >
                    {/* Date */}
                    <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.date}</span>
                      </div>
                    </td>

                    {/* Symptoms & Indicators */}
                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 line-clamp-1">
                        {log.rawInput || 'Clinical indicators survey'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.indicators?.bloodPressure !== 'Normal' && log.indicators?.bloodPressure && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                            BP: {log.indicators.bloodPressure}
                          </span>
                        )}
                        {log.indicators?.fever !== 'Normal' && log.indicators?.fever && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                            Fever: {log.indicators.fever}
                          </span>
                        )}
                        {log.indicators?.breathing !== 'Normal' && log.indicators?.breathing && (
                          <span className="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded font-bold border border-cyan-200">
                            Breathing: {log.indicators.breathing}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Predicted Disease */}
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {log.predictedDisease}
                    </td>

                    {/* Confidence */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${log.confidence}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800">{log.confidence}%</span>
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <RiskBadge level={log.riskLevel} size="sm" pulse={log.riskLevel === 'High'} />
                    </td>

                    {/* Review Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {log.reviewedByDoctor ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Reviewed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                    </td>

                    {/* Download PDF Action */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadLogPdf(e, log)}
                        className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
                        title="Download official PDF report"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
