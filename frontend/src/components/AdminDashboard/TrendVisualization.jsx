import React, { useState } from 'react';
import { TrendingUp, Calendar, Activity, HeartPulse, Layers, BarChart2 } from 'lucide-react';

export default function TrendVisualization({ analytics }) {
  const [activeTrendTab, setActiveTrendTab] = useState('volume'); // 'volume' | 'severity' | 'risk' | 'disease'

  const {
    assessmentTrends = [],
    severityTrends = [],
    riskTrends = [],
    diseaseTrends = []
  } = analytics || {};

  const maxVolume = Math.max(...assessmentTrends.map(t => t.count), 1);

  return (
    <div className="card glass-panel padding-md margin-top-sm border-primary" style={{ border: '1px solid rgba(6, 182, 212, 0.3)' }}>
      {/* Visualizer Header */}
      <div className="border-bottom padding-bottom-xs flex-between flex-wrap">
        <div className="flex-gap">
          <TrendingUp size={22} color="#06b6d4" />
          <div>
            <h4 className="text-highlight">Healthcare Time-Series Trend Visualizer</h4>
            <p className="card-subtitle text-xs">
              Chronological trends of disease predictions, symptom severities, and risk levels over time
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="trend-tab-controls flex-gap margin-top-xs">
          <button
            type="button"
            onClick={() => setActiveTrendTab('volume')}
            className={`btn-sm ${activeTrendTab === 'volume' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Activity size={14} /> <span>Assessment Volume</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTrendTab('severity')}
            className={`btn-sm ${activeTrendTab === 'severity' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <TrendingUp size={14} /> <span>Severity Trends</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTrendTab('risk')}
            className={`btn-sm ${activeTrendTab === 'risk' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <HeartPulse size={14} /> <span>CVD & Risk Trends</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTrendTab('disease')}
            className={`btn-sm ${activeTrendTab === 'disease' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Layers size={14} /> <span>Disease Trends</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: ASSESSMENT VOLUME TRENDS OVER TIME --- */}
      {activeTrendTab === 'volume' && (
        <div className="trend-content margin-top-xs fade-in">
          <h5 className="text-xs text-muted margin-bottom-xs font-bold">
            📈 Daily Assessment Submission Volume Over Time:
          </h5>
          {assessmentTrends.length === 0 ? (
            <p className="text-xs text-muted padding-y-md text-center">No timeline records recorded yet.</p>
          ) : (
            <div className="timeline-bars-grid flex-gap margin-top-xs" style={{ alignItems: 'flex-end', height: '140px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {assessmentTrends.map((t, idx) => {
                const heightPct = Math.max(Math.round((t.count / maxVolume) * 100), 12);
                return (
                  <div key={idx} className="flex-1 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span className="text-2xs text-highlight font-bold margin-bottom-2xs">{t.count}</span>
                    <div
                      className="bar-column"
                      style={{
                        width: '70%',
                        height: `${heightPct}%`,
                        background: 'linear-gradient(180deg, #06b6d4, #3b82f6)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease'
                      }}
                      title={`${t.date}: ${t.count} assessments`}
                    ></div>
                    <span className="text-2xs text-dim margin-top-2xs" style={{ whiteSpace: 'nowrap', fontSize: '0.65rem' }}>{t.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: SYMPTOM SEVERITY TRENDS OVER TIME --- */}
      {activeTrendTab === 'severity' && (
        <div className="trend-content margin-top-xs fade-in">
          <h5 className="text-xs text-muted margin-bottom-xs font-bold">
            🌡️ Symptom Severity Distribution (Mild / Moderate / Severe) Over Time:
          </h5>
          {severityTrends.length === 0 ? (
            <p className="text-xs text-muted padding-y-md text-center">No severity timeline records recorded yet.</p>
          ) : (
            <div className="severity-timeline-list margin-top-xs">
              {severityTrends.map((s, idx) => {
                const total = (s.Mild + s.Moderate + s.Severe) || 1;
                return (
                  <div key={idx} className="margin-bottom-xs padding-xs background-dark border-radius-sm">
                    <div className="flex-between text-xs margin-bottom-2xs">
                      <span className="font-bold flex-gap"><Calendar size={12} /> Date: {s.date}</span>
                      <span className="text-dim">Total: {total} cases</span>
                    </div>
                    <div className="stacked-bar-container" style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ width: `${(s.Mild / total) * 100}%`, background: '#10b981' }} title={`Mild: ${s.Mild}`}></div>
                      <div style={{ width: `${(s.Moderate / total) * 100}%`, background: '#eab308' }} title={`Moderate: ${s.Moderate}`}></div>
                      <div style={{ width: `${(s.Severe / total) * 100}%`, background: '#f43f5e' }} title={`Severe: ${s.Severe}`}></div>
                    </div>
                    <div className="flex-gap text-2xs margin-top-2xs">
                      <span style={{ color: '#10b981' }}>● Mild: {s.Mild}</span>
                      <span style={{ color: '#eab308' }}>● Moderate: {s.Moderate}</span>
                      <span style={{ color: '#f43f5e' }}>● Severe: {s.Severe}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: CVD & RISK ASSESSMENT TRENDS OVER TIME --- */}
      {activeTrendTab === 'risk' && (
        <div className="trend-content margin-top-xs fade-in">
          <h5 className="text-xs text-muted margin-bottom-xs font-bold">
            🎯 CVD & Risk Triage Categories (Low / Moderate / High / Critical) Over Time:
          </h5>
          {riskTrends.length === 0 ? (
            <p className="text-xs text-muted padding-y-md text-center">No risk timeline records recorded yet.</p>
          ) : (
            <div className="risk-timeline-list margin-top-xs">
              {riskTrends.map((r, idx) => {
                const total = (r.Low + r.Moderate + r.High + r.Critical) || 1;
                return (
                  <div key={idx} className="margin-bottom-xs padding-xs background-dark border-radius-sm">
                    <div className="flex-between text-xs margin-bottom-2xs">
                      <span className="font-bold flex-gap"><Calendar size={12} /> Date: {r.date}</span>
                      <span className="text-dim">Total Triage: {total} cases</span>
                    </div>
                    <div className="stacked-bar-container" style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ width: `${(r.Low / total) * 100}%`, background: '#10b981' }} title={`Low: ${r.Low}`}></div>
                      <div style={{ width: `${(r.Moderate / total) * 100}%`, background: '#eab308' }} title={`Moderate: ${r.Moderate}`}></div>
                      <div style={{ width: `${(r.High / total) * 100}%`, background: '#f97316' }} title={`High: ${r.High}`}></div>
                      <div style={{ width: `${(r.Critical / total) * 100}%`, background: '#f43f5e' }} title={`Critical: ${r.Critical}`}></div>
                    </div>
                    <div className="flex-gap text-2xs margin-top-2xs">
                      <span style={{ color: '#10b981' }}>🟢 Low: {r.Low}</span>
                      <span style={{ color: '#eab308' }}>🟡 Moderate: {r.Moderate}</span>
                      <span style={{ color: '#f97316' }}>🟠 High: {r.High}</span>
                      <span style={{ color: '#f43f5e' }}>🔴 Critical: {r.Critical}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: DISEASE DISTRIBUTION OVER TIME --- */}
      {activeTrendTab === 'disease' && (
        <div className="trend-content margin-top-xs fade-in">
          <h5 className="text-xs text-muted margin-bottom-xs font-bold">
            📊 Predicted Disease Conditions Logged Over Time:
          </h5>
          {diseaseTrends.length === 0 ? (
            <p className="text-xs text-muted padding-y-md text-center">No disease timeline records recorded yet.</p>
          ) : (
            <div className="disease-timeline-list margin-top-xs">
              {diseaseTrends.map((d, idx) => (
                <div key={idx} className="margin-bottom-xs padding-xs background-dark border-radius-sm">
                  <span className="font-bold text-xs flex-gap margin-bottom-xs" style={{ color: '#06b6d4' }}>
                    <Calendar size={12} /> Date: {d.date}
                  </span>
                  <div className="symptoms-chips-container">
                    {Object.keys(d.conditions || {}).map((condName, cIdx) => (
                      <span key={cIdx} className="disease-option-chip active" style={{ fontSize: '0.75rem' }}>
                        {condName}: {d.conditions[condName]} cases
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
