# ASCEND Shareable Private Beta Privacy Model — v0.6.0.8

## Stored cloud progress

Each signed-in tester has one Supabase `player_state` row protected by Row Level Security. Normal authenticated client requests are limited to the row whose `user_id` matches the authenticated user.

Before the player state is sent to Supabase, the browser encrypts the JSON state with AES-GCM using a random 256-bit recovery key created on the client.

Supabase therefore stores an encrypted envelope containing ciphertext and an IV rather than the readable quest/profile state.

On the device, Guest uses a dedicated browser-storage namespace. Authenticated cache and recovery-key names include the Supabase user ID. The generic legacy device state is not considered when an authenticated account hydrates. Pending cloud work is invalidated whenever the active identity changes.

## Recovery key

- Generated in the browser.
- Stored locally per signed-in user on that device.
- Never included inside the uploaded state row.
- Can be downloaded as a small private Recovery File (or copied manually) to unlock a trusted second device once.
- Losing every copy of the key can make the encrypted cloud state unrecoverable.

ASCEND asks for a one-time backup acknowledgement on each browser/device. It does not attach the recovery key to the account password, email, feedback, or server configuration; doing that would give the service a path to decrypt player-state and weaken the client-side vault model.

## Private Beta feedback

- The server verifies the signed-in Supabase session before accepting feedback.
- Stored fields are the tester account ID/email, chosen feedback type, message, app version, current page, and optional basic browser/display diagnostics.
- Quest text, XP history, recovery keys, encrypted player-state, and backups are not attached.
- Browser roles have no read/write policies on `beta_feedback`; only the server-side secret inserts rows for the owner to review.

## External Requests

- The shared URL uses a random 256-bit token and includes no email or Supabase user ID. Supabase stores only its SHA-256 hash.
- The sender's browser encrypts the name, contact, subject, requested time, and details before upload. The ASCEND server does not receive readable request text.
- The request private key is encrypted with the owner's recovery vault. A trusted unlocked owner device decrypts pending messages locally.
- Stored server metadata is limited to inbox/request identifiers, ciphertext envelope, status/timestamps/expiry, an envelope replay hash, and a salted hash of the sender IP for rate control. The raw IP is not stored by ASCEND.
- A pending external request cannot mutate player-state, become a Quest, or award XP. The owner must review and accept it.
- Link recipients are still untrusted. Encryption protects stored content; it does not make a stranger's message truthful or safe.

## Focus Circles

- Circles are optional and available only to signed-in accounts. A random invite code grants the ability to request membership; it is not account access.
- The shared board contains only the member-chosen display name plus Rank, level, seven-day XP, and active-day summaries, and group-visible lecture/session/assignment entries.
- It never shares email, Quest text, recovery keys, encrypted player-state, backups, or external-request decryption keys.
- Circle data is server-mediated and membership-checked, but it is intentionally group-visible rather than end-to-end encrypted. Do not put sensitive personal information in a Circle title or shared schedule item.
- Circle progress is informational. It cannot award XP, clear Quests, alter Rank, or write to another member's player-state.

## Voice Quest capture

ASCEND uses the browser's optional speech-recognition interface. The app stores the returned transcript as ordinary Quest input and does not record or upload an audio file itself. Browser/operating-system speech services may process audio according to their own platform policy, so typed intake remains available when the user prefers not to grant microphone access.

## Important limits

This is a private-beta privacy design, not an audited zero-knowledge product.

- Local browser storage still contains readable player-state and the device's recovery key. The External Request RSA private key is separately vault-encrypted inside that state.
- Anyone with control of a trusted unlocked device can read that local state.
- The web-app operator controls the JavaScript served by future deployments, so no web app can honestly promise protection from a malicious future client build controlled by its operator.
- Text intentionally sent to the configured AI provider for semantic analysis is separate from encrypted-at-rest cloud storage.

## API secrets

- Gemini API keys remain server-side in environment variables.
- The browser receives only the Supabase public anon/publishable credential.
- The Supabase `service_role` key must never be shipped to the browser.
