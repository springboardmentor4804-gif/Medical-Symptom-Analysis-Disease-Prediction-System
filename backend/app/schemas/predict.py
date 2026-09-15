from pydantic import BaseModel, Field
class PredictionIn(BaseModel):
    symptoms:list[str]=Field(min_length=1)
    age:int=Field(default=30,ge=1,le=120)
class PredictionOut(BaseModel):
    id:int; disease:str; confidence:float; risk_level:str; recommendation:str; symptoms:list[str]; created_at:str
