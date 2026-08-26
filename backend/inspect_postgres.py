#!/usr/bin/env python
"""READ-ONLY inspection of PostgreSQL database - no writes."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import create_engine, text
from config import settings

def main():
    if not settings.database_url.startswith('postgresql'):
        print(f'ERROR: DATABASE_URL is not PostgreSQL: {settings.database_url}')
        return 1
    
    engine = create_engine(settings.database_url)
    
    print('=' * 70)
    print('POSTGRESQL DATABASE INSPECTION (READ-ONLY)')
    print('=' * 70)
    print(f'Database: {settings.database_url.split("@")[-1]}')
    
    with engine.connect() as conn:
        # Check users
        result = conn.execute(text('SELECT COUNT(*) FROM users'))
        user_count = result.scalar()
        print(f'\nUsers: {user_count}')
        
        result = conn.execute(text('SELECT id, email, role FROM users ORDER BY id'))
        for row in result:
            print(f'  User ID {row[0]}: {row[1]} ({row[2]})')
        
        # Check assessments
        result = conn.execute(text('SELECT COUNT(*) FROM assessments'))
        assessment_count = result.scalar()
        print(f'\nAssessments: {assessment_count}')
        
        result = conn.execute(text('SELECT MIN(id), MAX(id) FROM assessments'))
        row = result.fetchone()
        if row[0] is not None:
            print(f'  Assessment ID range: {row[0]} - {row[1]}')
        
        # Count assessments per user
        result = conn.execute(text('SELECT user_id, COUNT(*) FROM assessments GROUP BY user_id ORDER BY user_id'))
        print(f'\nAssessments per user:')
        for row in result:
            print(f'  User {row[0]}: {row[1]} assessments')
        
        # Check sequence status
        result = conn.execute(text(
            "SELECT pg_get_serial_sequence('assessments', 'id') as seq_name"))
        seq_name = result.scalar()
        if seq_name:
            result = conn.execute(text(f"SELECT last_value, is_called FROM {seq_name}"))
            row = result.fetchone()
            print(f'\nAssessment ID sequence:')
            print(f'  Sequence name: {seq_name}')
            print(f'  Last value: {row[0]}')
            print(f'  Is called: {row[1]}')
            print(f'  Next ID will be: {row[0] + 1 if row[1] else row[0]}')
        
        # Show assessment columns
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'assessments' 
            ORDER BY ordinal_position
        """))
        print(f'\nAssessment table columns:')
        for row in result:
            print(f'  {row[0]}: {row[1]} {row[2]}')
        
        # Show sample assessment
        result = conn.execute(text('SELECT * FROM assessments ORDER BY id LIMIT 1'))
        sample = result.fetchone()
        if sample:
            print(f'\nSample assessment (ID {sample[0]}):')
            # Get column names
            result2 = conn.execute(text('SELECT * FROM assessments LIMIT 0'))
            cols = result2.keys()
            for col, val in zip(cols, sample):
                if col in ('input_json', 'result_json', 'treatment_evidence'):
                    val_str = str(val)[:100] + '...' if val and len(str(val)) > 100 else str(val)
                else:
                    val_str = val
                print(f'  {col}: {val_str}')
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
