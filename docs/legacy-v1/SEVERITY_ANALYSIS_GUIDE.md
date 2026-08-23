# Severity Analysis Feature - Implementation Guide

## Overview

The **Severity Analysis** feature provides rule-based, deterministic symptom severity assessment that runs **independently** of ML disease prediction models. It focuses on clinical red flags and evidence-based severity rules to provide transparent, auditable severity tiering.

## Key Principles

1. **Independence from ML**: Severity is calculated using clinical rules, NOT ML similarity scores
2. **Red Flags First**: Emergency symptoms always trigger highest severity tier
3. **Explainable**: Every severity tier includes a human-readable reason
4. **Auditable**: Rule-based logic can be traced and verified
5. **Safety-First**: Never lets low ML confidence suppress emergency tiers

## Severity Tiers

| Tier | Priority | Color | Meaning |
|------|----------|-------|---------|
| **emergency** | Highest | Red | Life-threatening symptoms requiring immediate medical attention (911) |
| **see_doctor_soon** | High | Orange | Moderate severity requiring medical evaluation within 24-48 hours |
| **monitor** | Medium | Yellow | Mild symptoms that should be watched for changes |
| **self_care** | Low | Green | Very mild symptoms suitable for home management |

## Architecture

### Backend Components

#### 1. `severity_engine.py` (NEW)
Standalone module containing all severity assessment logic:

**Key Functions:**
- `assess_severity()` - Main entry point for severity calculation
- `check_red_flags()` - Detects emergency symptoms
- `calculate_symptom_score()` - Scores symptom characteristics
- `check_risk_factor_elevation()` - Correlates BRFSS risks with predictions
- `determine_severity_tier()` - Converts score to tier

**Red Flag Symptoms:**
- Cardiovascular: chest pain, severe chest tightness
- Respiratory: difficulty breathing, gasping for air, choking
- Bleeding: severe bleeding, coughing/vomiting blood
- Neurological: confusion, loss of consciousness, slurred speech, facial drooping, one-sided weakness, seizure
- High fever: >103°F / 39.4°C
- Abdominal: severe abdominal pain, rigid abdomen
- Other: severe allergic reaction, inability to swallow

**Emergency Combinations:**
- Chest pain + shortness of breath
- Chest pain + sweating/nausea
- Slurred speech + weakness (stroke signs)
- High fever + confusion/stiff neck (meningitis signs)

#### 2. `predict.py` (MODIFIED)
Integrated severity assessment into existing prediction pipeline:

```python
# After disease prediction and risk assessment
severity_analysis = assess_severity(
    symptoms=symptoms,
    duration_days=None,  # TODO: Collect from frontend
    intensity=None,      # TODO: Collect from frontend
    predicted_diseases=top_diseases_records,
    patient_risk_profile=lifestyle_risk
)

# Added to result
result["severity_analysis"] = severity_analysis
```

#### 3. `main.py` (NO CHANGES NEEDED)
The `/assess` endpoint automatically includes severity in responses since it's added to the result dictionary in `run_assessment()`.

### Frontend Components

#### 1. `SeverityBanner.jsx` (NEW)
React component for displaying severity assessment:

**Features:**
- Emergency tier: Full-width red banner with 911 call-to-action
- Non-emergency tiers: Standard colored cards with recommendations
- Shows reason, triggered red flags, and action guidance
- Includes safety disclaimer

**Usage:**
```jsx
<SeverityBanner severity={severityAnalysis} />
```

#### 2. `RiskAssessment.jsx` (MODIFIED)
Added severity banner above disease predictions:

```jsx
{severityAnalysis && (
  <SeverityBanner 
    severity={severityAnalysis} 
    className="animate-in fade-in duration-300" 
  />
)}
```

## Data Flow

```
User submits symptoms
    ↓
Backend: /assess endpoint
    ↓
predict.py: run_assessment()
    ↓
┌─────────────────────────────┐
│ 1. Disease Prediction (ML)  │ ← Model 1a (symptom similarity)
│ 2. Risk Assessment (Rules)  │ ← Emergency detection
│ 3. BRFSS Screening (ML)     │ ← Model 2 (lifestyle risks)
│ 4. Severity Analysis (NEW)  │ ← Rule-based severity engine
└─────────────────────────────┘
    ↓
severity_engine.py: assess_severity()
    ↓
┌─────────────────────────────┐
│ Step 1: Check Red Flags     │ ← Has emergency symptom?
│         ↓ YES → EMERGENCY   │
│         ↓ NO → Continue     │
│                             │
│ Step 2: Calculate Score     │ ← Symptom count, duration, intensity
│         (0-15 points)       │
│                             │
│ Step 3: Risk Elevation      │ ← BRFSS risks match predictions?
│         (+2 points if yes)  │
│                             │
│ Step 4: Determine Tier      │ ← Score → Tier mapping
│                             │
│ Step 5: Generate Reason     │ ← Human-readable explanation
└─────────────────────────────┘
    ↓
Return severity object:
{
  "tier": "emergency" | "see_doctor_soon" | "monitor" | "self_care",
  "score": 0-99,
  "reason": "Red-flag symptom detected: chest pain",
  "triggered_flags": ["chest pain"],
  "risk_factors_relevant": ["coronary_hd"],
  "recommendations": "🚨 SEEK IMMEDIATE MEDICAL ATTENTION...",
  "disclaimer": "This is not a medical diagnosis..."
}
    ↓
Frontend: RiskAssessment.jsx
    ↓
SeverityBanner component
    ↓
Displayed to user
```

