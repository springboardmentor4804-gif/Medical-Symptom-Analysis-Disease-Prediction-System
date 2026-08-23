# Severity Analysis - Quick Reference Card

## 🎯 What It Does
Rule-based clinical severity assessment that runs INDEPENDENT of ML disease predictions.

## 🚨 Red Flag Symptoms (Always → Emergency)
- **Cardiac:** chest pain, severe chest tightness
- **Respiratory:** difficulty breathing, gasping, choking
- **Bleeding:** severe bleeding, coughing/vomiting blood
- **Neuro:** confusion, fainting, slurred speech, facial drooping, weakness, seizure
- **Fever:** >103°F / 39.4°C
- **Abdominal:** severe abdominal pain, rigid abdomen

## 📊 Severity Tiers

| Tier | Display | Action |
|------|---------|--------|
| 🚨 **emergency** | Red banner | Call 911 immediately |
| ⚠️ **see_doctor_soon** | Orange card | Appointment within 24-48h |
| 👁️ **monitor** | Yellow card | Watch for changes |
| ✅ **self_care** | Green card | Home care, rest, hydrate |

## 🧮 Scoring Quick Formula

```
Score = Symptom Count + Duration + Intensity + Risk Elevation

Symptom Count:
  1 symptom = 1 pt
  2 symptoms = 2 pts
  3-4 symptoms = 4 pts
  5+ symptoms = 6 pts

Duration (if provided):
  <1 day = 0 pts
  2-3 days = 1 pt
  4-7 days = 2 pts
  1-2 weeks = 3 pts
  2+ weeks = 4 pts

Intensity (if provided):
  Mild = 1 pt
  Moderate = 3 pts
  Severe = 5 pts

Risk Elevation:
  BRFSS risk matches prediction = +2 pts

Tier Assignment:
  Red flags = emergency (always)
  0-2 pts = self_care
  3-5 pts = monitor
  6-8 pts = see_doctor_soon
  9+ pts = see_doctor_soon
```

## 🔧 Files to Know

```
backend/
  severity_engine.py     ← All severity logic
  predict.py             ← Calls assess_severity()

web/src/
  components/med/
    SeverityBanner.jsx   ← UI component
  pages/
    RiskAssessment.jsx   ← Shows banner
```

## 🧪 Test Commands

```bash
# 1. Test Emergency
Input: ["chest pain", "shortness of breath"]
Expected: Red banner, 911 call-to-action

# 2. Test See Doctor
Input: ["fever", "cough", "fatigue", "body aches", "headache"]
Expected: Orange card, schedule appointment

# 3. Test Monitor
Input: ["runny nose", "sneezing"]
Expected: Yellow card, watch symptoms

# 4. Test Self-Care
Input: ["mild headache"]
Expected: Green card, home care advice
```

## 🐛 Common Issues

**Severity not showing?**
→ Check backend response has `severity_analysis` field

**Not emergency despite chest pain?**
→ Verify symptom string matches red flag list (exact or fuzzy match)

**Score seems wrong?**
→ Duration and intensity are optional (currently NULL), only symptom count counts

## 📝 API Response Structure

```json
{
  ...other fields...,
  "severity_analysis": {
    "tier": "emergency",
    "score": 99,
    "reason": "Red-flag symptom detected: chest pain",
    "triggered_flags": ["chest pain"],
    "risk_factors_relevant": [],
    "recommendations": "🚨 SEEK IMMEDIATE...",
    "disclaimer": "This is not a medical diagnosis..."
  }
}
```

## ⚡ Quick Integration Steps

1. **Backend:** `severity_engine.py` is imported in `predict.py`
2. **Backend:** `assess_severity()` called in `run_assessment()`
3. **Backend:** Result includes `severity_analysis` object
4. **Frontend:** `SeverityBanner` component created
5. **Frontend:** Banner added to `RiskAssessment.jsx`
6. **Restart:** Both backend and frontend

## 🎨 UI Color Guide

```
Emergency:    bg-rose-50, border-rose-500, text-rose-900
See Doctor:   bg-orange-50, border-orange-400, text-orange-900
Monitor:      bg-yellow-50, border-yellow-400, text-yellow-900
Self-Care:    bg-emerald-50, border-emerald-400, text-emerald-900
```

## ⚖️ Safety Rules

1. ✅ Red flags ALWAYS win (even if ML confidence is low)
2. ✅ Severity is independent of ML disease predictions
3. ✅ Every tier includes safety disclaimer
4. ✅ Emergency tier ALWAYS shows 911 call-to-action
5. ❌ NEVER suppress emergency tier based on ML scores

---

**For full documentation, see:** `SEVERITY_ANALYSIS_GUIDE.md`
