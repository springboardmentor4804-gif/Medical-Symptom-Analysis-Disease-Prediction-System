'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import PatientReportModal from '../../components/PatientReportModal';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FadeIn, StaggerContainer, StaggerItem, HoverCard } from '@/components/motion/MotionWrapper';

export default function Dashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleGenerateReport = async () => {
    setIsReportModalOpen(true);
    setReportLoading(true);
    setReportError('');
    try {
      // 1. Trigger PDF download directly from GET /patients/me/report
      await api.downloadFile('/patients/me/report', 'MedAssist_AI_Clinical_Report.pdf');

      // 2. Fetch JSON format for modal preview
      const data = await api.get('/patients/me/report?format=json');
      setReportData(data);
    } catch (err) {
      setReportError(err.message || 'Failed to generate report.');
    } finally {
      setReportLoading(false);
    }
  };


  const loadDashboardData = async () => {
    setLoadingData(true);
    setFetchError('');
    try {
      const [profileData, symptomsData] = await Promise.all([
        api.get('/patients/me'),
        api.get('/symptoms/me'),
      ]);
      setProfile(profileData);
      setSymptoms(Array.isArray(symptomsData) ? symptomsData : []);
    } catch (err) {
      setFetchError(err.message || 'Failed to load dashboard data. Please try refreshing.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  const recentSymptoms = symptoms.slice(0, 5);

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex-1 px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full">
          
          {/* Header Bar */}
          <FadeIn direction="up" distance={15} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Live Health Portal</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Patient Overview
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Welcome back{profile?.name ? `, ${profile.name}` : ''} • Track symptoms & AI clinical assessments
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleGenerateReport}
                className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold shadow-md border border-slate-700"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Health Report
              </motion.button>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="flex-1 sm:flex-initial">
                <Link
                  href="/dashboard/prediction"
                  className="flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-500/20"
                >
                  <svg className="w-4 h-4 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Prediction
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="flex-1 sm:flex-initial">
                <Link
                  href="/dashboard/symptoms"
                  className="flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Submit Symptoms
                </Link>
              </motion.div>
            </div>
          </FadeIn>

          {/* Global Error Banner */}
          {fetchError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-3 animate-fade-rise">
              <span>{fetchError}</span>
              <button
                onClick={loadDashboardData}
                className="underline font-bold text-xs text-red-800 dark:text-red-200 hover:no-underline"
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* Quick Metrics Bar */}
          {!loadingData && (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StaggerItem>
                <HoverCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Logged Symptoms</span>
                    <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{symptoms.length}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">AI Model Readiness</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                </HoverCard>
              </StaggerItem>

              <StaggerItem>
                <HoverCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Demographic Status</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {profile?.age ? `${profile.age} y/o • ${profile.gender}` : 'Complete Profile'}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                </HoverCard>
              </StaggerItem>
            </StaggerContainer>
          )}

          {/* Loading State */}
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400"></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading patient portal...</p>
            </div>
          ) : (
            <FadeIn direction="up" delay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Profile Summary Card */}
              <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Demographic Profile</h2>
                    <Link
                      href="/dashboard/profile"
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Edit Profile
                    </Link>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient Name</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{profile?.name || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Age</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{profile?.age !== undefined && profile?.age !== null ? `${profile.age} yrs` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gender</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{profile?.gender || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Email</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{profile?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href="/dashboard/profile"
                    className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                  >
                    Update Demographics & Profile
                  </Link>
                </div>
              </div>

              {/* Recent Symptoms Section */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Symptom Activity Log</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recent submissions</p>
                    </div>
                    <Link
                      href="/dashboard/history"
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      View All History &rarr;
                    </Link>
                  </div>

                  {recentSymptoms.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No symptoms logged yet.</p>
                      <Link
                        href="/dashboard/symptoms"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        + Submit your first symptom set
                      </Link>
                    </div>
                  ) : (
                    <StaggerContainer className="space-y-3">
                      {recentSymptoms.map((sym) => (
                        <StaggerItem key={sym.id || sym._id || Math.random()}>
                          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-4 hover:border-emerald-500/30 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {Array.isArray(sym.symptoms) ? sym.symptoms.join(', ') : sym.symptom || 'Symptom Log'}
                                </span>
                                {sym.severity && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                    Severity: {sym.severity}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-1">
                                Recorded on {formatDate(sym.created_at || sym.date)}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
                              Logged
                            </span>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Link
                    href="/dashboard/symptoms"
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    <span>Log New Symptoms</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>

            </FadeIn>
          )}

        </div>
      </div>

      {/* Patient Report Modal */}
      <PatientReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportData={reportData}
        loading={reportLoading}
        error={reportError}
      />
    </ProtectedRoute>
  );
}
