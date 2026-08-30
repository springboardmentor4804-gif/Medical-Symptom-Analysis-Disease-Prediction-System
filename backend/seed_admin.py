import os
import sys

# Ensure the backend directory is in the path to support direct script execution
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.security import get_password_hash

def seed_admin(email: str = "admin@vitals.ai", password: str = "admin123"):
    db = SessionLocal()
    try:
        # Check if user already exists
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"Admin user with email '{email}' already exists.")
            # Update password and role to ensure correct admin configuration
            user.password_hash = get_password_hash(password)
            user.role = "admin"
            db.commit()
            print("Admin credentials updated.")
            return
        
        # Create admin user record (no patient record created)
        new_admin = User(
            email=email,
            password_hash=get_password_hash(password),
            role="admin"
        )
        db.add(new_admin)
        db.commit()
        print(f"Admin user created successfully with email: '{email}' and password: '{password}'")
    except Exception as e:
        print(f"Error seeding admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    email = os.getenv("ADMIN_EMAIL", "admin@medassist.ai")
    password = os.getenv("ADMIN_PASSWORD", "admin123")
    
    # Command-line arguments overwrite defaults
    if len(sys.argv) > 2:
        email = sys.argv[1]
        password = sys.argv[2]
    elif len(sys.argv) > 1:
        email = sys.argv[1]
        
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)
    
    seed_admin(email, password)
