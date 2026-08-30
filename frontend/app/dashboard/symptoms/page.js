'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, ScaleIn } from '../../../components/motion/MotionWrapper';

const COMMON_SYMPTOMS = ['Fever', 'Cough', 'Fatigue', 'Difficulty Breathing', 'Headache', 'Nausea'];
const INTENSE_SYMPTOMS = ['Chest Pain', 'Severe Dizziness', 'Confusion / Disorientation', 'Coughing Blood', 'Numbness / Weakness'];

export default function SymptomsSubmission() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [occurrenceCount, setOccurrenceCount] = useState(1);
  const [durationOnset, setDurationOnset] = useState('Just today');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Logged History State (for Edit & Delete)
  const [historySymptoms, setHistorySymptoms] = useState([]);
  const [frequencyStats, setFrequencyStats] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingCount, setEditingCount] = useState(1);
  const [editingDuration, setEditingDuration] = useState('Just today');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const [resHistory, resStats] = await Promise.all([
        api.get('/symptoms/me').catch(() => []),
        api.get('/symptoms/frequency-stats').catch(() => null),
      ]);
      setHistorySymptoms(resHistory || []);
      setFrequencyStats(resStats);
    } catch (err) {
      console.error('Failed to load symptom history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleToggleCommon = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    const clean = customInput.trim();
    if (clean && !selectedSymptoms.includes(clean)) {
      setSelectedSymptoms((prev) => [...prev, clean]);
    }
    setCustomInput('');
  };

  const handleRemoveSymptom = (symptom) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s !== symptom));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    let finalSymptoms = [...selectedSymptoms];
    if (customInput.trim() && !finalSymptoms.includes(customInput.trim())) {
      finalSymptoms.push(customInput.trim());
      setCustomInput('');
    }

    if (finalSymptoms.length === 0) {
      setError('Please enter or select at least one symptom.');
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(
        finalSymptoms.map((sym) =>
          api.post('/symptoms', {
            symptom_name: sym,
            occurrence_count: parseInt(occurrenceCount, 10),
            duration_onset: durationOnset
          })
        )
      );

      setSuccessMessage(`Successfully recorded ${finalSymptoms.length} symptom${finalSymptoms.length > 1 ? 's' : ''} (Occurred ${occurrenceCount} time(s))!`);
      setSelectedSymptoms([]);
      setOccurrenceCount(1);
      setDurationOnset('Just today');
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to submit symptoms. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit / Update Symptom
  const handleStartEdit = (symptom) => {
    setEditingId(symptom.id);
    setEditingText(symptom.symptom_name);
  };

  const handleSaveEdit = async (symptomId) => {
    if (!editingText.trim()) return;
    setActionLoading(true);
    setError('');
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

  // Delete Symptom
  const handleDeleteSymptom = async (symptomId) => {
    if (!window.confirm('Are you sure you want to delete this symptom record?')) return;
    setActionLoading(true);
    setError('');
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          
          {/* Header */}
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Patient Overview
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Submit & Manage Symptoms</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
              Record reported symptoms for AI analysis or update your historical logs.
            </p>
          </div>

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-rise">
              <div className="flex items-center gap-2 font-semibold">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMessage}</span>
              </div>
              <Link
                href="/dashboard/prediction"
                className="text-xs font-bold text-emerald-900 dark:text-emerald-200 underline hover:no-underline"
              >
                Run AI Prediction &rarr;
              </Link>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-sm text-red-700 dark:text-red-300 flex items-center gap-2 animate-fade-rise">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add New Symptom Entry
            </h2>

            {/* Quick Multi-select Common Symptoms */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                Common Symptoms
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COMMON_SYMPTOMS.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleToggleCommon(sym)}
                      className={`med-card-hover p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span>{sym}</span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intense & Critical Symptoms */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Intense & Acute Symptoms (Critical Indicators)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INTENSE_SYMPTOMS.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleToggleCommon(sym)}
                      className={`med-card-hover p-3.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 ring-1 ring-rose-500/30'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-800'
                      }`}
                    >
                      <span>{sym}</span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <label htmlFor="customInput" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Or Type Custom Symptom
              </label>
              <form onSubmit={handleAddCustom} className="flex gap-2">
                <input
                  id="customInput"
                  type="text"
                  placeholder="e.g. Back pain, Sore throat, Dizziness..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Selected Symptoms Badge List */}
            {selectedSymptoms.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Symptoms Ready for Batch Submit ({selectedSymptoms.length})
                </label>
                <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <AnimatePresence>
                    {selectedSymptoms.map((sym) => (
                      <motion.span
                        key={sym}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
                      >
                        {sym}
                        <button
                          type="button"
                          onClick={() => handleRemoveSymptom(sym)}
                          className="hover:text-red-600 font-bold ml-1 text-slate-400 dark:text-slate-500"
                          title="Remove"
                        >
                          &times;
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>

                {/* OCCURRENCE FREQUENCY & DURATION ONSET SELECTORS */}
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      How many times has this occurred?
                    </label>
                    <select
                      value={occurrenceCount}
                      onChange={(e) => setOccurrenceCount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="1">1 time (Single Episode)</option>
                      <option value="2">2 times (Occurred Twice)</option>
                      <option value="3">3 - 4 times (Multiple Episodes)</option>
                      <option value="5">5 - 9 times (Frequent Episodes)</option>
                      <option value="10">10+ times (Daily / Recurring Chronic)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Duration / Onset Timeframe
                    </label>
                    <select
                      value={durationOnset}
                      onChange={(e) => setDurationOnset(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="Just today">Just today (Acute Onset)</option>
                      <option value="1-3 days">1 - 3 Days</option>
                      <option value="Past week">Past Week (4 - 7 Days)</option>
                      <option value="Past month">Past Month</option>
                      <option value="Chronic (>1 Month)">Chronic / Persistent (&gt; 1 Month)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-all"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || (selectedSymptoms.length === 0 && !customInput.trim())}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Symptoms'}
              </button>
            </div>
          </div>

          {/* LOGGED SYMPTOMS HISTORY & MANAGEMENT TABLE CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Logged Symptom Records ({historySymptoms.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Update or delete previous symptom records.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold"
                title="Refresh history"
              >
                <svg className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">Loading symptom logs...</div>
            ) : historySymptoms.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No recorded symptoms yet. Submit symptoms above to start your health log.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {historySymptoms.map((sym) => (
                  <div key={sym.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    {editingId === sym.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-purple-400 dark:border-purple-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
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
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {sym.symptom_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {sym.occurrence_count || 1} Episode{(sym.occurrence_count || 1) > 1 ? 's' : ''}
                            </span>
                            {sym.duration_onset && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {sym.duration_onset}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                            Logged: {formatDate(sym.submitted_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(sym)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors flex items-center gap-1"
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
                            className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-400 text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTORICAL SYMPTOM RECURRENCE ANALYTICS CARD */}
          {frequencyStats && frequencyStats.symptom_counts && Object.keys(frequencyStats.symptom_counts).length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Historical Recurrence Frequency Breakdown ({frequencyStats.total_episodes} Total Episodes)
                </h2>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-full">
                  Frequency Stats
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(frequencyStats.symptom_counts).map(([name, count]) => (
                  <div key={name} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Onset: {frequencyStats.symptom_durations?.[name] || 'Just today'}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                      {count} {count > 1 ? 'Times' : 'Time'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}

