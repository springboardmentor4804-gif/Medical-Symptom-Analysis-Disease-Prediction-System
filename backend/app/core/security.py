from datetime import datetime,timedelta,timezone
from jose import jwt,JWTError
from passlib.context import CryptContext
from fastapi import Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import SECRET_KEY,ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.session import get_db
from app.models import User
pwd=CryptContext(schemes=['bcrypt'],deprecated='auto')
oauth2=OAuth2PasswordBearer(tokenUrl='/api/auth/login')
def hash_password(p): return pwd.hash(p)
def verify_password(p,h): return pwd.verify(p,h)
def create_token(user_id):
    exp=datetime.now(timezone.utc)+timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({'sub':str(user_id),'exp':exp},SECRET_KEY,algorithm='HS256')
def current_user(token:str=Depends(oauth2),db:Session=Depends(get_db)):
    try: uid=int(jwt.decode(token,SECRET_KEY,algorithms=['HS256'])['sub'])
    except (JWTError,ValueError,KeyError): raise HTTPException(status_code=401,detail='Invalid or expired token')
    user=db.get(User,uid)
    if not user: raise HTTPException(status_code=401,detail='User not found')
    return user
def require_role(role):
    def dep(user=Depends(current_user)):
        if user.role!=role: raise HTTPException(status_code=403,detail=f'{role.title()} access required')
        return user
    return dep
