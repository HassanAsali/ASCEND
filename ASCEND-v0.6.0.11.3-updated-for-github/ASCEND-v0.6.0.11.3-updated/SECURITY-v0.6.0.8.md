# ASCEND v0.6.0.8 — Security review

## Preserved controls

- Confirmed-email Supabase authentication and user-ID-scoped `player_state` RLS.
- Separate Guest and authenticated local namespaces; account switching invalidates stale hydration and social requests.
- AES-256-GCM player-state encryption in the browser before cloud upload; the recovery key is not uploaded with that state.
- Server-only Gemini, Supabase Secret, Turnstile Secret, feedback, account-deletion, External Request, and Circle operations.
- Same-origin and Fetch Metadata enforcement for unsafe API methods, restrictive CORS behavior, body-size bounds, timeouts, rate limits, no-store API responses, CSP, HSTS on Vercel, frame denial, no-referrer policy, and a restrictive Permissions Policy.
- Quest reward inputs remain system-reviewed; Voice, Planner, Circle, and Next-action events cannot grant XP by themselves.

## Focus Circle boundary

Focus Circles are authenticated, server-mediated, and private by invite. The backend verifies the bearer session and Circle membership for every operation. Direct browser grants are revoked from all Circle tables and no `anon` or `authenticated` RLS policy is created.

Only a member's chosen display name, Rank, level, seven-day XP, active days, and group schedule items are shared. Circle endpoints do not read or write Quest text, recovery material, encrypted player-state, completion history, XP, or Rank. Published summaries are motivational rather than authoritative anti-cheat data, so ASCEND deliberately avoids a public/global leaderboard and any reward based on Circle placement.

Circle content is visible to group members and is not end-to-end encrypted. Do not place secrets or highly sensitive personal details in names or schedule items. Invite codes must be treated like private links; remove members or delete the Circle if one is shared unintentionally.

## Voice boundary

Voice capture is optional and permission-gated. ASCEND stores only the resulting transcript and never creates an audio recording. Browser/platform speech recognition may use an external service. Typed Quest intake remains available, and every transcript is editable before AI analysis.

## External Request boundary

The shared URL is a submission capability, not account access. Its random token is stored only as a SHA-256 hash. Request content uses fresh AES-256-GCM encryption, RSA-OAEP-256 wraps its content key, and the owner private key is protected by the recovery vault. Turnstile, link binding, replay checks, rate limits, expiry, and a separate quarantined inbox apply. No external request can award XP or become a Quest without explicit owner review.

## Operational rules before a wider beta

- Never commit or expose `.env`, `.env.local`, `SUPABASE_SECRET_KEY`, service-role credentials, Gemini keys, `TURNSTILE_SECRET_KEY`, recovery keys, or backups.
- Protect Vercel, Supabase, Cloudflare, Gemini, and registrar accounts with MFA and least privilege.
- Keep runtime/dependencies patched; review production logs and billing/cost alerts; maintain tested backups and a secret-rotation/incident checklist.
- Test account deletion, Guest/account isolation, recovery on a clean device, External Requests, and Circle cross-account access before every public invitation wave.
- Publish Privacy/Terms documents and obtain an independent security review before claiming production-grade compliance or handling sensitive regulated data.

## Honest limit

This is a hardened small-private-beta design, not a penetration-test certificate and not a promise that compromise is impossible. A trusted unlocked device and future JavaScript deployed by the app operator remain trusted parts of the system.
