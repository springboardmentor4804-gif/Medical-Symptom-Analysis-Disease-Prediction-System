# Testing Guide - Unified Risk Engine

## 🚀 Quick Start

### Step 1: Restart Backend
```bash
# Open Command Prompt in project directory
cd c:\Users\kmage\OneDrive\Desktop\MedAssist\backend

# Stop any running backend (Ctrl+C if needed)
# Then start it fresh
python main.py
```

**Expected Output:**
```
INFO: Started server process
INFO: Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Check for Import Errors
Look for any error messages about:
- `ModuleNotFoundError: No module named 'unified_risk_engine'`
- `ImportError: cannot import name...`

If you see errors, the new files aren't being found. Make sure:
- `unified_risk_engine.py` is in the `backend/` directory
- No typos in the filename

### Step 3: Frontend (Should Auto-Reload)
If frontend is already running, it should auto-reload. If not:
```bash
cd c:\Users\kmage\OneDrive\Desktop\MedAssist\web
npm run dev
```

---

## ✅ Test Case 1: Basic Functionality

### Inputs:
1. Go to **Symptom Checker** page
2. Select symptoms:
   - ✅ Fever
   - ✅ Cough
   - ✅ Fatigue
3. Patient Info:
   - Age: 30
   - Gender: Male
   - Blood Pressure: Normal
4. Submit

### What to Check:

#### A. Risk Assessment Page Loads
- ✅ Page displays without errors
- ✅ "Risk Assessment" header shows
- ✅ No JavaScript errors in browser console (F12)

#### B. Current Risk Level Card
Look at the top stat cards:
```
┌─────────────────────────┐
│ Current Risk Level      │
│ [Color: Amber/Orange]   │
│ REVIEW                  │
│ Score: XX/100           │ ← Should show a number
└─────────────────────────┘
```

**✅ PASS if:**
- Shows a score (e.g., "Score: 45/100")
- Color matches tier (Low=Green, Moderate=Amber, High/Emergency=Red)

**❌ FAIL if:**
- Shows "undefined/100"
- Card is blank
- Console shows error

#### C. Risk Score Breakdown Card
Scroll down, should see new card:
```
┌─────────────────────────────────────────┐
│ Risk Score Breakdown (Explainable AI)  │
│                                         │
│ Unified Risk Score: 45/100  [MODERATE] │
│ ✅ Risk tier 'MODERATE' is consistent  │
│                                         │
│ Disease Risk Component: XX/60           │
│ Symptom Severity Component: XX/25       │
│ ...                                     │
└─────────────────────────────────────────┘
```

**✅ PASS if:**
- Card is visible
- Shows score and tier
- Shows component breakdowns
- No errors in console

**❌ FAIL if:**
- Card missing entirely
- Shows "undefined" values
- Console error about `RiskBreakdown`

---

## 🚨 Test Case 2: Red Flag Override (Critical!)

This tests the most important fix: red flag detection forces Emergency tier.

### Inputs:
1. Go to **Symptom Checker**
2. Select symptoms:
   - ✅ Chest Pain
   - ✅ Shortness of Breath
3. Age: 55, Gender: Male
4. Submit

### What to Check:

#### A. Current Risk Level Card
```
┌─────────────────────────┐
│ Current Risk Level      │
│ [Color: RED]            │ ← Must be red!
│ HIGH PRIORITY           │ ← Must show this
│ Score: 95-100/100       │ ← Should be 95+
└─────────────────────────┘
```

**✅ PASS if:**
- Card is RED
- Shows "HIGH PRIORITY"
- Score is 95 or higher

**❌ FAIL if:**
- Card is green/amber (low/moderate)
- Score is below 95
- Shows "LOW" or "REVIEW"

#### B. Risk Breakdown Shows Override
Look for emergency override section:
```
🚨 Emergency Override Applied
   Reason: Red flags detected: chest pain, shortness of breath
   Base score before override: XX/100
