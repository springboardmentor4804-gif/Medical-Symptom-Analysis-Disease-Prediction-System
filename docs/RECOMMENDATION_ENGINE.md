# Healthcare Recommendation Workflow Engine

## Overview

The Healthcare Recommendation Workflow module consolidates outputs from MedAssist's four existing model components into a single, human-readable action plan. This is **not** an ML model—it's deterministic, auditable rule logic following the same design pattern as the severity engine.

## Design Principles

1. **Traceability**: Every recommendation field cites which upstream component(s) it derives from
2. **No Fabrication**: Only information traceable to model outputs is included
3. **Config-Driven**: All thresholds, mappings, and phrasing live in `recommendation_config.json`
4. **Auditability**: Transparent logic that can be reviewed by clinicians
5. **Consistency**: Follows existing codebase patterns (particularly `severity_engine.py`)

## Architecture

### Input Components

The recommendation engine takes outputs from four existing components:

1. **Severity Engine** (`severity_engine.compute_severity()`)
   - Severity level (EMERGENCY/URGENT/MODERATE/MILD)
   - Red flags (critical and serious)
   - Component scores and breakdowns

2. **Disease Model** (`disease_model.predict()`)
   - Ranked disease predictions
   - Confidence scores
   - Disease reference data (symptoms, doctor type, cures)

3. **Chronic Risk Model** (`risk_model.assess()`)
   - Per-condition risk scores (0-100)
   - Risk bands (high/elevated/average/low)
   - Contributing factors with feature importance

4. **Treatment Cascade** (`treatment_cascade.recommend()`)
   - Recommended drugs/treatments
   - Treatment layer (MIMIC-IV or drug reviews)
   - Disease/condition linkage

### Output Structure

```python
{
    "primary_action": str,              # Single clear instruction
    "urgency_timeline": str,            # immediate / same-day / within a week / 2-4 weeks
    "urgency_description": str,         # Detailed timeline guidance
    "recommended_specialist": str,      # Doctor type to consult
    "specialist_note": str,             # Additional specialist guidance
    "preventive_care_notes": [          # Only for elevated chronic risk
        {
            "condition": str,
            "condition_label": str,
            "risk_score": int,
            "contributing_factors": [str],
            "recommended_actions": [str],
            "message": str,
            "source": "chronic_risk_model"
        }
    ],
    "self_care_suggestions": [          # Only for MILD/MODERATE without red flags
        {
            "suggestion": str,
            "type": "otc_or_lifestyle" | "otc_medication",
            "source": str
        }
    ],
    "disclaimer": str,                  # Standard medical disclaimer
    "metadata": {                       # Transparency data
        "severity_level": str,
        "has_red_flags": bool,
        "red_flag_category": str,
        "specialist_selection_reason": str,
        "components_used": dict
    }
}
```

## Configuration File

All recommendation logic is driven by `backend/artifacts/recommendation_config.json`:

### Severity Actions
Maps each severity level to:
- Primary action text
- Urgency timeline
- Detailed urgency description

### Chronic Risk Thresholds
- `chronic_risk_threshold`: 60 (minimum score to generate preventive care notes)
- `chronic_risk_high_threshold`: 75 (marks high-risk conditions)

### Preventive Care Templates
Condition-specific templates with:
- Message template with placeholders
- Feature-to-action mappings (e.g., BMI → "weight management strategies")

Supported conditions:
- diabetes
- heart_attack
- coronary_hd
- stroke
- asthma
- arthritis
- depression
- default (fallback for other conditions)

### Specialist Prioritization
Two prioritization mechanisms:

1. **By Severity Level**: Emergency and urgent cases prioritize certain specialists
2. **By Red Flag Category**: Maps red flag types (cardiac, neurological, respiratory, GI) to appropriate specialists

### Self-Care Rules
- `self_care_severity_limit`: ["MILD", "MODERATE"] - Only generate for these severities
- `self_care_red_flag_exclusion`: true - Skip self-care when red flags present

## Function API

### Main Entry Point

```python
from services.recommendation_engine import generate_healthcare_recommendation

recommendation = generate_healthcare_recommendation(
    severity_result=severity_output,
    disease_predictions=disease_output,
    chronic_risks=risk_output,
    treatment_options=treatment_output
)
```

### Integration with Engine

The recommendation is automatically generated in `services/engine.py` as part of the `analyze()` method:

```python
def analyze(self, symptoms=None, age=None, ...):
    # ... existing code ...
    
    recommendation = generate_healthcare_recommendation(
        severity_result=severity,
        disease_predictions=diagnosis,
        chronic_risks=risk,
        treatment_options=treatment
    )
    
    return {
        "diagnosis": diagnosis,
        "risk": risk,
        "severity": severity,
        "treatment": treatment,
        "recommendation": recommendation,  # ← NEW SECTION
        "meta": {...}
    }
```

## Recommendation Logic

### Primary Action & Urgency
Directly derived from severity level via config:
- EMERGENCY → "Seek emergency care immediately" (immediate)
- URGENT → "Seek same-day medical attention" (same-day)
- MODERATE → "Schedule a medical appointment soon" (within a week)
- MILD → "Self-care and monitor symptoms" (2-4 weeks)

### Specialist Selection
Multi-stage prioritization:

1. **Extract Candidates**:
   - From disease prediction reference data
   - From treatment recommendation reference data

2. **Prioritize**:
   - If EMERGENCY/URGENT with red flags → prioritize by red flag category
   - Otherwise → prioritize by severity level
   - Fall back to first candidate or generic recommendation

3. **Fallback Logic**:
   - EMERGENCY → "emergency medicine physician"
   - URGENT → "primary care physician or urgent care"
   - Other → "primary care physician"

