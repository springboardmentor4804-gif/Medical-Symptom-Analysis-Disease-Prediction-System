import React, { useState, useEffect } from 'react';
import { db, CASES_UPDATED_EVENT } from '../../services/db';
import TrendVisualization from './TrendVisualization';
import { BarChart3, Users, Stethoscope, CheckCircle2, Clock, Activity, TrendingUp, AlertTriangle, ShieldCheck, HeartPulse, RefreshCw, Layers, Award, FileText } from 'lucide-react';


export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await db.getAnalyticsData();
      setAnalytics(data);
    } catch (err) {
      console.warn('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const handleSync = () => {
      fetchAnalytics();
    };

    window.addEventListener(CASES_UPDATED_EVENT, handleSync);
    window.addEventListener('casesUpdated', handleSync);
    return () => {
      window.removeEventListener(CASES_UPDATED_EVENT, handleSync);
      window.removeEventListener('casesUpdated', handleSync);
    };
  }, []);

  if (loading && !analytics) {
    return (
      <div className="card glass-panel padding-lg text-center fade-in">
        <BarChart3 size={40} className="icon-faded spin-icon" color="#06b6d4" />
        <p className="margin-top-xs text-muted">Loading Real Database Analytics...</p>
      </div>
    );
  }

  const {
    patientCount = 0,
    doctorCount = 0,
    adminCount = 0,
    totalAssessments = 0,
    reviewedCount = 0,
    pendingCount = 0,
    completedReports = 0,
    avgRiskScore = 0,
    diseaseDistribution = [],
    riskLevelDistribution = { Low: 0, Moderate: 0, High: 0, Critical: 0 },
    severityDistribution = { Mild: 0, Moderate: 0, Severe: 0 },
    assessmentTrends = []
  } = analytics || {};

  const totalRiskCases = (riskLevelDistribution.Low + riskLevelDistribution.Moderate + riskLevelDistribution.High + riskLevelDistribution.Critical) || 1;
  const totalSevCases = (severityDistribution.Mild + severityDistribution.Moderate + severityDistribution.Severe) || 1;
  const completionRate = totalAssessments > 0 ? Math.round((reviewedCount / totalAssessments) * 100) : 0;

  return (
    <div className="analytics-dashboard-section fade-in margin-bottom-md">
      {/* Header Banner */}
      <div className="card glass-panel padding-md margin-bottom-sm flex-between flex-wrap border-primary" style={{ border: '1px solid rgba(6, 182, 212, 0.3)' }}>
        <div className="flex-gap">
          <div className="admin-avatar">
            <BarChart3 size={28} color="#06b6d4" />
          </div>
          <div>
            <h3 className="text-highlight">System Healthcare & Clinical Analytics</h3>
            <p className="card-subtitle text-xs">
              Real-time aggregated metrics from MongoDB Atlas: Patients, Doctors, ML Disease Predictions & Risk Distribution
            </p>
          </div>
        </div>

        <button type="button" onClick={fetchAnalytics} className="btn-secondary btn-sm flex-gap" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
          <span>Sync Analytics</span>
        </button>
      </div>

      {/* --- 1. PATIENT & SYSTEM METRIC STAT CARDS --- */}
      <div className="grid-4-col gap-sm margin-bottom-sm">
        {/* Total Patients */}
        <div className="stat-card glass-panel padding-sm border-radius-md flex-between">
          <div>
            <span className="text-xs text-muted font-bold uppercase">Total Patients</span>
            <h3 className="text-highlight margin-top-2xs">{patientCount}</h3>
            <span className="text-xs text-dim">Registered Accounts</span>
          </div>
          <div className="stat-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <Users size={24} color="#06b6d4" />
          </div>
        </div>

        {/* Total Doctors */}
        <div className="stat-card glass-panel padding-sm border-radius-md flex-between">
          <div>
            <span className="text-xs text-muted font-bold uppercase">Total Doctors</span>
            <h3 className="text-purple margin-top-2xs">{doctorCount}</h3>
            <span className="text-xs text-dim">Active Specialists</span>
          </div>
          <div className="stat-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <Stethoscope size={24} color="#a855f7" />
          </div>
        </div>

        {/* Total Assessments */}
        <div className="stat-card glass-panel padding-sm border-radius-md flex-between">
          <div>
            <span className="text-xs text-muted font-bold uppercase">Total Assessments</span>
            <h3 className="text-warning margin-top-2xs">{totalAssessments}</h3>
            <span className="text-xs text-dim">ML Case Evaluations</span>
          </div>
          <div className="stat-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <Activity size={24} color="#f59e0b" />
          </div>
        </div>

        {/* Reviewed Cases */}
        <div className="stat-card glass-panel padding-sm border-radius-md flex-between">
          <div>
            <span className="text-xs text-muted font-bold uppercase">Reviewed Cases</span>
            <h3 className="text-success margin-top-2xs">{reviewedCount}</h3>
            <span className="text-xs text-dim">{completionRate}% Completion Rate</span>
          </div>
          <div className="stat-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <CheckCircle2 size={24} color="#10b981" />
          </div>
        </div>
      </div>

      {/* --- 2. DISEASE DISTRIBUTION & FREQUENCY ANALYTICS --- */}
      <div className="grid-2-col gap-sm margin-bottom-sm">
        {/* Disease Distribution Chart */}
        <div className="card glass-panel padding-sm">
          <h4 className="flex-gap text-highlight border-bottom padding-bottom-xs margin-bottom-xs">
            <Layers size={18} color="#06b6d4" /> Predicted Disease Distribution & Frequency
          </h4>
          
          {diseaseDistribution.length === 0 ? (
            <p className="text-xs text-muted padding-y-md text-center">No disease prediction data recorded yet.</p>
          ) : (
            <div className="disease-chart-bars margin-top-xs">
              {diseaseDistribution.map((d, idx) => (
                <div key={idx} className="margin-bottom-xs">
                  <div className="flex-between text-xs margin-bottom-2xs">
                    <span className="font-bold">{d.condition}</span>
                    <span className="text-dim">{d.count} cases ({d.percentage}%)</span>
                  </div>
                  <div className="progress-track" style={{ background: 'rgba(255,255,255,0.08)', height: '10px', borderRadius: '5px' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.max(d.percentage, 5)}%`,
                        background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                        height: '100%',
                        borderRadius: '5px'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk Level Category Distribution */}
        <div className="card glass-panel padding-sm">
          <h4 className="flex-gap text-highlight border-bottom padding-bottom-xs margin-bottom-xs">
            <HeartPulse size={18} color="#f97316" /> Risk Level Breakdown & Severity Ratings
          </h4>

          <div className="risk-level-breakdown margin-top-xs">
            {/* Low Risk */}
            <div className="margin-bottom-xs padding-xs background-dark border-radius-sm">
              <div className="flex-between text-xs margin-bottom-2xs">
                <span className="font-bold text-success">🟢 Low Risk</span>
                <span>{riskLevelDistribution.Low} cases ({Math.round((riskLevelDistribution.Low / totalRiskCases) * 100)}%)</span>
              </div>
              <div className="progress-track" style={{ background: 'rgba(255,255,255,0.08)', height: '8px', borderRadius: '4px' }}>
                <div className="progress-fill" style={{ width: `${(riskLevelDistribution.Low / totalRiskCases) * 100}%`, background: '#10b981', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Moderate Risk */}
            <div className="margin-bottom-xs padding-xs background-dark border-radius-sm">
              <div className="flex-between text-xs margin-bottom-2xs">
                <span className="font-bold text-warning">🟡 Moderate Risk</span>
                <span>{riskLevelDistribution.Moderate} cases ({Math.round((riskLevelDistribution.Moderate / totalRiskCases) * 100)}%)</span>
              </div>
              <div className="progress-track" style={{ background: 'rgba(255,255,255,0.08)', height: '8px', borderRadius: '4px' }}>
                <div className="progress-fill" style={{ width: `${(riskLevelDistribution.Moderate / totalRiskCases) * 100}%`, background: '#eab308', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* High Risk */}
            <div className="margin-bottom-xs padding-xs background-dark border-radius-sm">
              <div className="flex-between text-xs margin-bottom-2xs">
                <span className="font-bold text-orange" style={{ color: '#f97316' }}>🟠 High Risk</span>
                <span>{riskLevelDistribution.High} cases ({Math.round((riskLevelDistribution.High / totalRiskCases) * 100)}%)</span>
              </div>
              <div className="progress-track" style={{ background: 'rgba(255,255,255,0.08)', height: '8px', borderRadius: '4px' }}>
                <div className="progress-fill" style={{ width: `${(riskLevelDistribution.High / totalRiskCases) * 100}%`, background: '#f97316', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Critical Risk */}
            <div className="margin-bottom-xs padding-xs background-dark border-radius-sm">
              <div className="flex-between text-xs margin-bottom-2xs">
                <span className="font-bold text-danger">🔴 Critical Risk</span>
                <span>{riskLevelDistribution.Critical} cases ({Math.round((riskLevelDistribution.Critical / totalRiskCases) * 100)}%)</span>
              </div>
              <div className="progress-track" style={{ background: 'rgba(255,255,255,0.08)', height: '8px', borderRadius: '4px' }}>
                <div className="progress-fill" style={{ width: `${(riskLevelDistribution.Critical / totalRiskCases) * 100}%`, background: '#f43f5e', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Average Risk Index Score */}
            <div className="avg-risk-score-box margin-top-xs padding-xs background-glass border-radius-sm flex-between text-xs">
              <span className="text-muted font-bold">Average System Risk Index Score:</span>
              <span className="font-bold text-highlight" style={{ fontSize: '1rem' }}>{avgRiskScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- 3. SEVERITY DISTRIBUTION & ASSESSMENT PROGRESS RATIO --- */}
      <div className="grid-2-col gap-sm">
        {/* Symptom Severity Distribution */}
        <div className="card glass-panel padding-sm">
          <h4 className="flex-gap text-highlight border-bottom padding-bottom-xs margin-bottom-xs">
            <TrendingUp size={18} color="#a855f7" /> Symptom Severity Level Distribution
          </h4>
          <div className="grid-3-col gap-xs margin-top-xs text-center">
            <div className="padding-xs background-dark border-radius-sm">
              <span className="text-xs text-muted block">Mild</span>
              <h4 className="text-success margin-top-2xs">{severityDistribution.Mild}</h4>
              <span className="text-2xs text-dim">{Math.round((severityDistribution.Mild / totalSevCases) * 100)}% of total</span>
            </div>

            <div className="padding-xs background-dark border-radius-sm">
              <span className="text-xs text-muted block">Moderate</span>
              <h4 className="text-warning margin-top-2xs">{severityDistribution.Moderate}</h4>
              <span className="text-2xs text-dim">{Math.round((severityDistribution.Moderate / totalSevCases) * 100)}% of total</span>
            </div>

            <div className="padding-xs background-dark border-radius-sm">
              <span className="text-xs text-muted block">Severe</span>
              <h4 className="text-danger margin-top-2xs">{severityDistribution.Severe}</h4>
              <span className="text-2xs text-dim">{Math.round((severityDistribution.Severe / totalSevCases) * 100)}% of total</span>
            </div>
          </div>
        </div>

        {/* Assessment Progress & Completion */}
        <div className="card glass-panel padding-sm">
          <h4 className="flex-gap text-highlight border-bottom padding-bottom-xs margin-bottom-xs">
            <Clock size={18} color="#eab308" /> Assessment Triage & Completion Ratio
          </h4>

          <div className="margin-top-xs text-xs">
            <div className="flex-between margin-bottom-2xs">
              <span>Reviewed Doctor Consultations:</span>
              <strong className="text-success">{reviewedCount} cases</strong>
            </div>
            <div className="flex-between margin-bottom-xs">
              <span>Pending Doctor Triage Queue:</span>
              <strong className="text-warning">{pendingCount} cases</strong>
            </div>

            <div className="progress-track" style={{ background: 'rgba(234, 179, 8, 0.2)', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${completionRate}%`,
                  background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                  height: '100%'
                }}
              ></div>
            </div>
            <div className="flex-between text-2xs text-dim margin-top-2xs">
              <span>{completionRate}% Doctor Prescribed</span>
              <span>100% Total Cases</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- 4. HEALTHCARE TIME-SERIES TREND VISUALIZER --- */}
      <TrendVisualization analytics={analytics} />
    </div>
  );
}

