'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import PatientReportModal from '../../../components/PatientReportModal';
import { api } from '../../../lib/api';
import Link from 'next/link';
import {
  FeverGaugeChart,
  BloodPressureSpectrumChart,
  VitalRangesComparisonChart,
  DiseaseProbabilityChart,
  FeatureWeightChart,
  TriageEmergencyBanner,
  OrganSystemRiskChart,
} from '../../../components/VitalCharts';
import { motion } from 'framer-motion';
import { FadeIn, ScaleIn, AnimatedProgressBar } from '../../../components/motion/MotionWrapper';

export default function PredictionDashboard() {
  const [profile, setProfile] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // Core Form State
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('Female');
  const [fever, setFever] = useState('No');
  const [cough, setCough] = useState('No');
  const [fatigue, setFatigue] = useState('No');
  const [difficultyBreathing, setDifficultyBreathing] = useState('No');
  const [bloodPressure, setBloodPressure] = useState('Normal');
  const [cholesterolLevel, setCholesterolLevel] = useState('Normal');
  const [diseaseName, setDiseaseName] = useState('');

  // Intense & Severe Symptoms Form State
  const [chestPain, setChestPain] = useState('No');
  const [severeDizziness, setSevereDizziness] = useState('No');
  const [confusionDisorientation, setConfusionDisorientation] = useState('No');
  const [coughingBlood, setCoughingBlood] = useState('No');
  const [numbnessParalysis, setNumbnessParalysis] = useState('No');
  const [symptomSeverityScale, setSymptomSeverityScale] = useState(5);

  // Optional Quantitative Vital Readings State
  const [showOptionalVitals, setShowOptionalVitals] = useState(false);
  const [feverTemp, setFeverTemp] = useState('');
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [oxygenSat, setOxygenSat] = useState('');

  // Patient Logged Symptom History State
  const [recentSymptoms, setRecentSymptoms] = useState([]);

  // Execution & Results State
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const handleGenerateReportWithPredictions = async () => {
    setIsReportModalOpen(true);
    setReportLoading(true);
    try {
      const baseReport = await api.get('/patients/me/report').catch(() => null);

      const mergedReport = {
        ...(baseReport || {}),
        report_id: baseReport?.report_id || `AI-PRED-REP-${Date.now()}`,
        generated_at: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        patient: {
          id: profile?.id || baseReport?.patient?.id || 1,
          name: profile?.name || baseReport?.patient?.name || 'Patient',
          age: parseInt(age, 10) || profile?.age || 30,
          gender: gender || profile?.gender || 'Female',
          email: profile?.email || baseReport?.patient?.email || 'patient@medassist.ai',
          medical_history: profile?.medical_history || baseReport?.patient?.medical_history || 'N/A',
        },
        symptoms: (recentSymptoms && recentSymptoms.length > 0)
          ? recentSymptoms
          : baseReport?.symptoms || [],
        total_symptoms: recentSymptoms.length || baseReport?.total_symptoms || 0,
        health_status_summary: result?.message || baseReport?.health_status_summary || 'Comprehensive AI Disease Risk Health Report.',
        ai_prediction: result,
      };

      setReportData(mergedReport);
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setReportLoading(false);
    }
  };

  const applySymptomsToPredictors = (symptomsList) => {
    if (!symptomsList || symptomsList.length === 0) return;

    const names = symptomsList.map((s) => s.symptom_name.toLowerCase());
    let hasFever = false;

    if (names.some((n) => n.includes('fever'))) {
      setFever('Yes');
      hasFever = true;
    }
    if (names.some((n) => n.includes('cough'))) {
      setCough('Yes');
    }
    if (names.some((n) => n.includes('fatigue') || n.includes('tired') || n.includes('exhaustion'))) {
      setFatigue('Yes');
    }
    if (names.some((n) => n.includes('breath') || n.includes('shortness') || n.includes('dyspnea'))) {
      setDifficultyBreathing('Yes');
    }

    // Intense symptom detection
    if (names.some((n) => n.includes('chest pain') || n.includes('chest pressure') || n.includes('angina'))) {
      setChestPain('Yes');
    }
    if (names.some((n) => n.includes('dizziness') || n.includes('vertigo') || n.includes('lightheaded'))) {
      setSevereDizziness('Yes');
    }
    if (names.some((n) => n.includes('confusion') || n.includes('disorientation'))) {
      setConfusionDisorientation('Yes');
    }
    if (names.some((n) => n.includes('coughing blood') || n.includes('hemoptysis'))) {
      setCoughingBlood('Yes');
    }
    if (names.some((n) => n.includes('numbness') || n.includes('weakness') || n.includes('paralysis'))) {
      setNumbnessParalysis('Yes');
    }

    if (hasFever) {
      setShowOptionalVitals(true);
    }

    // Custom non-standard symptoms can be appended to diseaseName
    const customNames = symptomsList
      .map((s) => s.symptom_name)
      .filter((name) => {
        const lower = name.toLowerCase();
        return ![
          'fever', 'cough', 'fatigue', 'difficulty breathing',
          'chest pain', 'severe dizziness', 'confusion / disorientation',
          'coughing blood', 'numbness / weakness'
        ].includes(lower);
      });

    if (customNames.length > 0) {
      setDiseaseName(customNames.join(', '));
    }
  };

  const handleDeleteSymptomFromPrediction = async (symId) => {
    if (!window.confirm('Delete this logged symptom record?')) return;
    try {
      await api.delete(`/symptoms/${symId}`);
      const updated = await api.get('/symptoms/me');
      setRecentSymptoms(updated || []);
      applySymptomsToPredictors(updated || []);
    } catch (err) {
      console.error("Delete symptom error:", err);
    }
  };

  const handleEditSymptomFromPrediction = async (sym) => {
    const newName = window.prompt("Edit symptom description:", sym.symptom_name);
    if (!newName || !newName.trim() || newName.trim() === sym.symptom_name) return;
    try {
      await api.put(`/symptoms/${sym.id}`, { symptom_name: newName.trim() });
      const updated = await api.get('/symptoms/me');
      setRecentSymptoms(updated || []);
      applySymptomsToPredictors(updated || []);
    } catch (err) {
      console.error("Edit symptom error:", err);
    }
  };

  useEffect(() => {
    async function initData() {
      try {
        const [profData, infoData, symData] = await Promise.all([
          api.get('/patients/me').catch(() => null),
          api.get('/prediction/model-info').catch(() => null),
          api.get('/symptoms/me').catch(() => null),
        ]);

        if (profData) {
          setProfile(profData);
          if (profData.age) setAge(profData.age);
          if (profData.gender) setGender(profData.gender);
        }
        if (infoData) {
          setModelInfo(infoData);
        }
        if (Array.isArray(symData) && symData.length > 0) {
          setRecentSymptoms(symData);
          applySymptomsToPredictors(symData);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoadingInit(false);
      }
    }
    initData();
  }, []);

  const handleRunPrediction = async (e) => {
    e.preventDefault();
    setPredicting(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        age: parseInt(age, 10),
        gender,
        fever,
        cough,
        fatigue,
        difficulty_breathing: difficultyBreathing,
        blood_pressure: bloodPressure,
        cholesterol_level: cholesterolLevel,
        chest_pain: chestPain,
        severe_dizziness: severeDizziness,
        confusion_disorientation: confusionDisorientation,
        coughing_blood: coughingBlood,
        numbness_paralysis: numbnessParalysis,
        symptom_severity_scale: parseInt(symptomSeverityScale, 10),
        disease_name: diseaseName || undefined,
        fever_temperature: feverTemp ? parseFloat(feverTemp) : undefined,
        systolic_bp: systolicBp ? parseInt(systolicBp, 10) : undefined,
        diastolic_bp: diastolicBp ? parseInt(diastolicBp, 10) : undefined,
        heart_rate: heartRate ? parseInt(heartRate, 10) : undefined,
        oxygen_saturation: oxygenSat ? parseInt(oxygenSat, 10) : undefined,
      };

      const res = await api.post('/prediction/predict', payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to run prediction. Please try again.');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">
          
          {/* Top Navigation & Header */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                  <span>AI Health Analytics & Risk Prediction</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    RandomForest ML
                  </span>
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Evaluate health outcome risk, probable disease indicators, and quantitative vital ranges using machine learning.
                </p>
              </div>

              {modelInfo && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs text-xs flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Dataset Samples</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{modelInfo.total_samples} entries</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">RandomForest Accuracy</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {(modelInfo.outcome_accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Input Form Column (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Clinical Predictors Input
              </h2>

              {/* RECENT LOGGED SYMPTOMS HISTORY BADGE */}
              {recentSymptoms.length > 0 && (
                <div className="bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent Logged Symptoms ({recentSymptoms.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => applySymptomsToPredictors(recentSymptoms)}
                      className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-200/60 dark:bg-purple-900/80 px-2 py-0.5 rounded-md hover:bg-purple-300 transition-colors"
                    >
                      Sync to Form
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {recentSymptoms.map((sym, idx) => (
                      <span
                        key={sym.id || idx}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        <span>{sym.symptom_name}</span>

                        {sym.id && (
                          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-purple-200 dark:border-purple-800">
                            <button
                              type="button"
                              onClick={() => handleEditSymptomFromPrediction(sym)}
                              className="text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 font-bold"
                              title="Edit symptom description"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSymptomFromPrediction(sym.id)}
                              className="text-[12px] text-slate-400 hover:text-red-600 font-black ml-0.5"
                              title="Delete symptom record"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-purple-700 dark:text-purple-400 italic">
                    These logged symptoms are automatically loaded into your AI prediction inputs.
                  </p>
                </div>
              )}

              <form onSubmit={handleRunPrediction} className="space-y-5 text-sm">
                
                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                </div>

                {/* Primary Symptom Toggles */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Primary Symptoms (Yes / No)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'Fever', state: fever, set: setFever },
                      { label: 'Cough', state: cough, set: setCough },
                      { label: 'Fatigue', state: fatigue, set: setFatigue },
                      { label: 'Difficulty Breathing', state: difficultyBreathing, set: setDifficultyBreathing },
                    ].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => {
                          const nextState = s.state === 'Yes' ? 'No' : 'Yes';
                          s.set(nextState);
                          if (s.label === 'Fever' && nextState === 'Yes' && !showOptionalVitals) {
                            setShowOptionalVitals(true);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                          s.state === 'Yes'
                            ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-400 dark:border-purple-700 text-purple-800 dark:text-purple-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{s.label}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          s.state === 'Yes' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {s.state}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* INTENSE & ACUTE SYMPTOMS TOGGLES */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Intense & Severe Symptoms (Emergency Indicators)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: 'Chest Pain / Pressure', state: chestPain, set: setChestPain },
                      { label: 'Severe Vertigo / Dizziness', state: severeDizziness, set: setSevereDizziness },
                      { label: 'Confusion / Disorientation', state: confusionDisorientation, set: setConfusionDisorientation },
                      { label: 'Hemoptysis (Coughing Blood)', state: coughingBlood, set: setCoughingBlood },
                      { label: 'Numbness / Focal Weakness', state: numbnessParalysis, set: setNumbnessParalysis },
                    ].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => s.set(s.state === 'Yes' ? 'No' : 'Yes')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                          s.state === 'Yes'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500/30'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                        }`}
                      >
                        <span>{s.label}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          s.state === 'Yes' ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {s.state}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* OVERALL SYMPTOM SEVERITY SCALE SLIDER (1 to 10) */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Overall Symptom Severity Scale (1 - 10)
                    </label>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-black ${
                      symptomSeverityScale >= 8 ? 'bg-rose-600 text-white' :
                      symptomSeverityScale >= 5 ? 'bg-amber-500 text-white' :
                      'bg-emerald-600 text-white'
                    }`}>
                      Level {symptomSeverityScale} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={symptomSeverityScale}
                    onChange={(e) => setSymptomSeverityScale(e.target.value)}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1 (Mild)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (Severe / Critical)</span>
                  </div>
                </div>

                {/* Blood Pressure & Cholesterol */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Blood Pressure Category
                    </label>
                    <select
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Cholesterol Level
                    </label>
                    <select
                      value={cholesterolLevel}
                      onChange={(e) => setCholesterolLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* Optional Suspected Disease */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Suspected Condition / Disease (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Influenza, Asthma, Diabetes..."
                    value={diseaseName}
                    onChange={(e) => setDiseaseName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* OPTIONAL QUANTITATIVE READINGS ACCORDION */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowOptionalVitals(!showOptionalVitals)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Optional Quantitative Vital Readings
                    </span>
                    <span className="text-[11px] font-normal text-purple-600 dark:text-purple-400 underline">
                      {showOptionalVitals ? 'Hide Optional Fields' : 'Add Temp °F, BP mmHg, SpO2'}
                    </span>
                  </button>

                  {showOptionalVitals && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
                      
                      {/* Fever Temperature */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Body Temperature (°F) <span className="text-slate-400 font-normal">(e.g. 101.5°F)</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="90"
                          max="110"
                          placeholder="e.g. 98.6 or 101.5"
                          value={feverTemp}
                          onChange={(e) => setFeverTemp(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      {/* BP Systolic & Diastolic */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Systolic BP <span className="text-slate-400 font-normal">(mmHg)</span>
                          </label>
                          <input
                            type="number"
                            min="60"
                            max="240"
                            placeholder="e.g. 120"
                            value={systolicBp}
                            onChange={(e) => setSystolicBp(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Diastolic BP <span className="text-slate-400 font-normal">(mmHg)</span>
                          </label>
                          <input
                            type="number"
                            min="40"
                            max="150"
                            placeholder="e.g. 80"
                            value={diastolicBp}
                            onChange={(e) => setDiastolicBp(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Pulse & SpO2 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Heart Rate <span className="text-slate-400 font-normal">(BPM)</span>
                          </label>
                          <input
                            type="number"
                            min="30"
                            max="220"
                            placeholder="e.g. 75"
                            value={heartRate}
                            onChange={(e) => setHeartRate(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Oxygen Saturation <span className="text-slate-400 font-normal">(SpO2 %)</span>
                          </label>
                          <input
                            type="number"
                            min="70"
                            max="100"
                            placeholder="e.g. 98"
                            value={oxygenSat}
                            onChange={(e) => setOxygenSat(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={predicting}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {predicting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing RandomForest Analysis...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Run ML Prediction & Generate Charts</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Results & Visual Analytics Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {result ? (
                <>
                  {/* CLINICAL TRIAGE EMERGENCY DIRECTIVE BANNER */}
                  {result.triage_level && (
                    <TriageEmergencyBanner
                      triageLevel={result.triage_level}
                      triageColor={result.triage_color}
                      directive={result.emergency_action_directive}
                      timeframe={result.urgency_timeframe}
                      intenseFlags={result.intense_symptom_flags}
                    />
                  )}

                  {/* Outcome Prediction Card */}
                  <ScaleIn className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm relative overflow-hidden ${
                    result.prediction === 'Positive'
                      ? 'border-amber-300 dark:border-amber-900/60'
                      : 'border-emerald-300 dark:border-emerald-900/60'
                  }`}>
                    
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          RandomForest Health Risk Outcome
                        </span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-2xl sm:text-3xl font-black ${
                            result.prediction === 'Positive'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {result.prediction} Risk Outcome
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border badge-pulse ${
                            result.prediction === 'Positive'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                          }`}>
                            {result.confidence}% Confidence
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Outcome Risk Meter Progress Bar */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>Health Outcome Risk Score</span>
                        <span>{result.outcome_probability}%</span>
                      </div>
                      <AnimatedProgressBar
                        progress={result.outcome_probability}
                        colorClass={
                          result.prediction === 'Positive'
                            ? 'bg-gradient-to-r from-amber-500 to-red-500'
                            : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        }
                        heightClass="h-3"
                      />
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 leading-relaxed">
                      {result.message}
                    </p>

                    {/* Action Button: Generate Printable Report with Predictions */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateReportWithPredictions}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span>Generate & Export Health Report with Predictions</span>
                      </button>
                    </div>
                  </ScaleIn>

                  {/* RECOMMENDED NEXT STEPS SECTION */}
                  {result.recommendation && (
                    <ScaleIn className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/60 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recommended Next Steps</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Rule-Based Clinical Protocol & Lifestyle Guidance</p>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          result.recommendation.urgency === 'Critical Emergency'
                            ? 'bg-rose-500 text-white'
                            : result.recommendation.urgency === 'High risk'
                            ? 'bg-amber-500 text-white'
                            : result.recommendation.urgency === 'Medium risk'
                            ? 'bg-purple-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {result.recommendation.urgency}
                        </span>
                      </div>

                      {/* Action Message */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {result.recommendation.action_message}
                      </div>

                      {/* Preventive Tips List */}
                      {result.recommendation.preventive_tips && result.recommendation.preventive_tips.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                            Preventive & Self-Care Action Tips:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {result.recommendation.preventive_tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 text-xs text-slate-700 dark:text-slate-300">
                                <span className="text-teal-500 font-bold">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Follow-up Guidance */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                          Follow-up Advice:
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          {result.recommendation.follow_up_advice}
                        </p>
                      </div>
                    </ScaleIn>
                  )}

                  {/* FEVER GAUGE CHART (IF TEMPERATURE READINGS ARE PRESENT) */}
                  {feverTemp && (
                    <FeverGaugeChart temp={feverTemp} unit="°F" />
                  )}

                  {/* BLOOD PRESSURE SPECTRUM CHART (IF BP READINGS ARE PRESENT) */}
                  {(systolicBp || diastolicBp) && (
                    <BloodPressureSpectrumChart systolic={systolicBp} diastolic={diastolicBp} />
                  )}

                  {/* QUANTITATIVE VITALS COMPARISON CHART */}
                  {result.vital_metrics && Object.keys(result.vital_metrics).length > 0 && (
                    <VitalRangesComparisonChart metrics={result.vital_metrics} />
                  )}

                  {/* MULTI-ORGAN SYSTEM RISK BREAKDOWN CHART */}
                  {result.organ_system_risks && (
                    <OrganSystemRiskChart organRisks={result.organ_system_risks} />
                  )}

                  {/* TOP PREDICTED DISEASES ANALYTICS BAR CHART */}
                  {result.top_diseases && result.top_diseases.length > 0 && (
                    <DiseaseProbabilityChart diseases={result.top_diseases} />
                  )}

                  {/* FEATURE IMPORTANCE WEIGHT MATRIX CHART */}
                  {result.feature_importances && (
                    <FeatureWeightChart importances={result.feature_importances} />
                  )}
                </>
              ) : (
                /* Empty state prompt */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[420px] space-y-4">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Interactive Analytics & Prediction Ready</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                      Enter your symptoms or open optional vital readings (Fever °F, BP mmHg, SpO2, Heart Rate) and click &quot;Run ML Prediction & Generate Charts&quot;.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Official Medical Health Report Modal */}
        <PatientReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportData={reportData}
          loading={reportLoading}
        />
      </div>
    </ProtectedRoute>
  );
}
