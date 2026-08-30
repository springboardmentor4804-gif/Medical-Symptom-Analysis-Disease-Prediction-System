'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { api } from '../../lib/api';
import { ClinicAnalyticsView } from '../../components/RoleAnalyticsCharts';

export default function ClinicDashboard() {
  const [clinicProfile, setClinicProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ total_doctors: 0, total_patients: 0, solved_cases: 0 });
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('management');


  // Clinic profile edit modal state
  const [isEditingClinicProfile, setIsEditingClinicProfile] = useState(false);
  const [clinicForm, setClinicForm] = useState({ clinic_name: '', address: '' });
  const [savingClinicProfile, setSavingClinicProfile] = useState(false);

  // Modals state for Patients & Doctors
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({ name: '', age: '', gender: 'Male', medical_history: '' });
  const [savingPatient, setSavingPatient] = useState(false);

  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({ name: '', specialty: '' });
  const [savingDoctor, setSavingDoctor] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assigningDoctor, setAssigningDoctor] = useState(false);

  // Sample fallback data shown when no real data exists
  const SAMPLE_PATIENTS = [
    { id: 'demo-1', user_id: 0, name: 'Aanya Sharma', age: 34, gender: 'Female', email: 'aanya.sharma@example.com', medical_history: 'Hypertension, seasonal allergies', assigned_doctor: 'Dr. Rajiv Mehta', _isSample: true },
    { id: 'demo-2', user_id: 0, name: 'Rohan Gupta', age: 52, gender: 'Male', email: 'rohan.gupta@example.com', medical_history: 'Type 2 Diabetes, mild asthma', assigned_doctor: 'Dr. Priya Nair', _isSample: true },
    { id: 'demo-3', user_id: 0, name: 'Meera Iyer', age: 28, gender: 'Female', email: 'meera.iyer@example.com', medical_history: 'Migraine, iron deficiency', assigned_doctor: 'Dr. Rajiv Mehta', _isSample: true },
  ];

  const SAMPLE_DOCTORS = [
    { id: 'demo-d1', name: 'Dr. Rajiv Mehta', email: 'rajiv.mehta@clinic.example.com', specialty: 'Cardiologist', _isSample: true },
    { id: 'demo-d2', name: 'Dr. Priya Nair', email: 'priya.nair@clinic.example.com', specialty: 'General Practitioner', _isSample: true },
  ];

  const loadClinicData = useCallback(async () => {
    try {
      // Fetch each endpoint independently so a single failure doesn't block the rest
      const [profileResult, doctorResult, patientResult, statsResult, availableResult] = await Promise.allSettled([
        api.get('/clinic/me'),
        api.get('/clinic/doctors'),
        api.get('/clinic/patients'),
        api.get('/clinic/stats'),
        api.get('/clinic/available-doctors'),
      ]);

      if (profileResult.status === 'fulfilled') {
        setClinicProfile(profileResult.value);
      } else {
        setError(profileResult.reason?.message || 'Failed to load clinic profile.');
      }

      if (doctorResult.status === 'fulfilled') {
        setDoctors(Array.isArray(doctorResult.value) ? doctorResult.value : []);
      }

      if (patientResult.status === 'fulfilled') {
        setPatients(Array.isArray(patientResult.value) ? patientResult.value : []);
      } else {
        // Non-fatal: patients section will show sample data
        console.warn('Patients load failed:', patientResult.reason?.message);
      }

      if (statsResult.status === 'fulfilled' && statsResult.value) {
        setStats(statsResult.value);
      }

      if (availableResult.status === 'fulfilled') {
        setAvailableDoctors(Array.isArray(availableResult.value) ? availableResult.value : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load clinic data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClinicData();
  }, [loadClinicData]);

  // Handle Edit Clinic Profile
  const openEditClinicProfile = () => {
    if (clinicProfile) {
      setClinicForm({
        clinic_name: clinicProfile.clinic_name || '',
        address: clinicProfile.address || '',
      });
    }
    setIsEditingClinicProfile(true);
  };

  const handleSaveClinicProfile = async (e) => {
    e.preventDefault();
    setSavingClinicProfile(true);
    try {
      const updated = await api.put('/clinic/me', clinicForm);
      setClinicProfile(updated);
      setIsEditingClinicProfile(false);
    } catch (err) {
      alert(err.message || 'Failed to update clinic profile.');
    } finally {
      setSavingClinicProfile(false);
    }
  };

  // Handle Edit Patient
  const openEditPatient = (patient) => {
    setEditingPatient(patient);
    setPatientForm({
      name: patient.name || '',
      age: patient.age ? patient.age.toString() : '',
      gender: patient.gender || 'Male',
      medical_history: patient.medical_history || '',
    });
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;
    setSavingPatient(true);
    try {
      const updated = await api.put(`/clinic/patients/${editingPatient.id}`, {
        name: patientForm.name,
        age: parseInt(patientForm.age, 10),
        gender: patientForm.gender,
        medical_history: patientForm.medical_history,
      });

      setPatients((prev) =>
        prev.map((p) => (p.id === editingPatient.id ? { ...p, ...updated } : p))
      );
      setEditingPatient(null);
    } catch (err) {
      alert(err.message || 'Failed to update patient.');
    } finally {
      setSavingPatient(false);
    }
  };

  // Handle Edit Doctor
  const openEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      name: doctor.name || '',
      specialty: doctor.specialty || '',
    });
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setSavingDoctor(true);
    try {
      const updated = await api.put(`/clinic/doctors/${editingDoctor.id}`, {
        name: doctorForm.name,
        specialty: doctorForm.specialty,
      });

      setDoctors((prev) =>
        prev.map((d) => (d.id === editingDoctor.id ? { ...d, ...updated } : d))
      );
      setEditingDoctor(null);
    } catch (err) {
      alert(err.message || 'Failed to update doctor.');
    } finally {
      setSavingDoctor(false);
    }
  };

  // Handle Assign Doctor
  const handleAssignDoctor = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) return;
    setAssigningDoctor(true);
    try {
      const assignedDoc = await api.post('/clinic/doctors/assign', {
        doctor_id: parseInt(selectedDoctorId, 10),
      });

      setDoctors([...doctors, assignedDoc]);
      setAvailableDoctors((prev) => prev.filter((d) => d.id !== parseInt(selectedDoctorId, 10)));
      setIsAssignModalOpen(false);
      setSelectedDoctorId('');
      loadClinicData();
    } catch (err) {
      alert(err.message || 'Failed to assign doctor.');
    } finally {
      setAssigningDoctor(false);
    }
  };

  // Filtered lists — fall back to sample data when real data is empty
  const isShowingSamplePatients = patients.length === 0;
  const isShowingSampleDoctors = doctors.length === 0;
  const displayPatients = isShowingSamplePatients ? SAMPLE_PATIENTS : patients;
  const displayDoctors = isShowingSampleDoctors ? SAMPLE_DOCTORS : doctors;

  const query = searchQuery.toLowerCase().trim();
  const filteredDoctors = displayDoctors.filter(
    (d) =>
      d.name?.toLowerCase().includes(query) ||
      d.email?.toLowerCase().includes(query) ||
      d.specialty?.toLowerCase().includes(query)
  );

  const filteredPatients = displayPatients.filter(
    (p) =>
      p.name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.medical_history?.toLowerCase().includes(query) ||
      p.assigned_doctor?.toLowerCase().includes(query)
  );

  return (
    <ProtectedRoute allowedRoles={['clinic']}>
      <div className="flex-1 px-4 sm:px-6 py-10 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-950 dark:text-slate-100">Clinic Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Manage clinic staff, update patient profiles, assign doctors, and monitor clinic performance analytics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-900 p-1.5 rounded-2xl text-xs font-bold border border-slate-300 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('management')}
                  className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'management' ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Clinic Operations
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Analytics Dashboard
                </button>
              </div>

              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                + Assign Doctor
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {activeTab === 'analytics' ? (
            <ClinicAnalyticsView />
          ) : (
            <>


          {/* Clinic Profile Card */}
          {clinicProfile && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-900 via-slate-900 to-slate-950 text-white shadow-md border border-cyan-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11h4v10" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{clinicProfile.clinic_name}</h2>
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30">
                      Verified Clinic Profile
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {clinicProfile.address} • Email: {clinicProfile.email}
                  </p>
                </div>
              </div>

              <button
                onClick={openEditClinicProfile}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all shrink-0"
              >
                Edit Clinic Info
              </button>
            </div>
          )}

          {/* Clinic Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Clinic Doctors</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total_doctors || doctors.length}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Clinic Patients</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total_patients || patients.length}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Solved Cases</span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.solved_cases}</span>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search doctors, patients, email, specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          {loading ? (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              
              {/* Doctors Section */}
              <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Clinic Doctors & Medical Staff</h2>
                      {isShowingSampleDoctors && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 uppercase tracking-wide">Sample Data</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">{filteredDoctors.length} doctors</span>
                  </div>

                  {filteredDoctors.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">No doctors match query.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-xs uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                          <tr>
                            <th className="px-6 py-3.5">Doctor Name</th>
                            <th className="px-6 py-3.5">Specialty</th>
                            <th className="px-6 py-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                          {filteredDoctors.map((doctor) => (
                            <tr key={doctor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-950 dark:text-slate-100">{doctor.name || 'Unnamed Doctor'}</span>
                                  {doctor._isSample && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 uppercase">Demo</span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{doctor.email}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-900/40">
                                  {doctor.specialty || 'General Practitioner'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {doctor._isSample ? (
                                  <span className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-600 cursor-not-allowed">Edit Doctor</span>
                                ) : (
                                  <button
                                    onClick={() => openEditDoctor(doctor)}
                                    className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    Edit Doctor
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              {/* Patients Section */}
              <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Clinic Patients</h2>
                      {isShowingSamplePatients && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 uppercase tracking-wide">Sample Data</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">{filteredPatients.length} patients</span>
                  </div>

                  {filteredPatients.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">No patients match query.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-xs uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                          <tr>
                            <th className="px-6 py-3.5">Patient Details</th>
                            <th className="px-6 py-3.5">Assigned Doctor</th>
                            <th className="px-6 py-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                          {filteredPatients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-950 dark:text-slate-100">{patient.name}</span>
                                  {patient._isSample && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 uppercase">Demo</span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {patient.age} yrs / {patient.gender} • {patient.email}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium text-xs">
                                {patient.assigned_doctor ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{patient.assigned_doctor}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Unassigned</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {patient._isSample ? (
                                  <span className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed">Edit Patient</span>
                                ) : (
                                  <button
                                    onClick={() => openEditPatient(patient)}
                                    className="inline-flex items-center rounded-lg border border-cyan-600 px-3 py-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors"
                                  >
                                    Edit Patient
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

            </div>
          )}
          </>
          )}
        </div>


        {/* Edit Clinic Profile Modal */}
        {isEditingClinicProfile && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                Edit Clinic Profile
              </h3>
              <form onSubmit={handleSaveClinicProfile} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Clinic Name</label>
                  <input
                    type="text"
                    required
                    value={clinicForm.clinic_name}
                    onChange={(e) => setClinicForm({ ...clinicForm, clinic_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Address / Location</label>
                  <textarea
                    rows={2}
                    required
                    value={clinicForm.address}
                    onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingClinicProfile(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingClinicProfile}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {savingClinicProfile ? 'Saving...' : 'Save Clinic Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Patient Modal */}


        {editingPatient && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                Edit Patient Profile
              </h3>
              <form onSubmit={handleSavePatient} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={patientForm.name}
                    onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Age</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="120"
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Gender</label>
                    <select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Medical History & Notes</label>
                  <textarea
                    rows={3}
                    value={patientForm.medical_history}
                    onChange={(e) => setPatientForm({ ...patientForm, medical_history: e.target.value })}
                    placeholder="Enter chronic conditions, allergies..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingPatient(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPatient}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {savingPatient ? 'Saving...' : 'Save Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Doctor Modal */}
        {editingDoctor && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                Edit Doctor Profile
              </h3>
              <form onSubmit={handleSaveDoctor} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Specialty</label>
                  <select
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="General Practitioner">General Practitioner</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Endocrinologist">Endocrinologist</option>
                    <option value="Gastroenterologist">Gastroenterologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Pulmonologist">Pulmonologist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingDoctor(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDoctor}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {savingDoctor ? 'Saving...' : 'Save Doctor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Doctor Modal */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                Assign Doctor to Clinic
              </h3>
              
              {availableDoctors.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No unassigned doctors available.
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="block mt-4 mx-auto px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAssignDoctor} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Select Doctor Account
                    </label>
                    <select
                      required
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="" disabled>Choose a doctor...</option>
                      {availableDoctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name || 'Doctor'} ({d.email}) - {d.specialty || 'General'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assigningDoctor || !selectedDoctorId}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold disabled:opacity-50"
                    >
                      {assigningDoctor ? 'Assigning...' : 'Assign to Clinic'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}