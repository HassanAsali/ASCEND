# ASCEND v0.6.0.0 — Security Review

## Preserved controls

- Supabase confirmed-email authentication and per-user `player_state` RLS.
- Separate Guest and user-ID-scoped authenticated caches.
- AES-256-GCM player-state encryption before cloud upload.
- Server-only Gemini, Supabase admin, Turnstile secret, feedback, and account-deletion operations.
- Same-origin API enforcement, Fetch Metadata checks, body limits, rate limiting, no-store responses, CSP, HSTS on Vercel, frame denial, restrictive permissions, and no-referrer policy.

## External Request threat model

The shared URL is a submission capability, not account access. It cannot read player data. Its token is 256 random bits and only a SHA-256 hash is stored. Every request uses fresh AES-256-GCM encryption; RSA-OAEP-256 wraps the content key. The owner private key is protected inside the recovery vault.

The server validates strict envelope sizes/algorithms, verifies Turnstile action + hostname + link binding, hashes IP data with a server secret, rejects replays, limits IP and inbox volume in a serialized database transaction, caps pending rows, expires old rows, and exposes no browser table privileges. Requests remain quarantined until owner review and cannot award XP directly.

## Operational rules

- Never commit or expose `.env`, `SUPABASE_SECRET_KEY`, service-role credentials, Gemini keys, or `TURNSTILE_SECRET_KEY`.
- Use only the production HTTPS alias. Keep Supabase/Vercel/Cloudflare accounts protected by MFA and least privilege.
- Rotate a shared request URL if it is posted somewhere unintended. Rotate/revoke infrastructure secrets if exposure is suspected.
- Review Supabase Auth, Vercel, and Cloudflare security logs; keep dependencies/runtime patched.
- Run the included security/regression suite before every deployment.

## Honest limit

This is a hardened private-beta design, not a third-party penetration test or formal security certification. No software can promise that compromise is impossible. Local unlocked devices and future JavaScript served by the app operator remain trusted parts of the model.
