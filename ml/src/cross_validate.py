import pandas as pd
import numpy as np

from sklearn.preprocessing import MultiLabelBinarizer, LabelEncoder
from sklearn.model_selection import GroupKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


# ============================================================
# Load Dataset
# ============================================================

DATASET_PATH = r"D:\MedAssist_AI\datasets\dataset.csv"

df = pd.read_csv(DATASET_PATH)

print("=" * 60)
print("5-FOLD GROUPED CROSS-VALIDATION")
print("=" * 60)

print("Total rows:", len(df))


# ============================================================
# Clean Disease
# ============================================================

df["Disease"] = (
    df["Disease"]
    .astype(str)
    .str.strip()
)


# ============================================================
# Get Symptom Columns
# ============================================================

symptom_columns = [
    col
    for col in df.columns
    if col.startswith("Symptom")
]


# ============================================================
# Clean Symptoms
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
# Create Symptom Pattern Groups
# ============================================================

patterns = []

for symptoms in symptom_lists:

    pattern = "|".join(
        sorted(set(symptoms))
    )

    patterns.append(pattern)


df["pattern"] = patterns


print(
    "Unique symptom patterns:",
    df["pattern"].nunique()
)


# ============================================================
# Encode Disease
# ============================================================

label_encoder = LabelEncoder()

y = label_encoder.fit_transform(
    df["Disease"]
)


# ============================================================
# Prepare Groups
# ============================================================

groups = df["pattern"].values


# ============================================================
# 5-FOLD GROUPED CROSS VALIDATION
# ============================================================

group_kfold = GroupKFold(
    n_splits=5
)

fold_scores = []


for fold, (train_idx, test_idx) in enumerate(
    group_kfold.split(
        symptom_lists,
        y,
        groups
    ),
    start=1
):

    print("\n" + "=" * 60)
    print(f"FOLD {fold}")
    print("=" * 60)


    # --------------------------------------------------------
    # Split symptoms
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # Verify group separation
    # --------------------------------------------------------

    train_patterns = set(
        groups[train_idx]
    )

    test_patterns = set(
        groups[test_idx]
    )

    overlap = train_patterns.intersection(
        test_patterns
    )

    print(
        "Training rows:",
        len(train_idx)
    )

    print(
        "Testing rows:",
        len(test_idx)
    )

    print(
        "Training patterns:",
        len(train_patterns)
    )

    print(
        "Testing patterns:",
        len(test_patterns)
    )

    print(
        "Pattern overlap:",
        len(overlap)
    )


    # --------------------------------------------------------
    # Feature Engineering
    # --------------------------------------------------------

    mlb = MultiLabelBinarizer()

    X_train = mlb.fit_transform(
        symptoms_train
    )

    X_test = mlb.transform(
        symptoms_test
    )


    # --------------------------------------------------------
    # Train Model
    # --------------------------------------------------------

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        n_jobs=-1
    )

    model.fit(
        X_train,
        y_train
    )


    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    predictions = model.predict(
        X_test
    )


    # --------------------------------------------------------
    # Accuracy
    # --------------------------------------------------------

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    fold_scores.append(
        accuracy
    )

    print(
        f"Fold {fold} Accuracy: "
        f"{accuracy * 100:.2f}%"
    )


# ============================================================
# FINAL RESULTS
# ============================================================

print("\n" + "=" * 60)
print("FINAL CROSS-VALIDATION RESULTS")
print("=" * 60)


for i, score in enumerate(
    fold_scores,
    start=1
):

    print(
        f"Fold {i}: "
        f"{score * 100:.2f}%"
    )


mean_accuracy = np.mean(
    fold_scores
)

std_accuracy = np.std(
    fold_scores
)


print("\n" + "-" * 60)

print(
    f"Mean Accuracy: "
    f"{mean_accuracy * 100:.2f}%"
)

print(
    f"Standard Deviation: "
    f"{std_accuracy * 100:.2f}%"
)

print("-" * 60)

print("\nCross-validation completed successfully!")