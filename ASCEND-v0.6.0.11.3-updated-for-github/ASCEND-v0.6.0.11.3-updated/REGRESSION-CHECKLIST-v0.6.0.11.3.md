# ASCEND v0.6.0.11.3 — Friends Regression Checklist

Apply `SUPABASE-FRIENDS-v0.6.0.11.3.sql` once before testing Friends.

## First short test

1. Deploy and open `/api/health`; confirm version `0.6.0.11.3` and the five `friend-*` feature markers.
2. Sign in as Account A, open Friends, copy its private code.
3. Sign in as Account B in another browser/profile, paste the code, send the request, then confirm Account A can accept it.

## Collaboration test

1. Add one shared Study plan from Account A.
2. Mark it complete as A, then independently as B.
3. Confirm Shared Completions changes only when enabled and neither account's XP, Rank, skills, or milestones change.

## Lifecycle and privacy test

1. Test decline and outgoing-request cancellation with a fresh private code.
2. Remove an accepted friend; verify shared plans disappear from normal lists.
3. Block a request; verify neither account sees the blocked relationship and the same code gives only the generic unavailable response.
4. Rotate the private code and confirm the previous code no longer works.

## Automated verification

Run `npm test`. The suite covers syntax, schema/RLS markers, relationship transitions, account isolation, no email search, and XP/Rank non-mutation.
