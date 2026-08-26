from database import get_database_connection


def create_patient_profiles_table():
    connection = get_database_connection()
    cursor = connection.cursor()

    create_table_query = """
    CREATE TABLE IF NOT EXISTS patient_profiles (
        id SERIAL PRIMARY KEY,

        user_id INTEGER UNIQUE NOT NULL,

        date_of_birth DATE,
        gender VARCHAR(20),
        phone VARCHAR(20),
        blood_group VARCHAR(10),

        height_cm NUMERIC(5, 2),
        weight_kg NUMERIC(5, 2),

        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_patient_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );
    """

    cursor.execute(create_table_query)

    connection.commit()

    cursor.close()
    connection.close()

    print("Patient profiles table created successfully!")


create_patient_profiles_table()


@router.get("/profile")
def get_patient_profile(
    current_user: dict = Depends(get_current_user)
):
    connection = get_database_connection()
    cursor = connection.cursor()

    user_id = int(current_user["user_id"])

    cursor.execute(
        """
        SELECT
            id,
            user_id,
            date_of_birth,
            gender,
            phone,
            blood_group,
            height_cm,
            weight_kg,
            emergency_contact_name,
            emergency_contact_phone,
            created_at,
            updated_at
        FROM patient_profiles
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
            detail="Patient profile not found"
        )

    return {
        "id": profile[0],
        "user_id": profile[1],
        "date_of_birth": profile[2],
        "gender": profile[3],
        "phone": profile[4],
        "blood_group": profile[5],
        "height_cm": float(profile[6]),
        "weight_kg": float(profile[7]),
        "emergency_contact_name": profile[8],
        "emergency_contact_phone": profile[9],
        "created_at": profile[10],
        "updated_at": profile[11]
    }