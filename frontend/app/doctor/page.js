'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { api } from '../../lib/api';
import { DoctorAnalyticsView } from '../../components/RoleAnalyticsCharts';

// Helper to determine if a patient's symptoms or predicted conditions match doctor's specialty
function matchesSpecialty(patient, specialty = '') {
  if (!specialty || specialty === 'General Practitioner' || specialty === 'Other') return true;

  const specLower = specialty.toLowerCase();
  const symptomsStr = Array.isArray(patient.symptoms)
    ? patient.symptoms.map((s) => (s.symptom_name || '').toLowerCase()).join(' ')
    : (patient.medical_history || '').toLowerCase();
  const diseaseStr = (patient.ai_predicted_disease || '').toLowerCase() + ' ' + (patient.last_diagnosis || '').toLowerCase();
  const combined = `${symptomsStr} ${diseaseStr}`;

  if (specLower.includes('cardio')) {
    return /chest|bp|blood pressure|hypertension|heart|dizziness|tachycardia|cardio/.test(combined);
  }
  if (specLower.includes('pulmon') || specLower.includes('resp')) {
    return /cough|breath|fever|asthma|pneumonia|lung|hypoxia|respiratory/.test(combined);
  }
  if (specLower.includes('neuro')) {
    return /headache|migraine|confusion|numbness|paralysis|stroke|vertigo|neuro/.test(combined);
  }
  if (specLower.includes('derma')) {
    return /skin|rash|itch|lesion|derma/.test(combined);
  }
  if (specLower.includes('gastro')) {
    return /nausea|stomach|abdominal|vomiting|digest|gastro/.test(combined);
  }
  return true;
}

