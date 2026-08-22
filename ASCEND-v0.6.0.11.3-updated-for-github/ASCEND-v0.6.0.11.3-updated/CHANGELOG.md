# v0.6.0.11.3 — Private Friends

- Added a separate Friends workspace without changing Focus Circles.
- Private token invitations only; no public email search or account enumeration.
- Full request lifecycle: incoming/outgoing Pending, Accept, Decline, Cancel, Remove, and Block.
- Added private shared tasks, study sessions, and meetings. Each friend records only their own completion.
- Added an opt-in Shared Completions board. It is coordination-only and never changes account XP, level, Rank, Skills, Milestones, or progression days.
- Friend invite tokens remain inside the encrypted/account-scoped player state; the database stores only a SHA-256 hash.
- Added database membership guards, canonical unique friend pairs, RLS, and revoked direct browser access.
- Added `SUPABASE-FRIENDS-v0.6.0.11.3.sql` as an additive one-time migration.
- Added regression coverage for relationship transitions, duplicate pair prevention, privacy, database access, and progression isolation.

# v0.6.0.11.2 — Circle Contribution XP + Finish/Archive Circle

- **Fixed the real bug:** the number shown inside a Focus Circle's leaderboard ring was the member's self-reported account Total XP (client-supplied, server only range-clamped it), republished. It was fully spoofable and had nothing to do with actual circle activity.
- Added an independent **Circle Contribution XP** system:
  - Earned only by completing a shared circle item, computed server-side from that item's real duration (never trusted from the client request).
  - Always displayed and sorted as a live `SUM()` over each member's own idempotent completion rows — never a client-pushed number.
  - Protected against Complete → Undo → Complete farming by construction: because completion rows are uniquely keyed by (item, user), undoing removes exactly that item's XP and redoing restores exactly the same amount — cycling never accumulates more than one item's worth of XP.
  - Capped per item (max 60 XP) and capped per member per rolling 24 hours (150 XP) to block bulk-session farming.
  - Never awarded for creating a circle, joining a circle, or clicking repeatedly — only for a verified completion.
  - Clearly labeled "Circle Contribution XP" in the UI, distinct from account XP, level, and rank, which it never touches.
- Added **Finish Circle** (owner-only):
  - Confirmation prompt before finishing.
  - Idempotent — finishing an already-finished circle is a no-op, not an error, and never grants a second reward.
  - Freezes the circle: new shared items, edits, and progress changes are rejected both at the server (before any Supabase call) and at the database layer (a new trigger), so the rule holds even if a future code path forgets the server-side check.
  - Returns and displays a final summary (participants, sessions completed, total Circle XP).
  - Finished circles move to a separate "Archived Circles" section in the UI, distinct from active circles.
- New cumulative SQL migration `SUPABASE-UPGRADE-v0.6.0.11.2.sql` — additive only (new columns with `IF NOT EXISTS`, one new trigger). No table, column, or row is dropped. Safe to run on a database that already has `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql` applied.
- Added 8 new automated regression tests covering: the XP formula's bounds, the anti-farm Complete/Undo/Complete property, Finish Circle's owner-only and idempotent behavior, Finish Circle never performing more than its one status-change write, both write-blocking guards on a finished circle, and the client no longer sorting by self-reported account XP.
- All pre-existing automated tests continue to pass unchanged.

# v0.6.0.11.1 — Project Workspaces + Precise Reminders + Rolling Habits

- Made Projects the primary home for their linked workstreams and subquests, with progress, edit, complete/reopen, and final-objective locking inside each Project card.
- Hid project-linked work from the normal Quest Board by default while retaining explicit Standalone / Project work / All work scope filters.
- Excluded project workstreams from the standalone Quest badge and daily directive so the same work is not presented twice.
- Routed notification clicks to the exact Quest, Project workstream, or Habit instead of only opening Command Center.
- Added a neutral session-restoration gate so remembered devices do not briefly flash the Sign In screen.
- Changed interval Habits to rolling, repeatable check-ins based on the real completion time; check-ins remain XP-free.
- Hardened narrow laptop/desktop layouts against collapsed hero text, overflowing request controls, and displaced buttons.
- Preserved existing XP, Rank requirements, earned history, encrypted account namespaces, Guest isolation, and Focus Circle setup requirements.

# v0.6.0.11 — Retired First Action + Private-Device Sessions + Reminder Center

