# Recommendation Engine - UI Integration Guide

## ✅ Implementation Status

### Backend: **COMPLETE** ✓
- Recommendation engine module implemented
- Integrated with MedAssist engine
- All tests passing
- Configuration file ready

### Frontend: **NOW COMPLETE** ✓
- Recommendation section added to Streamlit UI
- Displays after treatment options
- Color-coded by urgency
- Expandable preventive care notes
- Self-care suggestions with icons

---

## 📍 Where It's Implemented

**File:** `frontend/app.py`  
**Location:** Lines ~280-330 (after treatment section, before model limitations)

### Visual Layout

```
┌─────────────────────────────────────────────┐
│ SEVERITY BANNER                             │
│ [EMERGENCY/URGENT/MODERATE/MILD]            │
├─────────────────────────────────────────────┤
│ Possible Conditions                         │
│ - Disease predictions with confidence       │
├─────────────────────────────────────────────┤
│ Chronic Condition Risk                      │
│ - Risk scores and percentiles               │
├─────────────────────────────────────────────┤
│ Treatment Options                           │
│ - Recommended medications                   │
├─────────────────────────────────────────────┤
│ 📋 RECOMMENDATION ← NEW SECTION             │
│                                             │
│ ⚠️/⏰/📅 PRIMARY ACTION (color-coded)       │
│ Urgency description                         │
│                                             │
│ Recommended specialist: [Doctor type]       │
│                                             │
│ ▼ Preventive Care Recommendations          │
│   ▶ Diabetes (Risk: 82/100)                │
│     [Expandable with factors & actions]     │
│   ▶ Heart Attack (Risk: 68/100)            │
│                                             │
│ Self-Care Suggestions:                      │
│ 💊 Acetaminophen (over-the-counter)        │
│ 🏠 rest                                     │
│ 🏠 fluids                                   │
│                                             │
│ [Disclaimer in small italics]               │
├─────────────────────────────────────────────┤
│ ▼ Model Limitations                        │
└─────────────────────────────────────────────┘
```

---

## 🎨 UI Components

### 1. Primary Action (Color-Coded)
```python
if urgency == "immediate":
    st.error(f"⚠️ {action_text}")      # Red background
elif urgency == "same-day":
    st.warning(f"⏰ {action_text}")     # Yellow background
elif urgency in ["within a week", "2-4 weeks"]:
    st.info(f"📅 {action_text}")        # Blue background
else:
    st.success(action_text)             # Green background
```

**Examples:**
- 🔴 ⚠️ **Seek emergency care immediately** (EMERGENCY)
- 🟡 ⏰ **Seek same-day medical attention** (URGENT)
- 🔵 📅 **Schedule a medical appointment soon** (MODERATE)
- 🟢 **Self-care and monitor symptoms** (MILD)

### 2. Urgency Description
```python
st.caption(rec.get("urgency_description", ""))
```

Shows detailed timeline:
- "Go to the nearest emergency room or call emergency services now"
- "Contact your doctor today or visit an urgent care clinic"
- "Book an appointment with your healthcare provider within the next few days"
- "Monitor your symptoms and seek care if they worsen or persist beyond 2 weeks"

### 3. Recommended Specialist
```python
st.markdown(f"**Recommended specialist:** {specialist}")
if rec.get("specialist_note"):
    st.caption(rec["specialist_note"])
```

**Examples:**
- Recommended specialist: **cardiologist**
- Recommended specialist: **primary care physician**
- Recommended specialist: **emergency medicine physician**  
  _Seek emergency care immediately_

### 4. Preventive Care (Expandable)
```python
for note in preventive_notes:
    with st.expander(f"{note['condition_label']} (Risk: {note['risk_score']}/100)"):
        st.write(note['message'])
        st.caption(f"Key factors: {', '.join(note['contributing_factors'][:3])}")
```

**Renders as:**
```
▼ Preventive Care Recommendations:
  ▶ Diabetes (Risk: 82/100)
  ▶ Heart Attack (Risk: 68/100)
```

When expanded:
```
▼ Diabetes (Risk: 82/100)
  Your diabetes risk assessment shows elevated likelihood. 
  Key contributing factors include BMI, Exercise, Smoking status. 
  Consider discussing weight management strategies, regular 
  physical activity plans, smoking cessation programs with your 
  healthcare provider.
  
  Key factors: BMI, Exercise, Smoking status
```

### 5. Self-Care Suggestions
```python
for sugg in self_care:
    icon = "💊" if sugg.get("type") == "otc_medication" else "🏠"
    st.write(f"{icon} {sugg['suggestion']}")
```

**Renders as:**
```
Self-Care Suggestions:
💊 Acetaminophen (over-the-counter)
💊 Ibuprofen (over-the-counter)
🏠 rest
🏠 fluids
🏠 over-the-counter medications
```

### 6. Disclaimer
```python
st.caption(f"_{rec['disclaimer']}_")
```

Small, italicized text at the bottom of the recommendation section.

---

## 🔄 Response Flow