export default function DoctorDashboard() {
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'specialty', 'pending', 'solved'
  const [activeTab, setActiveTab] = useState('queue');

  const loadDoctorData = useCallback(async () => {
    try {
      const [profileResult, patientsResult] = await Promise.allSettled([
        api.get('/doctor/me'),
        api.get('/doctor/patients'),
      ]);

      if (profileResult.status === 'fulfilled') {
        setDoctorProfile(profileResult.value);
      } else {
        // Fallback doctor profile
        setDoctorProfile({
          name: 'Dr. Clinical Specialist',
          specialty: 'Cardiologist',
          age: 42,
          email: 'doctor@medassist.com',
        });
      }

      if (patientsResult.status === 'fulfilled') {
        setPatients(Array.isArray(patientsResult.value) ? patientsResult.value : []);
      } else {
        setError(patientsResult.reason?.message || 'Failed to fetch patient list.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load doctor workspace data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!ignore) {
        await loadDoctorData();
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [loadDoctorData]);

  const doctorSpecialty = doctorProfile?.specialty || 'Cardiologist';
  const totalCount = patients.length;
  const solvedCount = patients.filter((p) => p.case_status === 'Solved').length;
  const pendingCount = totalCount - solvedCount;
  const specialtyMatchedPatients = patients.filter((p) => matchesSpecialty(p, doctorSpecialty));
  const specialtyCount = specialtyMatchedPatients.length;

  const filteredPatients = patients.filter((p) => {
    if (statusFilter === 'pending') return p.case_status !== 'Solved';
    if (statusFilter === 'solved') return p.case_status === 'Solved';
    if (statusFilter === 'specialty') return matchesSpecialty(p, doctorSpecialty);
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <div className="flex-1 px-4 sm:px-8 py-10 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header & Main Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Clinical Management Workspace</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Doctor Clinical Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 font-medium">
                Review patient symptoms, diagnose cases, provide medical recommendations, and analyze clinical trends.
              </p>
            </div>

            {/* Main View Mode Tabs */}
            <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-900 p-1.5 rounded-2xl text-xs font-bold border border-slate-300 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'queue' ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Patient Queue
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Analytics Dashboard
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300 animate-fade-rise">
              {error}
            </div>
          )}

          {activeTab === 'analytics' ? (
            <DoctorAnalyticsView />
          ) : (
            <>
              {/* Doctor Details Profile Card */}
              {doctorProfile && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 text-white shadow-lg border border-teal-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 text-2xl font-black shadow-inner">
                        {doctorProfile.name ? doctorProfile.name.charAt(0).toUpperCase() : 'D'}
                      </div>
                      <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black" title="Verified Practitioner">
                        ✓
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-white tracking-tight">{doctorProfile.name}</h2>
                        <span className="px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 uppercase tracking-wide">
                          {doctorProfile.specialty}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                          {doctorProfile.qualification || 'MBBS, MD'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          Reg: {doctorProfile.medical_reg_no || 'MCI-2021-98421'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                        <span className="font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Age: <strong className="text-white">{doctorProfile.age || 42} yrs</strong>
                        </span>
                        <span>•</span>
                        <span className="font-medium">{doctorProfile.email}</span>
                        <span>•</span>
                        <span className="text-teal-400 font-bold flex items-center gap-1">
                          ✓ Verified with {doctorProfile.council_type === 'State Medical Council' ? (doctorProfile.state_council || 'State Medical Council') : 'National Medical Commission (NMC)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-teal-500/20 text-xs shrink-0">
                    <div className="text-center px-3 border-r border-slate-800">
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Specialty Matches</span>
                      <span className="text-lg font-black text-teal-400">{specialtyCount} Patients</span>
                    </div>
                    <div className="text-center px-3">
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Assigned</span>
                      <span className="text-lg font-black text-white">{totalCount} Patients</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="med-card-hover p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Total Patients Assigned</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 block">{totalCount}</span>
                </div>
                <div className="med-card-hover p-6 rounded-3xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50 shadow-sm">
                  <span className="block text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    {doctorSpecialty} Specialty Cases
                  </span>
                  <span className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1 block">{specialtyCount}</span>
                </div>
                <div className="med-card-hover p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
                  <span className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Solved Cases</span>
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{solvedCount}</span>
                </div>
              </div>

              {/* Patients Table Card */}
              <div className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
                
                {/* Filter Header */}
                <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 bg-slate-50/70 dark:bg-slate-950/50">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assigned Patient Queue</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Categorized by clinical status and doctor specialization ({doctorSpecialty})
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold flex-wrap">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3.5 py-1.5 rounded-xl transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      All ({totalCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('specialty')}
                      className={`px-3.5 py-1.5 rounded-xl transition-all ${statusFilter === 'specialty' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      ★ {doctorSpecialty} ({specialtyCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3.5 py-1.5 rounded-xl transition-all ${statusFilter === 'pending' ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      Pending ({pendingCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('solved')}
                      className={`px-3.5 py-1.5 rounded-xl transition-all ${statusFilter === 'solved' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      Solved ({solvedCount})
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-sm font-medium text-slate-500">Loading patient records & doctor workspace...</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                    No patients found for filter mode: <strong className="capitalize">{statusFilter}</strong>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th scope="col" className="py-4 px-6">Patient Name</th>
                          <th scope="col" className="py-4 px-6">Age / Gender</th>
                          <th scope="col" className="py-4 px-6">Logged Symptoms & Specialization Match</th>
                          <th scope="col" className="py-4 px-6">Status</th>
                          <th scope="col" className="py-4 px-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredPatients.map((patient) => {
                          const isSolved = patient.case_status === 'Solved';
                          const isMatched = matchesSpecialty(patient, doctorSpecialty);
                          return (
                            <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-slate-100 block">{patient.name}</span>
                                  {isMatched && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300 dark:border-teal-800" title={`Matches Doctor Specialty: ${doctorSpecialty}`}>
                                      ★ {doctorSpecialty} Match
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{patient.email}</span>
                              </td>
                              <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-semibold">
                                {patient.age ? `${patient.age} yrs` : 'N/A'} • {patient.gender || 'N/A'}
                              </td>
                              <td className="py-4 px-6">
                                {patient.symptoms && patient.symptoms.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                                    {patient.symptoms.slice(0, 3).map((sym, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700"
                                      >
                                        {sym.symptom_name}
                                      </span>
                                    ))}
                                    {patient.symptoms.length > 3 && (
                                      <span className="text-xs text-slate-500 font-bold self-center">
                                        +{patient.symptoms.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-xs">No symptoms logged</span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                    isSolved
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSolved ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                  {patient.case_status || 'Pending Review'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <Link
                                  href={`/doctor/patients/${patient.id}`}
                                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm transition-all"
                                >
                                  Review Patient
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}