- Removed First Action from AI schemas, fallback, review, saved Quest state, editing, and cards. Legacy values are ignored without damaging Quests or subquests.
- Added an opt-in 30-day private-device session using Supabase's renewable session token. ASCEND never stores the password, session-only remains the default, expiry is enforced locally, and sign-out clears both stores.
- Replaced automatic voice-language guessing with an explicit Arabic/English selector and made Arabic the first choice.
- Added a visible Notification Center plus per-Quest, per-Habit, course-class, and fixed-commitment reminders with account-scoped deduplication.
- Added readable Habit recurrence summaries; interval check-ins remain one honest daily result and never inflate XP.
- Preserved the owner-only Focus Circle migration diagnostic. `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql` must be applied once before Circles can load.
- Migrated state to schema `12` without changing Rank requirements, XP economics, earned history, RLS, encrypted cloud payloads, or identity isolation.

# v0.6.0.10 — Objective-Bound Intake + Reminder Windows

- Bound each batch result to its original submitted objective and replaced missing, duplicate, or unrelated First Actions before the result reaches review.
- Added visible First Actions to the batch overview and preserved source bindings through per-item review, discard, back, and accept flows.
- Added explicit Arabic and English speech-recognition language selection while retaining browser Auto mode.
- Added opt-in Quest due notifications and Habit reminders with persisted deduplication and notification-click routing back into ASCEND.
- Added bounded Habit reminder windows with 30/60/90/120/180/240-minute intervals and full category selection.
- Prevented Shareable Request controls and icon/button groups from overflowing at narrow laptop and phone widths.
- Replaced indefinite Focus Circle loading with a precise missing-schema diagnostic, retry action, safe server code, and PostgREST schema reload instruction.
- Migrated state to schema `11` without changing XP, Ranks, existing completions, Guest isolation, or encrypted account namespaces.

# v0.6.0.9 — Missed-Daily Catch-Up + XP-Free Habits

- Fixed unfinished Daily occurrences remaining permanently stuck on an old date after the player skipped one or more days.
- A stale active Daily now moves to the player's current local date, preserves partial checklist progress, records the number of missed scheduled days, and adds only a zero-XP audit entry.
- Reconciliation runs on initialization, tab visibility/focus return, and the next local midnight without generating duplicate occurrences or retroactive rewards.
- Tomorrow's occurrence created after a legitimate clear starts with a clean missed-day marker and remains locked until tomorrow.
- Added a dedicated Habits view with selected weekdays, optional time/category/note, today check/uncheck, seven-day history, current streak, missed-day count, and an optional broad starter pack.
- Kept Habits outside progression: no XP, no Rank influence, no Quest clears, no active-day credit, and no server/social leaderboard publication.
- Habit data migrates into account-scoped schema `10` and remains protected by the existing browser-side AES-GCM vault for authenticated users; Guest habits remain local-only.
- Re-ran regression coverage for Voice capture, analysis discard/cancel, intake clearing, Planner/Projects, Focus Circles, leaderboards, account isolation, Daily rewards, and Rank gates.
- No new SQL migration, environment variable, API key, or Rank requirement is needed.

# v0.6.0.8 — Private Focus Circles + Intake Integrity

- Added Arabic/English browser voice capture to the existing AI Quest Console. Audio is not uploaded or stored by ASCEND; only the user-reviewed transcript enters the normal classifier.
- Added private Focus Circles with random invite codes, opt-in seven-day progress summaries, shared lectures/sessions/assignments, member completion indicators, and a friendly leaderboard that cannot award XP or alter Rank.
- Added server-side Supabase mediation for every Circle operation. Browser roles receive no Circle table grants or RLS policies, and every API call re-verifies the signed-in user before membership checks.
- Added account-switch invalidation for loaded Circle data so one account's social summaries cannot flash after signing into another account.
- Fixed the manual Quick Add reward race: the Save path now waits for its system classification and fails closed instead of saving stale/default reward inputs.
- Cleared Quest Console text and pending analysis consistently after accept, cancel, batch discard, and successful batch completion.
- Added explicit **Discard Analysis**, **Discard This**, and **Delete Quest** review controls. A single batch result can be removed without throwing away the remaining analyzed objectives.
- Renamed the actionable guidance to **Next action**, displayed it on Quest cards, and added an XP-free start marker. Starting work never masquerades as completing work.
- Restored deliberate text selection inside AI results and review dialogs while keeping controls non-selectable.
- Allowed microphone access only for the same origin in the Permissions Policy and retained restrictive CSP, HSTS, Fetch Metadata, rate limits, body limits, RLS, encrypted state, and Guest/account namespace controls.
- Added `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql`, expanded automated regression coverage, and documented a privacy-respecting monetization path.

## Included Reward-Field Anti-Cheat Lock

