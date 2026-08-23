# Unified Risk Scoring Engine - Implementation Summary

## 🎯 Problem Solved

### Bug Fixed: Inconsistent Risk Tiers
**Before:** "Current Risk Level" card showed **LOW** while top disease showed **Emergency** → Contradiction!

**After:** Single unified risk score (0-100) that ALL components derive from → Consistent!

---

## 🏗️ Architecture

### Single Source of Truth: `unified_risk_engine.py`

```
┌─────────────────────────────────────────────┐
│     UNIFIED RISK SCORING ENGINE             │
│                                             │
│  Input: Diseases + Symptoms + Age + Vitals │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 1. Disease Severity (60% weight)      │ │
│  │    • Lookup table: 60+ diseases       │ │
│  │    • Weighted by ML confidence        │ │
│  │    • Logs missing lookups             │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 2. Symptom Severity (25% weight)      │ │
│  │    • Clinical severity weights        │ │
│  │    • Not just count, but severity     │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 3. Age Risk Adjustment                │ │
│  │    • Infants/Elderly: +20-50%         │ │
│  │    • Young adults: -10%               │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 4. Vitals Deviation                   │ │
│  │    • High BP: +15%                    │ │
│  │    • High cholesterol: +15%           │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 5. RED FLAG OVERRIDE (ALWAYS WINS)    │ │
│  │    • If detected → Force Emergency    │ │
│  │    • Cannot be downgraded             │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Output: risk_score (0-100) + tier + WHY  │
└─────────────────────────────────────────────┘
```

---

## 📊 Risk Score Calculation

### Formula:

```python
# Component scores
disease_score = Σ(disease_severity × disease_weight × ml_confidence)
symptom_score = Σ(symptom_clinical_weight)
age_adjustment = (age_factor - 1.0) × 10
vitals_adjustment = (vitals_factor - 1.0) × 10

# Normalize to 0-100
disease_normalized = (disease_score / max_possible) × 60  # 60% of total
symptom_normalized = (symptom_score / max_expected) × 25  # 25% of total

# Base score (before red flag override)
base_score = disease_normalized + symptom_normalized + age_adjustment + vitals_adjustment

# RED FLAG OVERRIDE (critical!)
if red_flag_detected:
    final_score = max(base_score, 95)  # Force to at least 95
    tier = "emergency"
else:
    final_score = base_score
    tier = score_to_tier(final_score)
```

### Tier Boundaries:

| Score | Tier | Flag | Color |
|-------|------|------|-------|
| 91-100 | emergency | HIGH PRIORITY | Red |
| 71-90 | high | HIGH PRIORITY | Orange |
| 41-70 | moderate | REVIEW | Amber |
| 0-40 | low | LOW | Green |

**Special Rule:** Red flag detection → Force Emergency tier, regardless of calculated score

---

## 🗂️ Disease Severity Lookup Table

### Complete Coverage (60+ Diseases):

```python
DISEASE_SEVERITY_LOOKUP = {
    # EMERGENCY (91-100 points)
    "pneumonia": {"severity": 95, "tier": "emergency", "weight": 4.0},
    "heart attack": {"severity": 100, "tier": "emergency", "weight": 4.0},
    "stroke": {"severity": 100, "tier": "emergency", "weight": 4.0},
    "bacterial meningitis": {"severity": 98, "tier": "emergency", "weight": 4.0},
    "sepsis": {"severity": 100, "tier": "emergency", "weight": 4.0},
    "anaphylaxis": {"severity": 100, "tier": "emergency", "weight": 4.0},
    # ... 10+ emergency diseases
    
    # HIGH (71-90 points)
    "bronchitis": {"severity": 75, "tier": "high", "weight": 3.0},
    "asthma": {"severity": 80, "tier": "high", "weight": 3.0},
    "diabetes": {"severity": 75, "tier": "high", "weight": 3.0},
    "tonsillitis": {"severity": 71, "tier": "high", "weight": 3.0},
    # ... 15+ high severity diseases
    
    # MODERATE (41-70 points)
    "flu": {"severity": 60, "tier": "moderate", "weight": 2.0},
    "otitis media": {"severity": 65, "tier": "moderate", "weight": 2.0},  # FIXED!
    "migraine": {"severity": 60, "tier": "moderate", "weight": 2.0},
    "viral infection": {"severity": 55, "tier": "moderate", "weight": 2.0},
    # ... 20+ moderate diseases
    
    # LOW (0-40 points)
    "common cold": {"severity": 20, "tier": "low", "weight": 1.0},
    "allergic rhinitis": {"severity": 25, "tier": "low", "weight": 1.0},
    "mild headache": {"severity": 15, "tier": "low", "weight": 1.0},
    # ... 15+ low severity diseases
}

# Default for unknown diseases
DEFAULT_DISEASE_SEVERITY = {"severity": 50, "tier": "moderate", "weight": 2.0}
```

