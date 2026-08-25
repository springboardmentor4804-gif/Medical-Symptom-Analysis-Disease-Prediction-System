from db.connection import engine
from sqlalchemy import text
with engine.connect() as conn:
    res = conn.execute(text('SELECT u.id,u.full_name,u.email,p.hospital_name,p.specialization,p.license_number,p.years_experience,p.qualification,p.department FROM users u LEFT JOIN provider_profile p ON p.user_id=u.id ORDER BY u.id DESC LIMIT 20'))
    for r in res:
        print(r)
