from database import get_database_connection


def create_patient_reports_table():

    connection = get_database_connection()
    cursor = connection.cursor()

    create_table_query = """
    CREATE TABLE IF NOT EXISTS patient_reports (

        id SERIAL PRIMARY KEY,

        patient_user_id INTEGER NOT NULL,

        file_name VARCHAR(255) NOT NULL,

        stored_file_name VARCHAR(255) NOT NULL,

        file_path TEXT NOT NULL,

        file_type VARCHAR(100),

        file_size BIGINT,

        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_patient_reports_patient
            FOREIGN KEY (patient_user_id)
            REFERENCES users(id)
            ON DELETE CASCADE

    );
    """

    cursor.execute(create_table_query)

    connection.commit()

    cursor.close()
    connection.close()

    print("Patient reports table created successfully!")


if __name__ == "__main__":
    create_patient_reports_table()