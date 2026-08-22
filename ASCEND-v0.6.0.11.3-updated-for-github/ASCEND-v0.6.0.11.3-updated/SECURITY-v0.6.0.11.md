# ASCEND v0.6.0.11 security notes

- Remember device is opt-in. It stores a renewable Supabase session envelope for at most 30 days, never the password. Session-only is the default; expiry and sign-out remove the persistent copy. Do not enable it on a shared device.
- Player state remains browser-encrypted with AES-GCM before cloud upload. Recovery material and caches remain isolated from Guest and other authenticated users.
- Reminder content is generated locally from the signed-in player's encrypted state. This release adds no public push endpoint and leaks no Quest/Habit text to Circles.
- Circle tables remain server-mediated and owner-installed. Browser roles have no direct table access; Circle statistics cannot award XP or change Rank.
- Existing CSP, HSTS, Fetch Metadata checks, request limits, Turnstile, Supabase RLS, server-only deletion key, encrypted External Requests, and secret redaction remain enabled.
- Secret keys must never appear in frontend code, `/api/config`, archives, screenshots, or chat.
