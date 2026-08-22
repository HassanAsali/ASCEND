# ASCEND Focus Circles setup — v0.6.0.8–v0.6.0.11

If ASCEND reports `Circle creation failed`, `CIRCLE_SCHEMA_MISSING`, or “Focus Circles are not ready,” run the complete SQL file below once in the same Supabase project used by the production Vercel variables. Testers never run this owner-only setup.

Focus Circles are an optional signed-in feature for small private groups. They add shared lectures, assignments, focus sessions, and an opt-in progress board without turning social activity into XP or Rank.

## One-time owner setup

1. Open the same Supabase project used by ASCEND.
2. In SQL Editor, run `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql` once.
3. Redeploy the current ASCEND release to the existing Vercel production project.
4. Open `/api/health` through the production app and confirm `socialConfigured` is `true`.

No new API key or environment variable is required. The existing server-only Supabase Secret key performs membership-checked Circle operations. Never move that key into frontend code or `/api/config`.

## First test

1. Account A creates a Circle and copies its random invite code.
2. Account B joins using that code.
3. Both accounts open Circles and refresh.
4. Add one shared session and mark it complete from B.
5. Confirm neither account gains XP and neither Rank changes.

## Privacy and abuse boundaries

- Direct `anon` and `authenticated` table access is revoked. All requests require a valid Supabase bearer session and server-side membership checks.
- Members see display names and limited progress summaries, not email addresses, Quest text, recovery data, or player-state.
- Shared titles/notes are visible to Circle members. Do not use Circles for secrets or sensitive personal data.
- A Circle is limited to 30 members; an owner is limited to five Circles.
- The progress board is motivational only. Server endpoints cannot award XP, complete a Quest, or promote Rank.
