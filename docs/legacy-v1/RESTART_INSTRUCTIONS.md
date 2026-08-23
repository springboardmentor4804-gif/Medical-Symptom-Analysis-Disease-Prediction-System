# How to Restart Backend to Enable Models

## The Problem

You changed `model_enabled = False` to `model_enabled = True` in `backend/main.py`, but **Python caches the code in memory**. The running backend process is still using the OLD code.

## The Solution

You MUST restart the backend server for changes to take effect.

## Step-by-Step Instructions

### Option 1: Using start.bat (Recommended)

1. **Stop all running processes**
   - Press `Ctrl+C` in any terminal running the backend
   - Press `Ctrl+C` in any terminal running the frontend
   - Close all PowerShell/CMD windows

2. **Restart everything**
   ```cmd
   cd C:\Users\kmage\OneDrive\Desktop\MedAssist
   start.bat
   ```

### Option 2: Manual Restart

1. **Stop the backend**
   - Find the terminal/PowerShell window running `python main.py`
   - Press `Ctrl+C` to stop it

2. **Start the backend again**
   ```cmd
   cd C:\Users\kmage\OneDrive\Desktop\MedAssist\backend
   python main.py
   ```

3. **Wait for this message:**
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
   ```

4. **Test in the browser**
   - Go to http://localhost:3000
   - Login
   - Go to Symptom Checker
   - Enter symptoms: fever, cough, headache
   - Submit
   - Check the disease names

## How to Verify It's Working

### Before Restart (Old Code - Demo Mode)
Disease names will be:
- Disease A
- Disease B
- Disease C
- Disease D
- Disease E

### After Restart (New Code - Real Models)
Disease names will be real medical conditions like:
- Common Cold
- Influenza
- Tonsillitis
- Bronchitis
- Pneumonia
- Upper Respiratory Infection
- Sinusitis
- etc.

## Quick Test Command

After restarting backend, run this to verify:

```cmd
cd C:\Users\kmage\OneDrive\Desktop\MedAssist\backend
python quick_test.py
```

This will show you both demo mode and real model output side-by-side.

## Still Not Working?

### Check 1: Is the code actually changed?

Open `backend/main.py` and look at line 139-140:
```python
@app.post("/assess")
def assess(
    patient: PatientInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    model_enabled = True  # <-- This should be True, not False
```

### Check 2: Are you looking at old assessments?

The database stores old assessment results. If you're looking at assessments created BEFORE the restart, they will still show "Disease A, B, C" because that's what was stored.

**Solution**: Create a NEW symptom check assessment after restarting.

### Check 3: Browser cache

Clear your browser cache or use Ctrl+Shift+R to hard refresh the page.

## Summary

✅ **Code is correct**: `model_enabled = True` in main.py
✅ **Models are working**: quick_test.py shows real disease names
❌ **Backend needs restart**: Code changes don't apply until restart

**Next step**: Restart the backend, then create a NEW symptom check!
