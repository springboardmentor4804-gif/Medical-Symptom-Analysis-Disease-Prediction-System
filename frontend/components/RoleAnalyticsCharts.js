'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { api } from '../lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartDarkOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94A3B8',
        font: { family: 'sans-serif', size: 12, weight: '600' },
      },
    },
    tooltip: {
      backgroundColor: '#0F172A',
      titleColor: '#F8FAFC',
      bodyColor: '#E2E8F0',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
      ticks: { color: '#94A3B8', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
      ticks: { color: '#94A3B8', font: { size: 11 }, precision: 0 },
    },
  },
};

const pieDarkOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#94A3B8',
        font: { family: 'sans-serif', size: 12, weight: '600' },
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#0F172A',
      titleColor: '#F8FAFC',
      bodyColor: '#E2E8F0',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 10,
    },
  },
};

// ─── DOCTOR ANALYTICS VIEW ─────────────────────────────────────────
export function DoctorAnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/doctor/analytics');
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load doctor analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 font-medium text-sm animate-pulse">
        Loading Doctor Clinical Analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-300">
        {error}
      </div>
    );
  }

  // 1. Case Status Pie
  const caseStatusData = {
    labels: ['Pending Review', 'Solved Cases'],
    datasets: [
      {
        data: [data?.case_status?.pending || 0, data?.case_status?.solved || 0],
        backgroundColor: ['#F59E0B', '#10B981'],
        borderColor: ['#D97706', '#059669'],
        borderWidth: 2,
      },
    ],
  };

  // 2. Most Common Predicted Diseases Bar
  const diseaseLabels = (data?.most_common_diseases || []).map((item) => item.disease);
  const diseaseCounts = (data?.most_common_diseases || []).map((item) => item.count);
  const diseaseBarData = {
    labels: diseaseLabels,
    datasets: [
      {
        label: 'Patient Count',
        data: diseaseCounts,
        backgroundColor: 'rgba(168, 85, 247, 0.75)',
        borderColor: '#A855F7',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  // 3. Symptom Frequency Bar
  const symptomLabels = (data?.symptom_frequency || []).map((item) => item.symptom);
  const symptomCounts = (data?.symptom_frequency || []).map((item) => item.count);
  const symptomBarData = {
    labels: symptomLabels,
    datasets: [
      {
        label: 'Occurrences Logged',
        data: symptomCounts,
        backgroundColor: 'rgba(20, 184, 166, 0.75)',
        borderColor: '#14B8A6',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Case Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Case Review Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pending vs Solved patient cases
            </p>
          </div>
          <div className="h-60 mt-4 relative">
            <Doughnut data={caseStatusData} options={pieDarkOptions} />
          </div>
        </div>

        {/* Chart 2: Most Common Predicted Diseases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Most Common Predicted Conditions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Top disease indicators across assigned patients
            </p>
          </div>
          <div className="h-60 mt-4 relative">
            <Bar data={diseaseBarData} options={chartDarkOptions} />
          </div>
        </div>

      </div>

      {/* Chart 3: Symptom Frequency Distribution */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Patient Symptom Frequency Distribution
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Most frequently reported symptoms among your patients
        </p>
        <div className="h-64 relative">
          <Bar data={symptomBarData} options={chartDarkOptions} />
        </div>
      </div>
    </div>
  );
}

// ─── CLINIC ANALYTICS VIEW ─────────────────────────────────────────
export function ClinicAnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/clinic/analytics');
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load clinic analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 font-medium text-sm animate-pulse">
        Loading Clinic Intelligence Analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-300">
        {error}
      </div>
    );
  }

  // 1. Total Cases by Risk Level Pie
  const riskDist = data?.risk_level_distribution || {};
  const riskPieData = {
    labels: Object.keys(riskDist),
    datasets: [
      {
        data: Object.values(riskDist),
        backgroundColor: ['#10B981', '#F59E0B', '#F97316', '#EF4444'],
        borderColor: ['#059669', '#D97706', '#EA580C', '#DC2626'],
        borderWidth: 1.5,
      },
    ],
  };

  // 2. Doctor Caseload Bar
  const caseloadLabels = (data?.doctor_caseload || []).map((item) => item.doctor_name);
  const caseloadCounts = (data?.doctor_caseload || []).map((item) => item.patient_count);
  const caseloadBarData = {
    labels: caseloadLabels,
    datasets: [
      {
        label: 'Patients Assigned',
        data: caseloadCounts,
        backgroundColor: 'rgba(56, 189, 248, 0.75)',
        borderColor: '#38BDF8',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  // 3. Most Common Diagnoses Bar
  const diagLabels = (data?.most_common_diagnoses || []).map((item) => item.diagnosis);
  const diagCounts = (data?.most_common_diagnoses || []).map((item) => item.count);
  const diagBarData = {
    labels: diagLabels,
    datasets: [
      {
        label: 'Resolved Diagnoses Count',
        data: diagCounts,
        backgroundColor: 'rgba(20, 184, 166, 0.75)',
        borderColor: '#14B8A6',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Triage Risk Level Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Risk Level Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total patient cases categorized by triage severity
            </p>
          </div>
          <div className="h-60 mt-4 relative">
            <Pie data={riskPieData} options={pieDarkOptions} />
          </div>
        </div>

        {/* Chart 2: Doctor Caseload Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Doctor Caseload Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active patient volume assigned per physician
            </p>
          </div>
          <div className="h-60 mt-4 relative">
            <Bar data={caseloadBarData} options={chartDarkOptions} />
          </div>
        </div>

      </div>

      {/* Chart 3: Most Common Clinic Diagnoses */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Most Common Clinical Diagnoses
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Top final diagnoses confirmed by clinic staff
        </p>
        <div className="h-64 relative">
          <Bar data={diagBarData} options={chartDarkOptions} />
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN ANALYTICS VIEW ──────────────────────────────────────────
export function AdminAnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/admin/analytics');
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load platform analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 font-medium text-sm animate-pulse">
        Loading Platform Admin Intelligence...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-300">
        {error}
      </div>
    );
  }

  // 1. Submissions Over Time Line Chart
  const timeLabels = (data?.submissions_over_time || []).map((item) => item.date.slice(5));
  const timeCounts = (data?.submissions_over_time || []).map((item) => item.count);
  const lineData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Symptom Submissions & Predictions',
        data: timeCounts,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#059669',
        pointRadius: 3,
      },
    ],
  };

  // 2. Risk Level Distribution Doughnut
  const riskDist = data?.risk_level_distribution || {};
  const riskDoughnutData = {
    labels: Object.keys(riskDist),
    datasets: [
      {
        data: Object.values(riskDist),
        backgroundColor: ['#10B981', '#F59E0B', '#F97316', '#EF4444'],
        borderColor: ['#059669', '#D97706', '#EA580C', '#DC2626'],
        borderWidth: 1.5,
      },
    ],
  };

  // 3. Most Frequent Diseases Predicted Bar
  const diseaseLabels = (data?.most_frequent_diseases || []).map((item) => item.disease);
  const diseaseCounts = (data?.most_frequent_diseases || []).map((item) => item.count);
  const diseaseBarData = {
    labels: diseaseLabels,
    datasets: [
      {
        label: 'Prediction Hits',
        data: diseaseCounts,
        backgroundColor: 'rgba(168, 85, 247, 0.75)',
        borderColor: '#A855F7',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      
      {/* Chart 1: Platform Submission Trends Over Time */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Symptom Submissions & AI Predictions (Last 30 Days)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily intake volume trends across the platform
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
            Total Predictions: {data?.total_predictions || 0}
          </span>
        </div>
        <div className="h-64 relative">
          <Line data={lineData} options={chartDarkOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 2: Risk Level Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Platform Risk Stratification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Triage breakdown across all processed cases
            </p>
          </div>
          <div className="h-60 mt-4 relative">
            <Doughnut data={riskDoughnutData} options={pieDarkOptions} />
          </div>
        </div>

        {/* Chart 3: Most Frequent Diseases Predicted */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Most Frequent Predicted Diseases
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Top RandomForest classification frequency platform-wide
            </p>
          </div>
          <div className="h-60 mt-4 relative">
            <Bar data={diseaseBarData} options={chartDarkOptions} />
          </div>
        </div>

      </div>
    </div>
  );
}