```

**✅ PASS if:**
- Shows emergency override section
- Explains which red flags triggered
- Shows base score was lower

**❌ FAIL if:**
- No override section
- Doesn't mention red flags

#### C. Consistency Check
**CRITICAL:** All risk indicators must match!
- Current Risk Level card: RED / HIGH PRIORITY
- Risk Breakdown: EMERGENCY tier
- Disease cards: Should show high severity

**✅ PASS if:** ALL show high/emergency
**❌ FAIL if:** Any mismatch (e.g., one says Low, another says Emergency)

---

## 📊 Test Case 3: Low Risk (Self-Care)

Tests normal, low-severity case.

### Inputs:
1. Go to **Symptom Checker**
2. Select symptoms:
   - ✅ Runny Nose
   - ✅ Sneezing
3. Age: 25, Gender: Female
4. Submit

### What to Check:

#### A. Current Risk Level Card
```
┌─────────────────────────┐
│ Current Risk Level      │
│ [Color: GREEN]          │ ← Must be green
│ LOW                     │ ← Must show this
│ Score: 10-40/100        │ ← Should be low
└─────────────────────────┘
```

**✅ PASS if:**
- Card is GREEN
- Shows "LOW"
- Score is 0-40

**❌ FAIL if:**
- Shows emergency/high despite mild symptoms

#### B. Risk Breakdown
Should show:
- Low disease severity contributions
- Low symptom severity (runny nose: 1 pt, sneezing: 1 pt)
- No red flag override section

---

## 🧪 Test Case 4: Missing Disease Lookup Detection

Tests that system handles diseases not in lookup table.

### What to Check:

#### A. Backend Logs
After submitting any symptom check, look at the backend console output.

**If disease lookup is working:**
```
INFO: Assessment recorded: user_id=1 risk_flag=REVIEW
```

**If disease is missing from lookup:**
```
WARNING: Disease severity lookup MISS: 'some disease name' - using default
INFO: Assessment recorded: user_id=1 risk_flag=REVIEW
```

#### B. Risk Breakdown Card
Look for warning:
```
Disease Risk Component: XX/60
  • disease name: XX pts (XX% conf, XX sev)
  
⚠️ 1 disease(s) used default severity
```

**✅ PASS if:**
- System doesn't crash
- Uses default severity (50)
- Shows warning in UI
- Logs warning in backend

**❌ FAIL if:**
- App crashes on unknown disease
- Shows "undefined" severity

---

## 🔍 Test Case 5: Age & Vitals Adjustments

Tests risk adjustment factors.

### Test A: Elderly Patient
**Inputs:**
- Symptoms: Fever, Cough
- Age: **75** (elderly)
- Blood Pressure: **High**

**Expected:**
- Risk score should be **higher** than young adult with same symptoms
- Risk breakdown should show:
  - Age Adjustment: **+2.0 to +5.0 pts**
  - Vitals Adjustment: **+1.5 pts** (for high BP)

### Test B: Young Adult
**Inputs:**
- Same symptoms
- Age: **25** (young adult)
- Blood Pressure: Normal

**Expected:**
- Risk score should be **lower**
- Age adjustment: **-1.0 to 0 pts** (or small negative)
- Vitals adjustment: **0 pts**

**✅ PASS if:** Elderly score > Young adult score

---

## 🐛 Common Issues & Fixes

### Issue 1: "ModuleNotFoundError: No module named 'unified_risk_engine'"

**Cause:** Backend can't find the new file

**Fix:**
```bash
# Check file exists
dir c:\Users\kmage\OneDrive\Desktop\MedAssist\backend\unified_risk_engine.py

