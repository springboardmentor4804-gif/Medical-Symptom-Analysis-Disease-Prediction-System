import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import Modal from '../common/Modal.jsx';
import { 
  Calendar, 
  Clock, 
  Star, 
  MapPin, 
  DollarSign, 
  Video, 
  Building, 
  CheckCircle2, 
  UserCheck, 
  Filter 
} from 'lucide-react';

export default function AppointmentBooking({ onBookingSuccess }) {
  const { currentUser } = useAuth();
  const { specialists, bookAppointment } = useMedical();

  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [activeDoctorForBooking, setActiveDoctorForBooking] = useState(null);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState('2026-03-16');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [meetingType, setMeetingType] = useState('In-Clinic Consultation');
  const [reason, setReason] = useState('Consultation following AI symptom triage evaluation');

  const specialties = ['All', ...new Set(specialists.map((s) => s.specialization))];

  const filteredDoctors = selectedSpecialty === 'All'
    ? specialists
    : specialists.filter((d) => d.specialization === selectedSpecialty);

  const handleOpenBooking = (doctor) => {
    setActiveDoctorForBooking(doctor);
    setSelectedSlot(doctor.availableSlots[0] || '10:00 AM');
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!activeDoctorForBooking) return;

    bookAppointment({
      patientId: currentUser?.id || currentUser?.email || 'patient',
      patientName: currentUser?.name || currentUser?.email || 'Patient',
      patientPhone: currentUser?.phone || '',
      patientAge: currentUser?.age || 30,
      patientGender: currentUser?.gender || 'Unspecified',
      doctorId: activeDoctorForBooking.id,
      doctorName: activeDoctorForBooking.name,
      specialization: activeDoctorForBooking.specialization,
      date: bookingDate,
      timeSlot: selectedSlot,
      meetingType,
      reason
    });

    setActiveDoctorForBooking(null);
    if (onBookingSuccess) onBookingSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Certified Medical Specialist Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Book in-person hospital visits or HIPAA-compliant telehealth consultations
          </p>
        </div>

        {/* Specialization Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec === 'All' ? 'All Medical Specialties' : spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Specialist Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-base shadow-xs flex-shrink-0">
                  {doc.name ? doc.name.replace(/^Dr\.\s*/i, '').charAt(0).toUpperCase() : 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mb-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{doc.rating}</span>
                    <span className="text-slate-400 font-normal">({doc.reviewsCount} reviews)</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                    {doc.name}
                  </h3>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {doc.specialization}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {doc.bio}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{doc.hospital}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{doc.experienceYears} Years Exp • {doc.availableDays.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-slate-800">{doc.consultationFee}</span>
                  <span className="text-slate-400">per consultation</span>
                </div>
              </div>
            </div>

            {/* Book Slot Action Button */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenBooking(doc)}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Consultation Slot</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {activeDoctorForBooking && (
        <Modal
          isOpen={!!activeDoctorForBooking}
          onClose={() => setActiveDoctorForBooking(null)}
          title={`Schedule Consultation with ${activeDoctorForBooking.name}`}
          subtitle={`${activeDoctorForBooking.specialization} • ${activeDoctorForBooking.hospital}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            {/* Mode: In-Clinic vs Telehealth */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Consultation Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeetingType('In-Clinic Consultation')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    meetingType === 'In-Clinic Consultation'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  In-Clinic Visit
                </button>
                <button
                  type="button"
                  onClick={() => setMeetingType('Telehealth Video Call')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    meetingType === 'Telehealth Video Call'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Telehealth Video
                </button>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Consultation Date
              </label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min="2026-03-10"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Available Provider Slots
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activeDoctorForBooking.availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                      selectedSlot === slot
                        ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason / Symptoms notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Clinical Reason / Symptoms
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief summary of symptoms or query for the physician..."
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Submit Booking */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Submit Appointment Request</span>
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
