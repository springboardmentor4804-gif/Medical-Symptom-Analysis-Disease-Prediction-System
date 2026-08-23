import { AlertOctagon, AlertTriangle, Eye, CheckCircle, Phone } from 'lucide-react'
import { Badge } from './Badge'

/**
 * SeverityBanner - Displays rule-based severity assessment prominently
 * 
 * This component shows the clinical severity tier determined by the rule-based
 * severity engine (independent of ML disease prediction confidence).
 * 
 * Severity tiers:
 * - emergency: Red alert banner with emergency contact info
 * - see_doctor_soon: Orange warning banner
 * - monitor: Yellow caution banner
 * - self_care: Green success banner
 */
export function SeverityBanner({ severity, className = '' }) {
  if (!severity) return null

  const { tier, reason, recommendations, triggered_flags, disclaimer } = severity

  // Configuration by tier
  const config = {
    emergency: {
      icon: AlertOctagon,
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-500',
      textColor: 'text-rose-900',
      iconColor: 'text-rose-600',
      badgeColor: 'rose',
      label: '🚨 EMERGENCY',
      priority: 'highest'
    },
    see_doctor_soon: {
      icon: AlertTriangle,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-400',
      textColor: 'text-orange-900',
      iconColor: 'text-orange-600',
      badgeColor: 'amber',
      label: '⚠️ See Doctor Soon',
      priority: 'high'
    },
    monitor: {
      icon: Eye,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-900',
      iconColor: 'text-yellow-600',
      badgeColor: 'amber',
      label: '👁️ Monitor Symptoms',
      priority: 'medium'
    },
    self_care: {
      icon: CheckCircle,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-400',
      textColor: 'text-emerald-900',
      iconColor: 'text-emerald-600',
      badgeColor: 'green',
      label: '✅ Self-Care',
      priority: 'low'
    }
  }

  const tierConfig = config[tier] || config.monitor
  const Icon = tierConfig.icon

  // Emergency tier gets special full-width banner treatment
  if (tier === 'emergency') {
    return (
      <div className={`${className}`}>
        {/* Emergency Banner - Full Width, High Visibility */}
        <div className={`${tierConfig.bgColor} ${tierConfig.borderColor} border-2 rounded-xl p-6 shadow-lg`}>
          <div className="flex items-start gap-4">
            <div className={`${tierConfig.iconColor} shrink-0 mt-1`}>
              <Icon className="h-10 w-10 animate-pulse" strokeWidth={2.5} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className={`text-2xl font-bold ${tierConfig.textColor}`}>
                  {tierConfig.label}
                </h2>
                <Badge color={tierConfig.badgeColor} size="lg">
                  URGENT
                </Badge>
              </div>

              {/* Reason */}
              <p className={`text-base font-semibold ${tierConfig.textColor} mb-4`}>
                {reason}
              </p>

              {/* Triggered Red Flags */}
              {triggered_flags && triggered_flags.length > 0 && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-rose-200">
                  <p className="text-sm font-semibold text-rose-900 mb-2">
                    ⚠️ Critical Symptoms Detected:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {triggered_flags.map((flag, idx) => (
                      <Badge key={idx} color="rose" size="sm">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Actions */}
              <div className="bg-white rounded-lg border-2 border-rose-400 p-4 mb-4">
                <h3 className="font-bold text-rose-900 mb-2 text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Immediate Action Required
                </h3>
                <div className="space-y-2 text-sm text-rose-800">
                  <p className="font-semibold">
                    📞 Call 911 (Emergency Services) immediately
                  </p>
                  <p>OR</p>
                  <p className="font-semibold">
                    🏥 Go to the nearest Emergency Room
                  </p>
                  <p className="mt-3 text-xs text-rose-700">
                    Do not drive yourself. Call an ambulance or have someone drive you.
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {recommendations && (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-rose-800 font-sans bg-white p-3 rounded-lg border border-rose-200">
                    {recommendations}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          {disclaimer && (
            <div className="mt-4 pt-4 border-t border-rose-200">
              <p className="text-xs text-rose-700 italic">
                {disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Non-emergency tiers get standard card treatment
  return (
    <div className={`${tierConfig.bgColor} ${tierConfig.borderColor} border-l-4 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`${tierConfig.iconColor} shrink-0 mt-0.5`}>
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className={`text-lg font-bold ${tierConfig.textColor}`}>
              {tierConfig.label}
            </h3>
            <Badge color={tierConfig.badgeColor} size="sm">
              {tier === 'see_doctor_soon' ? 'High Priority' : 
               tier === 'monitor' ? 'Watch' : 'Routine'}
            </Badge>
          </div>

          {/* Reason */}
          <p className={`text-sm ${tierConfig.textColor} mb-3`}>
            {reason}
          </p>

          {/* Recommendations */}
          {recommendations && (
            <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-2">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                {recommendations}
              </pre>
            </div>
          )}

          {/* Disclaimer */}
          {disclaimer && (
            <p className="text-xs text-slate-600 italic mt-2 pt-2 border-t border-slate-300">
              {disclaimer}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * SeverityCard - Compact card version for dashboard summaries
 */
export function SeverityCard({ severity, className = '' }) {
  if (!severity) return null

  const { tier, reason } = severity

  const config = {
    emergency: {
      icon: AlertOctagon,
      color: 'rose',
      label: 'EMERGENCY',
      bg: 'bg-rose-50',
      border: 'border-rose-300'
    },
    see_doctor_soon: {
      icon: AlertTriangle,
      color: 'amber',
      label: 'See Doctor Soon',
      bg: 'bg-orange-50',
      border: 'border-orange-300'
    },
    monitor: {
      icon: Eye,
      color: 'amber',
      label: 'Monitor',
      bg: 'bg-yellow-50',
      border: 'border-yellow-300'
    },
    self_care: {
      icon: CheckCircle,
      color: 'green',
      label: 'Self-Care',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300'
    }
  }

  const tierConfig = config[tier] || config.monitor
  const Icon = tierConfig.icon

  return (
    <div className={`${tierConfig.bg} border ${tierConfig.border} rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <Badge color={tierConfig.color} size="sm">
          {tierConfig.label}
        </Badge>
      </div>
      <p className="text-xs text-slate-700 line-clamp-2">{reason}</p>
    </div>
  )
}
