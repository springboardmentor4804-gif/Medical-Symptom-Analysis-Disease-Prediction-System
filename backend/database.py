import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env vars
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("Error: MONGO_URI environment variable is not set.")
    sys.exit(1)

try:
    # Initialize MongoClient
    client = MongoClient(MONGO_URI)
    
    # Extract database name from URI, default to 'medassist' if not specified
    # Typical URI: mongodb://.../dbname?options
    db_name = "medassist"
    
    # Simple parsing to check if a database name is specified in URI
    # Ignore protocol prefix 'mongodb://' or 'mongodb+srv://'
    clean_uri = MONGO_URI.split("://")[-1]
    path_part = clean_uri.split("/")[-1]
    possible_db = path_part.split("?")[0]
    if possible_db:
        db_name = possible_db
        
    db = client[db_name]
    print(f"MongoDB Connected to database: {db_name}")
except Exception as e:
    print(f"MongoDB Connection Error: {e}")
    sys.exit(1)

def get_db():
    return db
