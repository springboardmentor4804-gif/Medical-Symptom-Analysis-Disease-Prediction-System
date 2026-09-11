import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const MedicalContext = createContext(null);

export function MedicalProvider({ children }) {
  // Real Patient Diagnostic Logs from MongoDB Atlas
  const [patientLogs, setPatientLogs] = useState([]);

  // Real Appointments from MongoDB Atlas
  const [appointments, setAppointments] = useState([]);

  // Real Registered Doctors from MongoDB Atlas
  const [specialists, setSpecialists] = useState([]);

  // Active Diagnostic Result (current session)
  const [activeDiagnosis, setActiveDiagnosis] = useState(null);

  // Toast Notification System
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /**
   * Refetch real data from MongoDB Atlas via FastAPI
   */
  const refreshMedicalData = useCallback(async () => {
    const token = localStorage.getItem('medassist_token');
    if (!token) return;

    let currentUser = null;
    try {
      const savedUser = localStorage.getItem('medassist_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {
      // ignore
    }

    // 1. Fetch real patients diagnostic records from MongoDB Atlas
    try {
      const res = await api.getPatients();
      if (res && Array.isArray(res.patients)) {
        const formatted = res.patients.map((p) => ({
          id: p.id,
          patientId: p.email,
          patientName: p.full_name || p.email.split('@')[0],
          phone: p.phone || 'N/A',
          age: p.age || 30,
          gender: p.gender || 'Unspecified',
          location: p.location || 'Not specified',
          date: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          rawInput: p.symptoms || 'Clinical Consultation',
          symptoms: [p.symptoms || 'Consultation'],
          predictedDisease: p.prediction || 'Clinical Evaluation',
          confidence: parseFloat(p.confidence_score) || 90,
          riskLevel: p.risk_level || 'Low',
          reviewedByDoctor: false,
          status: 'Awaiting Review',
          description: `Clinical assessment indicates ${p.prediction}.`,
          treatmentAdvisory: `Consultation record for ${p.prediction}.`
        }));
        setPatientLogs(formatted);
      }
    } catch (err) {
      console.warn('Error fetching patient records from MongoDB Atlas:', err);
    }

    // 2. Fetch real doctors directory from MongoDB Atlas
    try {
      const docRes = await api.getDoctors();
      if (docRes && Array.isArray(docRes.doctors)) {
        const formattedDocs = docRes.doctors.map((d, i) => ({
          id: d.email,
          name: d.full_name.startsWith('Dr.') ? d.full_name : `Dr. ${d.full_name}`,
          email: d.email,
          specialization: d.specialization || 'General Physician',
          hospital: `${d.location || 'Metropolitan'} Medical Center`,
          location: d.location || 'Medical Center',
          phone: d.phone || '',
          rating: 4.9,
          reviewsCount: 45,
          avatar: `https://images.unsplash.com/photo-${1537368910025 + i * 100}?w=200&auto=format&fit=crop&q=80`,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          availableSlots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM'],
          consultationFee: '$80',
          bio: `Specialist in ${d.specialization || 'General Medicine'} located at ${d.location || 'Clinical Center'}.`
        }));
        setSpecialists(formattedDocs);
      }
    } catch (err) {
      console.warn('Error fetching doctors from MongoDB Atlas:', err);
    }

    // 3. Fetch real appointments from MongoDB Atlas
    if (currentUser?.email && currentUser?.role) {
      try {
        const apptRes = await api.getAppointments(currentUser.email, currentUser.role);
        if (apptRes && Array.isArray(apptRes.appointments)) {
          const formattedAppts = apptRes.appointments.map((a) => ({
            id: a.id,
            patientName: a.patient_email ? a.patient_email.split('@')[0] : 'Patient',
            patientEmail: a.patient_email,
            patientPhone: 'Verified Contact',
            doctorId: a.doctor_email,
            doctorName: a.doctor_email,
            date: a.appointment_date,
            timeSlot: a.scheduled_time || 'To be confirmed',
            status: a.status || 'Pending',
            doctorRemarks: a.scheduled_time !== 'To be confirmed' ? `Confirmed at ${a.scheduled_time}` : 'Awaiting confirmation',
            meetingType: 'In-Clinic Consultation',
            reason: 'AI Clinical Assessment Consultation'
          }));
          setAppointments(formattedAppts);
        }
      } catch (err) {
        console.warn('Error fetching appointments from MongoDB Atlas:', err);
      }
    }
  }, []);

  // Sync with MongoDB Atlas on mount and token availability
  useEffect(() => {
    refreshMedicalData();
  }, [refreshMedicalData]);

  // Add new clinical diagnosis log (triggered from Symptom Checker)
  const addDiagnosticLog = (newLogData) => {
    const logEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 10),
      reviewedByDoctor: false,
      doctorNotes: '',
      status: 'Awaiting Review',
      ...newLogData
    };
    setPatientLogs((prev) => [logEntry, ...prev]);
    setActiveDiagnosis(logEntry);
    addToast('success', 'Diagnostic evaluation completed and saved to your health record.');
    // Refetch to sync with server
    setTimeout(() => refreshMedicalData(), 1200);
    return logEntry;
  };

  // Update clinical doctor notes on a triage log
  const updatePatientLog = (logId, { doctorNotes, status }) => {
    setPatientLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          return {
            ...log,
            doctorNotes: doctorNotes !== undefined ? doctorNotes : log.doctorNotes,
            status: status || log.status,
            reviewedByDoctor: true
          };
        }
        return log;
      })
    );
    addToast('success', 'Patient clinical file updated successfully.');
  };

  // Patient books an appointment in MongoDB Atlas
  const bookAppointment = async (appointmentData) => {
    const newApt = {
      id: `apt-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString().slice(0, 10),
      doctorRemarks: '',
      ...appointmentData
    };
    setAppointments((prev) => [newApt, ...prev]);

    try {
      const res = await api.bookAppointment({
        patient_email: (appointmentData.patientEmail || appointmentData.patientId || '').toLowerCase(),
        doctor_email: (appointmentData.doctorEmail || appointmentData.doctorId || '').toLowerCase(),
        appointment_date: appointmentData.date || new Date().toISOString().slice(0, 10)
      });
      if (res.appointment_id) {
        newApt.id = res.appointment_id;
      }
      addToast('success', `Appointment request sent to ${appointmentData.doctorName || 'Doctor'} successfully.`);
      setTimeout(() => refreshMedicalData(), 1000);
    } catch (err) {
      addToast('error', err.message || 'Failed booking appointment on server');
    }

    return newApt;
  };

  // Doctor updates appointment (accept, reject, reschedule) in MongoDB Atlas
  const updateAppointment = async (aptId, { status, doctorRemarks, timeSlot, date }) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === aptId) {
          return {
            ...apt,
            status: status || apt.status,
            doctorRemarks: doctorRemarks !== undefined ? doctorRemarks : apt.doctorRemarks,
            timeSlot: timeSlot || apt.timeSlot,
            date: date || apt.date
          };
        }
        return apt;
      })
    );

    try {
      await api.updateAppointment(aptId, {
        status: status || 'Accepted',
        scheduled_time: timeSlot || '10:00 AM'
      });
      addToast(
        status === 'Accepted' ? 'success' : 'info',
        `Appointment status updated to ${status.toLowerCase()} successfully.`
      );
      setTimeout(() => refreshMedicalData(), 1000);
    } catch (err) {
      addToast('error', err.message || 'Failed updating appointment on server');
    }
  };

  return (
    <MedicalContext.Provider
      value={{
        patientLogs,
        appointments,
        specialists,
        activeDiagnosis,
        setActiveDiagnosis,
        addDiagnosticLog,
        updatePatientLog,
        bookAppointment,
        updateAppointment,
        refreshMedicalData,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </MedicalContext.Provider>
  );
}

export function useMedical() {
  const context = useContext(MedicalContext);
  if (!context) {
    throw new Error('useMedical must be used within a MedicalProvider');
  }
  return context;
}
