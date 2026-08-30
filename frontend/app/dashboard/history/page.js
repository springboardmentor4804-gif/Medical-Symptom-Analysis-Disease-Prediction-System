'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api';
import Link from 'next/link';

export default function HistoryPage() {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/symptoms/me');
      setSymptoms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load symptom history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleStartEdit = (sym) => {
    setEditingId(sym.id);
    setEditingText(sym.symptom_name);
  };

  const handleSaveEdit = async (symptomId) => {
    if (!editingText.trim()) return;
    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await api.put(`/symptoms/${symptomId}`, { symptom_name: editingText.trim() });
      setEditingId(null);
      setEditingText('');
      setSuccessMessage('Symptom updated successfully!');
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to update symptom.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSymptom = async (symptomId) => {
    if (!window.confirm('Are you sure you want to delete this symptom record?')) return;
    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await api.delete(`/symptoms/${symptomId}`);
      setSuccessMessage('Symptom record deleted.');
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to delete symptom.');
    } finally {
      setActionLoading(false);
    }
  };

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

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto w-full">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Patient Overview
              </Link>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Symptom History Log</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                Full chronological record of your reported symptoms.
              </p>
            </div>
            <Link
              href="/dashboard/symptoms"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              + Submit New Symptoms
            </Link>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-sm text-emerald-800 dark:text-emerald-300 font-semibold animate-fade-rise">
              {successMessage}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-sm text-red-700 dark:text-red-300 flex items-center justify-between animate-fade-rise">
              <span>{error}</span>
              <button onClick={fetchHistory} className="underline font-bold text-xs text-red-800 dark:text-red-200">
                Retry Loading
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center py-20 gap-3 shadow-sm">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400"></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading symptom history...</p>
            </div>
          ) : symptoms.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">No symptom logs recorded</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                When you record symptoms, they will appear here and can be updated or managed at any time.
              </p>
              <Link
                href="/dashboard/symptoms"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-md transition-all"
              >
                Submit Symptoms Now
              </Link>
            </div>
          ) : (
            /* Full Table / List with Edit and Delete */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Total Entries ({symptoms.length})
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sorted by most recent</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th scope="col" className="py-4 px-6">Symptom Name</th>
                      <th scope="col" className="py-4 px-6">Timestamp</th>
                      <th scope="col" className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {symptoms.map((sym) => (
                      <tr
                        key={sym.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                          {editingId === sym.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(sym.id)}
                                disabled={actionLoading || !editingText.trim()}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                              <span>{sym.symptom_name}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {formatDate(sym.submitted_at)}
                        </td>

                        <td className="py-4 px-6 text-right">
                          {editingId !== sym.id && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(sym)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSymptom(sym.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-400 text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              &larr; Back to Dashboard
            </Link>
            <Link
              href="/dashboard/prediction"
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Run AI Prediction &rarr;
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

