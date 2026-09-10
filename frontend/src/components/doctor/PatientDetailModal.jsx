import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import RiskBadge from '../common/RiskBadge.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { generateClinicalPdfReport } from '../../services/pdfReportGenerator.js';
import { 
  Download, 
  Stethoscope, 
  Save, 
  User, 
  Activity, 
  ShieldAlert, 
  FileText, 
  HeartHandshake, 
  Clock 
} from 'lucide-react';

export default function PatientDetailModal({ isOpen, onClose, log }) {
  const { updatePatientLog, addToast } = useMedical();

  const [doctorNotes, setDoctorNotes] = useState(log?.doctorNotes || '');
  const [caseStatus, setCaseStatus] = useState(log?.status || 'Awaiting Provider Review');
  const [isSaving, setIsSaving] = useState(false);

  if (!log) return null;

  const handleSaveNotes = (e) => {
    e.preventDefault();
    setIsSaving(true);
    updatePatientLog(log.id, {
      doctorNotes,
      status: caseStatus
    });
    setIsSaving(false);
    onClose();
  };

  const handleDownloadPdf = () => {
    try {
      generateClinicalPdfReport({
        patient: {
          name: log.patientName,
          id: log.patientId,
          age: log.patientAge || 34,
          gender: log.patientGender || 'Not Specified',
          phone: log.patientPhone || '+91 9845123456',
          location: 'Bangalore, India'
        },
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
      addToast('success', 'Clinical report exported successfully.');
    } catch (err) {
      console.error(err);
      addToast('error', 'Error generating PDF report.');
    }
  };

  const advisory = log.treatmentAdvisory || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Clinical File: ${log.patientName}`}
      subtitle={`Triage ID: ${log.id} • Evaluated: ${log.date}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Top Summary Box */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center">
              {log.patientName.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{log.patientName}</h4>
              <p className="text-xs text-slate-500">
                Patient ID: {log.patientId} • Record Date: {log.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RiskBadge level={log.riskLevel} size="md" pulse={log.riskLevel === 'High'} />
            <button
              onClick={handleDownloadPdf}
              className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Diagnosis & Model Confidence */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              AI Primary Diagnostic Evaluation
            </span>
            <span className="text-xs font-extrabold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
              {log.confidence}% Confidence
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900">{log.predictedDisease}</h3>
          {log.description && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.description}</p>
          )}
        </div>

        {/* Presentation & Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Reported Chief Complaint
            </h5>
            <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              "{log.rawInput || 'Selected via interactive symptom checkboxes'}"
            </p>
            <div className="pt-2">
              <span className="font-semibold text-slate-700 block mb-1">Identified Symptom Codes:</span>
              <div className="flex flex-wrap gap-1.5">
                {(log.symptoms || []).map((sym, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                    {sym}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Recorded Biomarker Indicators
            </h5>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Blood Pressure:</span>
                <span className="font-bold text-slate-800">{log.indicators?.bloodPressure || 'Normal'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Fever Profile:</span>
                <span className="font-bold text-slate-800">{log.indicators?.fever || 'Normal'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Breathing Status:</span>
                <span className="font-bold text-slate-800">{log.indicators?.breathing || 'Normal'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cough Severity:</span>
                <span className="font-bold text-slate-800">{log.indicators?.cough || 'None'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Lipid / Cholesterol:</span>
                <span className="font-bold text-slate-800">{log.indicators?.cholesterol || 'Normal'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Clinical Notes & Status Review Editor */}
        <form onSubmit={handleSaveNotes} className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              Physician Clinical Impression & Action Plan
            </h4>
            <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-semibold">
              Provider Verification Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Case Management Status
              </label>
              <select
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              >
                <option value="Awaiting Provider Review">Awaiting Provider Review</option>
                <option value="Under Treatment">Under Treatment (In Progress)</option>
                <option value="Completed">Completed & Discharged</option>
                <option value="Referred to Specialist">Referred to Specialist Hospital</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physician Notes, Rx Guidance & Follow-up Instructions
            </label>
            <textarea
              rows={3}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="e.g. Reviewed ECG and vitals. Prescribed oral antibiotic and advised repeat chest X-ray after 5 days if cough persists..."
              className="w-full p-3 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Sign Off Clinical Note</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
