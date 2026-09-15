from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import User,Prediction
from app.core.security import require_role
router=APIRouter(prefix='/api/doctor',tags=['Doctor'])
@router.get('/patients')
def patients(user=Depends(require_role('doctor')),db:Session=Depends(get_db)):
    users=db.query(User).filter(User.role=='patient').all(); return [{'id':u.id,'full_name':u.full_name,'email':u.email} for u in users]
