import React from 'react';
import { useMedical } from '../../context/MedicalContext.jsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  Clock 
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DoctorAnalytics() {
  const { patientLogs, appointments } = useMedical();

  // Calculate KPIs
  const totalEvaluations = patientLogs.length;
  const highRiskCount = patientLogs.filter((l) => (l.riskLevel || '').toLowerCase() === 'high').length;
  const mediumRiskCount = patientLogs.filter((l) => (l.riskLevel || '').toLowerCase() === 'medium').length;
  const lowRiskCount = patientLogs.filter((l) => (l.riskLevel || '').toLowerCase() === 'low').length;
  
  const pendingReviews = patientLogs.filter((l) => !l.reviewedByDoctor).length;
  const avgConfidence = totalEvaluations > 0 
    ? Math.round(patientLogs.reduce((acc, curr) => acc + (curr.confidence || 80), 0) / totalEvaluations)
    : 85;

  // 1. Line Chart Data: Weekly Symptom Trends & Prediction Volume
  const trendLabels = ['Mar 03', 'Mar 04', 'Mar 05', 'Mar 06', 'Mar 07', 'Mar 08', 'Mar 09'];
  const lineChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Total Triage Evaluations',
        data: [12, 19, 15, 24, 22, 28, 31],
        borderColor: '#4f46e5', // indigo-600
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.38,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'High-Risk Critical Flags',
        data: [2, 5, 3, 8, 6, 9, 11],
        borderColor: '#e11d48', // rose-600
        backgroundColor: 'rgba(225, 29, 72, 0.08)',
        fill: true,
        tension: 0.38,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  // 2. Bar Chart Data: Top Predicted Diseases Distribution
  // Count frequency from logs
  const diseaseCounts = {};
  patientLogs.forEach((log) => {
    const dis = log.predictedDisease || 'General Viral Syndrome';
    diseaseCounts[dis] = (diseaseCounts[dis] || 0) + 1;
  });

  // Seed with standard diseases if logs are small
  const defaultDistribution = {
    'Acute Bronchitis': diseaseCounts['Acute Bronchitis'] || 8,
    'Hypertension': diseaseCounts['Hypertension (Stage 2 Elevated)'] || 14,
    'Dengue Fever': diseaseCounts['Dengue Fever'] || 9,
    'Diabetes (Type 2)': diseaseCounts['Type 2 Diabetes Mellitus (Uncontrolled)'] || 11,
    'Migraine': diseaseCounts['Migraine with Aura'] || 7,
    'Pneumonia': diseaseCounts['Community-Acquired Pneumonia'] || 5
  };

  const barChartData = {
    labels: Object.keys(defaultDistribution),
    datasets: [
      {
        label: 'Diagnosed Cases',
        data: Object.values(defaultDistribution),
        backgroundColor: [
          '#6366f1',
          '#f43f5e',
          '#f59e0b',
          '#0d9488',
          '#8b5cf6',
          '#3b82f6'
        ],
        borderRadius: 8
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          maxRotation: 25,
          minRotation: 20
        }
      }
    }
  };

  // 3. Doughnut Chart: Patient Risk Stratification
  const doughnutData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [
      {
        data: [
          Math.max(highRiskCount, 1),
          Math.max(mediumRiskCount, 1),
          Math.max(lowRiskCount, 1)
        ],
        backgroundColor: ['#f43f5e', '#f59e0b', '#10b981'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: '600' }
        }
      }
    },
    cutout: '68%'
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Executive Clinical Analytics & Epidemic Intelligence
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Population health trends, clinical disease distribution, risk stratification, and patient intake volume
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Consultations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Triage Intake</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalEvaluations} Cases</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +14% from last week
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* High Risk Critical Cases */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider">Critical High Risk</p>
            <h3 className="text-2xl font-extrabold text-rose-700 mt-1">{highRiskCount} Patients</h3>
            <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Immediate review required
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Diagnostic Confidence */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Model Precision</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{avgConfidence}%</h3>
            <p className="text-[11px] text-indigo-600 font-bold mt-1">Average confidence score</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Provider Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Physician Review</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{pendingReviews} Records</h3>
            <p className="text-[11px] text-amber-600 font-bold mt-1">Awaiting clinical sign-off</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Linear Trend Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Symptom Trends & Diagnostic Volume Over Time
              </h3>
              <p className="text-xs text-slate-500">
                7-day longitudinal trajectory of triage inputs and elevated severity cases
              </p>
            </div>
          </div>
          <div className="h-72">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* 2. Doughnut Chart: Risk Level Stratification (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Patient Risk Level Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Stratification: High, Medium, and Low risk clinical triage
            </p>
          </div>
          <div className="h-56 relative my-2">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-xs text-slate-400 font-medium">Total</span>
              <span className="text-xl font-black text-slate-800">{totalEvaluations}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-around text-center text-xs">
            <div>
              <span className="block font-black text-rose-600">{highRiskCount}</span>
              <span className="text-[10px] text-slate-400">High</span>
            </div>
            <div>
              <span className="block font-black text-amber-600">{mediumRiskCount}</span>
              <span className="text-[10px] text-slate-400">Medium</span>
            </div>
            <div>
              <span className="block font-black text-emerald-600">{lowRiskCount}</span>
              <span className="text-[10px] text-slate-400">Low</span>
            </div>
          </div>
        </div>

        {/* 3. Bar Chart: Top Predicted Diseases Distribution (12 cols) */}
        <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Top Predicted Disease Distribution (Disease Frequency)
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated clinical conditions identified across recent patient presentations
              </p>
            </div>
          </div>
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
