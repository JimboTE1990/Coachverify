# Deploy Stripe Checkout Edge Function to Supabase

## Option 1: Deploy via Supabase Dashboard (No CLI needed)

### Step 1: Go to Edge Functions in Supabase Dashboard

1. Open https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce
2. Click "Edge Functions" in the left sidebar
3. Click "Create a new function"

### Step 2: Create the Function

- **Function name:** `create-checkout-session`
- **Copy the code from:** `supabase/functions/create-checkout-session/index.ts`
- Click "Deploy function"

### Step 3: Set Environment Variables

1. In the Edge Functions page, click on your `create-checkout-session` function
2. Go to "Settings" tab
3. Click "Add Secret"
4. Add the following secrets:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** Your Stripe secret key from .env file (starts with `sk_test_...`)

5. Add another secret:
   - **Name:** `APP_URL`
   - **Value:** `https://coachverify.vercel.app`

### Step 4: Test the Function

Your function will be available at:
```
https://whhwvuugrzbyvobwfmce.supabase.co/functions/v1/create-checkout-session
```

### Step 5: Update Frontend Code

Update `services/stripeService.ts` line 36 to use Supabase endpoint:

```typescript
const apiUrl = isDevelopment
  ? 'http://localhost:3001'
  : 'https://whhwvuugrzbyvobwfmce.supabase.co/functions/v1';
```

---

## Option 2: Deploy via CLI (If you install Homebrew later)

### Install Homebrew first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Then install Supabase CLI:
```bash
brew install supabase/tap/supabase
```

### Deploy:
```bash
cd /Users/jamiefletcher/Documents/Claude\ Projects/CoachDog/Coachverify

# Login to Supabase
supabase login

# Link project
supabase link --project-ref whhwvuugrzbyvobwfmce

# Set secrets (use your actual Stripe secret key from .env)
supabase secrets set STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY_HERE

# Deploy function
supabase functions deploy create-checkout-session
```

---

## Function Code (for copy-paste into dashboard)

See `supabase/functions/create-checkout-session/index.ts` for the complete code.

Make sure to also copy the CORS headers from `supabase/functions/_shared/cors.ts` into the function code.
