from database import get_database_connection


def create_patient_symptoms_table():
    connection = get_database_connection()
    cursor = connection.cursor()

    create_table_query = """
    CREATE TABLE IF NOT EXISTS patient_symptoms (
        id SERIAL PRIMARY KEY,

        user_id INTEGER NOT NULL,

        symptom_name TEXT NOT NULL,

        severity VARCHAR(20),

        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_symptom_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );
    """

    cursor.execute(create_table_query)

    connection.commit()

    cursor.close()
    connection.close()

    print("Patient symptoms table created successfully!")


create_patient_symptoms_table()