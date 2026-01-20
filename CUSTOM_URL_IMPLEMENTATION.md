# Custom URL Implementation Guide

## ✅ What's Already Done

1. **Database Migration** ([supabase/migrations/20260120_add_custom_url.sql](supabase/migrations/20260120_add_custom_url.sql))
   - Added `custom_url` column to `coaches` table
   - Unique constraint to prevent duplicates
   - URL-safe validation (lowercase, numbers, hyphens, 3-50 chars)
   - Index for fast lookups

2. **TypeScript Types** ([types.ts](types.ts))
   - Added `customUrl?: string` to Coach interface

## 🚧 What Needs to Be Done

### 1. Run the Database Migration

You need to run the SQL migration in your Supabase dashboard:

```bash
# Go to Supabase Dashboard → SQL Editor → Paste and run:
/Users/jamiefletcher/Documents/Claude Projects/CoachDog/Coachverify/supabase/migrations/20260120_add_custom_url.sql
```

### 2. Update Coach Dashboard Settings

Add a section in CoachDashboard.tsx for coaches to set/edit their custom URL:

```typescript
// In CoachDashboard.tsx, add to the Profile Settings section:

const [customUrlInput, setCustomUrlInput] = useState(currentCoach?.customUrl || '');
const [customUrlError, setCustomUrlError] = useState('');

const validateCustomUrl = (url: string): boolean => {
  // Must be 3-50 characters, lowercase letters, numbers, hyphens only
  const urlRegex = /^[a-z0-9-]{3,50}$/;
  return urlRegex.test(url);
};

const handleCustomUrlSave = async () => {
  if (!validateCustomUrl(customUrlInput)) {
    setCustomUrlError('URL must be 3-50 characters: lowercase letters, numbers, hyphens only');
    return;
  }

  try {
    const { error } = await supabase
      .from('coaches')
      .update({ custom_url: customUrlInput })
      .eq('id', currentCoach.id);

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        setCustomUrlError('This URL is already taken. Please choose another.');
      } else {
        setCustomUrlError('Failed to save custom URL');
      }
      return;
    }

    showToast('Custom URL saved successfully!', 'success');
    setCustomUrlError('');
  } catch (err) {
    setCustomUrlError('An error occurred');
  }
};

// JSX:
<div className="mb-6">
  <label className="block text-sm font-bold text-slate-900 mb-2">
    Custom Profile URL
  </label>
  <div className="flex items-center gap-2">
    <span className="text-slate-600">coachdog.com/coach/</span>
    <input
      type="text"
      value={customUrlInput}
      onChange={(e) => setCustomUrlInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
      placeholder="jonnysmith"
      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
    />
  </div>
  {customUrlError && (
    <p className="text-red-600 text-sm mt-1">{customUrlError}</p>
  )}
  <p className="text-xs text-slate-500 mt-2">
    Create a custom URL for your profile. Use lowercase letters, numbers, and hyphens only (3-50 characters).
  </p>
  <button
    onClick={handleCustomUrlSave}
    className="mt-3 bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700"
  >
    Save Custom URL
  </button>
</div>
```

### 3. Update getCoachById Function

Modify `services/supabaseService.ts` to support both UUID and custom URL:

```typescript
export const getCoachById = async (idOrCustomUrl: string): Promise<Coach | null> => {
  try {
    // Try UUID first (most common case)
    let query = supabase
      .from('coaches')
      .select('*')
      .eq('id', idOrCustomUrl)
      .single();

    let { data, error } = await query;

    // If not found by ID, try custom URL
    if (error && error.code === 'PGRST116') {
      query = supabase
        .from('coaches')
        .select('*')
        .eq('custom_url', idOrCustomUrl)
        .single();

      ({ data, error } = await query);
    }

    if (error || !data) {
      console.error('Error fetching coach:', error);
      return null;
    }

    return mapCoach(data);
  } catch (error) {
    console.error('Error in getCoachById:', error);
    return null;
  }
};
```

### 4. Update CoachCard Links

Update `components/CoachCard.tsx` to use custom URL if available:

```typescript
// In CoachCard.tsx, change the Link to:
<Link
  to={`/coach/${coach.customUrl || coach.id}`}
  className="..."
>
```

### 5. Update Share Functionality

Update the share URL in `pages/CoachDetails.tsx` to use custom URL:

```typescript
const handleShare = () => {
  const shareUrl = coach.customUrl
    ? `${window.location.origin}/coach/${coach.customUrl}`
    : window.location.href;

  if (navigator.share) {
    navigator.share({
      title: `${coach.name} - CoachDog`,
      text: `Check out ${coach.name} on CoachDog`,
      url: shareUrl
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareUrl);
    alert('Profile link copied to clipboard!');
  }
};
```

### 6. Display Custom URL in Dashboard

Show the coach their current custom URL:

```typescript
// In CoachDashboard.tsx, display current URL:
{currentCoach.customUrl && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
    <p className="text-sm text-green-900">
      <strong>Your custom URL:</strong>{' '}
      <a
        href={`/coach/${currentCoach.customUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 underline font-bold"
      >
        coachdog.com/coach/{currentCoach.customUrl}
      </a>
    </p>
  </div>
)}
```

## 🎯 User Flow Example

1. **Coach signs up** → Gets default URL: `/coach/abc-123-uuid`
2. **Coach goes to dashboard** → Sees "Custom Profile URL" field
3. **Coach enters "jonnysmith"** → Clicks "Save Custom URL"
4. **System validates**:
   - ✅ Lowercase letters, numbers, hyphens only
   - ✅ 3-50 characters
   - ✅ Not already taken
5. **Profile URL changes** → `/coach/jonnysmith`
6. **Share button uses new URL** → Coaches share prettier links

## ⚠️ Important Notes

- **Backward Compatibility**: Old UUID links still work (don't break existing shares)
- **Uniqueness**: System prevents duplicate custom URLs
- **URL Safety**: Only allows safe characters (prevents XSS/injection)
- **Optional Feature**: Coaches can keep UUID if they prefer
- **Validation**: Frontend prevents invalid input, backend enforces constraints

## 🔗 Benefits

1. **Professional branding**: `coachdog.com/coach/jonnysmith` vs `coachdog.com/coach/abc-123`
2. **Memorable links**: Easier for clients to remember and share
3. **SEO**: Custom URLs may perform better in search engines
4. **Marketing**: Better for business cards, email signatures, social media

## 📝 Testing Checklist

- [ ] Run database migration
- [ ] Add custom URL input field to dashboard
- [ ] Test validation (too short, invalid characters, etc.)
- [ ] Test uniqueness (try duplicate URL)
- [ ] Update getCoachById to support custom URLs
- [ ] Test accessing profile via custom URL
- [ ] Test accessing profile via old UUID (backward compat)
- [ ] Update share button to use custom URL
- [ ] Test sharing with custom URL
- [ ] Update CoachCard links

## 🚀 Deployment Order

1. Deploy database migration (run SQL)
2. Deploy backend changes (getCoachById function)
3. Deploy frontend changes (dashboard UI, links, share)
4. Test thoroughly in production
5. Announce feature to coaches!
