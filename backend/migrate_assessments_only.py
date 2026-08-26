#!/usr/bin/env python
"""
SAFE ASSESSMENT-ONLY MIGRATION: SQLite -> PostgreSQL

This script migrates ONLY assessment records from SQLite to PostgreSQL,
applying user ID mapping and preserving all existing PostgreSQL data.

SAFETY FEATURES:
- Read-only validation mode (default)
- Duplicate detection using fingerprints
- Transaction rollback on any error
- Sequence synchronization
- Comprehensive verification

USER ID MAPPING:
  SQLite user_id 1 -> PostgreSQL user_id 1
  SQLite user_id 2 -> PostgreSQL user_id 5
  SQLite user_id 3 -> PostgreSQL user_id 6

USAGE:
  python migrate_assessments_only.py --validate    # READ-ONLY checks (default)
  python migrate_assessments_only.py --migrate     # Perform migration (requires confirmation)
"""

import sys
import json
import hashlib
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent))

import sqlite3
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from config import settings

# User ID mapping: SQLite ID -> PostgreSQL ID
USER_ID_MAPPING = {
    1: 1,  # admin@medassist.local
    2: 5,  # dharanik269@gmail.com
    3: 6,  # tharun123@gmail.com
}

SQLITE_DB_PATH = 'medassist.db'
EXPECTED_SQLITE_ASSESSMENTS = 40
EXPECTED_POSTGRES_ASSESSMENTS = 5
EXPECTED_FINAL_COUNT = 45


def create_fingerprint(assessment):
    """
    Create a unique fingerprint for an assessment to detect duplicates.
    Uses user_id, created_at, and a hash of input_json.
    """
    # Normalize created_at to ISO format for consistent comparison
    created_at = assessment['created_at']
    if isinstance(created_at, datetime):
        created_str = created_at.isoformat()
    else:
        # If it's already a string, ensure it's in ISO format
        created_str = str(created_at)
    
    # Create hash of input_json if it exists
    input_hash = ''
    if assessment['input_json']:
        # Normalize JSON to avoid formatting differences
        try:
            if isinstance(assessment['input_json'], str):
                input_data = json.loads(assessment['input_json'])
            else:
                input_data = assessment['input_json']
            input_hash = hashlib.md5(
                json.dumps(input_data, sort_keys=True).encode()
            ).hexdigest()[:16]
        except (TypeError, ValueError, json.JSONDecodeError) as e:
            # Fallback: hash the raw string representation
            input_hash = hashlib.md5(
                str(assessment['input_json']).encode()
            ).hexdigest()[:16]
    
    # Fingerprint: mapped_user_id + created_timestamp + input_hash
    fingerprint = f"u{assessment['mapped_user_id']}_t{created_str}_i{input_hash}"
    return fingerprint


