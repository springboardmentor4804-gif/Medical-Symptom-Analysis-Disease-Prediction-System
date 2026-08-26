import psycopg2


def get_database_connection():
    connection = psycopg2.connect(
        dbname="medassist_ai",
        user="postgres",
        password="psql@2026",
        host="localhost",
        port="5432"
    )

    return connection