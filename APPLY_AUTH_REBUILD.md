# Apply Authentication Rebuild - Quick Start

**⏱️ Estimated Time:** 5 minutes
**🎯 Objective:** Fix email verification by applying database trigger

---

## Step 1: Apply Database Migration

### Option A: Supabase Dashboard (Recommended)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `database_migrations/006_auto_create_profile_trigger.sql`
6. Paste into SQL Editor
7. Click **Run** (or press Cmd+Enter / Ctrl+Enter)

**Expected Output:**
```
Success. No rows returned.
```

### Option B: Supabase CLI (Alternative)

```bash
# From project root
supabase db push

# Or execute specific migration
supabase db execute -f database_migrations/006_auto_create_profile_trigger.sql
```

---

## Step 2: Verify Migration Applied

Run this verification query in SQL Editor:

```sql
-- Check if trigger exists
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgname = 'on_auth_user_email_confirmed';

-- Check if function exists
SELECT
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'handle_new_user_email_confirmation';
```

**Expected Results:**
- First query: 1 row with trigger_name = `on_auth_user_email_confirmed`, enabled = `O` (origin trigger)
- Second query: 1 row with function_name = `handle_new_user_email_confirmation`

**If no results:** Migration didn't apply - check for SQL errors in Step 1.

---

## Step 3: Test the New Flow

### Quick Test (2 minutes):

1. **Navigate to signup:**
   ```
   http://localhost:3000/coach-signup
   ```

2. **Create test account:**
   - Email: `test-rebuild-$(date +%s)@example.com` (unique email)
   - Password: `TestPassword123!`
   - Complete license verification (use any accreditation body)

3. **Check email and click verification link**
   - Should see: "Verification Successful!" ✅
   - Should auto-redirect to login page after 3 seconds

4. **Verify profile was created by trigger:**
   ```sql
   SELECT
     id, user_id, name, email,
     subscription_status, trial_ends_at,
     created_at
   FROM coaches
   WHERE email = 'your-test-email@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   **Expected:** 1 row with:
   - `subscription_status` = `'trial'`
   - `trial_ends_at` = ~30 days from now
   - `created_at` = timestamp from when you clicked verification link

5. **Test login:**
   - Enter email and password
   - Click "Sign In"
   - Should redirect to dashboard ✅
   - Should see profile dropdown with your name ✅
   - Should see "Trial" status ✅

---

## Step 4: Monitor Database Logs (Optional)

To see the trigger in action:

1. Go to **Supabase Dashboard → Logs → Database**
2. Filter by: `"handle_new_user_email_confirmation"`
3. Look for log entries like:
   ```
   NOTICE: handle_new_user_email_confirmation: Email confirmed for user <uuid>
   NOTICE: handle_new_user_email_confirmation: Creating profile for user <uuid> with name: Full Name
   NOTICE: handle_new_user_email_confirmation: ✅ Profile created successfully for user <uuid>
   ```

**If you see WARNING or ERROR:** Check the error message and refer to [AUTH_REBUILD_GUIDE.md](AUTH_REBUILD_GUIDE.md#debugging-guide)

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Database trigger exists and is enabled
- [ ] Test signup completes successfully
- [ ] Verification email arrives
- [ ] Clicking verification link shows success message
- [ ] Auto-redirects to login page
- [ ] Profile was created in database (query shows row)
- [ ] Login works after verification
- [ ] Dashboard loads with trial status
- [ ] No console errors in browser DevTools

---

## 🚨 Troubleshooting

### "Trigger not found" after Step 2

**Cause:** SQL migration didn't execute or failed silently.

**Fix:**
1. Check SQL Editor for red error messages
2. Ensure you have permissions to create triggers (need `postgres` or `service_role` role)
3. Try running migration line-by-line to identify failing statement

### "Profile not created" after verification

**Cause:** Trigger didn't fire or failed during execution.

**Fix:**
1. Check database logs for WARNING/ERROR messages
2. Verify user's email was confirmed:
   ```sql
   SELECT id, email, email_confirmed_at
   FROM auth.users
   WHERE email = 'your-test-email@example.com';
   ```
   - If `email_confirmed_at` is NULL → email wasn't verified
   - If `email_confirmed_at` has timestamp but no profile → trigger failed

3. Check trigger is enabled:
   ```sql
   SELECT tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_email_confirmed';
   ```
   - Should return: `O` (enabled)
   - If `D` (disabled) → run: `ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_email_confirmed;`

### "No rows returned" in verification query (Step 2)

**Cause:** Trigger doesn't exist - migration didn't apply.

**Fix:**
1. Re-run entire migration SQL file
2. Check Supabase project permissions
3. Ensure you're connected to correct project/database

---

## 📚 Additional Resources

- **Complete Guide:** [AUTH_REBUILD_GUIDE.md](AUTH_REBUILD_GUIDE.md)
- **Migration SQL:** [database_migrations/006_auto_create_profile_trigger.sql](database_migrations/006_auto_create_profile_trigger.sql)
- **Deprecated Protocol:** [VERIFICATION_TESTING_PROTOCOL.md](VERIFICATION_TESTING_PROTOCOL.md) (historical reference only)

---

## 🎉 You're Done!

If all checklist items pass, your authentication system is now production-ready. The `setSession()` deadlock issue is permanently resolved.

**Next Steps:**
- Deploy to production
- Monitor signup/verification metrics
- Test with real email addresses (not temp mail services)
- Launch in 3-4 weeks as planned! 🚀

---

**Need Help?** Contact support@coachdog.com

**Last Updated:** December 13, 2025
