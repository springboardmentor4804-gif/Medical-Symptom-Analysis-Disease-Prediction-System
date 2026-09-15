from fastapi import APIRouter
router=APIRouter(tags=['System'])
@router.get('/api/health')
def health(): return {'status':'ok','service':'MedAssist AI'}
@router.get('/api/symptoms')
def symptoms(): return {'symptoms':['Fever','Cough','Fatigue','Headache','Sore throat','Runny nose','Sneezing','Nausea','Vomiting','Diarrhea','Abdominal pain','Light sensitivity','Dizziness','Wheezing','Shortness of breath','Chest tightness','Chest pain','Severe bleeding','Fainting']}
