# =============================================================
# Treatment suggestions for all 41 diseases in the ML model.
# Each disease maps to treatment categories, suggestions,
# dietary advice, and when to consult a doctor.
# =============================================================

TREATMENT_DATA = {

    "(vertigo) Paroymsal Positional Vertigo": {
        "category": "Neurological",
        "suggestions": [
            "Perform Epley manoeuvre exercises as guided by a physiotherapist.",
            "Avoid sudden head movements and position changes.",
            "Sleep with your head slightly elevated.",
            "Stay hydrated and avoid caffeine."
        ],
        "dietary_advice": "Reduce salt intake to lower fluid retention in the inner ear.",
        "when_to_see_doctor": "If vertigo lasts more than a few days or is accompanied by hearing loss."
    },

    "AIDS": {
        "category": "Immunological",
        "suggestions": [
            "Seek immediate medical consultation for antiretroviral therapy (ART).",
            "Maintain a strict medication schedule as prescribed.",
            "Practise safe hygiene to prevent opportunistic infections.",
            "Get regular CD4 count and viral load monitoring."
        ],
        "dietary_advice": "Eat a high-protein, nutrient-rich diet to support immune function.",
        "when_to_see_doctor": "Immediately — AIDS requires ongoing specialist care."
    },

    "Acne": {
        "category": "Dermatological",
        "suggestions": [
            "Wash your face twice daily with a gentle cleanser.",
            "Avoid touching or picking at acne lesions.",
            "Use non-comedogenic moisturisers and sunscreen.",
            "Consider over-the-counter benzoyl peroxide or salicylic acid products."
        ],
        "dietary_advice": "Limit dairy and high-glycaemic foods; increase fruits and vegetables.",
        "when_to_see_doctor": "If acne is severe, cystic, or does not improve with OTC treatments."
    },

    "Alcoholic hepatitis": {
        "category": "Hepatological",
        "suggestions": [
            "Stop alcohol consumption completely.",
            "Follow a liver-friendly diet as recommended by your doctor.",
            "Take prescribed medications (corticosteroids if advised).",
            "Get regular liver function tests."
        ],
        "dietary_advice": "High-calorie, high-protein diet; avoid processed foods and alcohol.",
        "when_to_see_doctor": "Immediately if experiencing jaundice, abdominal swelling, or confusion."
    },

    "Allergy": {
        "category": "Immunological",
        "suggestions": [
            "Identify and avoid known allergens.",
            "Take antihistamines as recommended for symptom relief.",
            "Keep an allergy action plan and carry emergency medication if prescribed.",
            "Use air purifiers indoors and keep windows closed during high-pollen days."
        ],
        "dietary_advice": "Avoid known food allergens; eat anti-inflammatory foods like omega-3 rich fish.",
        "when_to_see_doctor": "If experiencing severe reactions, breathing difficulty, or anaphylaxis."
    },

    "Arthritis": {
        "category": "Musculoskeletal",
        "suggestions": [
            "Engage in low-impact exercises like swimming or walking.",
            "Apply hot or cold compresses to affected joints.",
            "Maintain a healthy weight to reduce joint stress.",
            "Take prescribed anti-inflammatory medications."
        ],
        "dietary_advice": "Anti-inflammatory diet rich in omega-3, turmeric, ginger, and leafy greens.",
        "when_to_see_doctor": "If joint pain worsens, limits daily activities, or joints become swollen."
    },

    "Bronchial Asthma": {
        "category": "Respiratory",
        "suggestions": [
            "Use prescribed inhalers (reliever and preventer) as directed.",
            "Avoid triggers such as dust, smoke, pollen, and cold air.",
            "Monitor peak flow readings regularly.",
            "Have an asthma action plan ready for emergencies."
        ],
        "dietary_advice": "Eat fruits rich in vitamin C; avoid sulphite-containing foods.",
        "when_to_see_doctor": "If attacks become more frequent or reliever inhaler is needed more often."
    },

    "Cervical spondylosis": {
        "category": "Musculoskeletal",
        "suggestions": [
            "Practise neck stretching and strengthening exercises.",
            "Maintain proper posture while sitting and working.",
            "Use an ergonomic pillow for sleeping.",
            "Apply warm compresses to the neck area."
        ],
        "dietary_advice": "Include calcium and vitamin D rich foods for bone health.",
        "when_to_see_doctor": "If numbness, tingling in arms, or difficulty walking develops."
    },

    "Chicken pox": {
        "category": "Infectious",
        "suggestions": [
            "Rest and stay isolated to prevent spreading the virus.",
            "Use calamine lotion to relieve itching.",
            "Keep nails short and avoid scratching blisters.",
            "Take prescribed antiviral medication if recommended."
        ],
        "dietary_advice": "Stay hydrated; eat soft, bland foods; avoid spicy or acidic foods.",
        "when_to_see_doctor": "If fever is very high, rash spreads to eyes, or breathing difficulty occurs."
    },

    "Chronic cholestasis": {
        "category": "Hepatological",
        "suggestions": [
            "Follow prescribed medication for bile flow improvement.",
            "Avoid alcohol and hepatotoxic substances.",
            "Get regular liver function monitoring.",
            "Take fat-soluble vitamin supplements if recommended."
        ],
        "dietary_advice": "Low-fat diet with adequate protein; increase fibre intake.",
        "when_to_see_doctor": "If jaundice worsens, severe itching persists, or dark urine develops."
    },

    "Common Cold": {
        "category": "Respiratory",
        "suggestions": [
            "Rest adequately and stay hydrated.",
            "Use saline nasal spray to relieve congestion.",
            "Gargle with warm salt water for sore throat.",
            "Take over-the-counter cold relief medication as needed."
        ],
        "dietary_advice": "Drink warm fluids like soups and herbal teas; eat citrus fruits for vitamin C.",
        "when_to_see_doctor": "If symptoms last more than 10 days or are accompanied by high fever."
    },

    "Dengue": {
        "category": "Infectious",
        "suggestions": [
            "Rest completely and drink plenty of fluids.",
            "Take paracetamol for fever — avoid aspirin and ibuprofen.",
            "Monitor platelet count regularly.",
            "Use mosquito nets and repellents to prevent further bites."
        ],
        "dietary_advice": "Stay hydrated with ORS, coconut water, and fresh juices; eat papaya leaf extract.",
        "when_to_see_doctor": "Immediately if bleeding, severe abdominal pain, or persistent vomiting occurs."
    },

    "Diabetes": {
        "category": "Metabolic",
        "suggestions": [
            "Monitor blood sugar levels regularly.",
            "Take prescribed medication or insulin as directed.",
            "Exercise for at least 30 minutes daily.",
            "Manage stress through relaxation techniques."
        ],
        "dietary_advice": "Low-glycaemic diet; reduce refined sugar; eat whole grains, vegetables, and lean protein.",
        "when_to_see_doctor": "If blood sugar is consistently too high or too low, or if you feel dizzy or confused."
    },

    "Dimorphic hemmorhoids(piles)": {
        "category": "Gastrointestinal",
        "suggestions": [
            "Increase dietary fibre to prevent constipation.",
            "Take warm sitz baths for 15-20 minutes.",
            "Avoid straining during bowel movements.",
            "Use prescribed topical creams for pain relief."
        ],
        "dietary_advice": "High-fibre diet with plenty of water; eat fruits, vegetables, and whole grains.",
        "when_to_see_doctor": "If bleeding is heavy, pain is severe, or a lump does not reduce."
    },

    "Drug Reaction": {
        "category": "Immunological",
        "suggestions": [
            "Stop the suspected medication immediately and inform your doctor.",
            "Take antihistamines for mild reactions.",
            "Document the drug and reaction for future medical records.",
            "Wear a medical alert bracelet if you have known drug allergies."
        ],
        "dietary_advice": "Eat light, easily digestible foods while recovering.",
        "when_to_see_doctor": "Immediately if experiencing swelling, breathing difficulty, or widespread rash."
    },

    "Fungal infection": {
        "category": "Dermatological",
        "suggestions": [
            "Keep affected areas clean and dry.",
            "Use prescribed antifungal creams or oral medication.",
            "Wear breathable fabrics and loose clothing.",
            "Avoid sharing personal items like towels."
        ],
        "dietary_advice": "Reduce sugar intake; eat probiotic-rich foods like yoghurt.",
        "when_to_see_doctor": "If infection spreads, does not improve with treatment, or recurs frequently."
    },

    "GERD": {
        "category": "Gastrointestinal",
        "suggestions": [
            "Avoid lying down immediately after eating.",
            "Elevate the head of your bed by 6-8 inches.",
            "Take prescribed antacids or proton pump inhibitors.",
            "Eat smaller, more frequent meals."
        ],
        "dietary_advice": "Avoid spicy, acidic, and fatty foods; limit caffeine and alcohol.",
        "when_to_see_doctor": "If heartburn is persistent, causes difficulty swallowing, or leads to weight loss."
    },

    "Gastroenteritis": {
        "category": "Gastrointestinal",
        "suggestions": [
            "Stay hydrated with ORS, clear broths, and water.",
            "Rest and avoid solid foods until vomiting stops.",
            "Gradually reintroduce bland foods (BRAT diet).",
            "Wash hands frequently to prevent spread."
        ],
        "dietary_advice": "BRAT diet (bananas, rice, applesauce, toast); avoid dairy and fatty foods.",
        "when_to_see_doctor": "If dehydration signs appear, blood in stool, or fever exceeds 39°C."
    },

    "Heart attack": {
        "category": "Cardiovascular",
        "suggestions": [
            "Call emergency services immediately — every minute counts.",
            "Chew an aspirin if not allergic and advised by a doctor.",
            "Follow cardiac rehabilitation after treatment.",
            "Take prescribed heart medications strictly."
        ],
        "dietary_advice": "Heart-healthy diet: low sodium, low cholesterol, rich in fruits, vegetables, and whole grains.",
        "when_to_see_doctor": "Immediately — chest pain, shortness of breath, or arm pain require emergency care."
    },

    "Hepatitis B": {
        "category": "Hepatological",
        "suggestions": [
            "Follow antiviral therapy as prescribed by your doctor.",
            "Avoid alcohol completely.",
            "Get regular liver function and viral load tests.",
            "Practise safe hygiene and avoid sharing needles or razors."
        ],
        "dietary_advice": "Balanced diet with lean proteins, whole grains, and plenty of vegetables.",
        "when_to_see_doctor": "If jaundice, severe fatigue, or abdominal swelling develops."
    },

    "Hepatitis C": {
        "category": "Hepatological",
        "suggestions": [
            "Follow direct-acting antiviral (DAA) therapy as prescribed.",
            "Avoid alcohol and hepatotoxic drugs.",
            "Get regular liver health monitoring.",
            "Inform close contacts and healthcare providers about your status."
        ],
        "dietary_advice": "Low-fat, balanced diet; avoid excessive iron-rich foods.",
        "when_to_see_doctor": "If fatigue worsens, jaundice appears, or unusual bleeding occurs."
    },

    "Hepatitis D": {
        "category": "Hepatological",
        "suggestions": [
            "Manage underlying Hepatitis B infection with antiviral therapy.",
            "Avoid alcohol and substances harmful to the liver.",
            "Get regular liver function tests.",
            "Consider interferon-alpha therapy if recommended."
        ],
        "dietary_advice": "Liver-supportive diet: lean proteins, whole grains, and antioxidant-rich fruits.",
        "when_to_see_doctor": "If liver disease symptoms worsen or new symptoms develop."
    },

    "Hepatitis E": {
        "category": "Hepatological",
        "suggestions": [
            "Rest and stay well hydrated.",
            "Avoid alcohol until fully recovered.",
            "Practise good sanitation and drink clean water.",
            "Most cases resolve on their own — supportive care is key."
        ],
        "dietary_advice": "Light, easily digestible meals; avoid fatty and fried foods.",
        "when_to_see_doctor": "If pregnant, as Hepatitis E can be severe during pregnancy."
    },

    "Hypertension": {
        "category": "Cardiovascular",
        "suggestions": [
            "Monitor blood pressure regularly at home.",
            "Take prescribed antihypertensive medication consistently.",
            "Reduce stress through meditation, yoga, or breathing exercises.",
            "Exercise for at least 30 minutes most days of the week."
        ],
        "dietary_advice": "DASH diet: low sodium, rich in potassium, fruits, vegetables, and whole grains.",
        "when_to_see_doctor": "If BP readings are consistently above 140/90 or if headaches and dizziness occur."
    },

    "Hyperthyroidism": {
        "category": "Endocrine",
        "suggestions": [
            "Take prescribed anti-thyroid medication regularly.",
            "Avoid excessive iodine-rich foods.",
            "Get regular thyroid function tests.",
            "Manage anxiety and heart palpitations with relaxation techniques."
        ],
        "dietary_advice": "Calcium and vitamin D rich foods; limit caffeine and iodine-heavy foods.",
        "when_to_see_doctor": "If heart rate is persistently rapid, weight loss is severe, or eye problems develop."
    },

    "Hypoglycemia": {
        "category": "Metabolic",
        "suggestions": [
            "Keep fast-acting sugar sources (glucose tablets, juice) readily available.",
            "Eat small, frequent meals to maintain blood sugar.",
            "Monitor blood sugar levels regularly.",
            "Inform family and friends about recognising and treating low blood sugar."
        ],
        "dietary_advice": "Complex carbohydrates with protein at each meal; avoid skipping meals.",
        "when_to_see_doctor": "If episodes are frequent, severe, or cause loss of consciousness."
    },

    "Hypothyroidism": {
        "category": "Endocrine",
        "suggestions": [
            "Take thyroid hormone replacement medication as prescribed.",
            "Take medication on an empty stomach, 30-60 minutes before food.",
            "Get regular TSH level monitoring.",
            "Exercise regularly to combat fatigue and weight gain."
        ],
        "dietary_advice": "Balanced diet with adequate iodine; limit soy and cruciferous vegetables in excess.",
        "when_to_see_doctor": "If fatigue worsens, significant weight changes, or depression develops."
    },

    "Impetigo": {
        "category": "Dermatological",
        "suggestions": [
            "Apply prescribed antibiotic ointment to affected areas.",
            "Keep sores clean and covered with bandages.",
            "Avoid touching or scratching sores.",
            "Wash hands frequently and do not share towels."
        ],
        "dietary_advice": "Eat a balanced diet to support immune function and healing.",
        "when_to_see_doctor": "If sores spread rapidly, fever develops, or sores do not improve with treatment."
    },

    "Jaundice": {
        "category": "Hepatological",
        "suggestions": [
            "Rest and allow the liver to recover.",
            "Stay well hydrated.",
            "Avoid alcohol and fatty foods.",
            "Follow prescribed treatment for the underlying cause."
        ],
        "dietary_advice": "Light, low-fat meals; drink fresh juices; eat boiled vegetables.",
        "when_to_see_doctor": "If jaundice is accompanied by severe pain, high fever, or confusion."
    },

    "Malaria": {
        "category": "Infectious",
        "suggestions": [
            "Complete the full course of prescribed antimalarial medication.",
            "Rest and stay hydrated.",
            "Use mosquito nets and insect repellent to prevent re-infection.",
            "Monitor for fever cycles and report any worsening symptoms."
        ],
        "dietary_advice": "High-calorie, high-protein diet; stay hydrated with ORS and fluids.",
        "when_to_see_doctor": "If high fever persists, confusion develops, or symptoms return after treatment."
    },

    "Migraine": {
        "category": "Neurological",
        "suggestions": [
            "Identify and avoid personal migraine triggers.",
            "Rest in a dark, quiet room during an attack.",
            "Take prescribed pain relief or triptans at the first sign of a migraine.",
            "Maintain a regular sleep schedule."
        ],
        "dietary_advice": "Avoid trigger foods (aged cheese, alcohol, MSG); stay hydrated.",
        "when_to_see_doctor": "If migraines increase in frequency, are unusually severe, or cause visual disturbances."
    },

    "Osteoarthristis": {
        "category": "Musculoskeletal",
        "suggestions": [
            "Engage in gentle, regular exercise like walking or cycling.",
            "Use hot or cold therapy on affected joints.",
            "Maintain a healthy weight to reduce joint stress.",
            "Consider physiotherapy for joint mobility improvement."
        ],
        "dietary_advice": "Anti-inflammatory foods: fish, nuts, olive oil, leafy greens.",
        "when_to_see_doctor": "If joint pain severely limits mobility or does not respond to pain relief."
    },

    "Paralysis (brain hemorrhage)": {
        "category": "Neurological",
        "suggestions": [
            "Seek emergency medical care immediately.",
            "Follow rehabilitation programmes including physiotherapy.",
            "Take prescribed medications to prevent recurrence.",
            "Adapt home environment for safety and accessibility."
        ],
        "dietary_advice": "Heart-healthy diet to manage BP and cholesterol; soft foods if swallowing is difficult.",
        "when_to_see_doctor": "Immediately — this is a medical emergency requiring urgent hospital care."
    },

    "Peptic ulcer diseae": {
        "category": "Gastrointestinal",
        "suggestions": [
            "Take prescribed proton pump inhibitors and antibiotics if H. pylori positive.",
            "Avoid NSAIDs (ibuprofen, aspirin) unless prescribed.",
            "Stop smoking and limit alcohol.",
            "Eat regular meals and avoid long gaps between eating."
        ],
        "dietary_advice": "Avoid spicy, acidic, and fried foods; eat bland, non-irritating meals.",
        "when_to_see_doctor": "If you experience vomiting blood, black stools, or severe abdominal pain."
    },

    "Pneumonia": {
        "category": "Respiratory",
        "suggestions": [
            "Complete the full course of prescribed antibiotics.",
            "Rest and drink plenty of fluids.",
            "Use a humidifier to ease breathing.",
            "Practise deep breathing exercises to clear lungs."
        ],
        "dietary_advice": "Warm soups, broths, and fluids; eat protein-rich foods for recovery.",
        "when_to_see_doctor": "If breathing difficulty worsens, chest pain occurs, or fever does not subside."
    },

    "Psoriasis": {
        "category": "Dermatological",
        "suggestions": [
            "Apply prescribed topical corticosteroids or vitamin D analogues.",
            "Moisturise skin regularly to reduce dryness and flaking.",
            "Avoid skin injuries and excessive sun exposure.",
            "Manage stress as it can trigger flare-ups."
        ],
        "dietary_advice": "Anti-inflammatory diet; include omega-3 fatty acids and avoid alcohol.",
        "when_to_see_doctor": "If psoriasis covers large areas, causes joint pain, or does not respond to treatment."
    },

    "Tuberculosis": {
        "category": "Infectious",
        "suggestions": [
            "Complete the full 6-9 month course of prescribed anti-TB drugs.",
            "Isolate during the infectious phase to prevent spreading.",
            "Cover mouth when coughing and dispose of tissues properly.",
            "Get regular sputum tests to monitor progress."
        ],
        "dietary_advice": "High-calorie, high-protein diet to support recovery; eat eggs, milk, and fresh vegetables.",
        "when_to_see_doctor": "If coughing blood, weight loss continues, or side effects from medication occur."
    },

    "Typhoid": {
        "category": "Infectious",
        "suggestions": [
            "Complete the full course of prescribed antibiotics.",
            "Rest and stay hydrated.",
            "Practise strict hand hygiene and food safety.",
            "Get stool tests to confirm clearance after treatment."
        ],
        "dietary_advice": "Soft, easily digestible foods; avoid raw vegetables and unboiled water.",
        "when_to_see_doctor": "If fever persists beyond 3-4 days of treatment or abdominal pain worsens."
    },

    "Urinary tract infection": {
        "category": "Urological",
        "suggestions": [
            "Complete the full course of prescribed antibiotics.",
            "Drink plenty of water to flush out bacteria.",
            "Urinate frequently and avoid holding urine.",
            "Practise good personal hygiene."
        ],
        "dietary_advice": "Drink cranberry juice; increase water intake; avoid caffeine and alcohol.",
        "when_to_see_doctor": "If symptoms do not improve within 2-3 days of treatment or blood is in urine."
    },

    "Varicose veins": {
        "category": "Cardiovascular",
        "suggestions": [
            "Elevate your legs when resting.",
            "Wear compression stockings as recommended.",
            "Exercise regularly — walking improves leg circulation.",
            "Avoid standing or sitting for prolonged periods."
        ],
        "dietary_advice": "High-fibre diet to prevent constipation; reduce sodium to prevent swelling.",
        "when_to_see_doctor": "If veins become painful, swollen, or skin ulcers develop near varicose veins."
    },

    "hepatitis A": {
        "category": "Hepatological",
        "suggestions": [
            "Rest and let the body recover naturally.",
            "Stay hydrated and avoid alcohol.",
            "Practise good hand hygiene and food safety.",
            "Get vaccinated to prevent future infection."
        ],
        "dietary_advice": "Light, low-fat meals; avoid fried and greasy foods; eat fresh fruits and vegetables.",
        "when_to_see_doctor": "If symptoms worsen, jaundice deepens, or dehydration occurs."
    },
}


def get_treatment_suggestions(disease_name):
    """
    Look up treatment suggestions for a given disease.
    Returns the treatment data dict or a generic fallback.
    """

    # Try exact match first
    if disease_name in TREATMENT_DATA:
        return TREATMENT_DATA[disease_name]

    # Try case-insensitive match
    disease_lower = disease_name.strip().lower()

    for key, value in TREATMENT_DATA.items():
        if key.strip().lower() == disease_lower:
            return value

    # Fallback for unknown diseases
    return {
        "category": "General",
        "suggestions": [
            "Consult a qualified healthcare professional for proper diagnosis.",
            "Maintain a balanced diet and stay hydrated.",
            "Get adequate rest and manage stress levels.",
            "Follow up with regular health checkups."
        ],
        "dietary_advice": "Eat a balanced, nutritious diet with plenty of water.",
        "when_to_see_doctor": "If symptoms persist, worsen, or new symptoms appear."
    }