**Key Fix:** "Otitis Media" now has explicit severity (65, moderate) instead of "unknown"

**Missing Lookup Detection:** If a disease isn't in the table, system:
1. Uses default severity (50, moderate)
2. Logs the missing entry: `logger.warning(f"Disease severity lookup MISS: '{disease_name}'")`
3. Marks it in the explanation: "⚠️ 1 disease(s) used default severity"

---

## ⚖️ Symptom Clinical Severity Weights

Not just counting symptoms anymore—each symptom has clinical weight:

```python
SYMPTOM_SEVERITY_WEIGHTS = {
    # Emergency symptoms (10 points each)
    "chest pain": 10,
    "difficulty breathing": 10,
    "coughing up blood": 10,
    "confusion": 10,
    "seizure": 10,
    
    # High severity (5-7 points)
    "high fever": 7,
    "severe headache": 7,
    "persistent cough": 5,
    
    # Moderate (3-4 points)
    "fever": 4,
    "cough": 3,
    "nausea": 3,
    "headache": 3,
    
    # Mild (1-2 points)
    "runny nose": 1,
    "sneezing": 1,
    "fatigue": 2,
}
```

**Example:**
- `["chest pain", "shortness of breath"]` → 10 + 6 = 16 points → High symptom score
- `["runny nose", "sneezing", "fatigue"]` → 1 + 1 + 2 = 4 points → Low symptom score

---

## 👤 Age Risk Adjustment

```python
def calculate_age_risk_factor(age: int) -> float:
    if age < 1: return 1.4      # Infants (+40%)
    elif age < 5: return 1.2    # Young children (+20%)
    elif age < 18: return 1.0   # Children/teens (baseline)
    elif age < 45: return 0.9   # Young adults (-10%, lowest risk)
    elif age < 65: return 1.0   # Middle-aged (baseline)
    elif age < 75: return 1.2   # Elderly (+20%)
    else: return 1.5            # Very elderly (+50%)
```

**Impact:** ±2 to ±5 points on final score

---

## ❤️ Vitals Deviation Adjustment

```python
# Blood Pressure
if blood_pressure == "high": multiplier += 0.15
elif blood_pressure == "low": multiplier += 0.10

# Cholesterol
if cholesterol_level == "high": multiplier += 0.15
```

**Impact:** 0 to +3 points on final score

---

## 🚨 Red Flag Override (Critical!)

### The Golden Rule:
**If red flag detected → Risk tier = Emergency, NO EXCEPTIONS**

```python
if red_flag_detected:
    final_score = max(base_score, 95)  # Force to at least 95
    risk_tier = "emergency"
    red_flag_override = True
```

### Why This Matters:

**Scenario:** Patient reports "cough" + "fever"

**Old System (BUGGY):**
- Red flag detector: "Emergency! cough + fever"
- Weighted score calculator: "Base score: 35/100 (Low)"
- Current Risk Level card: **"LOW"** ← Wrong!
- Disease card: **"Emergency"** ← Right!
- **Result: Contradiction!**

**New System (FIXED):**
- Red flag detector: "Emergency! cough + fever"
- Base score: 35/100
- **Override applied:** final_score = 95, tier = "emergency"
- Current Risk Level card: **"HIGH PRIORITY (95/100)"** ← Correct!
- Disease card: **"Emergency"** ← Correct!
- **Result: Consistent!**

---

## 🧮 Example Calculation

### Case: 65-year-old with Otitis Media + Fever + Cough

**Inputs:**
- Top disease: Otitis Media (65% confidence)
- Symptoms: fever, cough, fatigue
- Age: 65
- Blood pressure: high
- Red flags: None

**Calculation:**

```
Disease Component:
  Otitis Media: severity=65, weight=2.0, confidence=0.65
  Contribution: 65 × 2.0 × 0.65 = 84.5
  Normalized (to 60): 84.5/400 × 60 = 12.7 points

Symptom Component:
  Fever: 4 points
  Cough: 3 points
  Fatigue: 2 points
  Total: 9 points
  Normalized (to 25): 9/40 × 25 = 5.6 points

Age Adjustment:
  Age 65 → factor = 1.2
  Contribution: (1.2 - 1.0) × 10 = +2.0 points

Vitals Adjustment:
  High BP → +0.15 multiplier
  Contribution: 0.15 × 10 = +1.5 points

Base Score = 12.7 + 5.6 + 2.0 + 1.5 = 21.8 ≈ 22/100

Red Flag Check: None detected
Final Score: 22/100
Tier: LOW (0-40 range)
```

**Result:** Risk Level = LOW, consistent across all cards

---

## 📱 Frontend Display

### Updated Components:

#### 1. Overview Stats (Now Consistent)

