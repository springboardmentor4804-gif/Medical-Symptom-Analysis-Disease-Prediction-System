"""
Quick helper script to view all records inside MongoDB (`medassist` database).

Usage:
  python view_mongo_db.py
"""

import os
import asyncio
import json
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load variables from .env file if present
load_dotenv()

MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb+srv://Jayanitha_S:jayan%40mo@cluster0.v9ibxko.mongodb.net/?appName=Cluster0",
)
DB_NAME = os.getenv("MONGO_DB_NAME", "medassist")

async def main():
    print("=" * 60)
    print(f" Connecting to MongoDB: {MONGO_URL} (Database: {DB_NAME})")
    print("=" * 60)
    
    import certifi

    # 5 second timeout so it fails fast if connection or IP whitelist is blocked
    client = AsyncIOMotorClient(
        MONGO_URL,
        serverSelectionTimeoutMS=5000,
        tlsCAFile=certifi.where(),
    )
    db = client[DB_NAME]

    try:
        await client.admin.command("ping")
        print("[OK] Connected to MongoDB!\n")
    except Exception as e:
        print("[!] Could not connect to MongoDB on localhost:27017.")
        print("    Reason:", str(e))
        print("\n[NOTE] Make sure MongoDB service is started, or MongoDB Compass / Docker container is running.")
        return

    collections = ["users", "patients", "symptoms", "user_inputs"]

    for col in collections:
        print("-" * 60)
        print(f"Collection: [{col}]")
        print("-" * 60)
        docs = await db[col].find({}).to_list(length=100)
        if not docs:
            print("   (empty - no documents stored yet)")
        else:
            for i, doc in enumerate(docs, 1):
                doc.pop("_id", None)
                print(f"   [{i}] {json.dumps(doc, default=str)}")
        print()

if __name__ == "__main__":
    asyncio.run(main())

