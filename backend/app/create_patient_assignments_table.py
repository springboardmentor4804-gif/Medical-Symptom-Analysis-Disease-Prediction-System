from app.database import get_database_connection


def create_patient_assignments_table():

    conn = get_database_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS patient_assignments(

            id SERIAL PRIMARY KEY,

            patient_user_id INTEGER NOT NULL,

            caretaker_user_id INTEGER NOT NULL,

            status VARCHAR(20) DEFAULT 'Active',

            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            accepted_at TIMESTAMP,

            CONSTRAINT fk_patient
                FOREIGN KEY(patient_user_id)
                REFERENCES users(id)
                ON DELETE CASCADE,

            CONSTRAINT fk_caretaker
                FOREIGN KEY(caretaker_user_id)
                REFERENCES users(id)
                ON DELETE CASCADE,

            CONSTRAINT unique_patient
                UNIQUE(patient_user_id)

        );
        """
    )

    conn.commit()

    cursor.close()
    conn.close()

    print("patient_assignments table created successfully.")


if __name__ == "__main__":
    create_patient_assignments_table()