# ASCEND monetization and Private Beta path — v0.6.0.8

## Recommended position

ASCEND should be sold as a private progression and planning system, not as an XP game and never as a marketplace for user data. The strongest differentiator is the combination of structured planning, strict progression, encrypted sync, private request intake, and small accountability circles.

## A practical offer

1. **Free / Local** — Guest mode, core Quests, basic Projects, local Planner, and limited AI trials.
2. **ASCEND Pro** — encrypted cross-device sync, unlimited history, semester planning, richer Project Architect use, exports, and advanced reviews.
3. **Focus Circles** — small private groups, shared sessions, friendly progress boards, and future host controls. This can be part of Pro during beta before testing a separate group plan.

Do not sell Rank advancement, XP multipliers, or paid shortcuts. Those would damage the progression system's meaning. Cosmetic themes, optional analytics, additional AI capacity, and collaboration limits are safer paid boundaries.

## Before charging anyone

- Make entitlements server-authoritative; never trust a browser flag that says a subscription is active.
- Publish a short Privacy Policy and Terms of Use, including Gemini processing, browser speech-service limitations, encrypted-state recovery responsibility, and deletion behavior.
- Add error monitoring, cost alerts, database backups, a support address, refund rules, and a tested incident/secret-rotation checklist.
- Keep Focus Circles private and invite-only. Do not publish a global public Rank board until anti-cheat, moderation, blocking, reporting, and server-verifiable progression exist.
- Measure activation, seven-day retention, useful Quest completion, Planner adoption, Circle return use, AI cost per active user, and support load during a 10–25 person beta.

Stripe Payment Links can accept one-time payments or subscriptions without building a full checkout first, making it a reasonable small paid-pilot path: https://docs.stripe.com/payment-links

## Security and operations

ASCEND is hardened for a small private beta, but it is not “unhackable” and should not be advertised that way. Keep production accounts behind MFA, use least-privilege credentials, rotate exposed secrets, and watch Vercel, Supabase, and Cloudflare logs.

Supabase recommends private Realtime channels with authorization policies for controlled group communication; if Circles later gain live presence or chat, use that model instead of public channels: https://supabase.com/docs/guides/realtime/authorization

Browser speech recognition is not consistently available across all major browsers, and some implementations use a server-based recognition engine. Voice input must remain optional and its transcript must be reviewed before classification: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

Review deployment quotas before widening the beta, especially because serverless and platform limits can affect bursts, logs, and function behavior: https://vercel.com/docs/limits

## Recommended release sequence

1. Run a private beta with the current free experience and Focus Circles.
2. Fix retention and reliability issues before introducing payment.
3. Add server-authoritative entitlements and a small Pro pilot.
4. Consider public documentation or a social launch only after monitoring, policies, backups, and incident procedures are proven.

