# Deploy Edge Functions Guide

## Quick Deploy Command

To deploy the EMCC verification function with the correct name:

```bash
cd "/Users/jamiefletcher/Documents/Claude Projects/CoachDog/Coachverify"

# Get your access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=your_token_here

# Deploy the function
npx supabase functions deploy verify-emcc-accreditation --project-ref YOUR_PROJECT_REF
```

## Find Your Project Ref

Your project ref is in the Supabase dashboard URL:
`https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]`

## After Deployment

1. Go to Edge Functions in dashboard
2. Verify `verify-emcc-accreditation` is listed and active
3. Delete `bright-processor` if it exists (old/wrong function)
4. Test verification with Paul Jones + wrong EIA
5. Check logs in `verify-emcc-accreditation` → Logs tab
