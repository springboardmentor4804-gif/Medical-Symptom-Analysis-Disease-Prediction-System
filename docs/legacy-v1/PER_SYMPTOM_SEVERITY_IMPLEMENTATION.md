# Per-Symptom Severity Implementation Guide

## Overview
This document outlines the complete implementation of per-symptom severity selection across the MedAssist platform.

---

## ✅ Changes Made

### 1. **Backend API Changes**

#### File: `backend/main.py`

**New Data Model:**
```python
class SymptomInput(BaseModel):
    """Individual symptom with severity rating"""
    name: str = Field(..., min_length=1)
    severity: Literal["low", "moderate", "high"] = Field(...)

class PatientInput(BaseModel):
    symptoms: List[SymptomInput] = Field(..., min_length=1)  # Changed from List[str]
    # ... other fields unchanged
```

**API Endpoint:**
- `POST /assess` now accepts: `{ "symptoms": [{"name": "fever", "severity": "high"}, ...] }`

---

### 2. **Assessment Pipeline**

#### File: `backend/predict.py`

**`run_assessment()` Function:**
- Now handles both old (string array) and new (object array) formats for backward compatibility
- Extracts symptom names for ML model predictions
- Passes full symptom objects (with severity) to risk scoring engine

**Key Changes:**
```python
# Parse symptoms to support both formats
if symptoms and isinstance(symptoms[0], dict):
    symptom_names = [s['name'] for s in symptoms]
    symptom_objects = symptoms  # Full objects with severity
else:
    # Backward compatibility: default to 'moderate' severity
    symptom_names = symptoms
    symptom_objects = [{'name': s, 'severity': 'moderate'} for s in symptoms]
```

**Response Format:**
```json
{
  "symptom_analysis": {
    "reported_symptoms": [
      {"name": "fever", "severity": "high"},
      {"name": "cough", "severity": "low"}
    ],
    "reported_symptoms_names": ["fever", "cough"],  // Backward compat
    "symptom_count": 2
  }
}
```

---

### 3. **Unified Risk Engine**

#### File: `backend/unified_risk_engine.py`

**Severity Multipliers:**
```python
SEVERITY_MULTIPLIERS = {
    "low": 0.5,      # 50% of base weight
    "moderate": 1.0, # 100% of base weight (default)
    "high": 1.5      # 150% of base weight
}
```

**Updated Symptom Scoring:**
- Base symptom weights (from `SYMPTOM_SEVERITY_WEIGHTS`) are now multiplied by user-selected severity
- Example: "fever" (base weight: 4) at "high" severity = 4 × 1.5 = 6 points

**Symptom Contribution Output:**
```python
{
    "symptom": "fever",
    "severity": "high",
    "base_weight": 4,
    "multiplier": 1.5,
    "weight": 6.0  // final weighted score
}
```

---

### 4. **Red Flag Detection**

#### File: `backend/predict.py`

**`detect_emergency()` Function:**
- Now severity-aware: high-severity emergency symptoms trigger emergency status immediately
- Updated emergency logic:
  1. Red flag combination detected
  2. Multiple emergency symptoms (2+)
  3. One emergency symptom + high-risk disease
  4. **NEW:** Single red flag symptom at HIGH severity

**Example:**
- "chest pain" (high severity) alone → Emergency
- "chest pain" (low severity) + "shortness of breath" (low severity) → Emergency
- "chest pain" (low severity) alone → Not emergency (unless combined with high-risk disease)

---

### 5. **Frontend UI**

#### File: `web/src/pages/SymptomChecker.jsx`

**Data Structure:**
```javascript
// Old format
selectedSymptoms = ["fever", "cough"]

// New format
selectedSymptoms = [
  { name: "fever", severity: "high" },
  { name: "cough", severity: "low" }
]
```

**New UI Components:**

**a) SymptomCard Component:**
- Inline severity selector appears immediately after symptom selection
- Three buttons: Low | Moderate | High
- Color-coded visual indicators:
  - Low: Green (emerald)
  - Moderate: Amber (yellow)
  - High: Rose (red)

**b) Validation:**
```javascript
// All symptoms must have severity selected before proceeding
const allSymptomsHaveSeverity = 
  selectedSymptoms.length > 0 && 
  selectedSymptoms.every(s => s.severity !== null)
```

**c) Visual Badges:**
```javascript
const SEVERITY_STYLES = {
  low: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: 'Low', icon: '●' },
  moderate: { badge: 'bg-amber-100 text-amber-700 border-amber-300', label: 'Moderate', icon: '●●' },
  high: { badge: 'bg-rose-100 text-rose-700 border-rose-300', label: 'High', icon: '●●●' },
}
```

---

## 📊 How Severity Impacts Risk Assessment

### Example Calculation:

**Scenario: Patient reports fever + cough**

**Without severity (old system):**
```
fever:  base weight = 4 points
cough:  base weight = 3 points
Total:  7 points
```

