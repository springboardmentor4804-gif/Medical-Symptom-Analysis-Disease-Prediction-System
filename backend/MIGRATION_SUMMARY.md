# Assessment Migration Summary

## Overview

Safe, one-time migration of **40 assessment records** from SQLite to PostgreSQL with user ID mapping.

## Migration Script

**File:** `migrate_assessments_only.py`
**Location:** `backend/migrate_assessments_only.py`

## What It Does

### Migrates
✅ **ONLY** the 40 assessment records from SQLite  
✅ Applies user ID mapping automatically  
✅ Preserves all assessment fields exactly  
✅ Lets PostgreSQL generate new IDs (no collisions)  
✅ Synchronizes the sequence after migration  

### Does NOT Migrate
❌ Users (already exist in PostgreSQL)  
❌ Provider profiles  
❌ Provider reports  
❌ Prescriptions  
❌ System settings  
❌ Patient profiles  

### Safety Features
✅ **Read-only validation** (default mode)  
✅ **Duplicate detection** using fingerprints (user_id + timestamp + input hash)  
✅ **Transaction rollback** on any error  
✅ **Idempotent** - safe to run multiple times  
✅ **Dry-run mode** to preview changes  
✅ **Sequence synchronization** to prevent ID collisions  
✅ **Comprehensive verification** after migration  

## User ID Mapping

The script automatically applies this mapping:

| SQLite user_id | PostgreSQL user_id | Email |
|---|---|---|
| 1 | 1 | admin@medassist.local |
| 2 | 5 | dharanik269@gmail.com |
| 3 | 6 | tharun123@gmail.com |

## Current Database State

### SQLite (medassist.db)
- **Users:** 3
- **Assessments:** 40
  - User 1 (admin): 13 assessments
  - User 2 (patient): 27 assessments
- **Assessment IDs:** 1-40

### PostgreSQL (localhost:5432/medassist)
- **Users:** 3 (IDs: 1, 5, 6)
- **Assessments:** 5 (IDs: 24-28)
  - User 5: 5 assessments
- **Sequence:** public.assessments_id_seq at 28
- **Next ID will be:** 29

## Validation Results

✅ **Prerequisites Check:** PASSED
- SQLite database exists
- PostgreSQL URL configured correctly
- All 3 mapped users exist in PostgreSQL

✅ **Duplicate Detection:** PASSED
- No duplicates found
- All 40 SQLite assessments are unique
- Safe to migrate all records

✅ **Expected Results:**
- **Before:** 5 assessments in PostgreSQL
- **Migrating:** 40 assessments from SQLite
- **After:** 45 total assessments in PostgreSQL

## Assessment Table Schema

Both databases have identical 9 columns:

```sql
id                  INTEGER/SERIAL PRIMARY KEY
user_id             INTEGER NOT NULL (will be mapped)
input_json          TEXT
result_json         TEXT
risk_flag           VARCHAR
created_at          DATETIME/TIMESTAMP
treatment_layer     VARCHAR
gate_reason         VARCHAR
treatment_evidence  JSON/JSONB
```

## Usage Instructions

### Step 1: Validation (READ-ONLY)

```bash
cd backend
python migrate_assessments_only.py --validate
```

This will:
- Check prerequisites
- Verify user mappings
- Detect duplicates
- Show current state
- **NO CHANGES MADE**

### Step 2: Dry Run (PREVIEW)

```bash
python migrate_assessments_only.py --dry-run
```

This will:
- Show exactly what would be migrated
- Display migration plan
- Preview first 5 records
- **NO CHANGES MADE**

### Step 3: Migration (REQUIRES CONFIRMATION)

```bash
python migrate_assessments_only.py --migrate
```

This will:
1. Run validation
2. Show migration plan
3. **Ask for confirmation** (type "MIGRATE")
4. Perform migration in a transaction
5. Reset sequence
6. Verify results

**Note:** The script requires you to type "MIGRATE" to confirm.

### Step 4: Verification (POST-MIGRATION)

```bash
python migrate_assessments_only.py --verify
```

This will:
- Check total count (should be 45)
- Verify per-user counts
- Confirm original IDs 24-28 still exist
- Check sequence synchronization

## What The Migration Does

