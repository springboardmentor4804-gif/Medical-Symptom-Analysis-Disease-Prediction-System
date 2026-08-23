import { Info, AlertTriangle, Activity, User, Heart } from 'lucide-react'
import { Card, CardTitle } from './Card'
import { Badge } from './Badge'

/**
 * RiskBreakdown - Displays explainable risk scoring breakdown
 * 
 * Shows how the unified risk score (0-100) was calculated from:
 * - Disease severity weights
 * - Symptom clinical severity
 * - Age risk adjustment
 * - Vitals deviation
 * - Red flag overrides
 */
export function RiskBreakdown({ riskAssessment, className = '' }) {
  if (!riskAssessment || !riskAssessment.unified_risk_explanation) {
    return null
  }

  const explanation = riskAssessment.unified_risk_explanation
  const riskScore = riskAssessment.unified_risk_score
  const riskTier = riskAssessment.unified_risk_tier
  const baseScore = riskAssessment.unified_base_score
  const redFlagOverride = riskAssessment.red_flag_override

  // Color coding by tier
  const tierColors = {
    emergency: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-900', badge: 'rose' },
    high: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', badge: 'orange' },
    moderate: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900', badge: 'amber' },
    low: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900', badge: 'green' }
  }

  const colors = tierColors[riskTier] || tierColors.moderate

  return (
    <Card className={`${className}`}>
      <CardTitle icon={<Info className="h-5 w-5" />}>
        Risk Score Breakdown (Explainable AI)
      </CardTitle>

      {/* Unified Risk Score Display */}
      <div className={`mt-4 p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-slate-600">Unified Risk Score</p>
            <p className={`text-4xl font-bold ${colors.text}`}>
              {riskScore}<span className="text-2xl">/100</span>
            </p>
          </div>
          <Badge color={colors.badge} size="lg">
            {riskTier.toUpperCase()}
          </Badge>
        </div>
        
        {/* Consistency Check */}
        <p className="text-xs text-slate-600 mt-2">
          ✅ {riskAssessment.consistency_check}
        </p>
      </div>

      {/* Red Flag Override Section */}
      {redFlagOverride && (
        <div className="mt-4 p-4 rounded-lg bg-rose-50 border-2 border-rose-400">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-900">🚨 Emergency Override Applied</h4>
              <p className="text-sm text-rose-800 mt-1">
                {explanation.red_flag_check.reason}
              </p>
              <p className="text-xs text-rose-700 mt-2">
                Base score before override: <span className="font-semibold">{baseScore}/100</span>
              </p>
              
              {explanation.red_flag_check.matched_flags && explanation.red_flag_check.matched_flags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-rose-800 mb-1">Detected red flags:</p>
                  <div className="flex flex-wrap gap-1">
                    {explanation.red_flag_check.matched_flags.map((flag, idx) => (
                      <Badge key={idx} color="rose" size="sm">{flag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Component Breakdown */}
      <div className="mt-4 space-y-3">
        {/* Disease Component */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-indigo-600" />
            <h4 className="font-semibold text-sm text-slate-900">
              Disease Risk Component
            </h4>
            <span className="ml-auto text-sm font-bold text-indigo-600">
              {explanation.disease_component.score.toFixed(1)}/60
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-2">{explanation.disease_component.weight}</p>
          
          {explanation.disease_component.top_contributors && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-700 mb-1">Contributions by disease:</p>
              {explanation.disease_component.top_contributors.map((contrib, idx) => (
                <div key={idx} className="text-xs text-slate-700 flex justify-between items-start">
                  <span className="flex-1">
                    • {contrib.disease}
                    <span className="text-slate-500 ml-1">
                      (sev: {contrib.severity}, conf: {contrib.confidence.toFixed(1)}%)
                    </span>
                  </span>
                  <span className="font-semibold ml-2 shrink-0">
                    {contrib.contribution.toFixed(1)} pts
                  </span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-slate-300 text-xs font-bold text-slate-800 flex justify-between">
                <span>Total Disease Component:</span>
                <span>{explanation.disease_component.score.toFixed(1)}/60 pts</span>
              </div>
            </div>
          )}

          {explanation.disease_component.missing_lookups && 
           explanation.disease_component.missing_lookups.length > 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ {explanation.disease_component.missing_lookups.length} disease(s) used default severity: {explanation.disease_component.missing_lookups.join(', ')}
            </p>
          )}
        </div>

        {/* Symptom Component */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-rose-600" />
            <h4 className="font-semibold text-sm text-slate-900">
              Symptom Severity Component
            </h4>
            <span className="ml-auto text-sm font-bold text-rose-600">
              {explanation.symptom_component.score.toFixed(1)}/25
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-2">{explanation.symptom_component.weight}</p>
          
          {explanation.symptom_component.highest_weighted && (
            <div className="space-y-1">
              {explanation.symptom_component.highest_weighted.map((contrib, idx) => (
                <div key={idx} className="text-xs text-slate-700 flex justify-between">
                  <span>• {contrib.symptom}</span>
                  <span className="font-semibold">{contrib.weight} pts</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">
            Total symptom weight: {explanation.symptom_component.total_symptom_weight}
          </p>
        </div>

        {/* Age Adjustment */}
        {explanation.age_adjustment && explanation.age_adjustment.contribution !== 0 && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-sm text-slate-900">
                Age Risk Adjustment
              </h4>
              <span className={`ml-auto text-sm font-bold ${
                explanation.age_adjustment.contribution > 0 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {explanation.age_adjustment.contribution > 0 ? '+' : ''}
                {explanation.age_adjustment.contribution.toFixed(1)} pts
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {explanation.age_adjustment.interpretation} (factor: {explanation.age_adjustment.factor.toFixed(2)}x)
            </p>
          </div>
        )}

        {/* Vitals Adjustment */}
        {explanation.vitals_adjustment && 
         explanation.vitals_adjustment.abnormal_vitals && 
         explanation.vitals_adjustment.abnormal_vitals.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-red-600" />
              <h4 className="font-semibold text-sm text-slate-900">
                Vitals Deviation Adjustment
              </h4>
              <span className="ml-auto text-sm font-bold text-orange-600">
                +{explanation.vitals_adjustment.contribution.toFixed(1)} pts
              </span>
            </div>
            <div className="space-y-1">
              {explanation.vitals_adjustment.abnormal_vitals.map((vital, idx) => (
                <p key={idx} className="text-xs text-slate-700">
                  • {vital}
                </p>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multiplier: {explanation.vitals_adjustment.factor.toFixed(2)}x
            </p>
          </div>
        )}
      </div>

      {/* Risk Tier Boundaries Reference */}
      <div className="mt-4 p-3 rounded-lg bg-slate-100 border border-slate-300">
        <p className="text-xs font-semibold text-slate-700 mb-2">Risk Tier Boundaries:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Low: 0-40</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Moderate: 41-70</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>High: 71-90</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span>Emergency: 91-100</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2 italic">
          * Red flag detection forces Emergency tier regardless of score
        </p>
      </div>
    </Card>
  )
}