**With severity (new system):**
```
Case 1: Both "high" severity
  fever (high):  4 × 1.5 = 6 points
  cough (high):  3 × 1.5 = 4.5 points
  Total:         10.5 points  (+50% increase)

Case 2: Both "low" severity
  fever (low):   4 × 0.5 = 2 points
  cough (low):   3 × 0.5 = 1.5 points
  Total:         3.5 points  (-50% decrease)

Case 3: Mixed severity
  fever (high):  4 × 1.5 = 6 points
  cough (low):   3 × 0.5 = 1.5 points
  Total:         7.5 points  (+7% increase)
```

---

## 🎯 Red Flag Behavior

### Emergency Trigger Examples:

| Symptoms | Severity | Emergency? | Reason |
|----------|----------|------------|--------|
| chest pain | high | ✅ Yes | Single high-severity red flag |
| chest pain | low | ❌ No | Needs combination or disease match |
| chest pain + shortness of breath | low + low | ✅ Yes | Multiple emergency symptoms |
| fever + cough | high + high | ✅ Yes | Red flag combination with high severity |
| fever + cough | low + low | ✅ Yes | Red flag combination (severity enhances, not required) |

---

## 🔄 Backward Compatibility

The system maintains **full backward compatibility**:

1. **Old API requests** (string array) are automatically converted:
   ```json
   // Old format still works
   { "symptoms": ["fever", "cough"] }
   
   // Internally converted to
   { "symptoms": [
       {"name": "fever", "severity": "moderate"},
       {"name": "cough", "severity": "moderate"}
   ]}
   ```

2. **Existing assessments** in database remain valid (stored as JSON)

3. **Test scripts** using old format continue to work

---

## 📝 Display Formatting

### Everywhere Symptoms Appear:

**1. Assessment Results Page:**
- Badges with color-coded severity indicators
- Format: `Fever (High)`, `Cough (Low)`

**2. PDF Reports:**
- Text format with severity in parentheses
- Example: "Reported Symptoms: Fever (High severity), Cough (Low severity), Headache (Moderate severity)"

**3. Triage Queue (Clinical Staff):**
- Full symptom + severity display for prioritization
- High-severity symptoms highlighted in red

**4. Assessment History:**
- Symptom badges with severity shown in timeline view

---

## 🧪 Testing

### Test with Different Severity Combinations:

```bash
# Backend test
cd backend
python test_unified_risk_fixes.py

# Manual API test
curl -X POST http://localhost:8000/assess \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "symptoms": [
      {"name": "fever", "severity": "high"},
      {"name": "cough", "severity": "low"}
    ],
    "age": 35,
    "gender": "male",
    "blood_pressure": "normal",
    "cholesterol_level": "normal"
  }'
```

---

## ⚙️ Configuration

### Adjusting Severity Multipliers:

To change how much severity impacts scoring, edit `backend/unified_risk_engine.py`:

```python
SEVERITY_MULTIPLIERS = {
    "low": 0.5,      # Adjust these values
    "moderate": 1.0,
    "high": 1.5
}
```

**Recommended ranges:**
- Low: 0.3 - 0.7 (don't go below 0.3)
- Moderate: 1.0 (baseline)
- High: 1.3 - 2.0 (don't exceed 2.0 to avoid over-scoring)

---

## 🚀 Deployment Checklist

- [x] Backend API updated to accept new symptom format
- [x] Pydantic models updated with validation
- [x] Risk scoring engine applies severity multipliers
- [x] Red flag detection considers severity levels
- [x] Frontend UI shows inline severity selectors
- [x] Validation prevents submission without severity
- [x] Results display symptoms with severity badges
- [x] Backward compatibility maintained
- [x] Emergency detection enhanced with severity awareness

---

## 📚 Files Modified

### Backend:
1. `backend/main.py` - API models and endpoints
2. `backend/predict.py` - Assessment pipeline and red flag detection
3. `backend/unified_risk_engine.py` - Risk scoring with severity multipliers

### Frontend:
1. `web/src/pages/SymptomChecker.jsx` - Complete UI overhaul with per-symptom severity selection

### Documentation:
1. `PER_SYMPTOM_SEVERITY_IMPLEMENTATION.md` - This file

---

## 💡 Future Enhancements

1. **Duration Tracking:** Add "How long have you had this symptom?" field
2. **Symptom History:** Track symptom progression over multiple assessments
3. **Smart Defaults:** Suggest severity based on symptom type (e.g., "chest pain" defaults to "high")
4. **Severity Explanations:** Show examples for each severity level per symptom
5. **Mobile Optimization:** Simplified severity selector for mobile devices

---

## 📞 Support

For questions or issues with this implementation:
1. Check the test scripts in `backend/test_unified_risk_fixes.py`
2. Review the API response format in the browser network tab
3. Verify severity multipliers in the risk engine configuration

---

**Implementation Date:** August 12, 2026  
**Version:** 1.0.0  
**Status:** ✅ Complete and Ready for Testing
