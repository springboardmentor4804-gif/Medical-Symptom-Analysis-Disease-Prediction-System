# Mentor Explanation — Actual Training

## Datasets used
1. `disease_prediction_train.csv`: **4,920 rows, 134 columns**. It contains **132 symptom features**, `prognosis` as the disease target, and one empty `Unnamed: 133` column which was removed.
2. `disease_prediction_test.csv`: **42 rows, 133 relevant columns** after ignoring the empty extra column. It was used as an external test set.
3. `disease_symptoms_patient_profile.csv`: **349 rows, 10 columns**. It contains Disease, Fever, Cough, Fatigue, Difficulty Breathing, Age, Gender, Blood Pressure, Cholesterol Level and Outcome Variable. It is used for the risk model.

## Disease model
Algorithm: Random Forest Classifier.
- Input: 132 binary symptom features.
- Target: `prognosis`.
- Training split: 80%.
- Validation split: 20%.
- Random state: 42.
- Estimators: 300.
- Class weighting: balanced.

## Disease model results
Validation accuracy: 100.00%
Validation precision: 100.00%
Validation recall: 100.00%
Validation F1: 100.00%

External 42-row test accuracy: 97.62%
External precision: 98.81%
External recall: 97.62%
External F1: 97.62%

## Risk model
A second Random Forest model is trained on the 349-row patient-profile dataset. Categorical variables are one-hot encoded. Target: `Outcome Variable`.
Accuracy: 75.71%
Precision: 75.70%
Recall: 75.71%
F1: 75.69%

## Web integration
React collects selected symptoms -> FastAPI `/api/assess` -> trained disease model -> top 5 disease probabilities. The risk model receives age, gender, blood pressure, cholesterol and symptom-derived values and produces a risk output. A transparent severity/risk score combines model output with urgent/lifestyle factors.

Do not describe the model as a clinically validated diagnostic system. The reported scores are dataset/model evaluation results only.
