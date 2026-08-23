"""
Check PostgreSQL database schema and data.
This script will NOT modify any data - only read.
"""
import sys

# Try to connect to PostgreSQL
try:
    import psycopg2
    from psycopg2 import sql
    
    # You need to provide your PostgreSQL password
    # This script does NOT expose passwords - it only tests connection
    
    print("="*60)
    print("PostgreSQL Database Inspection Script")
    print("="*60)
    print()
    print("⚠️  This script needs your PostgreSQL password.")
    print("⚠️  It will NOT be stored or displayed - only used to connect.")
    print()
    print("If you want to proceed, you need to:")
    print("1. Edit this script")
    print("2. Replace 'YOUR_PASSWORD_HERE' with your actual password")
    print("3. Run it again")
    print("4. Delete your password from the script after running")
    print()
    
    # Connection parameters
    conn_params = {
        'host': 'localhost',
        'port': 5432,
        'database': 'medassist',
        'user': 'postgres',
        'password': 'YOUR_PASSWORD_HERE'  # ⚠️  REPLACE THIS
    }
    
    if conn_params['password'] == 'YOUR_PASSWORD_HERE':
        print("❌ Password not configured. Please edit this script.")
        sys.exit(1)
    
    print("Attempting to connect to PostgreSQL...")
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor()
    print("✅ Connection successful!")
    print()
    
    # Get table list
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    tables = [row[0] for row in cursor.fetchall()]
    
    print("Tables found in 'medassist' database:")
    for table in tables:
        print(f"  - {table}")
    print()
    
    # Get row counts
    print("Row counts:")
    for table in tables:
        cursor.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(
            sql.Identifier(table)
        ))
        count = cursor.fetchone()[0]
        print(f"  {table}: {count} rows")
    print()
    
    # Get schema details for each table
    print("="*60)
    print("TABLE SCHEMAS")
    print("="*60)
    
    for table in tables:
        print(f"\n{table}:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (table,))
        
        columns = cursor.fetchall()
        for col in columns:
            nullable = "NULL" if col[2] == 'YES' else "NOT NULL"
            default = f" DEFAULT {col[3]}" if col[3] else ""
            print(f"  - {col[0]}: {col[1]} {nullable}{default}")
    
    # Get foreign key relationships
    print()
    print("="*60)
    print("FOREIGN KEY RELATIONSHIPS")
    print("="*60)
    
    cursor.execute("""
        SELECT
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
    """)
    
    fkeys = cursor.fetchall()
    for fk in fkeys:
        print(f"  {fk[0]}.{fk[1]} → {fk[2]}.{fk[3]}")
    
    # Check for users table specifically
    if 'users' in tables:
        print()
        print("="*60)
        print("USERS TABLE DATA (non-sensitive)")
        print("="*60)
        cursor.execute("""
            SELECT id, email, role, is_active, created_at
            FROM users
            ORDER BY id
        """)
        users = cursor.fetchall()
        print(f"Total users: {len(users)}")
        for user in users:
            print(f"  ID: {user[0]}, Email: {user[1]}, Role: {user[2]}, Active: {user[3]}, Created: {user[4]}")
    
    cursor.close()
    conn.close()
    
    print()
    print("="*60)
    print("✅ PostgreSQL inspection complete!")
    print("="*60)
    
except ImportError:
    print("❌ psycopg2 is not installed.")
    print("Run: pip install psycopg2-binary")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
    sys.exit(1)
