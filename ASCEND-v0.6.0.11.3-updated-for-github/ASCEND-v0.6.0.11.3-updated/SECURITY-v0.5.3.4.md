# ASCEND v0.5.3.4.13 — Security Hardening III

## Authentication feedback

The entry screen validates required fields before any network request. Supabase Auth errors are translated into user-facing messages without exposing sensitive server details. Login uses the deliberately non-enumerating message **Incorrect email or password** rather than confirming whether an arbitrary email exists. The only exception is a browser-local SHA-256 deletion marker created when this same browser successfully deletes that account; it can explain the just-deleted account without querying for email existence.

## Delete My Account

Permanent cloud-account deletion is deliberately a privileged backend operation. The browser cannot delete arbitrary Auth users and never receives the Supabase server admin key.

The deletion flow requires:

1. An already authenticated ASCEND cloud account.
2. Current-password reauthentication against Supabase Auth.
3. A fresh Cloudflare Turnstile token.
4. An explicit permanent-deletion acknowledgement checkbox.
5. A separate final destructive browser confirmation.
6. A same-origin call to `/api/account/delete` carrying the freshly issued user access token.
7. Server-side verification of that token via Supabase `/auth/v1/user`.
8. Exact email match against the verified Auth user.
9. A server-only Supabase Secret (`sb_secret_*`) or legacy `service_role` key for the final Admin delete.

The existing `public.player_state.user_id -> auth.users.id ON DELETE CASCADE` relationship removes the cloud-state row when the Auth account is deleted. ASCEND then clears the deleted account's local per-user state cache and AES-GCM recovery key from the current device.

## Secrets

Never expose any of these:

- `SUPABASE_SECRET_KEY` / legacy `SUPABASE_SERVICE_ROLE_KEY`
- Gemini API key
- Cloudflare Turnstile Secret

The Turnstile Site Key and Supabase Publishable Key are client/public credentials; access to private data still depends on Auth + RLS.

## Important JWT behavior

Deleting a Supabase Auth user invalidates refresh capability/sessions, but an already-issued access JWT can remain cryptographically valid until its expiration. ASCEND clears its local session immediately after deletion, and the deleted user's `player_state` row is gone. Keep normal Supabase access-token expiry conservative.
