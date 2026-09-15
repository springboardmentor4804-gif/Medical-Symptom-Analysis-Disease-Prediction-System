RULES={
 'Flu':{'fever','cough','fatigue','body ache','headache'},
 'Common Cold':{'cough','sore throat','runny nose','sneezing'},
 'Migraine':{'headache','nausea','light sensitivity','dizziness'},
 'Gastroenteritis':{'nausea','vomiting','diarrhea','abdominal pain'},
 'Asthma-like respiratory symptoms':{'wheezing','shortness of breath','chest tightness','cough'}
}
def analyze(symptoms,age):
    s={x.strip().lower() for x in symptoms}; scores={d:len(s & r) for d,r in RULES.items()}
    disease=max(scores,key=scores.get)
    if scores[disease]==0: disease='Unspecified symptom pattern'
    confidence=round(min(0.95,0.45+0.15*scores.get(disease,0)),2)
    emergency={'chest pain','severe shortness of breath','fainting','severe bleeding'} & s
    risk='High' if emergency else ('Moderate' if age>=65 or len(s)>=4 else 'Low')
    rec='Seek urgent medical care for severe or rapidly worsening symptoms.' if emergency else 'Monitor symptoms, rest, hydrate, and consult a qualified clinician if symptoms persist or worsen.'
    return disease,confidence,risk,rec