- Closed a real exploit: the "System reward" (XP) box was already read-only, but every field that feeds into its calculation — Difficulty, Type, Priority, Estimated minutes, Long-term value, Life impact — was a normal, freely-editable dropdown/input in the Quest dialog. Anyone could set Difficulty to S and inflate Estimated minutes to farm large XP even though they couldn't type into the XP box directly.
- All six reward-driving fields are now locked (`disabled`) the instant the Quest dialog opens, for every entry point: manual quick-add, AI-analyzed accept, batch accept, editing an existing quest, planner-linked quests, and external requests. They're visually distinct (cyan, "system-locked" styling) so it's clear they're intentional, not broken.
- For manual quick-add (just typing a title, no formal Analyze step), the system now automatically evaluates the typed title in the background (short debounce after typing stops) and fills in Difficulty/Type/Priority/time/value/impact itself via the existing local/AI classifier — so there is no remaining path where a person hand-picks these values before a quest is accepted.
- Verified live: fields cannot be focused or changed via the UI in any dialog mode; auto-evaluation correctly populates and locks fields from a typed title; editing an existing quest preserves and locks its original recorded XP rather than allowing recalculation.
- No data migrations, Supabase SQL, or environment variable changes required.

# v0.6.0.6 — Security Audit Pass

- Full manual security review: authentication flows, XSS surface (all 49 innerHTML render sites checked), Supabase RLS policies, CSP/security headers, rate limiting, static file path handling, and session token storage.
- Fixed: `server.mjs` (used for self-hosted/local deployments via `start-windows.bat` / `start-mac-linux.sh`) was missing the `Strict-Transport-Security` (HSTS) header that the Vercel edge config already applied in production. Self-hosted deployments now send HSTS too, so browsers enforce HTTPS-only on repeat visits there as well.
- Verified clean (no changes needed, already solid): every user- and external-sender-controlled field rendered to the DOM is passed through `escapeHtml()` — including the untrusted public External Request inbox path; auth/session tokens live in `sessionStorage` (not `localStorage`) and old `localStorage` copies are actively purged; static file serving normalizes and bounds paths so no traversal outside `/public` is possible; every privileged API route (account delete, feedback, external inbox) re-verifies the caller's Supabase session server-side before acting; Supabase RLS policies correctly scope every table to `auth.uid()` with `revoke all` + minimal `grant`; Turnstile verification checks hostname, action, and request binding, not just token validity.
- Noted for awareness, not changed: API rate limiting is in-memory, so it resets per server instance — fine for a single Node process (including this self-hosted mode) but won't share limits across multiple serverless function instances if deployed that way. Worth revisiting with a shared store (e.g. Redis) only if/when real abuse traffic shows up.
- No data migrations, Supabase SQL, or environment variable changes required.

# v0.6.0.5 — Planner Button Fix

- Fixed "Create First List" (Planner → Lists empty state) and "Create First Project" (Projects empty state) doing nothing when clicked. Root cause: both buttons used an inline `onclick="..."` HTML attribute, which the app's own Content-Security-Policy header silently blocks for security. Both now use the same delegated `data-*` click-handling pattern already used everywhere else in the app (e.g. Edit/Delete list and project buttons), so no structural changes were needed elsewhere.
- Verified in a real browser end-to-end: Guest onboarding, creating a List, toggling a list item, creating a Project, creating a Quest, and every primary view (Command, Quests, Projects, Planner, Guide, Progress, Milestones, System) now load and operate with zero console errors.
- Confirmed the Quest "System reward" (XP) field is, and remains, fully system-calculated and read-only — difficulty, priority, estimated time, long-term value, and life impact drive the formula, and the value cannot be edited or typed into by the user. Verified with an automated test that attempted to type into the field directly.
- No data migrations, Supabase SQL, or environment variable changes required. Existing local/guest and cloud data are unaffected.

# v0.6.0.4 — Structured Planner + Single-Quest External Review

- Fixed External Request AI review being interpreted as multiline Batch intake. One external proposal now remains one Quest throughout review.
- Removed automatic subquest manufacture from external proposals while preserving sender details, time, duration, language, and owner review.
- Added Planning Lists with sections, time estimates, target dates, completion progress, and explicit Planner-to-Quest conversion.
- Added Semester Planner with multiple semesters, courses, course codes, targets, focus levels, sections, and weekly class meetings.
- Added a seven-day timetable for classes plus standalone work, appointment, commitment, and protected-study blocks, with automatic overlap highlighting across all of them.
- Kept planning checkmarks XP-free so users cannot farm progression by arranging lists.
- Fixed Project-map edits incorrectly increasing lifetime Quest-acceptance metrics.
- Hardened Final Project Quest unlocking against malformed legacy Projects with zero required workstreams.
- Added state migration v8, PWA Planner caching, guided-tour coverage, responsive Planner UI, and automated regressions.
- No Supabase SQL or new environment variables are required.

