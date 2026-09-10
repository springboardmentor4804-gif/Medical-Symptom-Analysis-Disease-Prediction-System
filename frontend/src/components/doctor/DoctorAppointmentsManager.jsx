import React, { useState } from 'react';
import { useMedical } from '../../context/MedicalContext.jsx';
import Modal from '../common/Modal.jsx';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Check, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  FileText, 
  Video, 
  Building 
} from 'lucide-react';

export default function DoctorAppointmentsManager() {
  const { appointments, updateAppointment } = useMedical();

  const [statusFilter, setStatusFilter] = useState('All');
  const [activeAppointmentForAction, setActiveAppointmentForAction] = useState(null);
  const [actionType, setActionType] = useState('Accepted'); // 'Accepted' | 'Rejected'
  const [timeSlot, setTimeSlot] = useState('10:30 AM');
  const [doctorRemarks, setDoctorRemarks] = useState('');

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'All') return true;
    return apt.status === statusFilter;
  });

  const handleOpenActionModal = (apt, type) => {
    setActiveAppointmentForAction(apt);
    setActionType(type);
    setTimeSlot(apt.timeSlot || '10:00 AM');
    setDoctorRemarks(
      type === 'Accepted'
        ? 'Confirmed. Please bring your recent diagnostic tests and arrive 10 minutes prior.'
        : 'Unfortunately the requested consultation slot is unavailable. Please reschedule.'
    );
  };

  const handleConfirmAction = (e) => {
    e.preventDefault();
    if (!activeAppointmentForAction) return;

    updateAppointment(activeAppointmentForAction.id, {
      status: actionType,
      timeSlot,
      doctorRemarks
    });

    setActiveAppointmentForAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Consultation Booking & Triage Intake Requests
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review patient consultation requests, assign available time slots, and issue preparatory clinical notes
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {['All', 'Pending', 'Accepted', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No appointments found under the "{statusFilter}" filter.
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const isPending = apt.status === 'Pending';
            const isAccepted = apt.status === 'Accepted';
            const isRejected = apt.status === 'Rejected';

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top line: Patient name + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                        {apt.patientName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{apt.patientName}</h4>
                        <p className="text-xs text-slate-500">
                          {apt.patientAge} yrs • {apt.patientGender} • Tel: {apt.patientPhone || '9845123456'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isAccepted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isPending
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isAccepted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isPending && <Clock3 className="w-3.5 h-3.5" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5" />}
                      <span>{apt.status}</span>
                    </span>
                  </div>

                  {/* Date & Mode info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900">{apt.timeSlot}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-slate-600">
                      {apt.meetingType?.includes('Video') ? (
                        <Video className="w-3.5 h-3.5 text-indigo-500" />
                      ) : (
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{apt.meetingType || 'In-Clinic Consultation'}</span>
                    </div>
                  </div>

                  {/* Reason for visit */}
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 block mb-0.5">Clinical Chief Concern:</span>
                    <p className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 italic">
                      "{apt.reason || 'Symptom triage consultation'}"
                    </p>
                  </div>

                  {/* Doctor notes if present */}
                  {apt.doctorRemarks && (
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                      <span className="font-bold text-indigo-900 block mb-0.5">Provider Instructions:</span>
                      <p className="text-slate-700">{apt.doctorRemarks}</p>
                    </div>
                  )}
                </div>

                {/* Doctor Action Buttons (for Pending or to modify) */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenActionModal(apt, 'Accepted')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAccepted ? 'Update Slot & Notes' : 'Accept Request'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenActionModal(apt, 'Rejected')}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Accept / Decline / Slot Modal */}
      {activeAppointmentForAction && (
        <Modal
          isOpen={!!activeAppointmentForAction}
          onClose={() => setActiveAppointmentForAction(null)}
          title={`${actionType === 'Accepted' ? 'Approve' : 'Decline'} Appointment Request`}
          subtitle={`Patient: ${activeAppointmentForAction.patientName} (${activeAppointmentForAction.patientPhone})`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmAction} className="space-y-4">
            {actionType === 'Accepted' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm / Assign Consultation Time Slot
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                  <option value="05:30 PM">05:30 PM</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Clinical Preparation Instructions & Remarks
              </label>
              <textarea
                rows={3}
                required
                value={doctorRemarks}
                onChange={(e) => setDoctorRemarks(e.target.value)}
                placeholder="e.g. Fasting 8 hours prior recommended for lipid check..."
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveAppointmentForAction(null)}
                className="py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`py-2 px-4 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 ${
                  actionType === 'Accepted'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionType === 'Accepted' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>Confirm {actionType}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