def validate_prerequisites():
    """Validate database state before migration."""
    print('=' * 70)
    print('VALIDATION: PREREQUISITES CHECK')
    print('=' * 70)
    
    errors = []
    warnings = []
    
    # Check SQLite database exists
    sqlite_path = Path(SQLITE_DB_PATH)
    if not sqlite_path.exists():
        errors.append(f'SQLite database not found: {SQLITE_DB_PATH}')
        return errors, warnings
    
    # Check PostgreSQL configuration
    if not settings.database_url.startswith('postgresql'):
        errors.append(f'DATABASE_URL is not PostgreSQL: {settings.database_url}')
        return errors, warnings
    
    print(f'\n✓ SQLite database found: {SQLITE_DB_PATH}')
    print(f'✓ PostgreSQL URL configured: {settings.database_url.split("@")[-1]}')
    
    # Connect to SQLite
    try:
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_conn.row_factory = sqlite3.Row
        sqlite_cursor = sqlite_conn.cursor()
        
        # Verify SQLite users
        print('\n--- SQLite Users ---')
        sqlite_cursor.execute('SELECT id, email FROM users ORDER BY id')
        sqlite_users = {row['id']: row['email'] for row in sqlite_cursor.fetchall()}
        
        for user_id, email in sqlite_users.items():
            mapped_id = USER_ID_MAPPING.get(user_id)
            if mapped_id:
                print(f'  User {user_id} ({email}) -> will map to PostgreSQL user {mapped_id}')
            else:
                warnings.append(f'SQLite user {user_id} ({email}) has no mapping')
        
        # Verify SQLite assessments
        sqlite_cursor.execute('SELECT COUNT(*) as count FROM assessments')
        sqlite_count = sqlite_cursor.fetchone()['count']
        print(f'\n--- SQLite Assessments ---')
        print(f'  Total: {sqlite_count}')
        
        if sqlite_count != EXPECTED_SQLITE_ASSESSMENTS:
            warnings.append(
                f'SQLite has {sqlite_count} assessments, expected {EXPECTED_SQLITE_ASSESSMENTS}'
            )
        
        sqlite_cursor.execute('SELECT user_id, COUNT(*) as count FROM assessments GROUP BY user_id')
        for row in sqlite_cursor.fetchall():
            user_id = row['user_id']
            count = row['count']
            mapped_id = USER_ID_MAPPING.get(user_id, '???')
            print(f'  User {user_id} -> {mapped_id}: {count} assessments')
        
        sqlite_conn.close()
        
    except Exception as e:
        errors.append(f'SQLite validation failed: {e}')
        return errors, warnings
    
    # Connect to PostgreSQL
    try:
        pg_engine = create_engine(settings.database_url)
        
        with pg_engine.connect() as conn:
            # Verify PostgreSQL users
            print('\n--- PostgreSQL Users ---')
            result = conn.execute(text('SELECT id, email FROM users ORDER BY id'))
            pg_users = {row[0]: row[1] for row in result}
            
            # Check that mapped users exist
            for sqlite_id, pg_id in USER_ID_MAPPING.items():
                if pg_id in pg_users:
                    print(f'  ✓ User {pg_id} ({pg_users[pg_id]}) exists')
                else:
                    errors.append(f'Mapped PostgreSQL user {pg_id} does not exist!')
            
            # Verify PostgreSQL assessments
            result = conn.execute(text('SELECT COUNT(*) FROM assessments'))
            pg_count = result.scalar()
            print(f'\n--- PostgreSQL Assessments ---')
            print(f'  Current count: {pg_count}')
            
            if pg_count != EXPECTED_POSTGRES_ASSESSMENTS:
                warnings.append(
                    f'PostgreSQL has {pg_count} assessments, expected {EXPECTED_POSTGRES_ASSESSMENTS}'
                )
            
            result = conn.execute(text('SELECT MIN(id), MAX(id) FROM assessments'))
            row = result.fetchone()
            if row[0] is not None:
                print(f'  ID range: {row[0]} - {row[1]}')
            
            result = conn.execute(text(
                'SELECT user_id, COUNT(*) FROM assessments GROUP BY user_id ORDER BY user_id'))
            print(f'  Per user:')
            for row in result:
                print(f'    User {row[0]}: {row[1]} assessments')
            
            # Check sequence
            result = conn.execute(text(
                "SELECT pg_get_serial_sequence('assessments', 'id') as seq"))
            seq_name = result.scalar()
            if seq_name:
                result = conn.execute(text(f'SELECT last_value FROM {seq_name}'))
                last_val = result.scalar()
                print(f'\n  Sequence: {seq_name}')
                print(f'  Last value: {last_val}')
            else:
                warnings.append('Could not find assessment sequence!')
        
    except Exception as e:
        errors.append(f'PostgreSQL validation failed: {e}')
        return errors, warnings
    
    return errors, warnings