# v0.6.0.3 — Turnstile Verification Diagnostics

- Replaced the misleading one-size-fits-all “Security verification expired” response with safe, precise failure classes for expired/used tokens, rejected server keys, hostname mismatches, link-context mismatches, and temporary Siteverify outages.
- Kept mandatory server-side Siteverify validation plus exact hostname, action, and request-link `cData` binding; no verification requirement was removed or weakened.
- Bounded the server-to-Cloudflare validation call with an 8-second timeout so a provider/network issue cannot hang submission indefinitely.
- Added automated fail-closed regression tests for valid verification, duplicate/expired tokens, invalid Secret keys, action mismatch, request-link binding mismatch, hostname mismatch, and Siteverify outage.
- No Supabase SQL change is required. Existing Vercel keys are reused.

# v0.6.0.2 — Safe API Navigation Patch

- Fixed direct `/api/health` and other read-only API navigation being rejected as cross-origin after browser redirects or tab restoration.
- Kept strict same-origin and Fetch Metadata rejection for unsafe API methods, including `POST` writes.
- Added regression coverage proving direct cross-site-marked `GET` succeeds while a cross-site-marked `POST` remains blocked.
- Bumped PWA and browser asset versions without changing Supabase SQL or Vercel environment variables.

# v0.6.0.1 — External Request Delivery Patch

- Moved Shareable Request Link controls from System to a compact Command card with a pending-count Inbox shortcut.
- Changed public requests to generate a fresh Turnstile token only when Send is pressed, preventing five-minute prefilled-form expiry.
- Added verification and network timeouts, single-submit guards, automatic Turnstile reset/retry, and explicit success/failure states so the page cannot appear to send while still verifying.
- Added a bounded owner Inbox refresh so a failed request cannot leave the Refresh control loading forever.
- Refreshes the pending count when the owner returns to ASCEND or reconnects, while Quests still provides a manual Refresh button.
- Retries the same encrypted envelope after an uncertain timeout so network retries cannot create duplicate pending requests.
- Preserved v0.6.0.0 encryption, storage, SQL schema, account isolation, quests, XP, and rank rules.

# v0.6.0.0 — Shareable Private Beta

- Added an end-to-end encrypted External Request Inbox with shareable capability links, a no-account sender form, owner-only review, and explicit Quest acceptance.
- Added RSA-OAEP-256/AES-256-GCM hybrid encryption; the owner's request private key is additionally protected by the existing recovery vault.
- Added hashed link tokens, token-bound Turnstile verification, hostname/action checks, same-origin Fetch Metadata checks, replay hashes, expiry, application rate limiting, database advisory-lock rate limiting, and bounded pending storage.
- Revoked all direct anon/authenticated access to both request tables; only the server role can use them and no external request can write player-state or award XP.
- Added link rotation, pause/resume, dismiss, direct manual review, and optional AI review while preventing rewritten AI text from accepting the wrong external request.
- Fixed the iPhone standalone safe area and reduced mobile Command card size/spacing.
- Changed Recovery File download/import to ordinary `.txt` so it appears in the iPhone Files picker.
- Added SQL, owner setup, security notes, regression checklist, hybrid-encryption/replay/fail-closed tests, and updated PWA/cache versions.

# v0.5.3.4.13 — Vault-First New Device Recovery

- New devices with an existing encrypted cloud state now stop at a dedicated **Unlock your ASCEND progress** gate before onboarding.
- Added direct Recovery File selection and recovery-key paste controls to the locked-device gate.
- Blocked onboarding, account-state writes, autosave, and sync while the encrypted vault is locked.
- After a valid unlock, the decrypted cloud state is authoritative over any accidental empty local cache created by an older build.
- Added regression coverage for the vault-first gate, locked default-state write prevention, and encrypted-cloud restoration over a newer empty cache.

## Included v0.5.3.4.12 reward consistency patch

- Preserved the exact AI-reviewed XP when accepting an unchanged quest through Review & Accept.
- Preserved analyzed XP in batch Accept All instead of recalculating with a second client formula.
- Kept automatic XP recalculation when the user actually edits a reward-affecting field.
- Added the required `service_role` insert grant and PostgREST schema refresh to the bundled feedback SQL.

# v0.5.3.4.11 — Private Beta Handoff

- Split Quest Management into clearly labeled Daily, Main, Side, Campaign, and Boss lanes with purpose descriptions and counts.
- Excluded future locked Daily occurrences from the actionable Quest badge.
- Corrected Daily reward accounting so subquest XP plus final XP equals the configured reward; Undo Today now reverses the full occurrence and resets its subquests.
- Changed the 7-day chart to show net XP after same-day reversals.
- Added authenticated Private Beta feedback with server-verified identity and a write-only Supabase table.
- Added Apple Home Screen instructions, install-state detection, and dedicated PNG/Apple touch icons.
- Added one-time Recovery File download/import, first-device backup acknowledgement, and clearer “once per browser/device” wording.
- Preserved browser-side AES-GCM encryption; no recovery key or server secret is exposed to feedback or client configuration.

