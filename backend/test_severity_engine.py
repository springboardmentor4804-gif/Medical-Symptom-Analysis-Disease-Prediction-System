from app.ai.severity_engine import calculate_severity


print("=" * 60)
print("MEDASSIST AI - SEVERITY ENGINE TEST")
print("=" * 60)


tests = [
    {
        "name": "Minimal severity",
        "symptoms": [
            "cough",
        ],
    },
    {
        "name": "Mild severity",
        "symptoms": [
            "cough",
            "fatigue",
            "headache",
            "itching",
        ],
    },
    {
        "name": "Moderate severity",
        "symptoms": [
            "high_fever",
            "severe_headache",
            "dizziness",
        ],
    },
    {
        "name": "Severe severity",
        "symptoms": [
            "difficulty_breathing",
            "chest_pain",
            "high_fever",
        ],
    },
]


for test in tests:

    result = calculate_severity(
        symptoms=test["symptoms"]
    )

    print()
    print("-" * 60)

    print(
        test["name"]
    )

    print(
        "Symptoms:",
        test["symptoms"]
    )

    print(
        "Severity Score:",
        result["severity_score"]
    )

    print(
        "Severity Level:",
        result["severity_level"]
    )

    print(
        "Severity Factors:",
        result["severity_factors"]
    )


print()
print("=" * 60)
print("SEVERITY ENGINE TEST COMPLETED")
print("=" * 60)