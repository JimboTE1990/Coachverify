# CoachDog / Coachverify

A coaching directory and accreditation verification platform. Coaches sign up, verify their accreditation (EMCC, ICF, AC), and are listed in a searchable directory. Clients can browse coaches, view profiles, leave reviews, and book calls.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, React Router DOM 7
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe (subscriptions + lifetime membership)
- **Deployment**: Vercel — auto-deploys on push to `main`
- **Icons**: Lucide React

## Key Commands

```bash
npm run dev        # Start dev server (usually localhost:3000 or 3001)
npm run build      # Production build (must pass before shipping)
git push           # Triggers Vercel auto-deploy to production
```

## Directory Structure

```
pages/             # Route-level page components (31 files)
components/        # Reusable UI components (27 files)
services/          # Data layer — supabaseService.ts is the main file
contexts/          # React context providers (auth, etc.)
hooks/             # Custom React hooks
utils/             # Utility functions
types/             # TypeScript type definitions
constants/         # App-wide constants
supabase/
  functions/       # Edge Functions (Deno TypeScript runtime)
  migrations/      # SQL migration files (YYYYMMDD_description.sql)
```

## Key Files

| File | Purpose |
|------|---------|
| `services/supabaseService.ts` | Main data layer — all Supabase queries |
| `pages/CoachDetails.tsx` | Coach profile detail page (large file) |
| `pages/CoachList.tsx` | Coach directory / search page |
| `pages/CoachSignup.tsx` | Coach onboarding + accreditation verification |
| `pages/CoachDashboard.tsx` | Coach account management |
| `components/CoachCard.tsx` | Directory listing card |
| `supabase/functions/_shared/cors.ts` | Shared CORS headers for edge functions |

## Supabase

- **Auth**: Email/password, session managed via `AuthContext`
- **Storage bucket**: `profile-photos` (public) — coach profile + banner images
- **RLS**: All tables have Row Level Security enabled
- **Edge Functions**: Deno runtime — no Node.js APIs
- **Env vars**: `.env.local` (never commit)

## Domain Concepts

- **Accreditation bodies**: EMCC, ICF, AC — each has its own verification edge function
- **Verification status**: `pending_review` | `verified` | `rejected`
- **Subscription tiers**: Free trial → paid subscription OR lifetime membership (one-time)
- **Coach fields**: `total_reviews`, `average_rating` (aggregate columns updated via DB triggers)

## Coding Conventions

- All Supabase calls go through `services/supabaseService.ts`
- Components use TailwindCSS utility classes — no CSS modules
- TypeScript strict mode — avoid `any`
- No `SECURITY DEFINER` on views — use `SECURITY INVOKER` (default)
- Migration files: `supabase/migrations/YYYYMMDD_description.sql`
- React conditional rendering: use ternary or `!!` cast to avoid `{0}` rendering bugs

## Agents Available

| Command | Purpose |
|---------|---------|
| `/security-audit` | Full security sweep — RLS, secrets, auth, bucket policies |
| `/pre-ship` | Pre-deployment checklist before any push |
