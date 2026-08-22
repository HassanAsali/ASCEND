# ASCEND v0.6.0.11 regression checklist

Run only a few groups at a time.

## 1 — Retired First Action and batch intake

1. Submit three unrelated Arabic objectives as a batch.
2. Confirm each item keeps its own title, rationale and subquests, with no First Action anywhere.
3. Discard the middle result, review the others, then return; no text or result may move between objectives.

## 2 — Private-device session isolation

1. Sign in without Remember and confirm normal session-only behavior.
2. Sign in with **Remember this private device for 30 days**, reload, and confirm the account remains signed in.
3. Sign out and confirm the remembered session is removed. Switch Account A → B → Guest → A and verify no data crosses identities.

## 3 — Voice and notifications

1. Select Arabic and dictate Arabic. Repeat with English explicitly selected.
2. Enable System → Notification Center.
3. Add reminders to a Quest, Habit, weekly commitment and course class. Confirm settings survive reload without duplicate notifications.

## 4 — Habits and Circles

1. Create a Habit every 60 minutes from 08:00 to 20:00. Confirm the card says **Every hour, 08:00–20:00**, records one daily check-in and gives zero XP.
2. Apply `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql` once as owner, press Retry, create a Circle, and join from a second account.
3. Verify Circles expose no emails, Quest text, encrypted state, or automatic XP.

## 5 — Existing safety paths

- Wrong password, forgot password, account deletion and fresh Turnstile.
- Guest/new Guest and Account A/B isolation.
- Encrypted sync, recovery, External Requests, Planner, Projects, Daily recurrence and undo.
