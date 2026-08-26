from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database import get_database_connection
from app.auth import require_caretaker


router = APIRouter(
    prefix="/caretaker",
    tags=["Caretaker"]
)


class CaretakerProfileCreate(BaseModel):

    phone: str

    profession: str

    organization: str | None = None

    years_of_experience: int | None = None

    specialization: str | None = None


@router.post("/profile")
def create_caretaker_profile(
    profile: CaretakerProfileCreate,
    current_user: dict = Depends(require_caretaker)
):

    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        SELECT id
        FROM caretaker_profiles
        WHERE user_id = %s
        """,
        (user_id,)
    )

    existing = cursor.fetchone()

    if existing:

        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Caretaker profile already exists"
        )

    cursor.execute(
        """
        INSERT INTO caretaker_profiles
        (
            user_id,
            phone,
            profession,
            organization,
            years_of_experience,
            specialization
        )

        VALUES
        (%s,%s,%s,%s,%s,%s)

        RETURNING id
        """,
        (
            user_id,
            profile.phone,
            profile.profession,
            profile.organization,
            profile.years_of_experience,
            profile.specialization
        )
    )

    profile_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()

    return {

        "message":"Caretaker profile created successfully",

        "profile_id":profile_id,

        "user_id":user_id

    }


@router.get("/profile")
def get_caretaker_profile(
    current_user: dict = Depends(require_caretaker)
):

    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        SELECT
            phone,
            profession,
            organization,
            years_of_experience,
            specialization
        FROM caretaker_profiles
        WHERE user_id = %s
        """,
        (user_id,)
    )

    profile = cursor.fetchone()

    cursor.close()
    connection.close()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Caretaker profile not found"
        )

    return {
        "phone": profile[0],
        "profession": profile[1],
        "organization": profile[2],
        "years_of_experience": profile[3],
        "specialization": profile[4]
    }


@router.put("/profile")
def update_caretaker_profile(
    profile: CaretakerProfileCreate,
    current_user: dict = Depends(require_caretaker)
):

    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        UPDATE caretaker_profiles

        SET
            phone = %s,
            profession = %s,
            organization = %s,
            years_of_experience = %s,
            specialization = %s

        WHERE user_id = %s

        RETURNING id
        """,
        (
            profile.phone,
            profile.profession,
            profile.organization,
            profile.years_of_experience,
            profile.specialization,
            user_id
        )
    )

    updated = cursor.fetchone()

    if not updated:

        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Caretaker profile not found"
        )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Caretaker profile updated successfully"
    }


@router.get("/list")
def get_all_caretakers():

    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT

            u.id,
            u.full_name,
            cp.profession,
            cp.organization,
            cp.specialization,
            cp.years_of_experience

        FROM users u

        INNER JOIN caretaker_profiles cp
            ON u.id = cp.user_id

        WHERE u.role = 'caretaker'

        ORDER BY u.full_name;
        """
    )

    caretakers = cursor.fetchall()

    cursor.close()
    connection.close()

    return [
        {
            "id": row[0],
            "full_name": row[1],
            "profession": row[2],
            "organization": row[3],
            "specialization": row[4],
            "years_of_experience": row[5]
        }
        for row in caretakers
    ]



@router.get("/patients")
def get_assigned_patients(

    current_user=Depends(require_caretaker)

):

    conn = get_database_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT

            u.id,

            u.full_name,

            u.email,

            pa.assigned_at

        FROM patient_assignments pa

        JOIN users u

            ON pa.patient_user_id=u.id

        WHERE

            pa.caretaker_user_id=%s

            AND pa.status='Active'

        ORDER BY u.full_name
        """,
        (current_user["user_id"],)
    )

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return [

        {

            "id": row[0],

            "full_name": row[1],

            "email": row[2],

            "assigned_at": row[3]

        }

        for row in rows

    ]



@router.get("/patients/{patient_user_id}")
def get_patient_details(
    patient_user_id: int,
    current_user=Depends(require_caretaker)
):
    conn = get_database_connection()
    cursor = conn.cursor()

    caretaker_user_id = int(current_user["user_id"])

    # -------------------------------------------------
    # 1. Verify that this patient is assigned
    #    to the logged-in caretaker
    # -------------------------------------------------

    cursor.execute(
        """
        SELECT id
        FROM patient_assignments
        WHERE patient_user_id = %s
        AND caretaker_user_id = %s
        AND status = 'Active'
        """,
        (
            patient_user_id,
            caretaker_user_id
        )
    )

    assignment = cursor.fetchone()

    if not assignment:
        cursor.close()
        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Patient is not assigned to this caretaker"
        )

    # -------------------------------------------------
    # 2. Get basic user information
    # -------------------------------------------------

    cursor.execute(
        """
        SELECT
            id,
            full_name,
            email
        FROM users
        WHERE id = %s
        AND role = 'patient'
        """,
        (patient_user_id,)
    )

    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # -------------------------------------------------
    # 3. Get patient profile
    # -------------------------------------------------

    cursor.execute(
        """
        SELECT
            date_of_birth,
            gender,
            phone,
            blood_group,
            height_cm,
            weight_kg,
            emergency_contact_name,
            emergency_contact_phone
        FROM patient_profiles
        WHERE user_id = %s
        """,
        (patient_user_id,)
    )

    profile = cursor.fetchone()

    # -------------------------------------------------
    # 4. Get symptoms
    # -------------------------------------------------

    cursor.execute(
    """
    SELECT
        symptom_name,
        severity,
        recorded_at
    FROM patient_symptoms
    WHERE user_id = %s
    ORDER BY recorded_at DESC
    """,
    (patient_user_id,)
)

    symptoms = cursor.fetchall()

    # -------------------------------------------------
    # 5. Get disease predictions
    # -------------------------------------------------

    cursor.execute(
        """
        SELECT
            predicted_disease,
            created_at
        FROM disease_predictions
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (patient_user_id,)
    )

    predictions = cursor.fetchall()

    cursor.close()
    conn.close()

    # -------------------------------------------------
    # 6. Build response
    # -------------------------------------------------

    return {
        "patient": {
            "id": user[0],
            "full_name": user[1],
            "email": user[2]
        },

        "profile": {
            "date_of_birth": profile[0] if profile else None,
            "gender": profile[1] if profile else None,
            "phone": profile[2] if profile else None,
            "blood_group": profile[3] if profile else None,
            "height_cm": profile[4] if profile else None,
            "weight_kg": profile[5] if profile else None,
            "emergency_contact_name": (
                profile[6] if profile else None
            ),
            "emergency_contact_phone": (
                profile[7] if profile else None
            )
        },

        "symptoms": [
            {
                "symptom_name": row[0],
                "severity": row[1],
                "created_at": row[2]
            }
            for row in symptoms
        ],

        "predictions": [
            {
                "predicted_disease": row[0],
                "created_at": row[1]
            }
            for row in predictions
        ]
    }