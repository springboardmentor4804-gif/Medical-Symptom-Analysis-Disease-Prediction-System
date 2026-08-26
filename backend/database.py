import sqlite3

# Connect to SQLite database
conn = sqlite3.connect("medassist.db", check_same_thread=False)

cursor = conn.cursor()

# Create Users table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
)
""")

conn.commit()
cursor.execute(
    """
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT,
        doctor_name TEXT,
        appointment_date TEXT,
        appointment_time TEXT,
        consultation_type TEXT,
        reason TEXT
    )
    """
)

conn.commit()
cursor.execute("""
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT,
    filename TEXT
)
""")

conn.commit()


# NEW TABLE FOR PREDICTION HISTORY
cursor.execute("""
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT,
    symptoms TEXT,
    predicted_disease TEXT,
    confidence REAL,
    risk_level TEXT
)
""")

conn.commit()

# ============================================================
# MEDICAL HISTORY TABLE
# ============================================================

cursor.execute("""
CREATE TABLE IF NOT EXISTS medical_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT UNIQUE NOT NULL,
    allergies TEXT,
    medications TEXT,
    previous_treatments TEXT
)
""")

conn.commit()