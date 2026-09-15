from pydantic import BaseModel, EmailStr, Field
class RegisterIn(BaseModel):
    full_name:str=Field(min_length=2,max_length=120)
    email:EmailStr
    password:str=Field(min_length=8,max_length=128)
    role:str
class LoginIn(BaseModel):
    email:EmailStr
    password:str
class UserOut(BaseModel):
    id:int; full_name:str; email:EmailStr; role:str
    model_config={'from_attributes':True}
class Token(BaseModel): access_token:str; token_type:str='bearer'