# v0.5.3.4.10 — Locked Daily Recurrence

- Completing a Daily Quest now closes that dated occurrence and creates exactly one locked copy for the next day.
- The next occurrence displays its unlock date and cannot be completed, edited, deleted, or progressed early.
- The completed occurrence no longer behaves like a toggle. A separate **Undo Today** action reverses the exact XP, Attribute XP, Skill XP, Daily clear, and Milestone progress if completion was accidental.
- Undo removes the auto-generated next-day occurrence when it still has no progress, preventing duplicate Daily chains.
- Existing cumulative Daily history migrates safely; a Daily already completed today receives one next-day occurrence without awarding or removing XP.
- Daily clear metrics are rebuilt from recorded Daily history during migration so counters cannot drift from the underlying completion record.
- Added isolated Daily-cycle regression coverage for date rollover, lock enforcement, fresh subquests, duplicate prevention, and the same-day undo boundary.

# v0.5.3.4.9 — Milestone Path Labels

- Every Milestone card now displays its owning path/category next to its rarity, such as `ENGLISH`, `ENGINEERING`, `PROGRESSION`, `DISCIPLINE`, or `RANK`.
- Long/custom category names truncate cleanly without breaking the card layout.
- Preserves the realistic Milestone rules, focus recalibration, Skill allocation correction, Project progress protection, and stale-shell prevention from the integrated prior patches.

## Included deployment and progression integrity work

- Fixed the production mismatch where `/api/health` could report the new version while an older cached `index.html` still hid newly deployed controls.
- Added explicit build query versions to CSS and application scripts.
- Service-worker registration now bypasses the browser's worker cache and actively checks for an update.
- Navigation uses network-first loading with a versioned offline shell; old application caches are removed on activation.
- Vercel and the local Node server now return `no-store, must-revalidate` for the application shell and deploy-sensitive assets.
- Includes every v0.5.3.4.7 Milestone, Focus Area, Skill allocation, and Project-integrity change.

## Included progression patch

- Includes the unreleased v0.5.3.4.6 semantic Skill XP correction: one-time weekly planning now awards Planning + Organization and no false Consistency XP.
- Rebuilt every focus-area Milestone around measurable completed work, Area levels, substantial outcomes, and transferable Skill development.
- Removed profession/tool guessing and unhealthy or artificial achievements, including late-night completion rewards and keyword-only CAD/GitHub/IELTS-style gates.
- Daily Quest history now counts correctly toward its focus-area practice milestones and Guide path.
- Added broader lifetime Daily, Subquest, and completed-Project milestone series based only on recorded outcomes.
- Rank XP, time, clear, Main, Campaign, Boss, and level thresholds remain unchanged. Milestone and Attribute requirements can no longer demand more paths than the user's current system makes available, and Rank badges never count as their own prerequisites.
- Added **Recalibrate Focus Areas** under System. It preserves quests, XP, Skills, and history and does not replay first-run onboarding.
- Project-map editing is blocked when it would discard earned linked progress. Deleting an active Project keeps earned linked quests as standalone history; completed Projects remain permanent progression records.
- State migration now retains only currently eligible Milestones/titles and correctly migrates categories from the incoming account/Guest state rather than the previously active browser identity.
- Added automated regression coverage for the new Milestone rules, rank prerequisite integrity, focus recalibration, Project earned-progress safety, version/cache markers, and all prior isolation/security/language checks.

## Included semantic Skill correction

- Fixed one-time planning quests incorrectly awarding secondary XP to Consistency merely because it was a default/category-affinity skill.
- Skill selection now evaluates all transferable capabilities while using the selected category as relevance context, so explicit AI tags can activate the correct broad skill.
- Added stronger bilingual Planning signals for priorities and time management.
- Consistency is now eligible only for Daily/Campaign quests or objectives with an explicit habit, repetition, routine, or ongoing-practice signal.
- Each accepted quest stores its normalized Skill allocation. Completion, subquest reversal, and reopening therefore use the exact same skills even after future engine changes.
- Existing quests with earned XP retain the legacy allocation rule for safe reversal; unearned existing quests adopt the corrected semantic rule.
- Added an exact regression fixture for `ترتيب خطة الأسبوع وتحديد الأولويات`: Planning receives two thirds, Organization one third, and Consistency receives none.
- Rank requirements, total XP rewards, account isolation, Guest isolation, cloud encryption, AI language handling, and Delete Account are unchanged.