def check_duplicates():
    """
    Check if any SQLite assessments have already been migrated to PostgreSQL.
    Returns: (sqlite_assessments, postgres_fingerprints, duplicates)
    """
    print('\n' + '=' * 70)
    print('VALIDATION: DUPLICATE DETECTION')
    print('=' * 70)
    
    # Read SQLite assessments with mapping applied
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    
    sqlite_cursor.execute('''
        SELECT id, user_id, input_json, result_json, risk_flag, 
               created_at, treatment_layer, gate_reason, treatment_evidence
        FROM assessments 
        ORDER BY id
    ''')
    
    sqlite_assessments = []
    for row in sqlite_cursor.fetchall():
        assessment = dict(row)
        # Apply user ID mapping
        assessment['mapped_user_id'] = USER_ID_MAPPING.get(assessment['user_id'])
        if assessment['mapped_user_id'] is None:
            print(f"  WARNING: Assessment {assessment['id']} has unmapped user_id {assessment['user_id']}")
        assessment['fingerprint'] = create_fingerprint(assessment)
        sqlite_assessments.append(assessment)
    
    sqlite_conn.close()
    
    print(f'\nSQLite assessments: {len(sqlite_assessments)}')
    print(f'Sample fingerprints:')
    for assessment in sqlite_assessments[:3]:
        print(f'  ID {assessment["id"]}: {assessment["fingerprint"]}')
    
    # Read PostgreSQL assessments
    pg_engine = create_engine(settings.database_url)
    
    with pg_engine.connect() as conn:
        result = conn.execute(text('''
            SELECT id, user_id, input_json, result_json, risk_flag,
                   created_at, treatment_layer, gate_reason, treatment_evidence
            FROM assessments
            ORDER BY id
        '''))
        
        postgres_assessments = []
        for row in result:
            assessment = {
                'id': row[0],
                'user_id': row[1],
                'mapped_user_id': row[1],  # Already in PostgreSQL, no mapping needed
                'input_json': row[2],
                'result_json': row[3],
                'risk_flag': row[4],
                'created_at': row[5],
                'treatment_layer': row[6],
                'gate_reason': row[7],
                'treatment_evidence': row[8],
            }
            assessment['fingerprint'] = create_fingerprint(assessment)
            postgres_assessments.append(assessment)
    
    postgres_fingerprints = {a['fingerprint']: a['id'] for a in postgres_assessments}
    
    print(f'\nPostgreSQL assessments: {len(postgres_assessments)}')
    if postgres_assessments:
        print(f'Sample fingerprints:')
        for assessment in postgres_assessments[:3]:
            print(f'  ID {assessment["id"]}: {assessment["fingerprint"]}')
    
    # Check for duplicates
    duplicates = []
    for assessment in sqlite_assessments:
        if assessment['fingerprint'] in postgres_fingerprints:
            pg_id = postgres_fingerprints[assessment['fingerprint']]
            duplicates.append({
                'sqlite_id': assessment['id'],
                'postgres_id': pg_id,
                'fingerprint': assessment['fingerprint'],
                'user_id': assessment['user_id'],
                'mapped_user_id': assessment['mapped_user_id'],
            })
    
    print(f'\n--- Duplicate Detection Results ---')
    if duplicates:
        print(f'  FOUND {len(duplicates)} potential duplicates:')
        for dup in duplicates[:10]:  # Show first 10
            print(f'    SQLite ID {dup["sqlite_id"]} appears to match PostgreSQL ID {dup["postgres_id"]}')
        if len(duplicates) > 10:
            print(f'    ... and {len(duplicates) - 10} more')
        print(f'\n  ⚠️  These will be SKIPPED during migration to avoid duplicates.')
    else:
        print(f'  ✓ No duplicates found - safe to migrate all {len(sqlite_assessments)} assessments')
    
    return sqlite_assessments, postgres_fingerprints, duplicates


