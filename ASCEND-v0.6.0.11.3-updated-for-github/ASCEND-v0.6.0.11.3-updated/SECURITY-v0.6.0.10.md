# ASCEND v0.6.0.10 Security Notes

- No secret is added to frontend code or `/api/config`. Gemini, Supabase admin, and Turnstile secrets remain server-only environment variables.
- Notifications contain only a Habit title or aggregate due-Quest count. They never contain recovery keys, account tokens, encrypted player state, external-request ciphertext, or another user's data.
- Reminder history is stored inside the same identity-scoped player state. Guest reminders remain Guest-only; authenticated reminder state remains namespaced by Supabase `user_id` and covered by the existing browser AES-GCM cloud payload.
- Focus Circle setup failures return a bounded safe error code. Raw Supabase details are not returned to the browser. Running the Circle SQL still requires the project owner and does not grant browser table access.
- Batch objective binding is an integrity guard, not an authorization boundary. AI output is still reviewed by the user and does not grant XP until the normal Quest completion flow.
- Notification permission is always user-initiated. ASCEND does not register a push subscription or transmit a device token in this release.

Security-sensitive behavior retained: RLS isolation, server-mediated Circle access, AES-GCM cloud payloads, strict Guest/account namespaces, Turnstile protection, body/rate limits, Fetch Metadata checks, CSP, and server-only account deletion.
