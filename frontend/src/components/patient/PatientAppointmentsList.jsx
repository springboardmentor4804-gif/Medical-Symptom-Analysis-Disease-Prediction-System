import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { Calendar, Clock, MapPin, Video, CheckCircle, Clock3, XCircle, Stethoscope } from 'lucide-react';

export default function PatientAppointmentsList({ onNavigateToBook }) {
  const { currentUser } = useAuth();
  const { appointments } = useMedical();

  // Filter appointments for current patient
  const myAppointments = appointments.filter(
    (apt) => apt.patientId === currentUser?.id || apt.patientName === currentUser?.name
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Scheduled Appointments
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track status, room numbers, video meeting links, and provider confirmations
          </p>
        </div>

        <button
          onClick={onNavigateToBook}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Calendar className="w-4 h-4" />
          Book New Consultation
        </button>
      </div>

      {myAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No Appointments Scheduled Yet</h3>
          <p className="text-xs text-slate-500 mb-5">
            Book an appointment with one of our certified cardiologists, pulmonologists, or general physicians.
          </p>
          <button
            onClick={onNavigateToBook}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            Find a Specialist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myAppointments.map((apt) => {
            const isAccepted = apt.status === 'Accepted';
            const isPending = apt.status === 'Pending';
            const isRejected = apt.status === 'Rejected';

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{apt.doctorName}</h3>
                      <p className="text-xs text-slate-500">{apt.specialization}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      isAccepted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isPending
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isAccepted && <CheckCircle className="w-3.5 h-3.5" />}
                    {isPending && <Clock3 className="w-3.5 h-3.5" />}
                    {isRejected && <XCircle className="w-3.5 h-3.5" />}
                    <span>{apt.status}</span>
                  </span>
                </div>

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
                    <Video className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.meetingType || 'In-Clinic Consultation'}</span>
                  </div>
                </div>

                {apt.reason && (
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Reason:</strong> {apt.reason}
                  </p>
                )}

                {apt.doctorRemarks && (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
                    <span className="font-bold text-indigo-900 block mb-0.5">Physician Note:</span>
                    <p className="text-indigo-950/80">{apt.doctorRemarks}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
