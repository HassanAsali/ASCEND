# ASCEND v0.6.0.0 — External Requests owner setup

Testers and people who receive your link do not configure keys. The ASCEND owner performs these steps once:

1. Run `SUPABASE-EXTERNAL-REQUESTS-v0.6.0.0.sql` in Supabase SQL Editor.
2. Add `TURNSTILE_SECRET_KEY` to the Vercel Production environment. Keep the existing public `VITE_TURNSTILE_SITE_KEY`.
3. Redeploy Production and open `/api/health`. Confirm `externalRequestsConfigured` is `true`.
4. Sign in, open System → Shareable Request Link, and select **Create Secure Link**.

The Turnstile widget/domain settings must allow the exact production hostname (for example your stable `ascend-beta-nine.vercel.app` alias). The server verifies hostname, action, and a binding to this specific request link.

On Windows local development, copy the Turnstile Secret key to the clipboard and run `setup-external-requests-windows.bat`. It reads the clipboard, writes `.env`, and clears the clipboard without displaying the secret.

Security design:

- The URL contains a 256-bit random capability token. It contains no email or user id.
- The database stores only a SHA-256 hash of the token.
- A sender's browser encrypts the request with AES-256-GCM and wraps that key with the owner's RSA-OAEP-256 public key.
- The RSA private key is itself AES-GCM-encrypted by the owner's recovery vault before local/cloud player-state storage.
- Browser roles have no direct table privileges. The public endpoint requires link-bound Turnstile plus application/database rate limits.
- Duplicate encrypted envelopes are rejected, pending storage is bounded, and old envelopes expire automatically.
- External text never becomes a Quest or earns XP until the owner reviews and accepts it.