# If missing, file wasn't created properly
# Re-create it or check the filename spelling
```

### Issue 2: "Cannot import name 'calculate_unified_risk_score'"

**Cause:** Function name typo or file is incomplete

**Fix:**
1. Open `backend/unified_risk_engine.py`
2. Check line ~220, should have:
   ```python
   def calculate_unified_risk_score(
   ```
3. If missing, file didn't save correctly

### Issue 3: Frontend shows "undefined/100"

**Cause:** Frontend expecting data that backend isn't sending

**Fix:**
1. Open browser console (F12)
2. Look for error messages
3. Check Network tab → Click failed request → See response
4. Likely backend didn't restart or has errors

### Issue 4: Card is blank/missing

**Cause:** Component import failed

**Fix:**
1. Check browser console for error:
   ```
   Failed to compile
   Cannot find module 'RiskBreakdown'
   ```
2. Verify `RiskBreakdown.jsx` is in:
   ```
   web\src\components\med\RiskBreakdown.jsx
   ```
3. Check import in `RiskAssessment.jsx` matches filename exactly

### Issue 5: Inconsistent risk tiers still showing

**Cause:** Backend not using unified risk tier

**Fix:**
1. Check backend console for this log:
   ```
   INFO: Assessment recorded: user_id=X risk_flag=REVIEW
   ```
2. Restart backend (Ctrl+C, then `python main.py`)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Submit new symptom check

---

## 📋 Quick Checklist

Use this to verify everything works:

### Backend:
- [ ] Backend starts without errors
- [ ] No import errors in console
- [ ] Assessment endpoint returns 200 OK
- [ ] Response includes `unified_risk_score`
- [ ] Response includes `unified_risk_explanation`

### Frontend:
- [ ] Risk Assessment page loads
- [ ] Current Risk Level card shows score
- [ ] Risk Breakdown card is visible
- [ ] No JavaScript errors in console
- [ ] All stat cards show consistent tier

### Functionality:
- [ ] Low risk symptoms → Green/LOW
- [ ] Moderate symptoms → Amber/REVIEW
- [ ] High risk symptoms → Orange/RED/HIGH PRIORITY
- [ ] Red flags → Red/HIGH PRIORITY/95+ score
- [ ] Elderly + high BP → Higher score than young adult
- [ ] Risk breakdown shows component scores
- [ ] Override section shows when red flags fire

---

## 🎯 Expected Results Summary

| Test | Symptoms | Expected Tier | Expected Score |
|------|----------|---------------|----------------|
| Basic | Fever, Cough, Fatigue | MODERATE | 40-60 |
| Red Flag | Chest Pain, SOB | EMERGENCY | 95-100 |
| Low | Runny Nose, Sneezing | LOW | 10-30 |
| Elderly | Fever, Cough (age 75) | MODERATE-HIGH | 50-75 |
| Young | Same (age 25) | LOW-MODERATE | 30-50 |

---

## 🆘 Still Not Working?

### Debug Steps:

1. **Check Backend Response:**
   ```bash
   # In browser console (F12)
   # After submitting symptom check, look in Network tab
   # Click the /assess request
   # Check Response tab
   # Should see: unified_risk_score, unified_risk_tier
   ```

2. **Check Frontend State:**
   ```javascript
   // In browser console (F12)
   // Type this to see what data frontend received:
   console.log(result.risk_assessment)
   
   // Should show:
   // {
   //   unified_risk_score: 45,
   //   unified_risk_tier: "moderate",
   //   unified_risk_explanation: {...},
   //   ...
   // }
   ```

3. **Verify File Locations:**
   ```
   ✅ backend/unified_risk_engine.py exists
   ✅ backend/predict.py imports it
   ✅ web/src/components/med/RiskBreakdown.jsx exists
   ✅ web/src/pages/RiskAssessment.jsx imports it
   ```

4. **Check for Typos:**
   - `unified_risk_score` (not `unifiedRiskScore`)
   - `unified_risk_tier` (not `unified_risk_level`)
   - `RiskBreakdown` (capital R, capital B)

---

## ✅ Success Criteria

**System is working correctly if:**

1. ✅ Backend starts without errors
2. ✅ Symptom check submission succeeds
3. ✅ Risk Assessment page loads
4. ✅ Current Risk Level shows a score (XX/100)
5. ✅ Risk Breakdown card is visible
6. ✅ Red flags force Emergency tier (95+ score)
7. ✅ All cards show **consistent** tier (no LOW + Emergency mismatch)
8. ✅ Explanation shows component breakdowns
9. ✅ No console errors

**If ALL checkmarks pass → System is fully functional! 🎉**

---

## 📞 Need Help?

If tests fail:
1. Copy the error message from console
2. Note which test case failed
3. Check if backend or frontend issue
4. Review relevant section above for fixes

Most common fix: **Restart backend after code changes!**
```bash
# Stop backend (Ctrl+C)
# Start again
cd backend
python main.py
```
