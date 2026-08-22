# ASCEND v0.6.0.4 Architecture

## Client

- Static HTML/CSS/JavaScript PWA.
- Local-first state in browser storage.
- Guided onboarding engine with desktop/mobile targets.
- Web Crypto AES-GCM encryption before cloud upload.
- Per-user local cloud cache and per-user recovery key.
- Separate persistent Guest namespace; authenticated caches are keyed by Supabase user ID.
- Identity-epoch guards discard stale asynchronous sync results after identity switching.
- Height-aware responsive layers adapt authentication, the mobile System sheet, and the desktop command rail independently of viewport width.
- A pure client skill engine maps selected categories into deduplicated transferable capabilities and migrates legacy category-specific Skill XP into the new global keys.
- Accepted quests persist their normalized semantic Skill allocation, so completion and reversal remain exact across future engine versions.
- Daily Quests use immutable dated completion occurrences. The next occurrence is generated once and remains client-enforced locked until its local calendar date; only an explicit same-day undo reverses the earned ledger.
- Quest Board renders each quest type in a distinct operational lane so Daily recurrence cannot visually mix with Main, Side, Campaign, or Boss work.
- An analyzed quest keeps the exact reward shown during review; only a user edit to reward-affecting fields triggers a new calculation.
- Apple PWA onboarding provides Safari Home Screen installation instructions and dedicated PNG app icons.
- The recovery vault supports one-time Recovery File download/import per browser/device while retaining client-only encryption.
- External Request senders use a standalone no-account page. It creates a fresh AES-256-GCM key per message and wraps that key with the owner's RSA-OAEP-256 public key.
- The matching RSA private JWK is encrypted again with the account recovery vault before local/cache/cloud storage.
- iPhone standalone spacing uses the safe-area inset and ordinary text Recovery Files remain visible in the iOS Files picker.
- The Planner is an account-scoped part of encrypted player-state. Lists, semesters, courses, sections, class times, work shifts, appointments, and protected study blocks never award XP by themselves; only an explicit conversion of a real list/course item creates a normal Quest.
- Schedule conflict detection is deterministic and local. Planner migrations cap collection sizes and normalize user-entered dates, times, text, and estimates before persistence.
- External Request AI review sends a single-objective contract to the classifier and strips automatic subquests, preventing sender metadata from becoming Batch tasks.

## Server

- Node.js HTTP server for local development.
- Gemini calls remain server-side.
- `/api/config` exposes only public Supabase client configuration.
- `/api/feedback` verifies the Supabase access token, validates/sanitizes the report, and inserts it with the server-only Supabase secret.
- Public request endpoints return only a public encryption key, verify token-bound Turnstile, and store only a validated encrypted envelope.
- Owner inbox endpoints verify the Supabase access token and scope all reads/updates through the server to that user's inbox.
- `api/index.mjs` adapts the same request handler for Vercel serverless deployment.

## Cloud

- Supabase Auth for beta identities.
- Postgres `player_state` table.
- Postgres `beta_feedback` table with RLS enabled and all browser-role access revoked.
- Postgres `external_inboxes` and `external_requests` with RLS enabled, browser access revoked, hashed capability tokens, expiry, replay hashes, and database-enforced limits.
- RLS restricts normal clients to `auth.uid() = user_id`.
- `encrypted_state` stores the browser-encrypted envelope.

## Sync model

1. Save locally immediately.
2. Encrypt current state in the browser.
3. Debounced cloud push when online.
4. Pull on sign-in, focus, reconnect, manual Sync Now, and periodic foreground reconciliation.
5. Newest `updated_at` state wins.
6. Locked encrypted remote state cannot be overwritten until the recovery key is supplied.
7. Guest state and generic legacy device state are never cloud-sync candidates.
