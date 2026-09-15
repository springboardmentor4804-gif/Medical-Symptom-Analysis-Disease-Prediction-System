import pandas as pd
import numpy as np

from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier

from sklearn.ensemble import GradientBoostingClassifier
# ============================================================
# Load Dataset
# ============================================================

DATASET_PATH = r"D:\MedAssist_AI\datasets\diabetes_binary_5050split_health_indicators_BRFSS2015.csv"

df = pd.read_csv(DATASET_PATH)

TARGET = "Diabetes_binary"

X = df.drop(columns=[TARGET])
y = df[TARGET].astype(int)


# ============================================================
# Model
# ============================================================

model = GradientBoostingClassifier(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=3,
    random_state=42,
)


# ============================================================
# 5-Fold Stratified Cross Validation
# ============================================================

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42,
)


print("=" * 60)
print("DIABETES 5-FOLD CROSS-VALIDATION")
print("=" * 60)

scores = cross_val_score(
    model,
    X,
    y,
    cv=cv,
    scoring="accuracy",
    n_jobs=-1,
)


# ============================================================
# Results
# ============================================================

print("\nFold Results:")

for i, score in enumerate(scores, start=1):
    print(
        f"Fold {i}: {score * 100:.2f}%"
    )


print("\n" + "-" * 60)

print(
    f"Mean Accuracy: "
    f"{np.mean(scores) * 100:.2f}%"
)

print(
    f"Standard Deviation: "
    f"{np.std(scores) * 100:.2f}%"
)

print("-" * 60)