from app.ai.recommendation_engine import (
    generate_recommendations
)


print("=" * 60)
print("MEDASSIST AI - RECOMMENDATION ENGINE TEST")
print("=" * 60)


# ============================================================
# LOW RISK
# ============================================================

result = generate_recommendations(
    disease="Bronchial Asthma",
    symptoms=[
        "cough",
        "fatigue"
    ],
    risk_level="Low",
    severity_level="Mild",
)

print("\nLOW-RISK EXAMPLE")
print("-" * 40)

print("Disease:", result["disease"])
print("Risk Level:", result["risk_level"])
print("Severity Level:", result["severity_level"])

print("\nTreatment Suggestions:")
for item in result["treatment_suggestions"]:
    print("-", item)

print("\nPreventive Advice:")
for item in result["preventive_advice"]:
    print("-", item)

print("\nLifestyle Advice:")
for item in result["lifestyle_advice"]:
    print("-", item)

print("\nWarning Signs:")
for item in result["warning_signs"]:
    print("-", item)

print("\nAdvisory:")
print(result["advisory"])


# ============================================================
# HIGH / CRITICAL RISK
# ============================================================

result = generate_recommendations(
    disease="Bronchial Asthma",
    symptoms=[
        "high_fever",
        "difficulty_breathing",
        "chest_pain"
    ],
    risk_level="Critical",
    severity_level="Severe",
)

print("\n\nCRITICAL-RISK EXAMPLE")
print("-" * 40)

print("Disease:", result["disease"])
print("Risk Level:", result["risk_level"])
print("Severity Level:", result["severity_level"])

print("\nTreatment Suggestions:")
for item in result["treatment_suggestions"]:
    print("-", item)

print("\nPreventive Advice:")
for item in result["preventive_advice"]:
    print("-", item)

print("\nLifestyle Advice:")
for item in result["lifestyle_advice"]:
    print("-", item)

print("\nWarning Signs:")
for item in result["warning_signs"]:
    print("-", item)

print("\nAdvisory:")
print(result["advisory"])


print("\n")
print("=" * 60)
print("RECOMMENDATION ENGINE TEST COMPLETE")
print("=" * 60)