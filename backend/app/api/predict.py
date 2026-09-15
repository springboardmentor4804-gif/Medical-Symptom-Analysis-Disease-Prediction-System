from fastapi import APIRouter,Depends,HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Prediction
from app.schemas.predict import PredictionIn,PredictionOut
from app.core.security import current_user
from app.services.predictor import analyze
from datetime import datetime
router=APIRouter(prefix='/api',tags=['Disease Prediction'])
@router.post('/predict',response_model=PredictionOut)
def predict(x:PredictionIn,user=Depends(current_user),db:Session=Depends(get_db)):
    d,c,r,rec=analyze(x.symptoms,x.age); p=Prediction(user_id=user.id,symptoms=', '.join(x.symptoms),disease=d,confidence=c,risk_level=r,recommendation=rec); db.add(p); db.commit(); db.refresh(p)
    return PredictionOut(id=p.id,disease=d,confidence=c,risk_level=r,recommendation=rec,symptoms=x.symptoms,created_at=p.created_at.isoformat())
@router.get('/predict/history',response_model=list[PredictionOut])
def history(user=Depends(current_user),db:Session=Depends(get_db)):
    rows=db.query(Prediction).filter(Prediction.user_id==user.id).order_by(Prediction.created_at.desc()).all()
    return [PredictionOut(id=p.id,disease=p.disease,confidence=p.confidence,risk_level=p.risk_level,recommendation=p.recommendation,symptoms=[x.strip() for x in p.symptoms.split(',')],created_at=p.created_at.isoformat()) for p in rows]
