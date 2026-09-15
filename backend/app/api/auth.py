from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import User
from app.schemas.auth import RegisterIn,LoginIn,UserOut,Token
from app.core.security import hash_password,verify_password,create_token,current_user
router=APIRouter(prefix='/api/auth',tags=['Authentication'])
@router.post('/register',response_model=UserOut)
def register(x:RegisterIn,db:Session=Depends(get_db)):
    role=x.role.lower()
    if role not in ('patient','doctor'): raise HTTPException(400,'Role must be patient or doctor')
    if db.query(User).filter(User.email==x.email).first(): raise HTTPException(409,'Email already registered')
    u=User(full_name=x.full_name,email=x.email,password_hash=hash_password(x.password),role=role); db.add(u); db.commit(); db.refresh(u); return u
@router.post('/login',response_model=Token)
def login(x:LoginIn,db:Session=Depends(get_db)):
    u=db.query(User).filter(User.email==x.email).first()
    if not u or not verify_password(x.password,u.password_hash): raise HTTPException(401,'Invalid email or password')
    return Token(access_token=create_token(u.id))
@router.get('/me',response_model=UserOut)
def me(user=Depends(current_user)): return user
