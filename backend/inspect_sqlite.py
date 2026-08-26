#!/usr/bin/env python
"""READ-ONLY inspection of SQLite database - no writes."""

import sqlite3
import sys

def main():
    conn = sqlite3.connect('medassist.db')
    cursor = conn.cursor()

    print('=' * 70)
    print('SQLITE DATABASE INSPECTION (READ-ONLY)')
    print('=' * 70)

    # Check users
    cursor.execute('SELECT COUNT(*) FROM users')
    user_count = cursor.fetchone()[0]
    print(f'\nUsers: {user_count}')
    cursor.execute('SELECT id, email, role FROM users ORDER BY id')
    for row in cursor.fetchall():
        print(f'  User ID {row[0]}: {row[1]} ({row[2]})')

    # Check assessments
    cursor.execute('SELECT COUNT(*) FROM assessments')
    assessment_count = cursor.fetchone()[0]
    print(f'\nAssessments: {assessment_count}')
    cursor.execute('SELECT MIN(id), MAX(id) FROM assessments')
    min_id, max_id = cursor.fetchone()
    print(f'  Assessment ID range: {min_id} - {max_id}')

    # Count assessments per user
    cursor.execute('SELECT user_id, COUNT(*) FROM assessments GROUP BY user_id ORDER BY user_id')
    print(f'\nAssessments per user:')
    for row in cursor.fetchall():
        print(f'  User {row[0]}: {row[1]} assessments')

    # Show assessment columns
    cursor.execute('PRAGMA table_info(assessments)')
    print(f'\nAssessment table columns:')
    for row in cursor.fetchall():
        nullable = "NULL" if not row[3] else "NOT NULL"
        pk = "PK" if row[5] else ""
        print(f'  {row[1]}: {row[2]} {nullable} {pk}')

    # Show first assessment as sample
    cursor.execute('SELECT * FROM assessments LIMIT 1')
    sample = cursor.fetchone()
    if sample:
        print(f'\nSample assessment (ID {sample[0]}):')
        cols = [desc[0] for desc in cursor.description]
        for col, val in zip(cols, sample):
            if col in ('input_json', 'result_json', 'treatment_evidence'):
                val_str = str(val)[:100] + '...' if len(str(val)) > 100 else str(val)
            else:
                val_str = val
            print(f'  {col}: {val_str}')

    conn.close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