```jsx
<StatCard label="Current Risk Level" tone={...}>
  <p>{riskAssessment.flag}</p>  {/* HIGH PRIORITY / REVIEW / LOW */}
  <p>Score: {riskAssessment.unified_risk_score}/100</p>
</StatCard>
```

**Color coding matches tier:**
- Emergency/High → Red
- Moderate → Amber
- Low → Green

#### 2. Risk Breakdown Card (NEW)

Shows explainable breakdown:
- Unified risk score gauge (0-100)
- Red flag override section (if applied)
- Disease component breakdown
- Symptom component breakdown
- Age adjustment
- Vitals adjustment
- Tier boundaries reference

#### 3. Disease Cards (Now Consistent)

Each disease card shows:
- Disease name
- ML confidence %
- **Risk category from lookup table** (not "unknown" anymore)
- Consistent with overall tier

---

## 🔍 Explainability Features

### What Users See:

```
┌─────────────────────────────────────────────────────┐
│ Risk Score Breakdown (Explainable AI)              │
│                                                     │
│ Unified Risk Score: 95/100  [EMERGENCY]            │
│ ✅ Risk tier 'EMERGENCY' is consistent with        │
│    score 95/100 (Red flag override: cough + fever) │
│                                                     │
│ 🚨 Emergency Override Applied                      │
│    Reason: Red flags detected: cough, fever        │
│    Base score before override: 35/100              │
│                                                     │
│ Disease Risk Component: 12.7/60                    │
│   • Otitis media: 12.7 pts (65% conf, 65 sev)     │
│                                                     │
│ Symptom Severity Component: 5.6/25                 │
│   • Fever: 4 pts                                   │
│   • Cough: 3 pts                                   │
│   • Fatigue: 2 pts                                 │
│                                                     │
│ Age Adjustment: +2.0 pts                           │
│   Higher risk (elderly) (factor: 1.20x)            │
│                                                     │
│ Vitals Adjustment: +1.5 pts                        │
│   • Elevated blood pressure                        │
└─────────────────────────────────────────────────────┘
```

---

## 🐛 Bugs Fixed

### 1. ✅ Consistency Bug
**Before:** Current Risk Level = LOW, Disease = Emergency  
**After:** Both show EMERGENCY (unified tier)

### 2. ✅ Unknown Disease Severity
**Before:** "Otitis Media" → "unknown risk"  
**After:** "Otitis Media" → "moderate risk (65 severity)"

### 3. ✅ Red Flag Override Not Applied
**Before:** Red flags detected but overall score stayed low  
**After:** Red flags FORCE emergency tier (score ≥ 95)

### 4. ✅ Symptom Count vs Severity
**Before:** All symptoms weighted equally  
**After:** Each symptom has clinical severity weight

### 5. ✅ No Explainability
**Before:** Just a number, no explanation  
**After:** Full breakdown of how score was calculated

---

## 📁 Files Created/Modified

### New Files:
- `backend/unified_risk_engine.py` (450+ lines) - Core engine
- `web/src/components/med/RiskBreakdown.jsx` (250+ lines) - UI component

### Modified Files:
- `backend/predict.py` - Integrated unified risk engine
- `web/src/pages/RiskAssessment.jsx` - Added breakdown display, fixed stat cards

---

## 🧪 Testing Checklist

- [ ] Test: "cough" + "fever" → Should show Emergency consistently
- [ ] Test: "runny nose" alone → Should show Low consistently
- [ ] Test: High BP + elderly + moderate disease → Should elevate score appropriately
- [ ] Test: Unknown disease → Should log warning, use default, show in UI
- [ ] Test: Red flag override → Should show base score vs final score
- [ ] Test: All stat cards → Should match unified tier (no contradictions)

---

## 🚀 Deployment Steps

1. **Restart Backend:**
   ```bash
   cd backend
   python main.py
   ```

2. **Frontend Auto-Reload:**
   Should automatically pick up new component

3. **Verify:**
   - Submit symptom check
   - Check Risk Assessment page
   - All stat cards should show consistent tier
   - Breakdown should show calculation

---

## 📊 API Response Structure

```json
{
  "risk_assessment": {
    "flag": "HIGH PRIORITY",  // Derived from unified_risk_tier
    "unified_risk_score": 95,
    "unified_risk_tier": "emergency",
    "unified_risk_explanation": {
      "disease_component": {...},
      "symptom_component": {...},
      "age_adjustment": {...},
      "vitals_adjustment": {...},
      "red_flag_check": {...}
    },
    "unified_base_score": 35,
    "red_flag_override": true,
    "consistency_check": "✅ Risk tier 'EMERGENCY' is consistent..."
  }
}
```

---

**Status:** ✅ **IMPLEMENTED AND READY FOR TESTING**  
**Date:** August 10, 2026  
**Version:** 2.0 - Unified Risk Engine
