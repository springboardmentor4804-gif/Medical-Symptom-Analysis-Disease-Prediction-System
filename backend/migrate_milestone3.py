
import sqlite3
import os
from datetime import datetime


# =========================================
# DATABASE LOCATION
# =========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "medassist.db")


print("=========================================")
print("MedAssist AI - Milestone 3 Database Fix")
print("=========================================")
print(f"Database: {DATABASE_PATH}")
print()


# =========================================
# CONNECT TO DATABASE
# =========================================

connection = sqlite3.connect(DATABASE_PATH)
cursor = connection.cursor()


# =========================================
# CHECK PREDICTIONS TABLE
# =========================================

cursor.execute("PRAGMA table_info(predictions)")
columns = cursor.fetchall()

column_names = [column[1] for column in columns]

print("Existing prediction columns:")
for column in column_names:
    print(f" - {column}")

print()


# =========================================
# ADD RISK LEVEL COLUMN IF MISSING
# =========================================

if "risk_level" not in column_names:

    print("Adding risk_level column...")

    cursor.execute(
        """
        ALTER TABLE predictions
        ADD COLUMN risk_level TEXT
        """
    )

    print("risk_level column added.")

else:

    print("risk_level column already exists.")


# =========================================
# ADD RECOMMENDATION COLUMN IF MISSING
# =========================================

if "recommendation" not in column_names:

    print("Adding recommendation column...")

    cursor.execute(
        """
        ALTER TABLE predictions
        ADD COLUMN recommendation TEXT
        """
    )

    print("recommendation column added.")

else:

    print("recommendation column already exists.")


# =========================================
# ADD CREATED_AT COLUMN IF MISSING
# =========================================

if "created_at" not in column_names:

    print("Adding created_at column...")

    cursor.execute(
        """
        ALTER TABLE predictions
        ADD COLUMN created_at DATETIME
        """
    )

    print("created_at column added.")

else:

    print("created_at column already exists.")


# =========================================
# UPDATE EXISTING PREDICTIONS
# =========================================

print()
print("Updating existing prediction records...")


# Give old records a valid risk level
cursor.execute(
    """
    UPDATE predictions
    SET risk_level = 'Needs Review'
    WHERE risk_level IS NULL
       OR risk_level = ''
       OR risk_level = 'AI Prediction'
    """
)


# Give old records a recommendation if missing
cursor.execute(
    """
    UPDATE predictions
    SET recommendation =
        'This AI-generated prediction is for preliminary informational purposes only. Please consult a qualified healthcare professional for proper evaluation and treatment.'
    WHERE recommendation IS NULL
       OR recommendation = ''
    """
)


# Give old records a timestamp if missing
current_time = datetime.now().strftime(
    "%Y-%m-%d %H:%M:%S"
)

cursor.execute(
    """
    UPDATE predictions
    SET created_at = ?
    WHERE created_at IS NULL
       OR created_at = ''
    """,
    (current_time,)
)


# =========================================
# COMMIT CHANGES
# =========================================

connection.commit()


# =========================================
# SHOW UPDATED RECORDS
# =========================================

print()
print("Updated prediction records:")
print("-----------------------------------------")

cursor.execute(
    """
    SELECT
        id,
        patient_id,
        predicted_disease,
        confidence,
        risk_level,
        recommendation,
        created_at
    FROM predictions
    ORDER BY id
    """
)

records = cursor.fetchall()

for record in records:

    print(f"ID: {record[0]}")
    print(f"Patient ID: {record[1]}")
    print(f"Disease: {record[2]}")
    print(f"Confidence: {record[3]}")
    print(f"Risk Level: {record[4]}")
    print(f"Created At: {record[6]}")
    print("-----------------------------------------")


# =========================================
# CLOSE DATABASE
# =========================================

connection.close()


print()
print("=========================================")
print("Migration completed successfully.")
print("Your existing data has NOT been deleted.")
print("=========================================")