## Severity Scoring Algorithm

### Base Score Calculation

```python
score = 0

# 1. Symptom Count (0-6 points)
if symptom_count == 1: score += 1
elif symptom_count == 2: score += 2
elif symptom_count <= 4: score += 4
else: score += 6  # 5+ symptoms

# 2. Duration (0-4 points) - if provided
if duration_days <= 1: score += 0
elif duration_days <= 3: score += 1
elif duration_days <= 7: score += 2
elif duration_days <= 14: score += 3
else: score += 4  # 2+ weeks

# 3. Intensity (0-5 points) - if provided
if intensity == "mild": score += 1
elif intensity == "moderate": score += 3
elif intensity == "severe": score += 5

# 4. Risk Elevation (0-2 points)
if patient_has_relevant_brfss_risk: score += 2
```

### Tier Assignment

```python
# Red flags ALWAYS override score
if has_red_flag_symptom:
    return "emergency"  # score = 99

# Otherwise use score
if score <= 2: return "self_care"
elif score <= 5: return "monitor"
elif score <= 8: return "see_doctor_soon"
else: return "see_doctor_soon"  # High score but no red flags
```

## Example Scenarios

### Scenario 1: Emergency - Red Flag Detected

**Input:**
```json
{
  "symptoms": ["chest pain", "shortness of breath", "sweating"],
  "age": 55,
  "gender": "male"
}
```

**Severity Output:**
```json
{
  "tier": "emergency",
  "score": 99,
  "reason": "Red-flag symptom(s) detected: chest pain, shortness of breath (critical combination)",
  "triggered_flags": ["chest pain", "shortness of breath"],
  "recommendations": "🚨 SEEK IMMEDIATE MEDICAL ATTENTION\n\nCall emergency services (911)...",
  "disclaimer": "..."
}
```

**UI Display:**
- Full-width red emergency banner
- Pulsing alert icon
- "URGENT" badge
- 911 call-to-action box
- List of triggered red flags

---

### Scenario 2: See Doctor Soon - Multiple Symptoms + Duration

**Input:**
```json
{
  "symptoms": ["fever", "cough", "fatigue", "body aches", "headache"],
  "duration_days": 5,
  "intensity": "moderate"
}
```

**Calculation:**
```
Symptom count: 5 → +6 points
Duration: 5 days → +2 points
Intensity: moderate → +3 points
Total: 11 points → "see_doctor_soon"
```

**Severity Output:**
```json
{
  "tier": "see_doctor_soon",
  "score": 11,
  "reason": "5 symptoms reported; symptoms lasting 5+ days; moderate intensity",
  "recommendations": "🏥 Medical Attention Advised\n\nSchedule an appointment within 24-48 hours...",
  "disclaimer": "..."
}
```

**UI Display:**
- Orange warning card
- Warning triangle icon
- "High Priority" badge
- Appointment scheduling guidance

---

### Scenario 3: Monitor - Mild Symptoms, Watch for Changes

**Input:**
```json
{
  "symptoms": ["mild headache", "tired"],
  "duration_days": 1,
  "intensity": "mild"
}
```

**Calculation:**
```
Symptom count: 2 → +2 points
Duration: 1 day → +0 points
Intensity: mild → +1 point
Total: 3 points → "monitor"
```

**Severity Output:**
```json
{
  "tier": "monitor",
  "score": 3,
  "reason": "Multiple symptoms (2); mild intensity",
  "recommendations": "👁️ Monitor Symptoms\n\nKeep track over the next 24-48 hours...",
  "disclaimer": "..."
}
```

**UI Display:**
- Yellow caution card
- Eye icon
- "Watch" badge
- Monitoring instructions

---

### Scenario 4: Self-Care - Single Mild Symptom

**Input:**
```json
{
  "symptoms": ["runny nose"],
  "duration_days": null,
  "intensity": null
}
```

**Calculation:**
```
Symptom count: 1 → +1 point
Total: 1 point → "self_care"
```

**Severity Output:**
```json
{
  "tier": "self_care",
  "score": 1,
  "reason": "Mild symptoms suitable for home care",
  "recommendations": "✅ Self-Care Recommended\n\nRest, stay hydrated...",
  "disclaimer": "..."
}
```

**UI Display:**
- Green success card
- Check circle icon
- "Routine" badge
- Self-care tips

---

### Scenario 5: Risk Elevation - Diabetes Patient with Relevant Symptoms

**Input:**
```json
{
  "symptoms": ["increased thirst", "frequent urination", "blurred vision"],
  "patient_risk_profile": [
    {
      "condition": "diabetes",
      "flagged_at_risk": true,
      "risk_probability": 0.75
    }
  ],
  "predicted_diseases": [
    {"disease_canonical": "diabetes", "confidence_pct": 85}
  ]
}
```

