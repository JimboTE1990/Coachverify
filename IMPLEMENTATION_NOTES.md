# CoachVerify - Implementation Notes & Status

## Recently Completed (Jan 3, 2026)

### ✅ Comprehensive Coaching Fields
- **Types Added**: 7 categories with 80+ coaching expertise subcategories, 40+ CPD qualifications, 40+ languages
- **UI Added**: Three new sections in CoachDashboard profile editor with checkbox interfaces
- **Database Migration Created**: `015_add_coaching_expertise_cpd_languages.sql` - ready to run
- **Status**: ALL USERS can access these new fields in `/for-coaches` dashboard profile tab

### ✅ Email Verification Flow
- **CheckEmail Page**: Dedicated page for post-signup email verification with resend functionality
- **Rate Limiting**: 60-second cooldown on resend attempts
- **Error Handling**: Comprehensive error messages with logging

### ✅ Standardized Error Handling Utility
- **File Created**: `/utils/errorHandling.ts`
- **Features**:
  - Generic user-facing messages
  - Detailed logging for debugging
  - Categorized errors (network, auth, validation, etc.)
  - Special handlers for verification and auth errors

---

## 🔴 PRIORITY TASKS (User Requests - Jan 3, 2026)

### 1. Update All Error Messages to Use Standardized Utility

**Current State**: Error messages currently show raw technical errors to users

**Required Changes**:

#### A. CheckEmail.tsx - ✅ PARTIALLY COMPLETE
- Already updated to use `handleVerificationError()`
- Errors now logged but show user-friendly messages

#### B. VerifyEmail.tsx - NEEDS UPDATE
**File**: `/pages/VerifyEmail.tsx` (lines 48-84)
```typescript
// Current (line 48-60):
if (error || errorCode === 'otp_expired') {
  setStatus('expired');
  setMessage('This verification link has expired...');
  return;
}

// Change to:
import { handleVerificationError } from '../utils/errorHandling';

if (error || errorCode === 'otp_expired') {
  const errorResponse = handleVerificationError(error, {
    component: 'VerifyEmail',
    action: 'verify email link',
    metadata: { type, errorCode }
  });
  setStatus('expired');
  setMessage(errorResponse.userMessage);
  return;
}
```

#### C. ResendVerification.tsx - NEEDS UPDATE
**File**: `/pages/ResendVerification.tsx` (lines 48-65)

Replace error handling blocks with:
```typescript
import { handleVerificationError } from '../utils/errorHandling';

if (error) {
  const errorResponse = handleVerificationError(error, {
    component: 'ResendVerification',
    action: 'resend verification email',
    metadata: { email }
  });
  setMessage(errorResponse.userMessage);
  // Handle redirect if needed
  if (errorResponse.shouldRedirect) {
    setTimeout(() => navigate(errorResponse.shouldRedirect!), 2000);
  }
  return;
}
```

#### D. CoachSignup.tsx - NEEDS MAJOR UPDATE
**File**: `/pages/CoachSignup.tsx` (lines 141-197)

Current issues:
- Shows raw Supabase error messages
- Has duplicate email check error messages scattered throughout
- No standardized error handling

Required changes:
```typescript
import { handleError, handleAuthError } from '../utils/errorHandling';

// In handleCompleteSignup function (line 114):
try {
  const { data: authData, error: authError } = await supabase.auth.signUp({...});

  if (authError) {
    const errorResponse = handleAuthError(authError, {
      component: 'CoachSignup',
      action: 'create account',
      metadata: { email: formData.email }
    });
    setSignupError(errorResponse.userMessage);
    return;
  }
} catch (err: any) {
  const errorResponse = handleError(err, {
    component: 'CoachSignup',
    action: 'complete signup',
    metadata: { step: 'final' }
  });
  setSignupError(errorResponse.userMessage);
} finally {
  setLoading(false);
}
```

#### E. CoachLogin.tsx - NEEDS UPDATE
**File**: `/pages/CoachLogin.tsx` (lines 37-63)

Currently shows:
```typescript
setError(result.error || 'Login failed. Please check your credentials.');
```

Change to:
```typescript
import { handleAuthError } from '../utils/errorHandling';

// In handleLogin function:
try {
  const result = await login(email, password);

  if (!result.success) {
    const errorResponse = handleAuthError(result.error, {
      component: 'CoachLogin',
      action: 'login',
      metadata: { email }
    });
    setError(errorResponse.userMessage);

    // Show resend verification banner if email not verified
    if (result.error?.message?.includes('email not confirmed')) {
      setShowResendBanner(true);
    }
  }
}
```

---

### 2. Enhance Re-Verification Flow with Better Access Points

**Problem**: Users who don't complete verification on signup day have no easy way to resend verification email

**Current Access Points**:
1. ✅ `/check-email` - After signup
2. ✅ `/resend-verification` - Standalone page (exists but hidden)
3. ❌ Login page - NO prominent resend option
4. ❌ Expired email link - Shows generic error

**Required Enhancements**:

#### A. Add Resend Banner to Login Page

**File**: `/pages/CoachLogin.tsx`

Add state:
```typescript
const [showResendBanner, setShowResendBanner] = useState(false);
const [resendEmail, setResendEmail] = useState('');
```

Detect unverified email error and show banner:
```typescript
// After error in handleLogin:
if (result.error?.message?.includes('email not confirmed') ||
    result.error?.message?.includes('not verified')) {
  setShowResendBanner(true);
  setResendEmail(email); // Capture the email they tried to log in with
}
```

