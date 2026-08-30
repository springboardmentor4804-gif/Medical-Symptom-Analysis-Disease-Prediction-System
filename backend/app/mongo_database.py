"""
MongoDB async connection for MedAssist AI.
Uses `motor` (async MongoDB driver) so it integrates cleanly with FastAPI's async lifecycle.

Database : medassist
Collections:
  - users       → mirrored user registration data
  - patients    → mirrored patient profile data
  - symptoms    → mirrored symptom submissions
  - user_inputs → generic log of every form submission
"""

import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure

# Load variables from .env file if present
load_dotenv()

# ------------------------------------------------------------------
# Connection string — defaults to local MongoDB or Atlas.
# Override with MONGO_URL environment variable for Atlas / remote.
# ------------------------------------------------------------------
MONGO_URL: str = os.getenv(
    "MONGO_URL",
    "mongodb+srv://Jayanitha_S:jayan%40mo@cluster0.v9ibxko.mongodb.net/?appName=Cluster0",
)
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "medassist")

# Module-level client (initialised once at app startup)
_mongo_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    """Return the shared motor client (must be called after startup)."""
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=3000)
    return _mongo_client


def get_mongo_db():
    """Return the `medassist` database handle."""
    return get_mongo_client()[MONGO_DB_NAME]


# ── Convenience collection accessors ──────────────────────────────

def users_collection():
    return get_mongo_db()["users"]


def patients_collection():
    return get_mongo_db()["patients"]


def symptoms_collection():
    return get_mongo_db()["symptoms"]


def user_inputs_collection():
    """Generic log collection — every form submission is also recorded here."""
    return get_mongo_db()["user_inputs"]


# ── Startup / shutdown helpers called from main.py ─────────────────

async def connect_mongo():
    """Verify the MongoDB connection is alive at app startup."""
    client = get_mongo_client()
    try:
        # The `ping` command is lightweight and does not require auth
        await asyncio.wait_for(client.admin.command("ping"), timeout=3.0)
        print(f"[MongoDB] [OK] Connected to '{MONGO_DB_NAME}' at {MONGO_URL}")
    except (ConnectionFailure, asyncio.TimeoutError) as exc:
        # We log the error but do NOT crash the app —
        # the existing SQLite/Postgres path still works without Mongo.
        print(f"[MongoDB] [WARN] Could not connect or timed out: {exc}")
    except Exception as exc:
        print(f"[MongoDB] [WARN] Unexpected error during startup ping: {exc}")


async def close_mongo():
    """Close the motor client gracefully at app shutdown."""
    global _mongo_client
    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None
        print("[MongoDB] [CLOSED] Connection closed.")
