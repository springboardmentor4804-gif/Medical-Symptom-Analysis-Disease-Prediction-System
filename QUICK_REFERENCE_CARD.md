# 🎯 Healthcare Recommendation Engine - Quick Reference Card

## 📍 What You Need to Know

### ✅ Status: **COMPLETE & INTEGRATED**

The recommendation engine is fully working in your MedAssist application!

---

## 🚀 How to See It

### 1. Start Application
```bash
start.bat
```

### 2. Open Browser
```
http://127.0.0.1:5173
```

### 3. Complete Assessment
- Go to **Symptom Checker**
- Pick symptoms
- Fill form
- Click **"Assess Symptoms"**

### 4. Look for This Section
```
✨ Healthcare Recommendation
```
**Location:** After "Treatment options", before "How this was scored"

---

## 🎨 What You'll See

### Primary Action (Color-Coded)
```
🔴 EMERGENCY    → Red    → "Seek emergency care immediately"
🟠 URGENT       → Orange → "Seek same-day medical attention"  
🔵 MODERATE     → Blue   → "Schedule appointment soon"
🟢 MILD         → Green  → "Self-care and monitor symptoms"
```

### Recommended Specialist
```
👤 Recommended specialist: cardiologist
```

### Preventive Care (Expandable)
```
▼ Preventive Care Recommendations
  ▶ Diabetes (Risk: 82/100)
  ▶ Heart Attack (Risk: 68/100)
```

### Self-Care Suggestions
```
Self-Care Suggestions:
💊 Acetaminophen (over-the-counter)
🏠 rest
🏠 fluids
```

### Disclaimer
```
This recommendation is for informational purposes only...
```

---

## ⚙️ Configuration

### File Location
```
backend/artifacts/recommendation_config.json
```

### Key Settings

| Setting | Default | What It Controls |
|---------|---------|------------------|
| `chronic_risk_threshold` | 60 | When preventive care appears |
| `severity_actions` | - | Action text per severity level |
| `preventive_care_templates` | - | Messages for each condition |
| `specialist_priority_map` | - | Which specialists to prioritize |

### How to Modify
1. Edit `recommendation_config.json`
2. Restart backend (`start.bat`)
3. No code changes needed!

---

## 🧪 Quick Tests

### Test 1: Emergency
**Symptoms:** "sharp chest pain", "palpitations"  
**Expected:** 🔴 Red, emergency action, cardiologist

### Test 2: Mild
**Symptoms:** "runny nose", "cough"  
**Expected:** 🟢 Green, self-care suggestions

### Test 3: With Chronic Risk
**Symptoms:** Any mild symptoms  
**Profile:** High BMI (30+), smoker, no exercise  
**Expected:** Preventive care notes for diabetes/heart attack

---

## 📂 Key Files

### Backend
```
services/recommendation_engine.py     ← Core logic
artifacts/recommendation_config.json  ← Configuration
services/engine.py                    ← Integration
```

### Frontend
```
web/src/components/med/ResultPanels.jsx   ← RecommendationPanel
web/src/pages/SymptomChecker.jsx          ← Uses panel
```

### Documentation
```
RECOMMENDATION_ENGINE.md              ← Full technical docs
RECOMMENDATION_ENGINE_QUICKSTART.md   ← Quick guide
FINAL_VERIFICATION_CHECKLIST.md       ← Testing guide
ARCHITECTURE_DIAGRAM.md               ← System overview
```

---

## 🔧 Troubleshooting

### Not Seeing Recommendation Section?

**1. Check Backend Response**
- F12 → Network → /assess request → Preview
- Look for `"recommendation"` field
- Should have: `primary_action`, `urgency_timeline`, etc.

**2. Check Console for Errors**
- F12 → Console
- Look for "recommendation" or "RecommendationPanel" errors

**3. Hard Refresh Browser**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**4. Restart Everything**
```bash
# Stop start.bat (Ctrl+C in both windows)
start.bat
```

### Preventive Care Not Showing?

**This is normal when:**
- Health profile not filled
- All chronic risk scores < 60
- Risk assessment unavailable

**To see it:**
- Complete full health profile
- Set high BMI (e.g., 35)
- Mark as smoker, no exercise

### Self-Care Not Showing?

**This is normal when:**
- Severity is EMERGENCY or URGENT
- Red flags present
- No treatment data available

**To see it:**
- Pick mild symptoms (runny nose, cough)
- Avoid red-flag symptoms

---

## 📊 When Sections Appear

| Component | Appears When |
|-----------|-------------|
| Primary Action | Always |
| Urgency Timeline | Always |
| Specialist | Always (or default) |
| Preventive Care | Chronic risk ≥ 60 |
| Self-Care | MILD/MODERATE + no red flags |
| Disclaimer | Always |

---

## 🎯 Decision Logic

### Specialist Selection
```
1. Extract candidates from disease + treatment
2. If red flags → prioritize by red flag type
3. Else → prioritize by severity level
4. Fallback → generic based on severity
```

### Preventive Care
```
FOR EACH chronic condition:
  IF risk_score ≥ 60:
    Get top 3 risk factors
    Map to recommended actions
    Format with condition template
    Add to notes
```

### Self-Care
```
IF severity in [MILD, MODERATE]:
  IF no red flags:
    Extract from disease lookup
    Identify OTC medications
    Add lifestyle suggestions
```

---

## 💡 Pro Tips

### For Testing
- Use different symptom combinations
- Try with/without health profile
- Test all severity levels
- Check expandable sections work

### For Configuration
- Adjust thresholds gradually
- Test after each config change
- Keep backup of working config
- Document your changes

### For Production
- Clinical review before launch
- Monitor which recommendations appear
- Track user feedback
- Iterate based on usage

---

## 📞 Quick Links

| Need | File/Location |
|------|---------------|
| **Technical details** | `docs/RECOMMENDATION_ENGINE.md` |
| **Quick guide** | `RECOMMENDATION_ENGINE_QUICKSTART.md` |
| **Testing** | `FINAL_VERIFICATION_CHECKLIST.md` |
| **Architecture** | `ARCHITECTURE_DIAGRAM.md` |
| **Code** | `backend/services/recommendation_engine.py` |
| **Config** | `backend/artifacts/recommendation_config.json` |
| **UI Component** | `web/src/components/med/ResultPanels.jsx` |

---

## ✅ Success Checklist

After starting `start.bat` and completing an assessment:

- [ ] "Healthcare Recommendation" section appears
- [ ] Primary action shows with correct color
- [ ] Urgency description visible
- [ ] Specialist recommendation present
- [ ] Can expand preventive care (if risk ≥ 60)
- [ ] Self-care shows (if mild/moderate)
- [ ] Disclaimer at bottom
- [ ] No console errors
- [ ] Looks polished and professional

---

## 🎉 Summary

**What:** Consolidated healthcare recommendation from 4 models  
**Where:** After treatment options in results  
**How:** Config-driven, deterministic rules  
**Status:** ✅ Complete, tested, integrated  
**Ready for:** User testing and clinical review  

---

**Need More Help?**

📖 Read: `FINAL_VERIFICATION_CHECKLIST.md`  
🏗️ Architecture: `ARCHITECTURE_DIAGRAM.md`  
📝 Full Docs: `docs/RECOMMENDATION_ENGINE.md`

**Everything is working - just restart and test! 🚀**
