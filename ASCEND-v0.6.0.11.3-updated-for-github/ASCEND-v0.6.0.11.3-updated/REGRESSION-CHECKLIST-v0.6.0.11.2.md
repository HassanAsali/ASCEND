# ASCEND v0.6.0.11.2 regression checklist

Scope: Circle Contribution XP + Finish/Archive Circle only. Run only a few checks at a time.

## Setup (once, in Supabase SQL Editor)

- Run `SUPABASE-UPGRADE-v0.6.0.11.2.sql`. Requires `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql` to already be applied. Safe to re-run.

## Circle Contribution XP

- Create a circle with two real accounts as members.
- Add a shared session item (e.g. 60 minutes) and complete it as member A only.
- Confirm member A's Circle XP increases by the expected amount and member B's does not change.
- Confirm account Total XP, level, and rank are unchanged for member A after completing the circle item.
- Undo the completion, then complete it again. Confirm the final Circle XP is the same as after the first completion — not doubled.
- Complete enough items in one day to approach the daily cap and confirm further completions that day stop adding Circle XP (the item still marks as done).

## Finish Circle

- As a non-owner member, confirm there is no Finish Circle option.
- As the owner, click Finish Circle, confirm the confirmation prompt, then confirm.
- Confirm the summary shown (participants, sessions completed, total Circle XP) looks correct.
- Confirm the circle now appears under "Archived Circles" for every member.
- Confirm no member (including the owner) can add, edit, or complete anything in a finished circle.
- Try finishing the same circle again (e.g. via a stale button state or repeat click) and confirm it does not error or double-count.

## Automated verification

- `node --check server.mjs`
- `node --check public/app.js`
- `node --check tests/smoke.mjs`
- `npm test`
