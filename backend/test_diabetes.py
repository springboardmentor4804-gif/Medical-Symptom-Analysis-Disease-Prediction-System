from app.ai.diabetes_predict import predict_diabetes


result = predict_diabetes({

    "HighBP": 1,
    "HighChol": 1,
    "CholCheck": 1,
    "BMI": 32,
    "Smoker": 1,
    "Stroke": 0,
    "HeartDiseaseorAttack": 0,
    "PhysActivity": 0,
    "Fruits": 0,
    "Veggies": 0,
    "HvyAlcoholConsump": 0,
    "AnyHealthcare": 1,
    "NoDocbcCost": 0,
    "GenHlth": 4,
    "MentHlth": 5,
    "PhysHlth": 10,
    "DiffWalk": 1,
    "Sex": 1,
    "Age": 9,
    "Education": 4,
    "Income": 5,
})


print(result)