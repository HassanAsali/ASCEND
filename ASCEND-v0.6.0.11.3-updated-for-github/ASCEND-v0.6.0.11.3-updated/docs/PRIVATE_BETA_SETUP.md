# ASCEND Shareable Private Beta Cloud Setup — v0.6.0.8

## What a tester receives

Send only the production HTTPS Vercel URL. A tester does not download the ZIP, run Node, open `.env`, or configure any key. Gemini, Supabase, Turnstile, and admin secrets remain server-side in the owner's Vercel project.

Before sending the production app link, the owner runs these idempotent setup files once in Supabase SQL Editor:

1. `SUPABASE-BETA-FEEDBACK-v0.5.3.4.13.sql`
2. `SUPABASE-EXTERNAL-REQUESTS-v0.6.0.0.sql`
3. `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql`

The owner then verifies the existing server-only environment variables and deploys v0.6.0.8. Testers configure no keys. Feedback arrives in `beta_feedback`; encrypted proposals arrive through the External Request Inbox; Focus Circle rows remain accessible only through authenticated server endpoints.

## Apple installation

On iPhone or iPad, open the HTTPS link in Safari, tap Share, choose Add to Home Screen, enable Open as Web App when shown, and tap Add. ASCEND uses its dedicated Home Screen icon and launches in a standalone window.

## Recovery File

ASCEND asks a signed-in player to save one Recovery File after first setup. It is required only once per new browser/device (or after clearing browser storage), not on every sign-in. The file must remain private. This preserves browser-side AES-GCM encryption, which means the server and account password cannot decrypt player-state.

The database schema is `public.player_state`, protected with Row Level Security. ASCEND encrypts the player state in the browser before sending it to Supabase.

## Local setup

Put these two public client values in `.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Never place a Supabase `service_role`, secret key, or database password in the browser app.

Restart ASCEND. In **System → Cloud Link**, the badge should change from `LOCAL` to `READY`.

## First device

1. Create a beta account.
2. Confirm the email if Supabase requires it.
3. Sign in.
4. When ASCEND asks, link the current local progress to the account.
5. Press **Sync Now**.
6. Download the private **Recovery File** and store it somewhere safe. The text file is easier to select on iPhone/iPad than a special file type.

## Second device

1. Open ASCEND and sign in with the same account.
2. The encrypted cloud row will be detected.
3. Select the Recovery File, or paste the Recovery Key if preferred.
4. Press **Unlock Vault**.
5. ASCEND decrypts the cloud state locally and synchronizes the same quests, XP and progression.

The Recovery Key is intentionally not uploaded with the encrypted player state.

## Shareable External Request link

1. Finish the one-time owner setup in `EXTERNAL-REQUESTS-SETUP-v0.6.0.0.md`.
2. Sign in and unlock the recovery vault.
3. Open **Command → Shareable Request Link** and create the link.
4. Send only that link. The recipient needs no account and configures no keys.
5. Open **Quests → External Requests**, review the untrusted proposal, then dismiss it or convert it into a Quest.
6. Rotate the link at any time to invalidate the previous URL.

## Private Focus Circles

1. Apply `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql` once and redeploy.
2. Open **Circles**, create a private Circle, and send its random invite code only to intended members.
3. Members may share lectures, assignments, or focus sessions and publish a small opt-in progress summary.
4. Circle data never awards XP, completes Quests, or promotes Rank. Email addresses, Quest text, recovery data, and encrypted player-state are never shown on its board.
5. Rotate membership by removing or leaving members; delete the Circle when it is no longer needed.
