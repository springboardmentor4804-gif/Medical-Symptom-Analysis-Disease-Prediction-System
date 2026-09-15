import joblib

mlb = joblib.load(
    r"D:\MedAssist_AI\ml\models\mlb.pkl"
)

print("=" * 60)
print("MEDASSIST-AI ML SYMPTOM VOCABULARY")
print("=" * 60)

print("Total symptoms:", len(mlb.classes_))

for i, symptom in enumerate(mlb.classes_, start=1):
    print(f"{i:3}. {symptom}")