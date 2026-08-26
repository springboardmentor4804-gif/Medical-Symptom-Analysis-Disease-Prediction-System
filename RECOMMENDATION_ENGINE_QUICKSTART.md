# Recommendation Engine - Quick Start Guide

## What It Does

Converts raw medical AI model outputs into clear "what should I do?" guidance for patients.

**Input**: Four model outputs (disease prediction, chronic risk, severity, treatment)  
**Output**: One unified recommendation with action, timeline, specialist, preventive care, and self-care

## Quick Example

```python
from services.recommendation_engine import generate_healthcare_recommendation

# Call after getting model outputs
recommendation = generate_healthcare_recommendation(
    severity_result=severity_output,
    disease_predictions=disease_output,
    chronic_risks=risk_output,
    treatment_options=treatment_output
)

# Returns:
{
    "primary_action": "Schedule a medical appointment soon",
    "urgency_timeline": "within a week",
    "recommended_specialist": "cardiologist",
    "preventive_care_notes": [...],  # if chronic risk elevated
    "self_care_suggestions": [...],   # if mild/moderate
    "disclaimer": "..."
}
```

## Where It's Integrated

Already integrated in `services/engine.py`:

```python
result = engine.analyze(symptoms, age, profile, ...)

# Result automatically includes:
{
    "diagnosis": {...},
    "risk": {...},
    "severity": {...},
    "treatment": {...},
    "recommendation": {...},  # ← NEW
    "meta": {...}
}
```

## Configuration

Edit `backend/artifacts/recommendation_config.json` to tune:

- **Severity actions**: What to tell users per severity level
- **Chronic risk threshold**: When to generate preventive care (default: 60)
- **Preventive care templates**: Messages per condition
- **Specialist priorities**: Which specialists for which situations
- **Self-care rules**: When to show self-care suggestions

## Output Fields

| Field | Description | Example |
|-------|-------------|---------|
| `primary_action` | Main instruction | "Seek emergency care immediately" |
| `urgency_timeline` | Time window | "immediate", "same-day", "within a week", "2-4 weeks" |
| `recommended_specialist` | Doctor type | "cardiologist", "primary care physician" |
| `preventive_care_notes` | Risk-based guidance | Array of condition-specific notes with actual risk factors |
| `self_care_suggestions` | OTC/lifestyle tips | Only for mild/moderate without red flags |
| `disclaimer` | Medical disclaimer | Standard text on every output |

## Logic Flow

```
1. Primary Action → Directly from severity level (EMERGENCY/URGENT/MODERATE/MILD)

2. Specialist → 
   - Extract from disease prediction + treatment data
   - Prioritize by red flags (cardiac → cardiologist)
   - Prioritize by severity (EMERGENCY → emergency medicine)
   - Fallback to primary care

3. Preventive Care →
   - Only if chronic risk ≥ 60 (configurable)
   - Uses ACTUAL risk factors (BMI, smoking, exercise)
   - Condition-specific templates

4. Self-Care →
   - Only for MILD/MODERATE
   - Only if no red flags
   - From disease lookup + OTC medications
```

## When Recommendations Appear

| Severity | Primary Action | Preventive Care | Self-Care |
|----------|---------------|-----------------|-----------|
| EMERGENCY | "Seek emergency care" | Yes (if chronic risk elevated) | No |
| URGENT | "Seek same-day care" | Yes (if chronic risk elevated) | No |
| MODERATE | "Book appointment" | Yes (if chronic risk elevated) | Maybe |
| MILD | "Self-care and monitor" | Yes (if chronic risk elevated) | Yes |

## Testing

Run tests:
```bash
cd backend

# Unit tests (4 scenarios)
python test_recommendation_engine.py

# Integration tests (2 scenarios)
python test_integration_mock.py

# Verify implementation
python verify_recommendation_implementation.py
```

## Frontend Integration

Add recommendation section **after** treatment options:

```
Results Display:
├── Severity Banner
├── Disease Predictions  
├── Chronic Risk Scores
├── Treatment Options
└── 📋 Recommendation  ← ADD HERE
    ├── Primary Action (large, bold)
    ├── Timeline (color-coded)
    ├── Specialist (CTA button)
    ├── Preventive Care (expandable)
    ├── Self-Care (list)
    └── Disclaimer (small text)
```

## Tuning Examples

### Change chronic risk threshold
```json
{
  "chronic_risk_threshold": 70  // was 60
}
```

### Modify action text
```json
{
  "severity_actions": {
    "MODERATE": {
      "primary_action": "Contact your doctor this week"
    }
  }
}
```

### Add new condition template
```json
{
  "preventive_care_templates": {
    "my_condition": {
      "template": "Your {condition} risk is elevated. Factors: {factors}. Discuss {actions}.",
      "actions": {
        "BMI": "weight management",
        "exercise": "activity programs"
      }
    }
  }
}
```

## Files Reference

| File | Purpose |
|------|---------|
| `services/recommendation_engine.py` | Core logic (450 lines) |
| `artifacts/recommendation_config.json` | All configuration |
| `services/artifacts.py` | Config loader (modified) |
| `services/engine.py` | Integration point (modified) |
| `test_recommendation_engine.py` | Unit tests |
| `test_integration_mock.py` | Integration tests |
| `docs/RECOMMENDATION_ENGINE.md` | Full documentation |

## Troubleshooting

**Q: Recommendation section not appearing?**  
Check that `generate_healthcare_recommendation()` is called in `engine.py` and result includes `"recommendation"` key.

**Q: Preventive care not showing?**  
Risk score must be ≥ 60 (default). Check `chronic_risk_threshold` in config. Ensure chronic risk model is available.

**Q: Self-care not showing?**  
Only for MILD/MODERATE without red flags. Check severity level and `self_care_red_flag_exclusion` setting.

**Q: Specialist seems wrong?**  
Check prioritization logic in config: `specialist_priority_map` and `red_flag_specialist_map`.

**Q: Want to change thresholds?**  
Edit `recommendation_config.json`. No code changes needed. Restart application to pick up changes.

## Key Principles

✓ **Config-driven**: All rules in JSON, not code  
✓ **Traceable**: Every field cites its source  
✓ **Auditable**: Deterministic logic, no black box  
✓ **Safe**: Includes medical disclaimer  
✓ **Honest**: Only uses actual model outputs  

## Next Steps

1. ✅ Implementation complete
2. ⏩ Frontend integration
3. ⏩ Clinical review of templates
4. ⏩ User testing
5. ⏩ Monitor and tune

## Support

- **Full docs**: `docs/RECOMMENDATION_ENGINE.md`
- **Code**: `services/recommendation_engine.py`
- **Config**: `artifacts/recommendation_config.json`
- **Tests**: `test_recommendation_engine.py`

---

**Status**: ✅ Complete and tested  
**Ready for**: Frontend integration
