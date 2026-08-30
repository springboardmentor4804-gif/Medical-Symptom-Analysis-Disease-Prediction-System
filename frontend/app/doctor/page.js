'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { api } from '../../lib/api';
import { DoctorAnalyticsView } from '../../components/RoleAnalyticsCharts';

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('queue');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await api.get('/doctor/patients');
        setPatients(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch patient list.');
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  const totalCount = patients.length;
  const solvedCount = patients.filter((p) => p.case_status === 'Solved').length;
  const pendingCount = totalCount - solvedCount;

  const filteredPatients = patients.filter((p) => {
    if (statusFilter === 'pending') return p.case_status !== 'Solved';
    if (statusFilter === 'solved') return p.case_status === 'Solved';
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <div className="flex-1 px-4 sm:px-8 py-10 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header & Tabs */}
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
              {/* Stats Banner */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="med-card-hover p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Total Patients Assigned</span>
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 block">{totalCount}</span>
            </div>
            <div className="med-card-hover p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-sm">
              <span className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Reviews</span>
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{pendingCount}</span>
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assigned Patient Queue</h2>
              
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  All ({totalCount})
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

            {loadingPatients ? (
              <div className="p-12 text-center text-sm font-medium text-slate-500">Loading patient records...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                No patients found for status: <strong className="capitalize">{statusFilter}</strong>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th scope="col" className="py-4 px-6">Patient Name</th>
                      <th scope="col" className="py-4 px-6">Age / Gender</th>
                      <th scope="col" className="py-4 px-6">Logged Symptoms</th>
                      <th scope="col" className="py-4 px-6">Status</th>
                      <th scope="col" className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPatients.map((patient) => {
                      const isSolved = patient.case_status === 'Solved';
                      return (
                        <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{patient.name}</span>
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