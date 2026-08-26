from app.prediction_service import (
    predict_disease,
    predict_top_conditions
)


symptoms = [
    "stomach_pain",
    "acidity",
    "ulcers_on_tongue",
    "vomiting",
    "cough"
]


print("Single prediction:")

predicted_disease = predict_disease(
    symptoms
)

print(predicted_disease)


print("\nTop 3 possible conditions:")

top_conditions = predict_top_conditions(
    symptoms
)


for index, result in enumerate(
    top_conditions,
    start=1
):

    print(
        f"\n{index}. "
        f"{result['condition']}"
    )

    print(
        f"Model score: "
        f"{result['model_score']}%"
    )

    print(
        f"Description: "
        f"{result['description']}"
    )

    print("Precautions:")

    for precaution in result["precautions"]:

        print(
            f"  - {precaution}"
        )