# v0.5.3.4.5 — Transferable Skills & Quest AI Access

- Replaced the rigid four-skills-per-category model with a shared pool of broad, genuine capabilities. Categories now activate relevant skills but overlapping capabilities are deduplicated globally.
- Engineering now grows broad capabilities such as Planning, Problem Solving, Critical Thinking, Systems Thinking, and Quality Judgment; CAD/Design is no longer forced onto every Engineering user.
- Added broad skills including Consistency, Focus, Execution, Learning, Communication, Decision Making, Adaptability, Resilience, Organization, Creativity, Leadership, Endurance, Self-Management, Collaboration, and Responsibility.
- Reordered the Core Skills display by earned XP and cross-category relevance and replaced repeated category labels with concise skill descriptions.
- Added migration from legacy `Category::Skill` keys to global `core::skill` keys while preserving total Skill XP.
- Updated adaptive Guide and Milestone skill gates to use the same transferable skill engine.
- Added an **AI Quest Console** button to Quests that returns to and focuses the existing Command Console. No duplicate AI Console or extra API path was added.
- Added automated regressions for skill deduplication, general Engineering skills, legacy XP preservation, Daily Consistency growth, single-console enforcement, PWA caching, and the Quest Board shortcut.
- Fixed local Daily Directive deadline scoring to use the player's supplied local date instead of the deployment server's timezone.
- Rank requirements, XP rewards, AI anti-farming, encrypted sync, account isolation, and Guest isolation are unchanged.

# v0.5.3.4.4 — Height-Aware Responsive Polish

- Rebuilt the short-height Sign In / Create Account experience as a two-column laptop layout so enlarged Windows display scaling and browser zoom no longer produce an unnecessarily tall page.
- Added a dedicated compact phone state that removes only nonessential marketing/privacy repetition while keeping credential fields, Turnstile, security status, Guest access, and touch targets usable.
- Bounded the mobile System sheet to the dynamic viewport and compacted its player header and actions on short screens. **Delete Guest Profile** remains available as the intentional way to erase an existing device-only Guest identity.
- Added a height-aware desktop command rail that tightens navigation and account controls at enlarged display scaling and removes the competing visible sidebar scrollbar.
- Preserved the v0.5.3.4.3 Guest/account isolation, per-user caches, identity-epoch guards, AI language contract, current tutorial, Quest Console order, account deletion safety, XP economy, and rank gates.
- Added structural regression coverage for the responsive auth columns, short mobile auth, viewport-bounded System sheet, compact desktop rail, version endpoint, and PWA cache.
- Bumped the PWA service-worker cache to `ascend-v0.5.3.4.4` so previously cached layout CSS is replaced after deployment.

# v0.5.3.4.3 — Private Beta Isolation, Language & UX Polish

- Fixed same-browser Guest/account state crossover: authenticated users can hydrate only from that user ID's account cache or that user's RLS-protected cloud row; generic device and Guest state are excluded.
- Added a dedicated state-scope helper and per-write namespace resolution, so authenticated bootstrap writes cannot fall back to the generic device key.
- Added identity-epoch guards around async cloud pull/push/reconciliation. A request started for Account A is discarded if the browser switches identity before it finishes.
- Kept the identity gate visible until Guest or authenticated identity resolution completes, preventing a pre-auth flash of cached player state on shared devices.
- Added **Continue Guest Profile** / **Start Fresh Guest** behavior so testing can preserve one Guest profile or intentionally replace it.
- Onboarding focus selections are reset at the start of a fresh calibration, with a visible selection count and **Deselect all** action.
- Refreshed the first-run tutorial to 13 current steps covering Command, Quest Console, Skills, active objectives, Quest Board, Projects, Guide, Progress, Milestones, System, encrypted cloud sync, and account safety.
- Moved the AI Quest Console above Skill Matrix so adding work is a primary Command Center action.
- Added **Cancel** to a single analyzed quest before Review & Accept.
- Enforced Arabic/English output consistency for user-visible quest AI fields. Explicit in-objective language requests override the detected input language; system enum labels remain stable.
- Scoped Gemini classification-cache keys to the full sanitized player context, preventing identical objective text from reusing another account's category/context result.
- Added the same language contract to Project Architect output and a language-aware local fallback.
- Compacted Sign In / Create Account for short laptop displays and mobile screens while preserving touch targets and Turnstile.
- Improved deleted-account feedback only when this browser has a hashed local record of having deleted that email; arbitrary unknown accounts retain the generic auth failure message.
- Replaced typed `DELETE` with an acknowledgement checkbox plus final destructive confirmation. Password reauthentication and fresh Turnstile remain required.
- Bumped the PWA service-worker cache to prevent stale pre-patch JS/CSS from surviving an upgrade.
- Rank gates, S-Rank impact-credit limits, XP economy, and existing cloud encryption rules are unchanged.