def perform_migration(dry_run=True):
    """
    Perform the actual migration.
    If dry_run=True, shows what would be done without writing.
    """
    print('\n' + '=' * 70)
    if dry_run:
        print('DRY RUN: MIGRATION PREVIEW (NO CHANGES WILL BE MADE)')
    else:
        print('EXECUTING MIGRATION')
    print('=' * 70)
    
    # Get assessments and check duplicates
    sqlite_assessments, postgres_fingerprints, duplicates = check_duplicates()
    
    # Filter out duplicates
    to_migrate = [a for a in sqlite_assessments 
                  if a['fingerprint'] not in postgres_fingerprints]
    
    print(f'\n--- Migration Plan ---')
    print(f'  Total SQLite assessments: {len(sqlite_assessments)}')
    print(f'  Already in PostgreSQL (duplicates): {len(duplicates)}')
    print(f'  To be migrated: {len(to_migrate)}')
    print(f'  Expected final count: {EXPECTED_POSTGRES_ASSESSMENTS + len(to_migrate)}')
    
    if not to_migrate:
        print('\n  Nothing to migrate - all assessments already exist in PostgreSQL!')
        return True
    
    print(f'\n--- Assessments to Migrate ---')
    for assessment in to_migrate[:5]:
        print(f'  SQLite ID {assessment["id"]}: user {assessment["user_id"]} -> {assessment["mapped_user_id"]}, created {assessment["created_at"]}')
    if len(to_migrate) > 5:
        print(f'  ... and {len(to_migrate) - 5} more')
    
    if dry_run:
        print('\n  This is a DRY RUN - no changes will be made.')
        print('  Run with --migrate to perform actual migration.')
        return True
    
    # Actual migration
    print('\n--- Starting Migration ---')
    pg_engine = create_engine(settings.database_url)
    
    try:
        with pg_engine.begin() as conn:  # Transaction - auto-rollback on error
            inserted_count = 0
            
            for assessment in to_migrate:
                # Skip if user mapping is missing
                if assessment['mapped_user_id'] is None:
                    print(f'  SKIP ID {assessment["id"]}: no user mapping for user_id {assessment["user_id"]}')
                    continue
                
                # Insert assessment (let PostgreSQL generate new ID)
                conn.execute(text('''
                    INSERT INTO assessments 
                        (user_id, input_json, result_json, risk_flag, created_at,
                         treatment_layer, gate_reason, treatment_evidence)
                    VALUES 
                        (:user_id, :input_json, :result_json, :risk_flag, :created_at,
                         :treatment_layer, :gate_reason, :treatment_evidence)
                '''), {
                    'user_id': assessment['mapped_user_id'],
                    'input_json': assessment['input_json'],
                    'result_json': assessment['result_json'],
                    'risk_flag': assessment['risk_flag'],
                    'created_at': assessment['created_at'],
                    'treatment_layer': assessment['treatment_layer'],
                    'gate_reason': assessment['gate_reason'],
                    'treatment_evidence': assessment['treatment_evidence'],
                })
                inserted_count += 1
                
                if inserted_count % 10 == 0:
                    print(f'  Inserted {inserted_count}/{len(to_migrate)}...')
            
            print(f'\n  ✓ Inserted {inserted_count} assessments successfully')
            
            # Reset sequence
            print('\n--- Resetting Sequence ---')
            result = conn.execute(text(
                "SELECT pg_get_serial_sequence('assessments', 'id')"))
            seq_name = result.scalar()
            
            if seq_name:
                # Set sequence to MAX(id) so next INSERT uses max+1
                result = conn.execute(text(f'''
                    SELECT setval('{seq_name}', 
                                  (SELECT MAX(id) FROM assessments),
                                  true)
                '''))
                new_value = result.scalar()
                print(f'  ✓ Sequence {seq_name} set to {new_value}')
                print(f'  Next assessment ID will be: {new_value + 1}')
            else:
                print(f'  ⚠️  Could not find sequence!')
            
            print('\n  ✓ Transaction committed successfully')
    
    except SQLAlchemyError as e:
        print(f'\n  ✗ MIGRATION FAILED: {e}')
        print(f'  Transaction rolled back - no changes made to PostgreSQL')
        return False
    
    return True


