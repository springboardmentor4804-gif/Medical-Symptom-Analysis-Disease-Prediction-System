from app.ai.risk_engine import calculate_risk


print("=" * 60)
print("MEDASSIST AI - RISK ENGINE TEST")
print("=" * 60)


tests = [
    {
        "name": "Low-risk example",
        "symptoms": [
            "cough",
            "fatigue",
        ],
        "confidence": 36,
    },
    {
        "name": "Moderate-risk example",
        "symptoms": [
            "high_fever",
            "cough",
            "fatigue",
        ],
        "confidence": 65,
    },
    {
        "name": "High-risk example",
        "symptoms": [
            "high_fever",
            "difficulty_breathing",
            "chest_pain",
        ],
        "confidence": 75,
    },
    {
        "name": "Critical-risk example",
        "symptoms": [
            "difficulty_breathing",
            "chest_pain",
            "loss_of_consciousness",
        ],
        "confidence": 90,
    },
]


for test in tests:

    result = calculate_risk(
        symptoms=test["symptoms"],
        confidence=test["confidence"],
    )

    print()
    print("-" * 60)
    print(test["name"])
    print("Symptoms:", test["symptoms"])
    print("Confidence:", test["confidence"], "%")
    print("Risk Score:", result["risk_score"])
    print("Risk Level:", result["risk_level"])
    print("Risk Factors:", result["risk_factors"])


print()
print("=" * 60)
print("RISK ENGINE TEST COMPLETED")
print("=" * 60)