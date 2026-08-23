# Risk Assessment Scores - Explained

## Understanding the Different Scores

The Risk Assessment page shows multiple types of scores. Here's what each one means:

### 1. **Similarity Score** (0-100%)
**What it is**: Raw cosine similarity between your symptoms and the disease's typical symptoms
**Scale**: 0-1 in backend, converted to 0-100% in frontend
**Example**: 0.856 → 85.6%

**Code**:
```python
# Backend (predict.py)
similarity_score = cosine_similarity(input_symptoms, disease_symptoms)
# Returns: 0.856

# Frontend (RiskAssessment.jsx)
similarity: (disease.similarity_score * 100).toFixed(1)
// Displays: "85.6%"
```

**Meaning**: How well your symptoms match this disease's symptom pattern
- 80-100%: Very strong match
- 60-80%: Good match
- 40-60%: Moderate match
- <40%: Weak match

---

### 2. **Confidence Percentage** (0-100%)
**What it is**: Relative confidence **among the top 5 predictions**
**Scale**: Already 0-100% (calculated from similarity scores)
**Example**: 33.3%

**Code**:
```python
# Backend (predict.py)
score_sum = all_similarity_scores.sum()
confidence_pct = (similarity_score / score_sum * 100).round(1)
# Returns: 33.3 (already percentage)

# Frontend (RiskAssessment.jsx)
confidence: disease.confidence_pct
// Displays: "33.3%"
```

**Meaning**: Out of the top 5 predictions, this disease accounts for X% of the total confidence
- If top 5 have similar scores: ~20% each
- If one dominates: Could be 50%+
- Sum of all top 5 = 100%

**Important**: This is **relative** confidence, not absolute. A 33% confidence with 85% similarity is strong!

---

### 3. **Risk Probability** (0-100%)
**What it is**: BRFSS model prediction for chronic conditions
**Scale**: 0-1 in backend, converted to 0-100% in frontend
**Example**: 0.123 → 12.3%

**Code**:
```python
# Backend (predict.py)
risk_probability = model.predict_proba(lifestyle_data)[0, 1]
risk_probability = round(risk_probability, 3)
# Returns: 0.123

# Frontend (RiskAssessment.jsx)
risk: (condition.risk_probability * 100).toFixed(1)
// Displays: "12.3%"
```

**Meaning**: Probability you have or will develop this chronic condition
- <10%: Low risk
- 10-30%: Moderate risk
- >30%: High risk (flagged)

---

### 4. **Outcome Probability** (0-100%)
**What it is**: ML classifier prediction for positive outcome
**Scale**: 0-1 in backend, converted to 0-100% in frontend
**Example**: 0.425 → 42.5%

**Code**:
```python
# Backend (predict.py)
outcome_probability_positive = classifier.predict_proba(features)[0, 1]
outcome_probability_positive = round(outcome_probability_positive, 3)
# Returns: 0.425

# Frontend (RiskAssessment.jsx)
{(diseasePrediction.outcome_probability_positive * 100).toFixed(1)}%
// Displays: "42.5%"
```

**Meaning**: Likelihood of a positive outcome (recovery/improvement)
- >60%: High confidence positive outcome
- 40-60%: Moderate (uncertain)
- <40%: Low confidence positive outcome

---

### 5. **Disease Risk** (0-100%)
**What it is**: Historical risk percentage from disease database
**Scale**: Already 0-100% (from disease data)
**Example**: 15.0%

**Code**:
```python
# Backend (disease database)
risk_pct = 15.0  # Already percentage

# Frontend (RiskAssessment.jsx)
disease.risk_pct
// Displays: "15%"
```

**Meaning**: Population-level risk for this disease
- <5%: Very rare
- 5-20%: Uncommon
- >20%: Common

---

## Visual Comparison

### Chart 1: Disease Prediction Confidence
Shows **two bars per disease**:
- **Purple bar**: Confidence % (relative among top 5)
- **Green bar**: Similarity % (absolute symptom match)

**Why different?**
- Flu: 33% confidence, 85% similarity
  - High absolute match (85% of symptoms)
  - But moderate relative confidence (33% vs other predictions)

### Chart 2: BRFSS Risk Probability
Shows **one bar per condition**:
- **Red bar**: At risk (probability ≥ threshold)
- **Green bar**: Low risk (probability < threshold)

All values are actual BRFSS model predictions.

### Chart 3: Risk Category Distribution (Pie)
Shows breakdown of predicted diseases by risk category:
- Red slice: High risk diseases (count)
- Amber slice: Moderate risk diseases (count)
- Green slice: Low risk diseases (count)

### Chart 4: Prediction Confidence Radar
Shows **two metrics per disease**:
- Purple line: ML confidence %
- Green line: Symptom similarity %

Helps visualize which diseases have strong confidence AND strong symptom match.

---

## Data Flow Summary

```
USER SYMPTOMS → ML MODEL → BACKEND → FRONTEND → DISPLAY
                    ↓
            [0-1 scale]
                    ↓
            round(value, 3)
                    ↓
        {"risk_probability": 0.123}
                    ↓
            * 100 (frontend)
                    ↓
            "12.3%" displayed
```

---

## Key Differences

| Metric | Scale | Purpose | Example |
|--------|-------|---------|---------|
| **Similarity Score** | 0-1 → 0-100% | Absolute symptom match | 85.6% |
| **Confidence %** | 0-100% | Relative among top 5 | 33.3% |
| **Risk Probability** | 0-1 → 0-100% | BRFSS chronic risk | 12.3% |
| **Outcome Probability** | 0-1 → 0-100% | Recovery likelihood | 42.5% |
| **Disease Risk** | 0-100% | Population risk | 15.0% |

---

## Why Multiple Scores?

**Different models, different purposes**:

1. **Similarity Score**: How well symptoms match (diagnostic)
2. **Confidence %**: Which disease is most likely (ranking)
3. **Risk Probability**: Chronic condition screening (preventive)
4. **Outcome Probability**: Treatment prognosis (prognostic)
5. **Disease Risk**: Population baseline (epidemiological)

All scores are **real ML model outputs**, not hardcoded or random!

---

## Common Confusion

**Q: Why is confidence 33% but similarity 85%?**

A: Because confidence is **relative**:
- Flu: 33% confidence, 85% similarity
- Cold: 30% confidence, 80% similarity
- Bronchitis: 20% confidence, 75% similarity
- Total: 83% confidence accounted for

All three have high absolute similarity, but flu is only slightly more confident than cold.

**Q: Is 33% confidence bad?**

A: No! If all top 5 diseases have similar confidence (~20% each), it means they're all plausible. Look at the **similarity score** (85%) for the actual diagnostic strength.

**Q: Why do charts show different scales?**

A: Because they measure different things:
- Disease confidence: Relative ranking (sums to 100%)
- BRFSS risks: Absolute probabilities (independent)
- Similarity: Absolute match quality (0-100%)

---

## Summary

✅ **All values are real** - from trained ML models
✅ **Properly converted** - 0-1 scale → 0-100% where appropriate
✅ **Not hardcoded** - pulls from actual API responses
✅ **Multiple perspectives** - different scores for different insights

The charts now display both **confidence % (relative)** and **similarity % (absolute)** to give you the complete picture!
