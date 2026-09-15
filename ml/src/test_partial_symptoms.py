from app.ai.predict import predict_disease


test_cases = [
    ["high_fever"],
    ["cough"],
    ["headache"],
    ["fatigue"],
    ["high_fever", "cough"],
    ["high_fever", "headache"],
    ["cough", "fatigue"],
    ["high_fever", "cough", "fatigue"],
    ["high_fever", "cough", "fatigue", "headache"],
]


print("=" * 60)
print("PARTIAL SYMPTOM TEST")
print("=" * 60)


for symptoms in test_cases:

    disease, confidence = predict_disease(symptoms)

    print("\nSymptoms:", symptoms)
    print("Prediction:", disease)
    print(f"Confidence: {confidence:.2f}%")