def verify_migration():
    """Verify the migration was successful."""
    print('\n' + '=' * 70)
    print('VERIFICATION: POST-MIGRATION CHECKS')
    print('=' * 70)
    
    pg_engine = create_engine(settings.database_url)
    
    with pg_engine.connect() as conn:
        # Check total count
        result = conn.execute(text('SELECT COUNT(*) FROM assessments'))
        total_count = result.scalar()
        print(f'\nTotal assessments: {total_count}')
        
        expected = EXPECTED_FINAL_COUNT
        if total_count == expected:
            print(f'  ✓ Matches expected count: {expected}')
        else:
            print(f'  ⚠️  Expected {expected}, got {total_count}')
        
        # Check per-user counts
        result = conn.execute(text('''
            SELECT user_id, COUNT(*) as count 
            FROM assessments 
            GROUP BY user_id 
            ORDER BY user_id
        '''))
        print(f'\nAssessments per user:')
        for row in result:
            print(f'  User {row[0]}: {row[1]} assessments')
        
        # Check ID range
        result = conn.execute(text('SELECT MIN(id), MAX(id) FROM assessments'))
        row = result.fetchone()
        print(f'\nAssessment ID range: {row[0]} - {row[1]}')
        
        # Verify original assessments still exist
        result = conn.execute(text('''
            SELECT id FROM assessments 
            WHERE id BETWEEN 24 AND 28 
            ORDER BY id
        '''))
        original_ids = [row[0] for row in result]
        print(f'\nOriginal assessments (24-28): {original_ids}')
        if original_ids == [24, 25, 26, 27, 28]:
            print(f'  ✓ All original assessments preserved')
        else:
            print(f'  ⚠️  Some original assessments missing!')
        
        # Check sequence
        result = conn.execute(text(
            "SELECT pg_get_serial_sequence('assessments', 'id')"))
        seq_name = result.scalar()
        if seq_name:
            result = conn.execute(text(f'''
                SELECT last_value, is_called FROM {seq_name}
            '''))
            row = result.fetchone()
            next_id = row[0] + 1 if row[1] else row[0]
            print(f'\nSequence status:')
            print(f'  Last value: {row[0]}')
            print(f'  Next ID will be: {next_id}')
            
            # Make sure next ID doesn't conflict
            result = conn.execute(text('SELECT MAX(id) FROM assessments'))
            max_id = result.scalar()
            if next_id > max_id:
                print(f'  ✓ Sequence is properly synchronized (next={next_id}, max={max_id})')
            else:
                print(f'  ⚠️  Sequence conflict: next={next_id}, max={max_id}')


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description=__doc__, 
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--validate', action='store_true', default=True,
                        help='Validate prerequisites and check for duplicates (default)')
    parser.add_argument('--migrate', action='store_true',
                        help='Perform actual migration (requires confirmation)')
    parser.add_argument('--verify', action='store_true',
                        help='Verify migration results (run after migration)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Show what would be migrated without making changes')
    
    args = parser.parse_args()
    
    # Default to validation if no args
    if not (args.migrate or args.verify or args.dry_run):
        args.validate = True
    
    if args.validate or args.migrate or args.dry_run:
        # Run validation
        errors, warnings = validate_prerequisites()
        
        if errors:
            print('\n' + '=' * 70)
            print('VALIDATION FAILED - CANNOT PROCEED')
            print('=' * 70)
            for error in errors:
                print(f'  ✗ {error}')
            return 1
        
        if warnings:
            print('\n' + '=' * 70)
            print('WARNINGS')
            print('=' * 70)
            for warning in warnings:
                print(f'  ⚠️  {warning}')
        
        # Check duplicates
        sqlite_assessments, postgres_fingerprints, duplicates = check_duplicates()
    
    if args.dry_run:
        perform_migration(dry_run=True)
        return 0
    
    if args.migrate:
        print('\n' + '=' * 70)
        print('READY TO MIGRATE')
        print('=' * 70)
        print('\n⚠️  This will INSERT assessment records into PostgreSQL.')
        print('    Existing PostgreSQL data will NOT be modified.')
        print('    User ID mapping will be applied.')
        print('')
        
        response = input('Type "MIGRATE" to confirm: ')
        if response != 'MIGRATE':
            print('\nMigration cancelled.')
            return 0
        
        success = perform_migration(dry_run=False)
        
        if success:
            print('\n' + '=' * 70)
            print('MIGRATION COMPLETED')
            print('=' * 70)
            verify_migration()
            return 0
        else:
            return 1
    
    if args.verify:
        verify_migration()
        return 0
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
