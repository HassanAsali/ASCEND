# ASCEND Security Hardening I — v0.5.3.2

This release reduces attack surface but does not claim that compromise is impossible.

## Applied in code
- Strict script CSP (`script-src 'self'`) and no framing.
- HSTS on Vercel plus browser security headers.
- API same-origin browser checks, request size limits, no-store responses, and application rate limiting.
- Auth tokens are browser-session scoped in `sessionStorage`; old persistent localStorage tokens are removed.
- Cloud state remains AES-256-GCM encrypted client-side; the recovery key is not uploaded.

## Required Supabase dashboard step
Run `SUPABASE-SECURITY-HARDENING-v0.5.3.2.sql` in SQL Editor and verify four policies are returned.

## Required Vercel dashboard step
Use the Vercel Firewall/WAF to rate-limit `/api/*`. Application rate limiting is defense-in-depth, but serverless instances do not share one in-memory counter. Start conservatively (for example 60 requests/minute/IP) and tune after observing normal beta traffic.

## Recommended account settings
Keep email confirmation enabled. Do not expose service-role keys in Vercel variables prefixed for the client. Rotate any secret that has ever been pasted into source code, Git, screenshots, or chat.

## Next hardening stage
For stronger session-token theft resistance, v0.5.3.3 should migrate authenticated sessions to a Backend-for-Frontend using `HttpOnly; Secure; SameSite` cookies. That is a larger architecture change and should be tested separately rather than silently mixed into this patch.
