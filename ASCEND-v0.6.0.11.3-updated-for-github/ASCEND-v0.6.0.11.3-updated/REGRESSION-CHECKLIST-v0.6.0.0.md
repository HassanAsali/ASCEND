# ASCEND v0.6.0.0 — Focused Regression Checklist

Run only a few checks at a time after deployment.

## Group 1 — deployment

1. `/api/health` reports version `0.6.0.0` and `externalRequestsConfigured: true`.
2. Existing account sign-in restores the same player/quests without onboarding.
3. On iPhone Home Screen, Command starts below the status bar.

## Group 2 — request link

1. Create the link in System and open it in a private browser.
2. Submit one meeting request after Turnstile.
3. Refresh Quests; it appears only under External Requests and not as a Quest.

## Group 3 — review integrity

1. Dismiss a test request; it leaves the pending inbox.
2. Accept another through manual review; exactly one Quest appears and no XP is awarded until completion.
3. Use AI review, rewrite the text, and confirm the original request remains pending rather than being auto-accepted.

## Group 4 — isolation/recovery

1. A second account cannot see the first account's request inbox or player-state.
2. Guest cannot create/read an external inbox.
3. On a new device, import the `.txt` Recovery File first; cloud player-state and encrypted requests then decrypt.