### API Response Structure
```json
{
  "diagnosis": {...},
  "risk": {...},
  "severity": {...},
  "treatment": {...},
  "recommendation": {          ← NEW
    "primary_action": "...",
    "urgency_timeline": "...",
    "urgency_description": "...",
    "recommended_specialist": "...",
    "specialist_note": "...",
    "preventive_care_notes": [...],
    "self_care_suggestions": [...],
    "disclaimer": "..."
  },
  "meta": {...}
}
```

### UI Rendering Logic
```python
# 1. Check if recommendation exists
rec = result.get("recommendation")
if rec:
    # 2. Display section header
    st.subheader("📋 Recommendation")
    
    # 3. Show primary action (color-coded)
    # 4. Show urgency description
    # 5. Show recommended specialist
    # 6. Show preventive care (if any)
    # 7. Show self-care (if any)
    # 8. Show disclaimer
```

---

## 🎯 When Sections Appear

| Severity | Urgency Color | Preventive Care | Self-Care |
|----------|---------------|-----------------|-----------|
| EMERGENCY | 🔴 Red | ✓ (if chronic risk ≥60) | ✗ Never |
| URGENT | 🟡 Yellow | ✓ (if chronic risk ≥60) | ✗ Never |
| MODERATE | 🔵 Blue | ✓ (if chronic risk ≥60) | ✓ (if no red flags) |
| MILD | 🟢 Green | ✓ (if chronic risk ≥60) | ✓ (if no red flags) |

---

## 📝 Code Changes Made

### Modified File: `frontend/app.py`

**Location:** After the treatment section, before "Model limitations"

**Lines added:** ~50 lines (280-330)

**Changes:**
1. Added `rec = result.get("recommendation")` to extract recommendation data
2. Added conditional rendering with `if rec:`
3. Implemented color-coded primary action display
4. Added urgency description
5. Added specialist recommendation
6. Added expandable preventive care notes
7. Added self-care suggestions with icons
8. Added disclaimer

---

## 🧪 Testing the UI

### 1. Start the backend
```bash
cd backend
python main.py
```

### 2. Start the frontend
```bash
cd frontend
streamlit run app.py
```

### 3. Test scenarios

**Emergency Case:**
- Add symptoms: "sharp chest pain", "palpitations"
- Should show: Red urgent banner, cardiologist recommendation, no self-care

**Moderate with Chronic Risk:**
- Add symptoms: "headache", "fatigue"
- Fill health profile with high BMI, no exercise
- Should show: Blue info banner, preventive care for elevated risks, maybe self-care

**Mild Case:**
- Add symptoms: "runny nose", "cough"
- Should show: Green success banner, primary care recommendation, self-care suggestions

---

## 🎨 Customization Options

### Change Color Scheme
Edit the urgency conditions in `app.py`:
```python
if urgency == "immediate":
    st.error(...)  # Change to st.warning() for yellow instead of red
```

### Adjust Icon Usage
```python
icon = "💊" if sugg.get("type") == "otc_medication" else "🏠"
# Add more icon types:
icon = {
    "otc_medication": "💊",
    "lifestyle": "🏃",
    "dietary": "🥗"
}.get(sugg.get("type"), "🏠")
```

### Modify Expandable Sections
```python
# Currently auto-expanded: None
# To auto-expand preventive care:
with st.expander(f"...", expanded=True):
```

---

## 📊 User Experience Flow

```
User enters symptoms
       ↓
Clicks "Assess Symptoms"
       ↓
Backend processes (all 4 models + recommendation)
       ↓
UI displays results in order:
  1. Severity Banner
  2. Disease Predictions
  3. Chronic Risk Scores
  4. Treatment Options
  5. 📋 RECOMMENDATION ← NEW
  6. Model Limitations
       ↓
User sees:
  • Clear action to take
  • When to act
  • Who to see
  • Why (preventive care)
  • What to do now (self-care)
```

---

## ✅ Verification

To verify the implementation is working:

1. **Check backend has recommendation:**
   ```bash
   cd backend
   python -c "from services.engine import get_engine; print(hasattr(get_engine(), 'analyze'))"
   ```

2. **Check frontend code updated:**
   ```bash
   cd frontend
   grep -n "Recommendation" app.py
   # Should show line ~281: st.subheader("📋 Recommendation")
   ```

3. **Run full test:**
   - Start backend and frontend
   - Complete an assessment
   - Look for "📋 Recommendation" section after treatment
   - Verify color-coding matches severity

---

## 🚀 Deployment Notes

When deploying to production:

1. ✓ Backend already includes recommendation in API response
2. ✓ Frontend code now displays recommendation section
3. ✓ No database migrations needed
4. ✓ No new dependencies required
5. ✓ Configuration tunable via `backend/artifacts/recommendation_config.json`

Simply deploy updated `frontend/app.py` alongside existing backend.

---

## 📞 Support

- **Technical Documentation:** `docs/RECOMMENDATION_ENGINE.md`
- **Backend Code:** `backend/services/recommendation_engine.py`
- **Frontend Code:** `frontend/app.py` (lines ~280-330)
- **Configuration:** `backend/artifacts/recommendation_config.json`
- **Quick Start:** `RECOMMENDATION_ENGINE_QUICKSTART.md`

---

**Status:** ✅ Fully integrated in both backend and frontend  
**Ready for:** User testing and clinical review
