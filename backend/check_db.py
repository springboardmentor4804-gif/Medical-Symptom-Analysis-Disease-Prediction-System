import sqlite3

conn = sqlite3.connect('medassist.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()
print('Tables in SQLite database:')
for t in tables:
    print(f'  - {t[0]}')
    cursor.execute(f"SELECT COUNT(*) FROM {t[0]}")
    count = cursor.fetchone()[0]
    print(f'    Rows: {count}')
conn.close()
