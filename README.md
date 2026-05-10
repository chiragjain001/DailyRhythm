# Next.js + Supabase Auth & Database Integration

This project integrates Supabase Auth (email/password) and three tables with RLS: `agenda`, `habits`, and `wellness_checklist`.

## Features

- Email/password signup & login at `/auth`
- Agenda UI at `/agenda` with add/list/mark complete
- Supabase client in `lib/supabaseClient.ts`
- CRUD helpers in `lib/db.ts`
- SQL migration with tables + RLS + policies in `supabase/migrations/0001_init.sql`

## Prerequisites

- Node 18+
- pnpm
- Supabase project (free tier is fine)

## Install dependencies

```bash
pnpm add @supabase/supabase-js
```

## Environment setup

Create `.env.local` in the project root with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Note: `.env*` files are gitignored in this repo. If you prefer an example file, create `.env.local.example` with the same variable names (do not include secrets) and copy it to `.env.local` locally.

## Database setup

1. Open your Supabase project → SQL Editor.
2. Copy the contents of `supabase/migrations/0001_init.sql` and run it.
3. This will create tables, enable RLS, and add policies so each user only sees their own rows.

## Run locally

```bash
pnpm dev
```

- Visit `/auth` to sign up or sign in.
- After logging in, visit `/agenda` to add/list/complete tasks.

## Deploy to Vercel + Supabase

1. Push this repo to GitHub/GitLab.
2. Import the repo into Vercel.
3. In Vercel Project Settings → Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy. The app should work on the free tier.

## Notes

- `lib/db.ts` implements:
  - `addAgendaTask(task, userId)`, `fetchAgenda(userId)`, `completeAgendaTask(taskId)`
  - `addHabit(habit, userId)`, `fetchHabits(userId)`, `completeHabit(habitId)`
  - `addWellnessActivity(activity, userId)`, `fetchWellnessChecklist(userId)`, `completeWellnessActivity(activityId)`
- All tables include `user_id` referencing `auth.users(id)`. RLS ensures users can only access their own rows.