### During Migration:

1. **Reads** 40 assessments from SQLite
2. **Checks** for duplicates using fingerprints
3. **Maps** user IDs (1→1, 2→5, 3→6)
4. **Inserts** into PostgreSQL (in transaction)
   - PostgreSQL generates new IDs automatically
   - Preserves all 9 fields exactly
   - Original SQLite IDs are NOT copied
5. **Resets** sequence to MAX(id) + 1
6. **Commits** transaction (or rolls back on error)

### After Migration:

PostgreSQL will have:
- **IDs 24-28:** Original 5 assessments (unchanged)
- **IDs 29-68:** New 40 migrated assessments (with mapped user_ids)
- **Sequence:** Set to 68, next ID will be 69

## Duplicate Detection

The script creates a unique fingerprint for each assessment:

```
fingerprint = f"u{mapped_user_id}_t{created_at}_i{input_hash}"
```

Where:
- `mapped_user_id` = PostgreSQL user ID after mapping
- `created_at` = timestamp
- `input_hash` = MD5 hash of input_json (first 16 chars)

Example: `u5_t2026-08-25 13:25:44.508364_i0cae166c9841eea6`

If a fingerprint exists in PostgreSQL, that assessment is skipped.

## Error Handling

### Transaction Rollback
If **any** error occurs during insertion:
- Entire transaction is rolled back
- **No changes** made to PostgreSQL
- Original 5 assessments remain intact
- Error message displayed

### Safe to Retry
The script is **idempotent**:
- If run again, duplicate detection prevents re-insertion
- Already-migrated assessments are skipped
- Safe to run multiple times

## Files Created

1. **`migrate_assessments_only.py`** - Main migration script
2. **`inspect_sqlite.py`** - SQLite inspection tool (read-only)
3. **`inspect_postgres.py`** - PostgreSQL inspection tool (read-only)
4. **`MIGRATION_SUMMARY.md`** - This file

## Verification Checklist

After migration, verify:

- [ ] Total PostgreSQL assessments = 45
- [ ] User 1 has 13 assessments (migrated from SQLite)
- [ ] User 5 has 32 assessments (5 original + 27 migrated)
- [ ] User 6 has 0 assessments (none in SQLite for user 3)
- [ ] Original assessment IDs 24-28 still exist
- [ ] All original assessments belong to user 5
- [ ] New assessment IDs are 29-68
- [ ] Sequence next value is 69
- [ ] No duplicate fingerprints

## Important Notes

1. **No User Changes:** The script does NOT create, modify, or delete users
2. **ID Mapping Only:** User IDs are mapped in assessment records only
3. **Preserves Existing Data:** PostgreSQL assessments 24-28 remain unchanged
4. **New IDs:** Migrated assessments get NEW PostgreSQL-generated IDs (29-68)
5. **One-Time Operation:** Intended as a one-time migration
6. **Transaction Safety:** All inserts in a single transaction (all-or-nothing)
7. **Sequence Reset:** Prevents ID collisions on future inserts

## Troubleshooting

### "PostgreSQL user X does not exist!"
- Check that users 1, 5, and 6 exist in PostgreSQL
- Run: `python inspect_postgres.py` to verify

### "Migration failed"
- Check error message
- No changes made (transaction rolled back)
- Fix the error and retry

### "Duplicates found"
- Some assessments already migrated
- They will be skipped automatically
- Only new assessments will be inserted

### "Sequence not synchronized"
- Run verification: `python migrate_assessments_only.py --verify`
- Manually reset if needed:
  ```sql
  SELECT setval('public.assessments_id_seq', 
                (SELECT MAX(id) FROM assessments), 
                true);
  ```

## Next Steps

1. ✅ **Review this summary**
2. ✅ **Run validation** (`--validate`)
3. ✅ **Run dry-run** (`--dry-run`)
4. ⏸️ **Wait for your approval**
5. ⏳ **Execute migration** (`--migrate`)
6. ✅ **Run verification** (`--verify`)

---

**Status:** Ready for review - waiting for approval before executing migration.

**Risk Level:** Low (comprehensive safety checks, transaction rollback, idempotent)

**Impact:** Adds 40 assessment records to PostgreSQL, no modifications to existing data
