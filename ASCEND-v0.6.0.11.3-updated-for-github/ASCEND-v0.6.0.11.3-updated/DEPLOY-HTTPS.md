# ASCEND v0.5.3.1 — HTTPS deployment

The encrypted vault uses the browser Web Crypto API. On phones/tablets, Web Crypto requires a secure context, so `http://192.168.x.x:3000` is for visual testing only. Use an HTTPS deployment for recovery-key unlock and encrypted cross-device sync.

## Vercel beta deployment

1. Deploy this project to Vercel (Git import or Vercel CLI).
2. In Vercel Project Settings → Environment Variables add these server-side values:
   - `GEMINI_API_KEY`
   - `GEMINI_FAST_MODEL` = `gemini-3.5-flash-lite` (optional)
   - `GEMINI_DEEP_MODEL` = your current deep model (optional)
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
3. Redeploy after saving environment variables.
4. Open the generated `https://...vercel.app` address.
5. In ASCEND → System → Cloud Link, sign in and import the Recovery Key on the second device.

Never add `service_role`, Supabase secret keys, database passwords, or private Gemini keys to browser code or screenshots.