# v0.5.3.4.2 — Windows Secret-key setup clipboard fix

- Replaced `Read-Host -AsSecureString` with direct clipboard reading for the Supabase server Secret key.
- Avoids the Windows console behavior that accepted only one pasted character and produced `Secret key is required`.
- Normalizes copied text, rejects publishable keys, preserves the existing `.env`, and clears the clipboard after a successful save.
- No authentication, RLS, Turnstile, quest, progression, or account-deletion behavior was otherwise changed.

# v0.5.3.4.1 — Delete-account setup input hardening

- Fixed Windows setup rejecting valid `sb_secret_...` values copied with invisible Unicode/control characters.
- Normalizes clipboard input before validation and strips surrounding quotes/whitespace safely.
- Distinguishes publishable keys from server Secret keys with a clearer error.
- Keeps the Secret key server-only in `.env`; it is never returned by `/api/config` or browser code.

# v0.5.3.4 — Authentication UX + Secure Account Deletion

- Added inline required-field validation for email/password on the account-first entry screen.
- Invalid or missing email/password no longer leave the interface in a vague loading state.
- Sign-in failures now map Supabase errors into clear, user-facing messages such as `Incorrect email or password`, unverified email, rate limit, CAPTCHA expiry, and network failure.
- Added Enter-key submission and guarded double-submit behavior on the welcome auth form.
- Added **Delete My Account** for authenticated cloud users in System plus desktop/mobile quick access.
- Account deletion uses a destructive confirmation dialog, requires the current password, requires typing `DELETE`, and requires a fresh Cloudflare Turnstile challenge.
- The browser reauthenticates first, then sends only a fresh user access token to ASCEND's same-origin backend.
- The backend verifies the caller with Supabase Auth before using a server-only Supabase Secret/service-role key to delete exactly that authenticated user.
- The Supabase admin key is never returned by `/api/config` and never enters browser code.
- Deleting `auth.users` cascades the existing `player_state` row through the schema's `ON DELETE CASCADE`; the device also removes that account's local cache and recovery key.
- Account deletion fails closed when no server-side admin key is configured.
- Added `.env.local` and `.vercel/` to `.gitignore` and refreshed setup-script version labels.
- Rank gates, XP economy, quests, projects, milestones, Guest data, and progression rules are unchanged.

# v0.5.3.3 — Security Hardening II: Turnstile Auth Protection

- Integrated Cloudflare Turnstile with Supabase email/password sign-in, sign-up, verification resend, and password recovery.
- Turnstile tokens are reset after protected authentication requests so repeated actions require a fresh verification token.
- Added public Turnstile Site Key delivery through `/api/config`; the Turnstile Secret remains only in Supabase Auth configuration.
- Updated Content Security Policy for the official Cloudflare Turnstile challenge origin.
- Added explicit-render Turnstile panels to the account-first entry gate and Cloud Link settings.
- Guest Mode remains device-only and does not require CAPTCHA.
- Added `.env.local` loading for local development while preserving `.env` fallback.
- Expanded smoke tests for CAPTCHA wiring, public-config exposure, CSP, and secret-key non-exposure.

# v0.5.3.2 — Security Hardening I

- Added strict CSP, anti-clickjacking, MIME-sniffing, referrer, permissions, COOP/CORP and HSTS headers on Vercel.
- API responses are no-store and browser cross-origin API calls are rejected.
- Added per-instance API rate limiting and 256 KB JSON request cap to reduce abuse/cost amplification.
- Auth access/refresh tokens moved from persistent localStorage to sessionStorage; legacy localStorage auth tokens are deleted automatically.
- Added hardened Supabase SQL: FORCE RLS, revoke PUBLIC/anon table rights, explicit authenticated policies, encrypted payload size boundary.
- No Gemini secret or Supabase service-role secret is exposed to the browser.

# v0.5.3.1 — Adaptive Taxonomy & Guest Safety
- Separates Focus Categories, Skills, Milestones, Quest Types, and Operating Style.
- New quest classification is restricted to selected focus categories; custom categories are supported.
- Skill Matrix is generated from category-specific skills.
- Every selected focus gets adaptive milestones and a progression route.
- Medicine & Healthcare includes Medical Knowledge, Clinical Reasoning, Patient Safety & Ethics, and Clinical Communication.
- Unselected domain milestones/routes no longer appear.
- Category XP and Skill XP are tracked separately.
- Log Out requires confirmation.
- Guest users can permanently Delete Guest Profile after a destructive confirmation.
- Existing encrypted cloud data and historical quests/projects are preserved.

