# ASCEND v0.6.0.9 Security Notes

This patch adds no public endpoint, database table, browser grant, API key, environment variable, social publication, or new trusted input surface.

## Daily catch-up

- Catch-up is deterministic client-side date reconciliation over the current identity's already-loaded player state.
- It changes only the active Daily occurrence's scheduled date and missed-day audit fields.
- It grants zero XP, creates no completion event, does not mark an active day, and cannot promote Rank.
- Completed Daily history and future locked occurrences are immutable to this operation.

## Habits

- Habits live only inside the existing identity-scoped player state. Authenticated state is encrypted in the browser with the established AES-GCM vault before cloud sync; Guest state remains local-only.
- Habit check-ins do not award XP or publish to Focus Circles/leaderboards.
- User text is rendered through the existing escaped rendering path. Stored records and completion history are bounded during migration.

All v0.6.0.8 authentication, RLS, encrypted cloud state, external-request encryption, Turnstile, same-origin API checks, server-mediated Focus Circles, rate limits, recovery-vault, and account-switch clearing protections remain unchanged.
