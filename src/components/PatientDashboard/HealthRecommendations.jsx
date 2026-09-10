import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Lightbulb, Pill, Compass, Utensils, AlertTriangle, Info, Download, Printer, Award, Cpu, Stethoscope, RefreshCw } from 'lucide-react';

export default function HealthRecommendations({ currentUser, predictionResult }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentCondition, setCurrentCondition] = useState('General Acute Condition');
  const [currentRisk, setCurrentRisk] = useState('Moderate');

  const patientProfile = currentUser?.id ? db.getProfile(currentUser.id) : {};

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      if (predictionResult && predictionResult.recommendations) {
        setRecommendations(predictionResult.recommendations);
        setCurrentCondition(predictionResult.primaryCondition || predictionResult.predictedDisease);
        setCurrentRisk(predictionResult.riskLevel || 'Moderate');
      } else {
        // Fallback or load from latest patient case history
        const patientCases = currentUser?.id ? db.getPatientCases(currentUser.id) : [];
        let cond = 'General Acute Condition';
        let risk = 'Moderate';
        let symptoms = ['chest_pain', 'palpitations'];

        if (patientCases.length > 0) {
          const latestCase = patientCases[0];
          cond = latestCase.predictedCondition || cond;
          risk = latestCase.riskLevel || risk;
          symptoms = latestCase.symptoms || symptoms;
        }

        setCurrentCondition(cond);
        setCurrentRisk(risk);

        const recs = await db.getRecommendations({
          predictedDisease: cond,
          riskLevel: risk,
          severity: 'Moderate',
          selectedSymptomIds: symptoms
        });

        if (recs) {
          setRecommendations(recs);
        }
      }
    } catch (err) {
      console.warn('Error loading health recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [currentUser, predictionResult]);

  const handleDownloadRecommendations = () => {
    window.print();
  };

  return (
    <div className="card glass-panel fade-in">
      {/* Header Banner */}
      <div className="card-header border-bottom flex-between">
        <div>
          <h3><Lightbulb className="icon-header glow-icon" color="#06b6d4" /> AI Health & Treatment Recommendations</h3>
          <p className="card-subtitle">
            Personalized supportive care, lifestyle guidance, dietary advice, and safety alerts based on your AI disease prediction
          </p>
        </div>

        <div className="flex-gap">
          <button
            type="button"
            onClick={loadRecommendations}
            className="btn-secondary btn-sm no-print"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadRecommendations}
            className="btn-primary btn-sm no-print"
            title="Download / Print Health Recommendations"
          >
            <Download size={14} />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="padding-lg text-center">
          <Cpu size={40} className="icon-faded pulse-glow" color="#06b6d4" />
          <p className="margin-top-xs text-muted">Generating AI Health Recommendations...</p>
        </div>
      ) : recommendations ? (
        <div className="recommendations-container padding-md">
          {/* Target Disease Context Banner */}
          <div className="condition-context-box padding-xs background-dark border-radius-sm border-glass flex-between margin-bottom-sm">
            <div>
              <span className="text-xs text-muted">Target Predicted Condition:</span>
              <h4 className="text-highlight margin-top-2xs">{currentCondition}</h4>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted">Assessed Risk Level:</span>
              <div className="margin-top-2xs">
                <span className={`risk-pill ${currentRisk.toLowerCase()}`}>{currentRisk} Risk</span>
              </div>
            </div>
          </div>

          {/* Urgency Alert Banner */}
          {recommendations.urgencyAlert && (
            <div className="alert-banner alert-info margin-bottom-sm">
              <Info size={18} />
              <span>{recommendations.urgencyAlert}</span>
            </div>
          )}

          {/* 4 Core Recommendation Cards */}
          <div className="grid-2-col gap-md margin-top-xs">
            {/* 1. Supportive Self-Care */}
            <div className="rec-card glass-panel padding-sm border-radius-md" style={{ borderLeft: '4px solid #10b981' }}>
              <h4 className="flex-gap text-success margin-bottom-xs">
                <Pill size={20} color="#10b981" /> 1. Supportive Self-Care & Relief
              </h4>
              <p className="text-sm text-dim leading-relaxed">{recommendations.primaryCare}</p>
            </div>

            {/* 2. Lifestyle Adjustments */}
            <div className="rec-card glass-panel padding-sm border-radius-md" style={{ borderLeft: '4px solid #a855f7' }}>
              <h4 className="flex-gap text-purple margin-bottom-xs">
                <Compass size={20} color="#a855f7" /> 2. Lifestyle & Environment Guidance
              </h4>
              <p className="text-sm text-dim leading-relaxed">{recommendations.lifestyleAdvice}</p>
            </div>

            {/* 3. Dietary Guidance */}
            <div className="rec-card glass-panel padding-sm border-radius-md" style={{ borderLeft: '4px solid #f59e0b' }}>
              <h4 className="flex-gap text-warning margin-bottom-xs">
                <Utensils size={20} color="#f59e0b" /> 3. Dietary Care & Hydration Plan
              </h4>
              <p className="text-sm text-dim leading-relaxed">{recommendations.dietaryGuidance}</p>
            </div>

            {/* 4. Warning Red Flags */}
            <div className="rec-card glass-panel padding-sm border-radius-md" style={{ borderLeft: '4px solid #f43f5e' }}>
              <h4 className="flex-gap text-danger margin-bottom-xs">
                <AlertTriangle size={20} color="#f43f5e" /> 4. Red-Flag Warning Symptoms
              </h4>
              <p className="text-sm text-dim leading-relaxed">{recommendations.warningSigns}</p>
            </div>
          </div>

          {/* Disclaimer Banner */}
          <div className="disclaimer-banner margin-top padding-xs border-radius-sm background-dark border-glass text-xs">
            <Info size={16} className="info-icon" />
            <span>{recommendations.disclaimer}</span>
          </div>

          {/* Footer Action */}
          <div className="margin-top padding-top-xs border-top flex-between no-print">
            <span className="text-xs text-muted">MediAI Recommendation Module & MongoDB Atlas</span>
            <button
              type="button"
              onClick={handleDownloadRecommendations}
              className="btn-primary btn-md flex-gap"
            >
              <Download size={16} />
              <span>Download Health Recommendations (PDF / Print)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-history text-center padding-y-lg">
          <Info size={40} className="icon-faded text-muted" />
          <h4 className="margin-top-xs">No Recommendations Available</h4>
          <p className="text-muted text-xs margin-top-xs">Select symptoms in the Symptoms Input tab to generate recommendations.</p>
        </div>
      )}
    </div>
  );
}