# v0.5.3.1 — Persistent Guest & Sidebar Accessibility

- Desktop sidebar now scrolls independently from the main content, so the account card and Log Out button remain reachable at short viewport heights or higher browser zoom.
- Added **Medicine & Healthcare** to onboarding focus areas.
- Guest mode is now a persistent device-only profile instead of a browser-session-only profile.
- Guest progress survives closing and reopening the browser on the same browser/device.
- Guest data is still never uploaded to Supabase and never synced across devices.
- Logging out of Guest returns to Welcome without deleting Guest progress.
- Choosing Continue as Guest again resumes the saved Guest profile.
- Signing into a cloud account cleanly leaves Guest mode while keeping its device-only data isolated for later testing.
- Clearing browser/site data removes Guest progress because Guest has no cloud account.

# v0.5.3.1 — Guest Access & Fast Session Switching

- Added **Continue as Guest** to the welcome screen.
- Guest mode requires no email, password, or Supabase account.
- Guest progress is isolated in `sessionStorage` and is never uploaded to the cloud.
- Refreshing the same tab keeps the guest session; closing the browser session naturally clears it.
- Added a visible **Log Out** button under the desktop player card.
- Added **Log Out / Exit Guest** inside the mobile System sheet.
- Logging out returns immediately to Welcome and hides the previous account state.
- Exiting Guest deletes the temporary guest state.
- Guest status is clearly labeled `GUEST SESSION` / `GUEST`.
- Existing encrypted sync, onboarding, quests, projects, milestones, and progression logic are preserved.

# v0.5.3.1 — Personalization & Onboarding Patch

- Expanded first-run focus selection across work, study, health, personal, social, creative, life, and project areas.
- Added custom focus areas.
- Simplified onboarding finish to one Enter ASCEND action.
- Guided tour now starts automatically after first onboarding and remains skippable/replayable.
- Milestones now hide area-specific paths that are unrelated to the player’s selected focus areas.
- Preserved broad focus selections across cloud state reloads.

# v0.5.3.1 — Verification UX Patch

- Shows a dedicated “Check your email” screen after signup when email confirmation is required.
- Displays the exact account email and clear next action.
- Adds “Resend verification email”.
- Adds “Back to Sign In”.
- Keeps sign-up state from looking frozen after the account is created.
- Production email confirmations use the Supabase Site URL configured for ASCEND.

# ASCEND v0.5.3.1 — IDENTITY

## Major release

- Account-first entry flow: Sign In / Create Account appears before the app.
- Personal calibration onboarding: name, focus areas, operating mode, then optional tutorial.
- Password-reset email flow and recovery callback UI.
- Projects: Project → Quests → Subquests hierarchy with required/optional workstreams and a locked final objective.
- AI Project Architect endpoint with conservative local fallback.
- Project completion bonus avoids duplicating normal Quest/Subquest XP.
- Exceptional Impact Credit: only completed, unusually difficult/high-impact project histories can receive S-Rank time credit; lifetime cap is 5%.
- Account-scoped encrypted cloud state remains the source of cross-device sync.
- Cloud conflict guard from v0.4.9.7 retained.
- Security audit SQL included for strict authenticated-only RLS policies.
- Existing v0.4.x progress migrates forward without reset.

## Privacy design

Each Supabase account has one player_state row keyed by auth user UUID. The browser encrypts the state before upload. The included SQL explicitly revokes anonymous table access and restricts SELECT/INSERT/UPDATE/DELETE to the authenticated row owner.

# v0.5.3.1 — Cloud Recovery Guard

- Prevents a newer empty/default cloud state from overwriting meaningful local progress.
- Prefers meaningful progress over blank state before using timestamps.
- Protects manual and heartbeat sync in both directions.
- AI connection checks no longer mutate the user progress timestamp.
- Includes the Vercel-compatible default server export.
- No rank or XP economy changes.

# ASCEND v0.5.3.1

## HTTPS Mobile Vault Patch

- Added explicit secure-context detection for encrypted sync.
- Mobile/local-network HTTP sessions now explain why AES-GCM recovery-key unlock is unavailable instead of showing a vague cryptography error.
- Recovery-key import and encrypted Sync controls are disabled on insecure HTTP origins to prevent accidental state conflicts.
- HTTPS/localhost sessions continue to use browser-side AES-GCM encryption.
- Added an HTTPS/Vercel deployment guide for the private beta.
- Updated PWA cache version so phones do not retain the previous build.
- Kept the existing Supabase RLS cloud schema and `player_state` ciphertext format unchanged.
- XP, ranks, quests, milestones, Guide, and existing player data are unchanged.