Add banner in JSX (after error message):
```tsx
{showResendBanner && (
  <div className="mt-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-bold text-yellow-900">Email Not Verified</p>
        <p className="text-xs text-yellow-800 mt-1">
          Please verify your email before logging in. We can send you a new verification link.
        </p>
        <button
          onClick={() => navigate('/check-email', { state: { email: resendEmail } })}
          className="mt-3 text-xs font-bold text-yellow-900 bg-yellow-200 hover:bg-yellow-300 px-4 py-2 rounded-lg transition-colors"
        >
          Resend Verification Email
        </button>
      </div>
    </div>
  </div>
)}
```

#### B. Make Check-Email Directly Accessible

**Current**: CheckEmail requires email from location state
**Problem**: Users can't bookmark or directly access it

**Solution**: Make email input always visible if no email provided

**File**: `/pages/CheckEmail.tsx` (lines 123-133)

Change conditional rendering:
```tsx
{/* Current: Only shows email if passed from signup */}
{emailFromState && (
  <p className="text-brand-600 font-bold mb-6 text-center break-all">
    {emailFromState}
  </p>
)}

{/* Change to: Always show email, but make it editable if not from state */}
<div className="mb-6">
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="your.email@example.com"
    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-center font-bold text-brand-600"
    disabled={!!emailFromState} // Only disable if came from signup
  />
  {!emailFromState && (
    <p className="text-xs text-slate-500 mt-2 text-center">
      Enter the email you signed up with
    </p>
  )}
</div>
```

#### C. Add "Resend Verification" Link to Main Nav

**File**: `/components/Layout.tsx`

Add link in navigation (for non-authenticated users):
```tsx
{!isAuthenticated && (
  <Link
    to="/check-email"
    className="text-sm font-medium text-slate-600 hover:text-brand-600"
  >
    Resend Verification
  </Link>
)}
```

---

### 3. Verify New Coaching Fields UI is Accessible

**Question**: Are the new coaching expertise, CPD qualifications, and languages fields available to all users?

**Answer**: ✅ YES - Available Now

**Access Path**:
1. Login at `/coach-login`
2. Navigate to `/for-coaches` (dashboard)
3. Click "Edit Profile" tab in sidebar (or mobile tab bar)
4. Scroll down past "Basic Info", "Matching Criteria", "Professional Credentials"
5. **New Sections Appear**:
   - "Coaching Areas of Expertise" (purple gradient box)
   - "CPD Qualifications & Certifications" (teal gradient box)
   - "Coaching Languages" (blue gradient box)

**How to Test**:
```bash
# 1. Login with an existing coach account
# 2. Check browser console for any TypeScript errors
# 3. Open dashboard profile tab
# 4. Confirm three new collapsible sections are visible
# 5. Try checking/unchecking expertise areas
# 6. Try checking CPD qualifications
# 7. Try selecting languages
# 8. Click "Save Changes" button
```

**Database Migration Required**:
Before the fields will persist in the database, run:
```sql
-- In Supabase SQL Editor:
\i database_migrations/015_add_coaching_expertise_cpd_languages.sql
```

**Current State**:
- ✅ TypeScript types defined
- ✅ UI forms created with all options
- ✅ Form state management working
- ❌ Database columns NOT YET created (migration exists but not run)
- ⚠️ Saving will work in local state but won't persist until migration runs

---

## Summary of Required Actions

### Immediate (High Priority)
1. **Run database migration** `015_add_coaching_expertise_cpd_languages.sql` in Supabase SQL Editor
2. **Update error handling** in 5 files (VerifyEmail, ResendVerification, CoachSignup, CoachLogin, CheckEmail)
3. **Add resend verification banner** to login page for unverified emails
4. **Make CheckEmail email input editable** for direct access

### Soon (Medium Priority)
5. Test new coaching fields end-to-end after migration
6. Add "Resend Verification" link to main navigation
7. Update CoachProfile display page to show new fields

### Later (Nice to Have)
8. Add search/filter by coaching expertise on client search page
9. Add search/filter by language on client search page
10. Add CPD qualifications to coach badges/credentials display

---

## Files Modified Today

### Created:
- `/utils/errorHandling.ts` - Standardized error handling utility ✅
- `/database_migrations/015_add_coaching_expertise_cpd_languages.sql` - Schema update ✅
- `/IMPLEMENTATION_NOTES.md` - This file ✅

### Modified:
- `/types.ts` - Added coaching expertise, CPD, languages types ✅
- `/pages/CoachDashboard.tsx` - Added three new form sections ✅
- `/pages/CheckEmail.tsx` - Updated to use standardized error handling ✅

### Pending Modifications:
- `/pages/VerifyEmail.tsx` - Update error handling ⏳
- `/pages/ResendVerification.tsx` - Update error handling ⏳
- `/pages/CoachSignup.tsx` - Update error handling ⏳
- `/pages/CoachLogin.tsx` - Update error handling + add resend banner ⏳

---

## Next Steps

**Recommended Order**:
1. Run database migration to enable new fields
2. Update all error handling to use standardized utility
3. Add resend verification banner to login page
4. Test complete user journey: signup → verify → profile edit → logout → login

**Testing Scenarios**:
- New user signup (happy path)
- User forgets to verify email, tries to login next day
- User clicks expired verification link
- User tries to resend verification too quickly (rate limit)
- User with verified email tries to resend (already verified)
