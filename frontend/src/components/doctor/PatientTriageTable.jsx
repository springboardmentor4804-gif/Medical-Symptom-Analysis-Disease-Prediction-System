import React, { useState } from 'react';
import { useMedical } from '../../context/MedicalContext.jsx';
import RiskBadge from '../common/RiskBadge.jsx';
import PatientDetailModal from './PatientDetailModal.jsx';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export default function PatientTriageTable() {
  const { patientLogs } = useMedical();

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [reviewFilter, setReviewFilter] = useState('All');
  const [selectedLogForModal, setSelectedLogForModal] = useState(null);

  const filteredLogs = patientLogs.filter((log) => {
    const matchesSearch =
      (log.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.predictedDisease || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.rawInput || '').toLowerCase().includes(search.toLowerCase());

    const matchesRisk =
      riskFilter === 'All' || (log.riskLevel || '').toLowerCase() === riskFilter.toLowerCase();

    const matchesReview =
      reviewFilter === 'All' ||
      (reviewFilter === 'Reviewed' && log.reviewedByDoctor) ||
      (reviewFilter === 'Pending' && !log.reviewedByDoctor);

    return matchesSearch && matchesRisk && matchesReview;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Assigned Patient Diagnostic Logs & Triage Records
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming symptom presentations, verify AI assessments, and record physician clinical notes
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, disease..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            <option value="All">All Risk Levels</option>
            <option value="High">High Risk Only</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>

          {/* Review Filter */}
          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Awaiting Review</option>
            <option value="Reviewed">Reviewed & Signed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Patient Profile</th>
                <th className="py-3.5 px-4">Evaluation Date</th>
                <th className="py-3.5 px-4">Predicted Condition</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Risk Severity</th>
                <th className="py-3.5 px-4">Case Status</th>
                <th className="py-3.5 px-4 text-right">Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No patient diagnostic records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Patient */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {log.patientName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{log.patientName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{log.patientId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.date}</span>
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="py-4 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {log.predictedDisease}
                    </td>

                    {/* Confidence */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800">{log.confidence}%</span>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <RiskBadge level={log.riskLevel} size="sm" pulse={log.riskLevel === 'High'} />
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {log.reviewedByDoctor ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {log.status || 'Reviewed'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3" />
                          {log.status || 'Pending Review'}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLogForModal(log)}
                        className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect File</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {selectedLogForModal && (
        <PatientDetailModal
          isOpen={!!selectedLogForModal}
          onClose={() => setSelectedLogForModal(null)}
          log={selectedLogForModal}
        />
      )}
    </div>
  );
}
