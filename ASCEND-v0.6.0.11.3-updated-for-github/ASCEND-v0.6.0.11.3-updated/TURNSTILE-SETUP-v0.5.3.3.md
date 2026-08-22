# ASCEND v0.5.3.3 — Turnstile Setup

This build expects Cloudflare Turnstile to be enabled in Supabase Authentication > Attack Protection.

## Cloudflare
- Widget mode: Managed.
- Production hostname: `ascend-beta-nine.vercel.app`.
- Local development hostname: `localhost`.
- The **Site Key** is public.
- The **Secret Key** must stay only in Supabase Authentication. Never place it in ASCEND source, GitHub, or Vercel frontend variables.

## Supabase
Authentication > Attack Protection:
- Enable CAPTCHA protection.
- Provider: Turnstile by Cloudflare.
- Captcha secret: use the Cloudflare **Secret Key**.

## Vercel
Set this Environment Variable for Production, Preview, and Development:

```env
VITE_TURNSTILE_SITE_KEY=<Cloudflare Site Key>
```

This project is plain Node/JavaScript rather than a Vite bundle. The name is retained because it is already configured in Vercel; `server.mjs` reads it server-side and exposes only the public Site Key through `/api/config`.

After changing a Vercel environment variable, deploy/redeploy the new build so the deployment receives it.

## Local development
Create `.env.local` (gitignored) beside `server.mjs`:

```env
SUPABASE_URL=<your Supabase project URL>
SUPABASE_PUBLISHABLE_KEY=<your public publishable key>
VITE_TURNSTILE_SITE_KEY=<Cloudflare Site Key>
```

Never add the Turnstile Secret to `.env.local`.

## Expected behavior
- Guest Mode: no CAPTCHA and no Supabase auth.
- Sign In: requires a fresh Turnstile token.
- Create Account: requires a fresh Turnstile token.
- Resend Verification Email: requires a fresh token.
- Forgot Password: requires a fresh token.
- After each protected request, the widget resets so a token is not reused.
