# ASCEND v0.5.3.3 — Security Hardening II

## Authentication bot protection
ASCEND uses Cloudflare Turnstile as the CAPTCHA provider configured in Supabase Authentication. The browser receives only the public Turnstile Site Key from `/api/config`. The Turnstile Secret must remain in Supabase Authentication > Attack Protection and is not required by the ASCEND server or client files.

Protected email/password flows: sign in, sign up, verification-email resend, and password recovery. Each auth request consumes the current Turnstile token and the client resets the widget afterward so the next protected request receives a fresh token.

## Local development
`server.mjs` loads `.env.local` and then `.env`. Set `VITE_TURNSTILE_SITE_KEY` (or `TURNSTILE_SITE_KEY`) to the public Site Key locally. Never place the Turnstile Secret in these files.

## Existing layers retained
- Supabase Row Level Security isolates `player_state` by `auth.uid()`.
- Cloud player state is encrypted client-side with AES-GCM before upload.
- Supabase auth session data uses `sessionStorage`, not persistent localStorage.
- Guest Mode is device-only and does not use Supabase authentication.
- API same-origin checks, body limits, rate limiting, no-store API responses, and strict security headers remain enabled.
