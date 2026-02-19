# Edge Function Fix for Onboarding Verification

## Problem
The edge function tries to update the database with a temporary coach ID during onboarding, causing:
```
invalid input syntax for type uuid: "temp_1769102366921"
```

## Solution
Skip database operations when coachId starts with "temp_"

## Code to Replace

Find this section (around line 75-136):

```typescript
    // Update coach profile with verification result
    if (result.verified && result.matchDetails) {
      // Check if EIA number is already used by another coach
      ...database operations...
    }
```

Replace with:

```typescript
    // Check if this is a temporary ID (onboarding verification)
    const isTempId = coachId.startsWith('temp_');

    // Update coach profile with verification result (skip for temp IDs during onboarding)
    if (result.verified && result.matchDetails && !isTempId) {
      // Check if EIA number is already used by another coach
      // Note: Only checks active coaches (not soft-deleted ones if you use deleted_at pattern)
      const { data: existingCoaches, error: checkError } = await supabase
        .from('coaches')
        .select('id, name, email')
        .eq('emcc_verified', true)
        .eq('accreditation_level', result.matchDetails.level)
        .ilike('name', `%${fullName.split(' ')[fullName.split(' ').length - 1]}%`) // Check by last name
        .neq('id', coachId);

      if (checkError) {
        console.error('[EMCC Verification] Error checking for duplicates:', checkError);
      }

      // If another verified coach exists with similar name and same level, flag potential duplicate
      if (existingCoaches && existingCoaches.length > 0) {
        const existingCoach = existingCoaches[0];
        console.warn('[EMCC Verification] Potential duplicate detected:', existingCoach);
        return new Response(
          JSON.stringify({
            verified: false,
            confidence: 0,
            reason: `This EIA number appears to be already verified by another coach in our system (${existingCoach.name}). If you believe this is an error, please contact support at support@coachdog.com with your EIA number: ${eiaNumber}`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabase
        .from('coach_profiles')
        .update({
          emcc_verified: true,
          emcc_verified_at: new Date().toISOString(),
          emcc_profile_url: result.matchDetails.profileUrl || null,
          accreditation_level: result.matchDetails.level || accreditationLevel || null,
        })
        .eq('id', coachId);

      if (updateError) {
        console.error('[EMCC Verification] Error updating coach:', updateError);
        throw updateError;
      }

      console.log('[EMCC Verification] Coach verified successfully');
    } else if (!result.verified && !isTempId) {
      // Mark as unverified (skip for temp IDs)
      const { error: updateError } = await supabase
        .from('coach_profiles')
        .update({
          emcc_verified: false,
        })
        .eq('id', coachId);

      if (updateError) {
        console.error('[EMCC Verification] Error updating coach:', updateError);
        throw updateError;
      }

      console.log('[EMCC Verification] Coach not verified:', result.reason);
    } else if (isTempId) {
      console.log('[EMCC Verification] Skipping database update for temporary ID (onboarding)');
    }
```

## Key Changes
1. Added `const isTempId = coachId.startsWith('temp_');`
2. Changed `if (result.verified && result.matchDetails)` to `if (result.verified && result.matchDetails && !isTempId)`
3. Changed else block to `else if (!result.verified && !isTempId)`
4. Added `else if (isTempId)` to log when skipping database operations

This allows verification to work during onboarding without trying to update a non-existent coach record.
