# Model Verification Guide

## Current Status

**⚠️ IMPORTANT: The ML models are currently DISABLED in the code**

The trained models exist in the `/model` directory, but they are **not being used** because of this line in `backend/main.py` (line 140):

```python
# Model is not trained yet, always use placeholder mode
model_enabled = False
```

## How to Enable the Trained Models

### Step 1: Change the Backend Code

Edit `backend/main.py` and change line 140:

**FROM:**
```python
model_enabled = False
```

**TO:**
```python
model_enabled = True
```

### Step 2: Restart the Backend Server

After making the change:
1. Stop the backend server (Ctrl+C in the terminal)
2. Restart it: `cd backend && python main.py`

## How to Verify Models Are Working

### Method 1: Check Backend Logs

When you submit a symptom check, look at the backend terminal output:
- **Demo mode**: Shows `model_mode=demo`
- **Real model**: Should show `model_mode=production` or similar

### Method 2: Check the Disease Names in Output

#### Demo Mode (Current - Placeholder Data):
- Disease A
- Disease B
- Disease C
- Disease D
- Disease E

#### Real Model (Trained Data):
- Real disease names like:
  - Common Cold
  - Influenza
  - Migraine
  - Gastroenteritis
  - Bronchitis
  - Pneumonia
  - Diabetes
  - Hypertension
  - etc. (155 diseases total)

### Method 3: API Testing

Use the browser or a tool like Postman to test:

1. **Login** first to get an auth token
2. **Submit a symptom check** with known symptoms:

```bash
# Example with curl (Windows CMD):
curl -X POST http://localhost:8000/assess ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"symptoms\":[\"fever\",\"cough\",\"fatigue\"],\"age\":30,\"gender\":\"male\",\"blood_pressure\":\"normal\",\"cholesterol_level\":\"normal\"}"
```

3. **Check the response** - look at the `disease_prediction.top_possible_diseases` array

### Method 4: UI Visual Inspection

After enabling models and restarting backend:

1. **Login** to the patient dashboard
2. **Go to Symptom Checker**
3. **Select common symptoms**: fever, cough, headache
4. **Submit the check**
5. **Look at the results**:
   - **Demo Mode**: Shows "Disease A", "Disease B", etc.
   - **Real Model**: Shows actual disease names with medical accuracy

### Method 5: Check Database Records

The assessment results are stored in the database. You can query:

```bash
# In the backend directory
python
```

```python
from database import SessionLocal, Assessment
import json

db = SessionLocal()
latest_assessment = db.query(Assessment).order_by(Assessment.id.desc()).first()

if latest_assessment:
    result = json.loads(latest_assessment.result_json)
    diseases = result['disease_prediction']['top_possible_diseases']
    
    print("Top predicted diseases:")
    for disease in diseases:
        print(f"  - {disease['disease_canonical']} ({disease['confidence_pct']}%)")
```

## What Each Model Does

### Model 1: Disease Prediction (Symptom Similarity)
- **File**: `model1_symptom_binarizer.pkl`, `model1_outcome_classifier.pkl`
- **Purpose**: Matches symptoms to 155 diseases using cosine similarity
- **Input**: List of symptoms
- **Output**: Top 5 most likely diseases with confidence scores

### Model 2: BRFSS Risk Screening
- **File**: `model2_brfss_risk_models.pkl`
- **Purpose**: Screens for 10 chronic conditions (diabetes, heart disease, etc.)
- **Input**: Lifestyle data (age, BMI, smoking, exercise, etc.)
- **Output**: Risk probability for each condition with AUC scores

### Model 3: Treatment Recommendations
- **File**: `model3_tfidf_vectorizer.pkl`, `model3_diagnosis_medication_reference.csv`
- **Purpose**: Suggests treatments based on MIMIC-IV discharge notes
- **Input**: Predicted disease name
- **Output**: Real-world medication recommendations

## Expected Behavior Differences

| Feature | Demo Mode (Current) | Real Model |
|---------|---------------------|------------|
| Disease Names | "Disease A", "Disease B" | "Common Cold", "Influenza", etc. |
| Confidence Scores | Fixed placeholders | Actual ML confidence |
| Treatment Recommendations | Generic | Based on real hospital data |
| Risk Screening | Random probabilities | BRFSS model predictions |
| Outcome Probability | Random | Regularized classifier output |

## Troubleshooting

### If models fail to load after enabling:

1. **Check Python version**: Models require Python 3.8+
2. **Check dependencies**: Ensure all packages in `requirements.txt` are installed
3. **Check model files**: Ensure all 9 model files exist in `/model` directory
4. **Check file paths**: The code looks for models at `Path(__file__).parent.parent / "model"`

### Common errors:

**"FileNotFoundError: No such file or directory: model1_*.pkl"**
- Solution: Model files are missing - ensure they're in the correct directory

**"ModuleNotFoundError: No module named 'sklearn'"**
- Solution: Install dependencies: `pip install -r requirements.txt`

**"Cannot unpickle model"**
- Solution: Version mismatch - ensure scikit-learn version matches training version

## Summary

✅ **Trained models exist**: All 9 model files are present in `/model` directory
✅ **Models are loaded**: Code loads models at import time
❌ **Models are not being used**: `model_enabled = False` in main.py

**To enable**: Change `model_enabled = False` to `model_enabled = True` in `backend/main.py` line 140
