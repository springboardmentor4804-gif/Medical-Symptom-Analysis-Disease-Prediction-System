import joblib

mlb = joblib.load(
    r"D:\MedAssist_AI\ml\models\mlb.pkl"
)

print("=" * 60)
print("MLB SYMPTOM VOCABULARY")
print("=" * 60)

print("Total symptoms:", len(mlb.classes_))

print("\nChecking required symptoms:")

test_symptoms = [
    "fever",
    "cough",
    "fatigue",
    "headache",
    "itching",
    "skin_rash",
]

for symptom in test_symptoms:
    if symptom in mlb.classes_:
        print(f"✅ {symptom}")
    else:
        print(f"❌ {symptom}")

print("\nAll symptoms containing 'fever':")

for symptom in mlb.classes_:
    if "fever" in symptom:
        print(repr(symptom))