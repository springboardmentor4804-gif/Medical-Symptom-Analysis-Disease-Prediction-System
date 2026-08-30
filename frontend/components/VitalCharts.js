'use client';

import React from 'react';

/**
 * 1. FEVER TEMPERATURE GAUGE & THERMOMETER CHART
 * Visualizes body temperature on a clinical scale with colored risk spectrum zones.
 */
export function FeverGaugeChart({ temp, unit = '°F' }) {
  if (temp === undefined || temp === null || temp === '') return null;

  const numericTemp = parseFloat(temp);
  const tempF = unit === '°C' ? (numericTemp * 9) / 5 + 32 : numericTemp;
  const tempC = unit === '°C' ? numericTemp : ((numericTemp - 32) * 5) / 9;

  // Scale bounds: 95°F (35°C) to 106°F (41.1°C)
  const minF = 95.0;
  const maxF = 106.0;
  const clampedF = Math.min(Math.max(tempF, minF), maxF);
  const percentage = ((clampedF - minF) / (maxF - minF)) * 100;

  let zoneLabel = 'Normal Body Temperature';
  let zoneColor = 'bg-emerald-500 text-emerald-700 dark:text-emerald-300 border-emerald-300';
  let badgeBg = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200';

  if (tempF >= 99.0 && tempF <= 100.4) {
    zoneLabel = 'Low-Grade Fever';
    zoneColor = 'bg-amber-500 text-amber-700 dark:text-amber-300 border-amber-300';
    badgeBg = 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200';
  } else if (tempF > 100.4 && tempF <= 103.0) {
    zoneLabel = 'Moderate Fever';
    zoneColor = 'bg-orange-500 text-orange-700 dark:text-orange-300 border-orange-300';
    badgeBg = 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-200';
  } else if (tempF > 103.0) {
    zoneLabel = 'High Fever Danger Risk';
    zoneColor = 'bg-rose-600 text-rose-700 dark:text-rose-300 border-rose-300';
    badgeBg = 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200';
  } else if (tempF < 97.0) {
    zoneLabel = 'Hypothermia Warning';
    zoneColor = 'bg-sky-500 text-sky-700 dark:text-sky-300 border-sky-300';
    badgeBg = 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200';
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/70 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fever Temperature Spectrum Chart
            </h4>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {tempF.toFixed(1)}°F ({tempC.toFixed(1)}°C)
            </span>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeBg}`}>
          {zoneLabel}
        </span>
      </div>

      {/* Thermometer Spectrum Bar Chart */}
      <div className="space-y-1.5 pt-1">
        <div className="relative w-full h-5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex p-0.5 border border-slate-300 dark:border-slate-700">
          {/* Normal Zone: 95 - 98.6 */}
          <div className="h-full bg-emerald-400 dark:bg-emerald-500/80 rounded-l-full" style={{ width: '32.7%' }} title="Normal (95°F - 98.6°F)" />
          {/* Low Grade: 98.6 - 100.4 */}
          <div className="h-full bg-amber-400 dark:bg-amber-500/80" style={{ width: '16.3%' }} title="Low-grade (98.6°F - 100.4°F)" />
          {/* Moderate: 100.4 - 103.0 */}
          <div className="h-full bg-orange-400 dark:bg-orange-500/80" style={{ width: '23.6%' }} title="Moderate (100.4°F - 103°F)" />
          {/* High Risk: 103.0 - 106.0 */}
          <div className="h-full bg-rose-500 dark:bg-rose-600 rounded-r-full" style={{ width: '27.4%' }} title="High Risk (>103°F)" />

          {/* Current Reading Needle Pointer */}
          <div
            className="absolute top-0 bottom-0 w-2.5 bg-slate-900 dark:bg-white rounded-full shadow-md border border-white dark:border-slate-900 transform -translate-x-1/2 transition-all duration-500"
            style={{ left: `${percentage}%` }}
          />
        </div>

        {/* Legend / Reference Scale */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1">
          <span>95°F (Normal)</span>
          <span>98.6°F</span>
          <span>100.4°F (Fever)</span>
          <span>103°F</span>
          <span>106°F+</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. BLOOD PRESSURE SPECTRUM & QUADRANT CHART
 * Visualizes Systolic & Diastolic mmHg range relative to AHA hypertension guidelines.
 */
export function BloodPressureSpectrumChart({ systolic, diastolic }) {
  if (!systolic && !diastolic) return null;

  const sys = parseInt(systolic || 120, 10);
  const dia = parseInt(diastolic || 80, 10);

  let bpCategory = 'Normal Blood Pressure';
  let badgeColor = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300';
  let description = 'Healthy optimal blood pressure range (<120 / <80 mmHg).';

  if (sys < 90 || dia < 60) {
    bpCategory = 'Hypotension (Low BP)';
    badgeColor = 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 border-sky-300';
    description = 'Blood pressure is below standard normal limits (<90/60 mmHg).';
  } else if (sys <= 120 && dia <= 80) {
    bpCategory = 'Normal BP';
    badgeColor = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300';
    description = 'Optimal normal arterial pressure.';
  } else if (sys <= 129 && dia <= 80) {
    bpCategory = 'Elevated Blood Pressure';
    badgeColor = 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300';
    description = 'Systolic is 120-129 mmHg with normal diastolic.';
  } else if ((sys >= 130 && sys <= 139) || (dia >= 81 && dia <= 89)) {
    bpCategory = 'Stage 1 Hypertension';
    badgeColor = 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-200 border-orange-300';
    description = 'Moderate hypertension stage (130-139 / 81-89 mmHg).';
  } else if (sys >= 140 || dia >= 90) {
    bpCategory = 'Stage 2 Hypertension';
    badgeColor = 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300';
    description = 'High arterial blood pressure (≥140 / ≥90 mmHg).';
  }

  // Calculate position in 2D plot scale
  // Systolic: 80 - 180 mmHg
  // Diastolic: 50 - 110 mmHg
  const sysPct = Math.min(Math.max(((sys - 80) / (180 - 80)) * 100, 5), 95);
  const diaPct = Math.min(Math.max(((dia - 50) / (110 - 50)) * 100, 5), 95);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Blood Pressure Range Chart
            </h4>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {sys} / {dia} <span className="text-xs font-normal text-slate-500">mmHg</span>
            </span>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
          {bpCategory}
        </span>
      </div>

      {/* 2D Quadrant Plot for BP */}
      <div className="relative w-full h-32 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 overflow-hidden">
        {/* Background Target Zone Gradients */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-25">
          <div className="bg-sky-400" title="Low BP / Normal" />
          <div className="bg-amber-400" title="Elevated / Prehypertension" />
          <div className="bg-emerald-400" title="Normal Range Zone" />
          <div className="bg-rose-500" title="Hypertension Zone" />
        </div>

        {/* AHA Guideline Overlay Bounds */}
        <div className="absolute left-0 right-0 bottom-[50%] border-b border-dashed border-slate-400 dark:border-slate-600 text-[9px] text-slate-400 pl-1">
          Normal Sys Limit (120 mmHg)
        </div>
        <div className="absolute top-0 bottom-0 left-[50%] border-r border-dashed border-slate-400 dark:border-slate-600 text-[9px] text-slate-400 pt-1 pl-1">
          Normal Dia (80 mmHg)
        </div>

        {/* Patient Coordinates Marker */}
        <div
          className="absolute w-4 h-4 rounded-full bg-purple-600 dark:bg-purple-400 border-2 border-white dark:border-slate-950 shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 animate-pulse"
          style={{ bottom: `${sysPct}%`, left: `${diaPct}%` }}
        />

        <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-400">
          Systolic {sys} vs Diastolic {dia}
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/**
 * 3. VITAL RANGES COMPARISON CHART
 * Displays horizontal spectrum bars for all inputted quantitative vitals vs normal ranges.
 */
export function VitalRangesComparisonChart({ metrics }) {
  if (!metrics || Object.keys(metrics).length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Quantitative Vital Signs Range Chart
        </h3>
        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-full">
          Clinical Reference Comparison
        </span>
      </div>

      <div className="space-y-4 pt-2">
        {/* Fever Temperature Bar */}
        {metrics.temperature && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Body Temperature (°F)</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {metrics.temperature.value}°F — {metrics.temperature.status}
              </span>
            </div>
            <div className="relative w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(
                    Math.max(((metrics.temperature.value - 95) / (106 - 95)) * 100, 5),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Oxygen Saturation Bar */}
        {metrics.oxygen_saturation && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Oxygen Saturation (SpO2 %)</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {metrics.oxygen_saturation.value}% — {metrics.oxygen_saturation.status}
              </span>
            </div>
            <div className="relative w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  metrics.oxygen_saturation.value >= 95
                    ? 'bg-emerald-500'
                    : metrics.oxygen_saturation.value >= 90
                    ? 'bg-amber-500'
                    : 'bg-rose-600'
                }`}
                style={{
                  width: `${Math.min(
                    Math.max(((metrics.oxygen_saturation.value - 70) / 30) * 100, 5),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Heart Rate Bar */}
        {metrics.heart_rate && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Heart Rate (BPM)</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {metrics.heart_rate.value} bpm — {metrics.heart_rate.status}
              </span>
            </div>
            <div className="relative w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  metrics.heart_rate.value >= 60 && metrics.heart_rate.value <= 100
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min(
                    Math.max(((metrics.heart_rate.value - 40) / 120) * 100, 5),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 4. DISEASE PROBABILITY BREAKDOWN CHART
 */
export function DiseaseProbabilityChart({ diseases }) {
  if (!diseases || diseases.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Probable Condition Risk Breakdown Chart
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            RandomForest multi-class classifier probabilities
          </p>
        </div>
        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-full">
          AI Diagnostic Match
        </span>
      </div>

      <div className="space-y-4 pt-2">
        {diseases.map((item, idx) => (
          <div key={item.disease} className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                {item.disease}
              </span>
              <span className="text-purple-600 dark:text-purple-400 font-mono">
                {item.probability}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(item.probability, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 5. FEATURE WEIGHT IMPORTANCE CHART
 */
export function FeatureWeightChart({ importances }) {
  if (!importances || Object.keys(importances).length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        RandomForest Predictor Weight Chart
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(importances).map(([feat, val]) => (
          <div key={feat} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300 capitalize">{feat.replace('_num', '').replace('_', ' ')}</span>
              <span className="text-purple-600 dark:text-purple-400 font-mono">{(val * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-purple-600 dark:bg-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${val * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. CLINICAL TRIAGE & EMERGENCY DIRECTIVE BANNER
 */
export function TriageEmergencyBanner({ triageLevel, triageColor, directive, timeframe, intenseFlags }) {
  if (!triageLevel) return null;

  let bgStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200";
  let badgeStyle = "bg-emerald-600 text-white";
  let iconColor = "text-emerald-600 dark:text-emerald-400";

  if (triageColor === 'red' || triageLevel === 'CRITICAL EMERGENCY') {
    bgStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/30 animate-pulse";
    badgeStyle = "bg-rose-600 text-white animate-bounce";
    iconColor = "text-rose-600 dark:text-rose-400";
  } else if (triageColor === 'orange' || triageLevel === 'SEVERE RISK') {
    bgStyle = "bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-800 text-amber-950 dark:text-amber-100";
    badgeStyle = "bg-amber-600 text-white";
    iconColor = "text-amber-600 dark:text-amber-400";
  } else if (triageColor === 'amber' || triageLevel === 'MODERATE RISK') {
    bgStyle = "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200";
    badgeStyle = "bg-yellow-600 text-white";
    iconColor = "text-yellow-600 dark:text-yellow-400";
  }

  return (
    <div className={`p-5 rounded-2xl border ${bgStyle} shadow-md space-y-3 transition-all`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-current/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-xs ${iconColor}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 block">
              Clinical Triage Level
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight">{triageLevel}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs ${badgeStyle}`}>
                {timeframe}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm font-semibold leading-relaxed">
        {directive}
      </p>

      {intenseFlags && intenseFlags.length > 0 && (
        <div className="pt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold opacity-75 mr-1">Active Intense Flags:</span>
          {intenseFlags.map((flag) => (
            <span key={flag} className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100 border border-rose-300 dark:border-rose-700">
              {flag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 7. MULTI-ORGAN SYSTEM RISK BREAKDOWN CHART
 */
export function OrganSystemRiskChart({ organRisks }) {
  if (!organRisks || Object.keys(organRisks).length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Multi-Organ System Risk Breakdown
        </h3>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full">
          Specialized Analytics
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {Object.entries(organRisks).map(([system, riskPct]) => {
          let barGradient = "from-emerald-500 to-teal-500";
          let riskLabel = "Low Risk";
          let textColor = "text-emerald-600 dark:text-emerald-400";

          if (riskPct >= 65) {
            barGradient = "from-rose-500 to-red-600";
            riskLabel = "High / Critical Risk";
            textColor = "text-rose-600 dark:text-rose-400 font-black";
          } else if (riskPct >= 35) {
            barGradient = "from-amber-500 to-orange-500";
            riskLabel = "Moderate Risk";
            textColor = "text-amber-600 dark:text-amber-400 font-bold";
          }

          return (
            <div key={system} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{system}</span>
                <span className={`font-mono text-xs ${textColor}`}>
                  {riskPct}% ({riskLabel})
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
                <div
                  className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-700`}
                  style={{ width: `${Math.max(riskPct, 5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
