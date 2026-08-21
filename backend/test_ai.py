from app.ai.predict import predict_disease


result = predict_disease([
    "high_fever",
    "cough",
    "fatigue",
    "headache"
])


print(result)