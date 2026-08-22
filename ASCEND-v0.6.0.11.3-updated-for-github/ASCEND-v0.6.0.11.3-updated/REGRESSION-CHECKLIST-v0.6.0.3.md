# ASCEND v0.6.0.3 — Focused Regression Checklist

1. Deploy v0.6.0.3 to the existing `ascend-beta` Vercel project. No SQL or new environment variable is required.
2. Open `/api/health` and confirm version `0.6.0.3` plus `externalRequestsConfigured: true`.
3. Open the existing public request link in a private window, submit one request, and confirm the success message.
4. If Cloudflare rejects it, copy only the displayed `TS_...` diagnostic code. Never share a Secret key, Turnstile token, recovery key, or encrypted payload.
5. In the owner's account, open Quests → Requests from People and confirm the pending encrypted request appears once.