### Preventive Care Notes
Generated when:
- Chronic risk model is available
- Condition risk score ≥ threshold (default 60)
- Top contributing factors are identifiable

Message includes:
- Condition-specific template
- Top 3 contributing factors by feature importance
- Recommended actions based on those factors

### Self-Care Suggestions
Generated when:
- Severity is MILD or MODERATE
- No red flags present (configurable)
- Treatment data contains self-care information

Sources:
- Disease lookup "cures" field (OTC medications, rest, fluids, lifestyle)
- Treatment drugs identified as OTC

## Testing

Run the test suite:

```bash
cd backend
python test_recommendation_engine.py
```

Test coverage:
- Emergency case with cardiac red flags
- Mild case with self-care eligibility
- Moderate case with elevated chronic risk
- Handling of unavailable components

## Example Usage

### Emergency Case
```python
# Input: Sharp chest pain + palpitations
# Output:
{
    "primary_action": "Seek emergency care immediately",
    "urgency_timeline": "immediate",
    "recommended_specialist": "cardiologist",
    "preventive_care_notes": [...]  # Cardiovascular risk factors
    "self_care_suggestions": []     # None for emergency
}
```

### Mild Case
```python
# Input: Common cold symptoms, no red flags
# Output:
{
    "primary_action": "Self-care and monitor symptoms",
    "urgency_timeline": "2-4 weeks",
    "recommended_specialist": "family doctor",
    "preventive_care_notes": [],
    "self_care_suggestions": [
        {"suggestion": "rest", "type": "lifestyle"},
        {"suggestion": "fluids", "type": "lifestyle"},
        {"suggestion": "Acetaminophen (over-the-counter)", "type": "otc_medication"}
    ]
}
```

### Moderate with Chronic Risk
```python
# Input: Diabetes symptoms + high BMI + sedentary lifestyle
# Output:
{
    "primary_action": "Schedule a medical appointment soon",
    "urgency_timeline": "within a week",
    "recommended_specialist": "endocrinologist",
    "preventive_care_notes": [
        {
            "condition": "diabetes",
            "risk_score": 82,
            "contributing_factors": ["BMI", "Exercise", "Smoking status"],
            "message": "Your diabetes risk assessment shows elevated likelihood..."
        }
    ]
}
```

## Frontend Integration

The recommendation section should be added as the **final section** of the results display, after:
1. Severity banner
2. Disease predictions
3. Chronic risk scores
4. Treatment options

### Display Priority

```
┌─────────────────────────────────────┐
│ SEVERITY: [EMERGENCY/URGENT/etc]    │ ← Existing
├─────────────────────────────────────┤
│ Disease Predictions                 │ ← Existing
├─────────────────────────────────────┤
│ Chronic Risk Scores                 │ ← Existing
├─────────────────────────────────────┤
│ Treatment Options                   │ ← Existing
├─────────────────────────────────────┤
│ 📋 RECOMMENDATION                   │ ← NEW SECTION
│                                     │
│ Primary Action: [...]               │
│ Timeline: [...]                     │
│ Specialist: [...]                   │
│                                     │
│ Preventive Care:                    │
│  • [condition-specific notes]       │
│                                     │
│ Self-Care Suggestions:              │
│  • [suggestions when applicable]    │
│                                     │
│ [Disclaimer]                        │
└─────────────────────────────────────┘
```

### Recommended Styling

- **Primary Action**: Bold, prominent (larger font)
- **Urgency Timeline**: Color-coded by severity (red for immediate, yellow for same-day, etc.)
- **Specialist**: Clear call-to-action button or link
- **Preventive Care**: Expandable sections per condition
- **Self-Care**: List format with icons
- **Disclaimer**: Small, muted text at bottom

## Tuning & Maintenance

### Updating Thresholds
Edit `backend/artifacts/recommendation_config.json`:
- Adjust `chronic_risk_threshold` to change when preventive care appears
- Modify severity action text without code changes
- Add new specialist priorities or red flag mappings

### Adding New Conditions
Add to `preventive_care_templates`:
```json
"new_condition": {
    "template": "Your {condition} risk shows elevated likelihood. Key factors include {factors}. Consider discussing {actions}.",
    "actions": {
        "FEATURE_NAME": "recommended action text",
        ...
    }
}
```

### Validation
After config changes:
1. Run `python test_recommendation_engine.py`
2. Check artifact health: `python verify_artifacts.py`
3. Review sample outputs with various severity levels

## Compliance & Limitations

### What This Module Does
✓ Consolidates existing model outputs into actionable guidance
✓ Uses deterministic, auditable rules
✓ Cites sources for all recommendations
✓ Provides transparency metadata

### What This Module Does NOT Do
✗ Make clinical diagnoses
✗ Replace professional medical judgment
✗ Generate new medical knowledge
✗ Use ML/black-box scoring for recommendations

### Medical Disclaimer
Every recommendation includes:
> "This recommendation is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns. If you are experiencing a medical emergency, call emergency services immediately."

## File Structure

```
backend/
├── artifacts/
│   └── recommendation_config.json         # All configuration
├── services/
│   ├── recommendation_engine.py           # Core logic
│   ├── engine.py                          # Integration point
│   └── artifacts.py                       # Config loading
├── test_recommendation_engine.py          # Test suite
└── ...

docs/
└── RECOMMENDATION_ENGINE.md              # This file
```

## See Also

- `severity_engine.py` - Pattern inspiration for config-driven logic
- `engine.py` - Integration point for the recommendation
- `recommendation_config.json` - All tunable parameters
