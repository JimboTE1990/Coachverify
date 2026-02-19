# Verified Credentials Cache Cleanup

## Why This Matters

When you delete a test user, their EMCC/ICF credentials are stored in the `verified_credentials` cache table. If you don't clear this cache, those credentials **cannot be reused** by another account because of the unique constraint:

```sql
CREATE UNIQUE INDEX idx_verified_credentials_unique
ON verified_credentials(accreditation_body, credential_number);
```

## What Gets Cached

The `verified_credentials` table stores:
- **EMCC EIA numbers** (e.g., `EIA20217053`)
- **ICF credential numbers**
- Coach's full name
- Accreditation level
- Verification timestamp

This cache is used to:
1. Bypass EMCC/ICF API rate limits
2. Speed up verification checks
3. Avoid 403 errors from excessive scraping

## Automatic Cleanup

The updated [DELETE_USER_MANUAL.sql](supabase/DELETE_USER_MANUAL.sql) script now **automatically clears** the verified_credentials cache when deleting a user.

### What It Does

```sql
-- Clear EMCC credential from cache
DELETE FROM verified_credentials
WHERE accreditation_body = 'EMCC'
AND credential_number = 'EIA20217053'; -- (or whatever the user's number was)

-- Clear ICF credential from cache
DELETE FROM verified_credentials
WHERE accreditation_body = 'ICF'
AND credential_number = 'ICF123456'; -- (or whatever the user's number was)
```

## Manual Cache Cleanup

If you need to manually clear cached credentials:

### Option 1: Clear Specific Credential

```sql
-- Clear a specific EMCC credential
DELETE FROM verified_credentials
WHERE accreditation_body = 'EMCC'
AND credential_number = 'EIA20217053';

-- Clear a specific ICF credential
DELETE FROM verified_credentials
WHERE accreditation_body = 'ICF'
AND credential_number = 'ICF123456';
```

### Option 2: Clear All Cached Credentials for a Name

```sql
-- Clear all credentials for a specific person
DELETE FROM verified_credentials
WHERE full_name = 'Paul Smith';
```

### Option 3: Clear All Cache (Nuclear Option)

```sql
-- ⚠️ WARNING: This clears ALL verified credentials
-- Only use if you want to start fresh
DELETE FROM verified_credentials;
```

## Verification

After deletion, verify the credentials are available for reuse:

```sql
-- Check if credential exists in cache
SELECT *
FROM verified_credentials
WHERE credential_number = 'EIA20217053';

-- Should return 0 rows if successfully cleared
```

## Production Considerations

### Should You Clear Cache in Production?

**NO** - In production, you typically want to:

1. **Keep the cache** - Credentials remain valid even if one coach leaves
2. **Mark as available** - Update `is_active = false` instead of deleting
3. **Audit trail** - Keep records for compliance/reporting

### Production-Safe Approach

Instead of deleting from cache:

```sql
-- Mark credential as no longer in use (but keep record)
UPDATE verified_credentials
SET is_active = false,
    notes = 'Coach account deleted on ' || NOW()::DATE
WHERE credential_number = 'EIA20217053';
```

This allows:
- ✅ New coaches to use the same credential
- ✅ Audit trail of who used what when
- ✅ Compliance reporting
- ✅ Faster re-verification if coach returns

### Why Clear in Development/Testing?

For test users, you SHOULD clear the cache because:
- You're reusing the same test credentials repeatedly
- You don't need an audit trail
- You want to test the full verification flow
- You want to avoid "credential already exists" errors

## Summary

✅ **Development/Testing**: Clear cache completely (DELETE)
- Allows immediate credential reuse
- No audit trail needed
- Faster testing cycles

✅ **Production**: Mark as inactive (UPDATE)
- Maintains audit trail
- Allows credential reuse
- Better compliance
- Can track credential usage history

The updated [DELETE_USER_MANUAL.sql](supabase/DELETE_USER_MANUAL.sql) uses the DELETE approach (appropriate for test users).

For production user deletion, you would use the soft-delete approach with `is_active = false`.
