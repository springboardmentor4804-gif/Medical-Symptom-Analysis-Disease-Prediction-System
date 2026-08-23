"""
Test PostgreSQL connection using the DATABASE_URL from .env
This script validates the connection and checks schema compatibility.
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from config import settings
    from sqlalchemy import create_engine, inspect, text
    
    print("="*60)
    print("PostgreSQL Connection Test")
    print("="*60)
    print()
    
    database_url = settings.database_url
    
    # Check if still using SQLite
    if database_url.startswith("sqlite"):
        print("❌ Still configured for SQLite!")
        print(f"   Current: {database_url}")
        print()
        print("Please update backend/.env file:")
        print("   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/medassist")
        sys.exit(1)
    
    # Check if password placeholder is still there
    if "YOUR_PASSWORD_HERE" in database_url or "YOUR_PASSWORD" in database_url:
        print("❌ Password placeholder detected in .env file!")
        print()
        print("Please update backend/.env line 4:")
        print("   Replace YOUR_PASSWORD_HERE with your actual PostgreSQL password")
        print()
        print("Example:")
        print("   DATABASE_URL=postgresql://postgres:MyActualPassword@localhost:5432/medassist")
        sys.exit(1)
    
    print(f"Database URL format: {database_url.split('@')[1] if '@' in database_url else 'unknown'}")
    print()
    print("Attempting connection...")
    
    # Create engine and test connection
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Test basic query
        result = conn.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        print(f"✅ Connected successfully!")
        print(f"   PostgreSQL version: {version.split(',')[0]}")
        print()
        
        # Check database name
        result = conn.execute(text("SELECT current_database()"))
        db_name = result.fetchone()[0]
        print(f"   Database: {db_name}")
        
        # Check if we can see tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"   Tables found: {len(tables)}")
        for table in sorted(tables):
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.fetchone()[0]
            print(f"      - {table}: {count} rows")
        print()
        
        # Expected tables from database.py
        expected_tables = {
            'users',
            'patient_profiles',
            'provider_profiles',
            'assessments',
            'provider_reports',
            'prescriptions',
            'system_settings'
        }
        
        existing_tables = set(tables)
        missing_tables = expected_tables - existing_tables
        extra_tables = existing_tables - expected_tables
        
        print("Schema Validation:")
        if missing_tables:
            print(f"   ⚠️  Missing tables: {', '.join(missing_tables)}")
            print("      These will be created when you start the backend.")
        else:
            print("   ✅ All expected tables exist")
        
        if extra_tables:
            print(f"   ℹ️  Extra tables: {', '.join(extra_tables)}")
        
        # Check users table specifically
        if 'users' in tables:
            print()
            print("Users table check:")
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.fetchone()[0]
            print(f"   Total users: {user_count}")
            
            result = conn.execute(text("SELECT COUNT(*) FROM users WHERE role = 'admin'"))
            admin_count = result.fetchone()[0]
            print(f"   Admin users: {admin_count}")
            
            if admin_count > 0:
                result = conn.execute(text("SELECT email FROM users WHERE role = 'admin' LIMIT 1"))
                admin_email = result.fetchone()[0]
                print(f"   Admin email: {admin_email}")
        
        print()
        print("="*60)
        print("✅ PostgreSQL connection test PASSED!")
        print("="*60)
        print()
        print("Next steps:")
        print("1. Start the backend: python main.py")
        print("2. The backend will run init_db() which creates any missing tables")
        print("3. Test login with admin credentials from .env file")
        print("4. Verify data is saved to PostgreSQL (check in pgAdmin)")
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print()
    print("Make sure you're running from the backend directory with venv activated:")
    print("   cd backend")
    print("   ..\\.venv\\Scripts\\activate")
    print("   python test_postgres_connection.py")
    sys.exit(1)

except Exception as e:
    print(f"❌ Connection failed: {type(e).__name__}")
    print(f"   {e}")
    print()
    print("Common issues:")
    print("1. Wrong password in .env file")
    print("2. PostgreSQL service not running")
    print("3. Database 'medassist' doesn't exist")
    print("4. Firewall blocking localhost:5432")
    print()
    print("Verify in pgAdmin that:")
    print("   - PostgreSQL server is running")
    print("   - Database 'medassist' exists")
    print("   - User 'postgres' has access")
    sys.exit(1)
