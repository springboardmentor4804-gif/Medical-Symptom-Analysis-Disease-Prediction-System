from app.database import get_database_connection


def create_patient_risk_assessments_table():
    connection = get_database_connection()
    cursor = connection.cursor()

    create_table_query = """
    CREATE TABLE IF NOT EXISTS patient_risk_assessments (
        id SERIAL PRIMARY KEY,

        user_id INTEGER NOT NULL,

        fever VARCHAR(10) NOT NULL,
        cough VARCHAR(10) NOT NULL,
        fatigue VARCHAR(10) NOT NULL,
        difficulty_breathing VARCHAR(10) NOT NULL,

        age INTEGER NOT NULL,
        gender VARCHAR(20) NOT NULL,

        blood_pressure VARCHAR(20) NOT NULL,
        cholesterol_level VARCHAR(20) NOT NULL,

        predicted_outcome VARCHAR(30) NOT NULL,

        positive_model_score NUMERIC(6, 2),
        negative_model_score NUMERIC(6, 2),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_risk_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_risk_assessment_user
        ON patient_risk_assessments(user_id);

    CREATE INDEX IF NOT EXISTS idx_risk_assessment_created
        ON patient_risk_assessments(created_at);
    """

    cursor.execute(create_table_query)

    connection.commit()

    cursor.close()
    connection.close()

    print("Patient risk assessments table created successfully!")


if __name__ == "__main__":
    create_patient_risk_assessments_table()