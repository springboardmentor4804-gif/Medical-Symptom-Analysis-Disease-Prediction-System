import pandas as pd
import joblib

from pathlib import Path
from sklearn.preprocessing import MultiLabelBinarizer, LabelEncoder
from sklearn.model_selection import GroupShuffleSplit
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = BASE_DIR.parent.parent / "datasets" / "dataset.csv"

# Save this experiment separately
MODEL_DIR = BASE_DIR.parent / "models" / "grouped"

MODEL_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD DATASET
# ============================================================

df = pd.read_csv(DATASET_PATH)

print("=" * 60)
print("DATASET")
print("=" * 60)

print("Rows:", len(df))
print("Columns:", len(df.columns))


# ============================================================
# CLEAN DISEASE
# ============================================================

df["Disease"] = (
    df["Disease"]
    .astype(str)
    .str.strip()
)


# ============================================================
# SYMPTOM COLUMNS
# ============================================================

symptom_columns = [
    col for col in df.columns
    if col.startswith("Symptom")
]

print("Symptom columns:", len(symptom_columns))


# ============================================================
# CLEAN SYMPTOMS
# ============================================================

symptom_lists = []

for _, row in df.iterrows():

    symptoms = []

    for column in symptom_columns:

       value = str(row[column]).strip().lower()

    if value in ["", "none", "nan"]:
        continue

        symptoms.append(value)

    symptom_lists.append(symptoms)


# ============================================================
# CREATE UNIQUE SYMPTOM PATTERN
# ============================================================

groups = []

for symptoms in symptom_lists:

    pattern = "|".join(sorted(set(symptoms)))

    groups.append(pattern)

df["pattern"] = groups


print("\nUnique symptom patterns:", df["pattern"].nunique())


# ============================================================
# CHECK PATTERN → DISEASE CONSISTENCY
# ============================================================

pattern_disease_counts = (
    df.groupby("pattern")["Disease"]
    .nunique()
)

conflicting_patterns = (
    pattern_disease_counts > 1
).sum()

print(
    "Patterns shared by multiple diseases:",
    conflicting_patterns
)


if conflicting_patterns > 0:

    print(
        "\nWARNING:"
        " Some symptom patterns belong to multiple diseases."
    )

    print(
        "Grouped evaluation may be ambiguous."
    )


# ============================================================
# LABEL ENCODING
# ============================================================

label_encoder = LabelEncoder()

y = label_encoder.fit_transform(
    df["Disease"]
)


# ============================================================
# GROUPED TRAIN / TEST SPLIT
# ============================================================

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=42
)

train_idx, test_idx = next(
    splitter.split(
        symptom_lists,
        y,
        groups=df["pattern"]
    )
)


symptoms_train = [
    symptom_lists[i]
    for i in train_idx
]

symptoms_test = [
    symptom_lists[i]
    for i in test_idx
]

y_train = y[train_idx]
y_test = y[test_idx]

groups_train = df["pattern"].iloc[train_idx]
groups_test = df["pattern"].iloc[test_idx]


# ============================================================
# VERIFY NO PATTERN LEAKAGE
# ============================================================

train_patterns = set(groups_train)
test_patterns = set(groups_test)

overlap = train_patterns.intersection(
    test_patterns
)

print("\n" + "=" * 60)
print("GROUPED SPLIT")
print("=" * 60)

print("Training rows:", len(train_idx))
print("Testing rows:", len(test_idx))

print("Training patterns:", len(train_patterns))
print("Testing patterns:", len(test_patterns))

print(
    "Patterns appearing in BOTH:",
    len(overlap)
)


# ============================================================
# FEATURE ENGINEERING
# ============================================================

mlb = MultiLabelBinarizer()

X_train = mlb.fit_transform(
    symptoms_train
)

X_test = mlb.transform(
    symptoms_test
)


print("\nNumber of features:", len(mlb.classes_))


# ============================================================
# TRAIN RANDOM FOREST
# ============================================================

print("\n" + "=" * 60)
print("TRAINING RANDOM FOREST")
print("=" * 60)

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    n_jobs=-1
)

model.fit(
    X_train,
    y_train
)


# ============================================================
# TEST
# ============================================================

predictions = model.predict(
    X_test
)


# ============================================================
# ACCURACY
# ============================================================

accuracy = accuracy_score(
    y_test,
    predictions
)

print("\n" + "=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\nClassification Report\n")

print(
    classification_report(
        y_test,
        predictions,
        labels=sorted(set(y_test)),
        target_names=label_encoder.inverse_transform(
            sorted(set(y_test))
        ),
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\n" + "=" * 60)
print("CONFUSION MATRIX")
print("=" * 60)

cm = confusion_matrix(
    y_test,
    predictions,
    labels=sorted(set(y_test))
)

print(cm)


# ============================================================
# SAVE EXPERIMENT MODEL
# ============================================================

joblib.dump(
    model,
    MODEL_DIR / "model.pkl"
)

joblib.dump(
    label_encoder,
    MODEL_DIR / "label_encoder.pkl"
)

joblib.dump(
    mlb,
    MODEL_DIR / "mlb.pkl"
)


print("\n" + "=" * 60)
print("GROUPED MODEL SAVED")
print("=" * 60)

print(
    "Model:",
    MODEL_DIR / "model.pkl"
)

print(
    "Label Encoder:",
    MODEL_DIR / "label_encoder.pkl"
)

print(
    "MLB:",
    MODEL_DIR / "mlb.pkl"
)