**Calculation:**
```
Symptom count: 3 → +4 points
Risk elevation: YES → +2 points (diabetes risk + diabetes prediction)
Total: 6 points → "see_doctor_soon"
```

**Severity Output:**
```json
{
  "tier": "see_doctor_soon",
  "score": 6,
  "reason": "Multiple symptoms (3); Patient has elevated risk for: diabetes",
  "risk_factors_relevant": ["diabetes"],
  "recommendations": "🏥 Medical Attention Advised...",
  "disclaimer": "..."
}
```

## Safety Guardrails

### 1. Red Flags Cannot Be Overridden
```python
# ✅ CORRECT: Red flag always wins
if has_red_flag:
    return "emergency"  # Even if ML confidence is low

# ❌ WRONG: Never do this
if has_red_flag and ml_confidence > 0.5:
    return "emergency"  # DANGEROUS: Could miss emergencies
```

### 2. Independence from ML Confidence
```python
# Severity assessment runs independently
severity = assess_severity(symptoms, ...)

# ML disease prediction runs separately
diseases = predict_disease_from_symptoms(symptoms)

# They are correlated but NOT dependent
# Low ML confidence does NOT suppress emergency tier
```

### 3. Always Show Disclaimer
Every severity assessment includes:
```
"This severity assessment is for informational purposes only and does not
constitute medical advice, diagnosis, or treatment. Always consult a qualified
healthcare provider for medical concerns."
```

### 4. Emergency Contact Info
Emergency tier ALWAYS includes:
- 📞 Call 911 immediately
- 🏥 Go to nearest Emergency Room
- Clear, actionable instructions

## Future Enhancements

### Phase 2: Collect Duration & Intensity (Frontend)

Update `SymptomChecker.jsx` to collect:
```jsx
// Add optional fields
<Field label="How long have you had these symptoms?">
  <select name="duration_days">
    <option value="">Select duration</option>
    <option value="0">Today (< 24 hours)</option>
    <option value="2">2-3 days</option>
    <option value="5">4-7 days</option>
    <option value="10">1-2 weeks</option>
    <option value="21">2+ weeks</option>
  </select>
</Field>

<Field label="How would you rate symptom intensity?">
  <select name="intensity">
    <option value="">Select intensity</option>
    <option value="mild">Mild (minor discomfort)</option>
    <option value="moderate">Moderate (noticeable, interfering)</option>
    <option value="severe">Severe (intense, debilitating)</option>
  </select>
</Field>
```

### Phase 3: Severity History Tracking

Store severity tiers in database:
```python
# In database.py
class Assessment(Base):
    ...
    severity_tier = Column(String, nullable=True)  # NEW
    severity_score = Column(Integer, nullable=True)  # NEW
```

Enable trending:
- "Your severity has improved from 'see_doctor_soon' to 'monitor'"
- Chart of severity scores over time

### Phase 4: Provider Dashboard Integration

For healthcare providers:
- Filter patients by severity tier
- Emergency alerts for red-flag cases
- Bulk triage view sorted by severity

### Phase 5: Symptom-Specific Guidance

Expand recommendations per symptom:
```python
SYMPTOM_SPECIFIC_GUIDANCE = {
    "chest pain": "Chew aspirin if not allergic...",
    "high fever": "Take acetaminophen/ibuprofen...",
    # ...
}
```

## Testing Checklist

- [x] Backend: severity_engine.py created with all functions
- [x] Backend: integrated into predict.py run_assessment()
- [x] Backend: severity included in /assess API response
- [x] Frontend: SeverityBanner component created
- [x] Frontend: integrated into RiskAssessment.jsx
- [ ] Manual Test: Submit red-flag symptom (chest pain) → Verify emergency banner shows
- [ ] Manual Test: Submit 5+ symptoms → Verify "see_doctor_soon" shows
- [ ] Manual Test: Submit 1 mild symptom → Verify "self_care" shows
- [ ] Manual Test: BRFSS risk + matching disease → Verify risk elevation
- [ ] Manual Test: Emergency banner includes 911 call-to-action
- [ ] Manual Test: All tiers show disclaimer
- [ ] Manual Test: Reason text is human-readable

## API Response Structure

```json
{
  "symptom_analysis": { ... },
  "disease_prediction": { ... },
  "risk_assessment": { ... },
  "severity_analysis": {
    "tier": "emergency",
    "score": 99,
    "reason": "Red-flag symptom detected: chest pain",
    "triggered_flags": ["chest pain"],
    "risk_factors_relevant": [],
    "recommendations": "🚨 SEEK IMMEDIATE MEDICAL ATTENTION...",
    "disclaimer": "This is an automated severity assessment..."
  },
  "lifestyle_risk_screening": [ ... ],
  "care_plan": { ... },
  "health_score": 45,
  "disclaimer": "..."
}
```

---

**Date**: 2026-08-10  
**Status**: ✅ Implemented (Phase 1 - Core Functionality)  
**Version**: 1.0
