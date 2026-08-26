from app.database import get_database_connection


def create_caretaker_profile_table():

    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS caretaker_profiles (

            id SERIAL PRIMARY KEY,

            user_id INTEGER UNIQUE NOT NULL,

            phone VARCHAR(20) NOT NULL,

            profession VARCHAR(100) NOT NULL,

            organization VARCHAR(150),

            years_of_experience INTEGER,

            specialization VARCHAR(100),

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT fk_caretaker_user
                FOREIGN KEY(user_id)
                REFERENCES users(id)
                ON DELETE CASCADE

        );
        """
    )

    connection.commit()

    cursor.close()
    connection.close()

    print("✅ caretaker_profiles table created successfully.")


if __name__ == "__main__":
    create_caretaker_profile_table()