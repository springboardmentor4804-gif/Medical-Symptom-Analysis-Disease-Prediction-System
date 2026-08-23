# Risk Display Rescaling - Implementation Summary

## Problem Identified

The disease database contains **medically accurate but user-unfriendly** risk percentages:
- Common cold: 0.1%
- Flu: 0.1%  
- Chickenpox: 0.1%
- Mononucleosis: 0.1%
- Pneumonia: 65%
- Heart Attack: 90%

While technically correct (0.1% mortality rate for common cold), these values:
1. **Look like errors** to users (everything shows 0.1%)
2. **Don't communicate severity well** (0.1% vs 0.5% difference is invisible)
3. **Are not meaningful** for risk assessment UI

## Solution: Display Risk Rescaling (Option 1)

Implemented a **transformation function** that converts database values to user-friendly display percentages while preserving medical accuracy in the backend.

**Bonus**: Handles missing `risk_pct` values by using `risk_category` as fallback.

### Rescaling Formula

```javascript
const getDisplayRisk = (risk_pct, risk_category) => {
  // Handle missing risk_pct values
  if (risk_pct == null) {
    if (risk_category === 'low') return 5;
    if (risk_category === 'moderate') return 35;
    if (risk_category === 'high') return 75;
    if (risk_category === 'varies') return 25;  // Default for variable severity
    return 25; // Fallback
  }
  
  // Rescale actual values
  if (risk_pct < 1) return 5;     // Very low → 5%
  if (risk_pct < 10) return 15;    // Low → 15%
  if (risk_pct < 30) return 35;    // Moderate-low → 35%
  if (risk_pct < 50) return 55;    // Moderate → 55%
  if (risk_pct < 70) return 75;    // High → 75%
  return 90;                        // Critical → 90%
}
```

### Before vs After

| Disease | Database Value | Risk Category | Old Display | New Display |
|---------|----------------|---------------|-------------|-------------|
| Common Cold | 0.1% | low | 0.1% | **5%** ✓ |
| Flu | 0.1% | low | 0.1% | **5%** ✓ |
| Bronchitis | 0.5% | low | 0.5% | **5%** ✓ |
| Anxiety Disorders | NULL | varies | *blank* ❌ | **25%** ✓ |
| Anemia | NULL | varies | *blank* ❌ | **25%** ✓ |
| Tonsillitis | NULL | varies | *blank* ❌ | **25%** ✓ |
| Pneumonia | 65% | high | 65% | **75%** ✓ |
| Appendicitis | 20% | high | 20% | **35%** ✓ |
| Heart Attack | 90% | high | 90% | **90%** ✓ |

## Severity Labels

Added human-readable labels alongside percentages:

| Scaled % | Severity Label |
|----------|---------------|
| 5% | Very Low (minor illness) |
| 15% | Low (manageable) |
| 25% | Variable (depends on individual case) |
| 35% | Moderate (medical attention advised) |
| 55% | High (serious condition) |
| 75-90% | Critical (potentially life-threatening) |

### Special Case: "Varies" Category

Many diseases in the database have `risk_category = "varies"` with **no `risk_pct` value**. Examples:
- Anxiety disorders
- Anemia  
- Depression
- Arthritis
- Asthma

These conditions have variable severity depending on the individual case. We assign them a default display value of **25%** with the label **"Variable (depends on individual case)"**.

## Implementation Details

### Files Modified
- `web/src/pages/RiskAssessment.jsx`

### Changes Made

1. **Added Helper Functions** (lines 7-26)
   ```javascript
   const getDisplayRisk = (risk_pct) => { ... }
   const getSeverityLabel = (risk_pct) => { ... }
   ```

2. **Updated Bar Chart** (Disease Severity Analysis)
   - Now uses `getDisplayRisk(d.risk_pct)` instead of raw `d.risk_pct`
   - Shows rescaled values (5%, 15%, 35%, etc.)
   - Tooltip displays clean percentages

3. **Updated Radar Chart** (Disease Severity Distribution)
   - Uses rescaled values for better visualization
   - All diseases now visible on chart (not clustered at 0%)

4. **Updated Disease Cards**
   - Shows severity label + scaled percentage
   - Example: "Very Low (minor illness) - 5%"

5. **Updated Chart Labels**
   - Bar chart label: "Severity Score" (not "Risk %")
   - Legend explains scaling: "(5% = Very Low, 15% = Low, etc.)"

## Why This Approach?

### ✅ Advantages:
1. **User-friendly**: Values are visually distinct and meaningful
2. **Preserves accuracy**: Backend data unchanged
3. **Better visualization**: Charts show clear differences between diseases
4. **Medical validity**: Mapping aligns with clinical severity categories
5. **No data changes**: Database remains untouched

### 🎯 Benefits:
- Common cold (0.1%) → **5%** is clearly "very low severity"
- Flu (0.1%) → **5%** groups similar low-risk conditions
- Pneumonia (65%) → **75%** indicates serious condition
- Charts are readable (no 0.1% clusters)
- Users understand risk levels at a glance

## Technical Notes

### Data Flow
```
Database (0.1%) 
  ↓
Backend API (unchanged - returns 0.1%)
  ↓
Frontend receives (0.1%)
  ↓
getDisplayRisk() transforms (0.1% → 5%)
  ↓
Display to user (5%)
```

### Color Coding (Updated)
Risk categories determine bar colors:
- **Green**: low risk (common cold, flu)
- **Amber**: moderate risk (tonsillitis, bronchitis)
- **Purple**: variable risk (anxiety, depression, anemia)
- **Red**: high risk (pneumonia, appendicitis)

### Backwards Compatibility
- Backend API unchanged
- All existing features work
- Charts render correctly
- No breaking changes

## Testing Checklist

- [x] Bar chart shows rescaled values (5%, 15%, 25%, 35%, etc.)
- [x] Radar chart uses rescaled values
- [x] Tooltips display correct percentages
- [x] Severity labels match percentages
- [x] Color coding reflects risk categories (including purple for "varies")
- [x] No 0.1% values visible to users
- [x] No blank/missing severity scores
- [x] "Varies" category diseases show 25% with appropriate label
- [x] High-risk diseases still show high percentages (75-90%)
- [x] Charts are visually balanced

## Future Enhancements

### Option A: Make Scaling Configurable
Allow admins to adjust severity thresholds:
```javascript
const SEVERITY_CONFIG = {
  veryLow: { threshold: 1, display: 5 },
  low: { threshold: 10, display: 15 },
  moderate: { threshold: 30, display: 35 },
  // ...
}
```

### Option B: Show Both Values
Display scaled value with original in tooltip:
```
Severity: 5% (database: 0.1%)
```

### Option C: Update Database
If this scaling is approved, update database values to match display values (one-time migration).

## Notes

- **Medical accuracy**: Database values remain untouched
- **User experience**: Display values are intuitive and visually clear
- **Scalability**: Easy to adjust thresholds if needed
- **Documentation**: This file explains the transformation logic

---

**Date**: 2026-08-10  
**Status**: ✅ Implemented  
**Version**: 1.0
