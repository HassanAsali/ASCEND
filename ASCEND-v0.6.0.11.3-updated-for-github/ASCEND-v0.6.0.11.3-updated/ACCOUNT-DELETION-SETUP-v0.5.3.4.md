# ASCEND v0.5.3.4.13 — Delete Account Setup

Delete My Account is intentionally disabled until the backend has a privileged Supabase key. Normal sign-in, Guest Mode, sync, Turnstile, quests, and projects do not need this key.

## Recommended key

Use a modern Supabase Secret key (`sb_secret_*`) from **Supabase Dashboard → Project Settings → API Keys → Secret keys**. Prefer creating a dedicated key for the ASCEND backend so it can be rotated independently.

## Local development

Add this only to the project's private `.env` file:

```env
SUPABASE_SECRET_KEY=your_sb_secret_key_here
```

Restart `npm start`. Then `/api/config` should show:

```json
"accountDeletionEnabled": true
```

The secret itself is never returned.

## Vercel

Add `SUPABASE_SECRET_KEY` as a **Sensitive** Environment Variable for Production/Preview as needed, then redeploy. Never prefix it with `VITE_`.

## Safety

Do not paste the secret into chat, screenshots, frontend code, GitHub, browser DevTools, or `/api/config`. If it is ever exposed, rotate/delete it from Supabase immediately.
