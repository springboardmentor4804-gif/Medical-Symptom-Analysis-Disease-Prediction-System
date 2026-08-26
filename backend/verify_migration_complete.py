#!/usr/bin/env python
"""Detailed post-migration verification."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import create_engine, text
from config import settings

def main():
    engine = create_engine(settings.database_url)

    print('=' * 70)
    print('DETAILED POST-MIGRATION VERIFICATION')
    print('=' * 70)

    with engine.connect() as conn:
        # Get all assessment IDs
        result = conn.execute(text('SELECT id FROM assessments ORDER BY id'))
        all_ids = [row[0] for row in result]
        
        print(f'\n--- Assessment IDs ---')
        print(f'Total assessments: {len(all_ids)}')
        print(f'ID range: {min(all_ids)} - {max(all_ids)}')
        print(f'First 10 IDs: {all_ids[:10]}')
        print(f'Last 10 IDs: {all_ids[-10:]}')
        
        # Verify new IDs are 29-68
        new_ids = [id for id in all_ids if id >= 29]
        print(f'\nNew migrated IDs: {len(new_ids)} records')
        print(f'Range: {min(new_ids) if new_ids else None} - {max(new_ids) if new_ids else None}')
        print(f'Expected: 29-68 (40 records)')
        match = new_ids == list(range(29, 69))
        print(f'Match: {"✓ PASS" if match else "✗ FAIL"}')
        
        # Verify original IDs preserved
        original_ids = [id for id in all_ids if 24 <= id <= 28]
        print(f'\nOriginal IDs (24-28): {original_ids}')
        original_match = original_ids == [24, 25, 26, 27, 28]
        print(f'All present: {"✓ PASS" if original_match else "✗ FAIL"}')
        
        # Check user mapping
        print(f'\n--- User Mapping Verification ---')
        result = conn.execute(text('''
            SELECT user_id, COUNT(*) as count, MIN(id) as min_id, MAX(id) as max_id
            FROM assessments 
            GROUP BY user_id 
            ORDER BY user_id
        '''))
        for row in result:
            print(f'User {row[0]}: {row[1]} assessments (IDs {row[2]}-{row[3]})')
        
        # Verify no records for unmapped users
        result = conn.execute(text('''
            SELECT COUNT(*) FROM assessments WHERE user_id IN (2, 3, 4)
        '''))
        unmapped = result.scalar()
        print(f'\nAssessments with unmapped user IDs (2,3,4): {unmapped}')
        print(f'Mapping correct: {"✓ PASS" if unmapped == 0 else "✗ FAIL - should be 0"}')
        
        # Check sequence
        result = conn.execute(text('''
            SELECT last_value, is_called 
            FROM public.assessments_id_seq
        '''))
        row = result.fetchone()
        print(f'\n--- Sequence Status ---')
        print(f'Last value: {row[0]}')
        print(f'Is called: {row[1]}')
        next_id = row[0] + 1 if row[1] else row[0]
        print(f'Next ID: {next_id}')
        seq_ok = row[0] == 68 and row[1]
        print(f'Synchronized: {"✓ PASS" if seq_ok else "✗ FAIL - should be 68 with is_called=True"}')
        
        # Verify other tables unchanged
        print(f'\n--- Other Tables Verification ---')
        result = conn.execute(text('SELECT COUNT(*) FROM users'))
        user_count = result.scalar()
        print(f'Users: {user_count} {"✓ PASS" if user_count == 3 else "✗ FAIL - should be 3"}')
        
        # Check if tables exist and get counts
        tables_to_check = ['provider_profiles', 'provider_reports', 'prescriptions', 'system_settings']
        for table in tables_to_check:
            result = conn.execute(text(f'''
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = '{table}' AND table_schema = 'public'
            '''))
            if result.scalar() > 0:
                result = conn.execute(text(f'SELECT COUNT(*) FROM {table}'))
                print(f'{table}: {result.scalar()} records')

    print('\n' + '=' * 70)
    print('VERIFICATION COMPLETE')
    print('=' * 70)
    return 0

if __name__ == '__main__':
    sys.exit(main())
