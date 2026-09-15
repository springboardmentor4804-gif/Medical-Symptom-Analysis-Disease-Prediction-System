import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL=os.getenv('DATABASE_URL','postgresql+psycopg2://postgres:postgres@localhost:5432/medassist_ai')
SECRET_KEY=os.getenv('SECRET_KEY','dev-secret-change-me')
ACCESS_TOKEN_EXPIRE_MINUTES=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES','1440'))
