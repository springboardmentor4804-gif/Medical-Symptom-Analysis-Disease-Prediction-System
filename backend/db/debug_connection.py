import os
from urllib.parse import urlsplit

from dotenv import load_dotenv
import psycopg

load_dotenv()

url = os.getenv("DATABASE_URL")
print("DATABASE_URL:", url)

parsed = urlsplit(url)
print("parsed.username:", parsed.username)
print("parsed.password:", parsed.password)
print("parsed.hostname:", parsed.hostname)
print("parsed.port:", parsed.port)
print("parsed.path:", parsed.path)

try:
    conn = psycopg.connect(
        host=parsed.hostname,
        port=parsed.port,
        dbname=parsed.path.lstrip("/"),
        user=parsed.username,
        password=parsed.password,
    )
    print("direct psycopg connect succeeded")
    conn.close()
except Exception as exc:
    print("direct psycopg connect failed")
    raise
