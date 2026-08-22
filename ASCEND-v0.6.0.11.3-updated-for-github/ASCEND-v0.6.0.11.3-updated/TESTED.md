# ASCEND v0.6.0.11.3 — Tested

## v0.6.0.11.3 regression pass (Private Friends)

**Automated and passing from the delivered files:**
- Complete existing `npm test` regression suite plus syntax checks for server and browser modules.
- Friend invitations use a random private code; no public email search, email lookup, or account-enumeration response exists.
- Canonical user-pair uniqueness prevents duplicate friendships and self-invites are rejected.
- Request lifecycle coverage includes Pending, Accepted, Declined, Cancelled/Removed, and Blocked transitions with role checks.
- Removed, declined, and blocked relationships are not returned to either user's normal Friends list.
- Shared study/task/meeting plans require an accepted friendship; each member can update only their own completion.
- Friend-plan completion and the opt-in Shared Completions board are isolated from account XP, Rank, skills, milestones, and `player_state`.
- Friend profile, relationship, plan, and progress tables have RLS enabled; browser roles are revoked and only the server service role can access them.
- The SQL migration is additive-only and contains no destructive schema operations.

**Requires one live two-account verification after applying the SQL migration:**
- Run `SUPABASE-FRIENDS-v0.6.0.11.3.sql`, deploy, then test request → accept → shared plan → each member completes → remove/block using two real accounts.
- Confirm the Friends board stays opt-in and both accounts' Total XP and Rank remain unchanged.

## v0.6.0.11.2 regression pass (Circle Contribution XP + Finish/Archive Circle only)

**Automated (ran and passing, verified from the actual delivered files):**
- Full pre-existing smoke suite (`npm test`) — unchanged, still passing.
- Node syntax checks: `server.mjs`, `public/app.js`, `tests/smoke.mjs`.
- New: `circleItemXp()` unit coverage — 60min→30XP, 5min minimum, 480min cap at 60XP, out-of-range and non-numeric input fail safe (never 0 or throw).
- New: Complete→Undo→Complete simulation confirms N cycles on one item never award more than one item's worth of XP.
- New: static verification that `/api/circles` list response computes each member's Circle XP as a live sum of `xp_awarded` rows, not from client-supplied `totalXp`.
- New: static verification that Finish Circle is owner-only, idempotent (`alreadyFinished` short-circuit), and performs exactly one database write (no room for a hidden XP grant).
- New: static verification that both `/api/circles/item` and `/api/circles/progress` reject writes on a finished circle before any Supabase call.
- New: static verification the client labels this "Circle Contribution XP" distinctly and no longer sorts the leaderboard by self-reported `totalXp`.
- New SQL migration verified additive-only (no `DROP TABLE`, no `DROP COLUMN`).

**NOT automatically tested — needs manual verification with a real Supabase project (this sandbox has no live Supabase instance):**
- Actually running `SUPABASE-UPGRADE-v0.6.0.11.2.sql` against a real Supabase project that already has the v0.6.0.8 Focus Circles schema, and confirming it applies cleanly.
- Live end-to-end: create a circle, add a shared item, complete it as two different real accounts, confirm both members' Circle XP appear correctly and independently, confirm account Total XP/level/rank are unaffected.
- Live daily-cap behavior: complete enough items in one day to hit the 150 XP cap and confirm further completions that day award 0 additional XP (but still mark as complete).
- Live Finish Circle: confirm the owner sees the summary, confirm a second member cannot finish it, confirm all circle members immediately lose the ability to add/edit/complete items, confirm the circle appears under "Archived Circles" for every member.
- Cross-browser/device check of the new archived-circle UI section and the Finish Circle confirmation dialog.

## v0.6.0.11.1 regression pass

- Node syntax checks pass for the server, client, state-scope, skills, Daily, Planner, Habit, request, and smoke-test modules.
- Static and unit regressions pass for encrypted payload round trips, Guest/account isolation, classification caches, skills, Daily accounting, Planner, Habits, security markers, responsive controls, and schema migrations.
- First Action is absent from the client UI/state and server classification output.
- Remember-device sessions are opt-in, bounded to 30 days, password-free, and cleared during sign-out/identity changes.
- Arabic/English voice selection, Notification Center, per-item reminders, readable Habit recurrence, and Circle setup diagnostics are covered.
- The hosted HTTP portion of the smoke suite was not executed inside the artifact sandbox because local network listeners are blocked there; run `npm test` locally before production deployment.

## v0.6.0.10 regression pass

- Node syntax checks pass for the server, application, Habit engine, and service worker.
- Batch regression confirms three source lines remain three independently bound results with unique Arabic First Actions.
- Habit regression confirms bounded interval slots, legacy one-time reminder migration, honest streaks, and zero-XP separation.
- Static UI regression confirms explicit Arabic voice selection, notification controls, full Habit categories, responsive request-card guards, and actionable Circle setup diagnostics.
- Existing security, encrypted state, account isolation, Daily reversal, Planner, Project, External Request, Circle authorization, and Rank-gate tests continue to pass.

## v0.6.0.9 Daily catch-up and Habits regression

- A Daily occurrence scheduled before the current local date advances once to today and records the skipped-day count.
- Catch-up preserves incomplete subquest state and existing award accounting, adds no XP, and does not create a duplicate Daily.
- Completed history never moves, future locked occurrences never move backward, and a freshly generated tomorrow occurrence resets inherited missed-day labels.
- Habits normalize selected weekdays, ignore check-ins on unscheduled days, support exact check/uncheck, and calculate schedule-aware seven-day progress/current streak.
- Missing a scheduled Habit day breaks its current streak without affecting XP, Rank, active-day history, Quest clears, or Daily recurrence.
- Habits migrate within account-scoped schema `10`; no API/table/SQL path was added and Guest/authenticated namespaces remain isolated.
- Existing Voice Quest, review discard/cancel, intake clearing, Planner/Project, Focus Circle, opt-in leaderboard, encryption, RLS, language, reward, Daily undo, and Rank regressions remain in the complete smoke suite.

## v0.6.0.4 Planner and external-review regression

- Multiline External Request metadata cannot trigger Batch intake; the API and client both preserve one result.
- Direct and AI External Request review produce one Quest card and no automatic subquest stack.
- Planner migration preserves Lists, Semester, Courses, estimates, focus levels, class meetings, and standalone fixed commitments without introducing XP fields.
- Planner progress is deterministic; conversion creates a linked Quest only after explicit user action.
- Weekly schedule overlap detection catches class-to-class and class-to-commitment conflicts, accepts Arabic or English day names, and ignores adjacent non-overlapping times.
- Project edits do not increment acceptance history; a Final Quest requires at least one required workstream.
- Planner, project, security, isolation, encryption, language, Daily, PWA, and API checks pass in the complete npm suite.

### Turnstile verification regression

- Valid hostname/action/request-link-bound Siteverify responses pass.
- Expired or already-used tokens produce a fresh-check message and a stable non-secret diagnostic code.
- Invalid/missing Secret keys, hostname mismatches, action mismatches, and `cData` binding mismatches fail closed with distinct safe messages.
- Siteverify HTTP/network timeouts fail closed within eight seconds and can be retried.
- Tokens, Secret keys, capability-link tokens, `cData`, IP addresses, and encrypted request contents are never returned as diagnostics.
- All prior encryption, request-inbox, state-isolation, language, Daily, XP, milestone, rank, PWA, and API regressions remain in the complete npm suite.

## v0.6.0.2 safe API navigation regression

- Direct address-bar-style `GET /api/health` succeeds even with `Sec-Fetch-Site: cross-site`.
- Cross-site-marked `POST /api/classify` remains rejected with HTTP 403.
- Same-origin application APIs, External Requests, encryption, state isolation, and existing regressions remain covered.

## v0.6.0.1 request delivery regression

- Turnstile executes on submit, not during initial page load.
- The sender button stays unavailable before the secure widget is ready and ignores duplicate submits.
- Verification and encrypted submission both have bounded timeouts and reset for retry after failure.
- The Shareable Request Link card appears once on Command and no longer appears in System.
- Command exposes the pending count and opens the Quests review inbox.
- Owner inbox loading has a bounded request timeout.

## v0.6.0.0 automated coverage

- Public request links contain no account ID or owner email and route to a standalone no-account form.
- Sender payloads pass an RSA-OAEP-256 + AES-256-GCM round trip; altered authenticated context fails decryption.
- The request private key is stored only as a recovery-vault-encrypted envelope.
- External endpoints fail closed unless Supabase public/admin configuration plus both Turnstile keys exist.
- Browser roles are revoked from request tables; the service role is the only database caller.
- Token-bound Turnstile, envelope replay rejection, per-IP/inbox rate limits, pending limits, and expiry markers are present.
- External request text remains pending until review; accepting it creates a normal Quest and then closes the pending envelope.
- A real edit to an AI-prefilled external objective severs automatic acceptance of the original request.
- iPhone status-bar safe-area CSS and ordinary `.txt` Recovery File download/import are wired.
- Static/API routing, syntax checks, all prior isolation/language/daily/reward/rank regressions, and the complete npm suite pass.

## v0.5.3.4.13 automated coverage

- Existing encrypted accounts on a new device receive the vault-unlock gate before onboarding.
- A locked device cannot persist or upload a default account state.
- A successful Recovery File unlock restores the decrypted cloud state even if an older build left a newer empty cache.
- Unchanged AI-analyzed quests keep the exact reviewed XP during individual acceptance and Accept All.
- Editing a reward-affecting form field deliberately unlocks and recalculates XP.
- Feedback setup includes the server-only insert grant and PostgREST schema refresh validated during live deployment.

## v0.5.3.4.11 automated coverage

- Quest Board separates active quests into labeled Daily, Main, Side, Campaign, and Boss lanes.
- Daily reward accounting grants no more than the advertised total and Undo Today reverses the full occurrence.
- Private Beta feedback fails closed without server configuration and browser roles cannot read the table.
- Apple install instructions, manifest PNG icons, and service-worker cache version are present.
- Recovery File download/import and one-time per-device acknowledgement controls are wired.
- XP Activity uses net ledger values so undo events do not inflate the chart.
- Syntax checks and the complete npm smoke/regression suite pass on v0.5.3.4.11.

## Automated verification completed

- `node --check server.mjs`
- `node --check public/app.js`
- `node --check public/daily-cycle.js`
- `node --check tests/smoke.mjs`
- `npm test`
- Milestone cards render the owning category/path alongside rarity
- Long and custom path names are constrained without overflowing cards
- Versioned CSS/JS URLs are embedded in the application shell
- Service-worker updates bypass HTTP cache and run an explicit update check
- Browser navigation is network-first with a versioned offline fallback
- Vercel and Node responses prevent caching of the deploy-sensitive application shell
- Realistic focus-area Milestones use completion counts, Area levels, substantial clears and transferable Skill levels
- Daily Quest history counts as individual focus-area completions
- Tool/keyword/profession-specific and late-night Milestones are absent
- Rank Milestone requirements exclude Rank badges themselves and cap only impossible unavailable-path counts; numeric rank gates are unchanged
- Focus-area recalibration controls exist and preserve progress without replaying first-run tutorial
- Project edit/delete protections prevent earned linked XP from becoming orphaned
- DOM ID consistency across auth, onboarding, Guest, tutorial, Quest Console, Turnstile and account-deletion controls
- Daily completion produces one next-day occurrence and the helper rejects duplicate generation
- Next-day Daily occurrences stay locked until their scheduled date and reset inherited subquest progress
- Explicit same-day Daily undo eligibility expires after the completion date
- PWA service-worker cache bumped to `ascend-v0.5.3.4.11`
- Transferable skill engine loads before the app and is included in the offline PWA core cache
- Engineering activates broad Planning, Problem Solving, Systems Thinking, Critical Thinking and Quality Judgment rather than forcing CAD/Design
- Business + Finance + Fitness skills deduplicate shared capabilities instead of rendering twelve category-owned cards
- Legacy category-specific Skill XP migration preserves the total amount earned
- Daily practice regression confirms that Consistency receives skill progression
- One-time weekly planning regression confirms a deterministic 40/20 split between Planning and Organization with zero Consistency XP
- Consistency gating requires a recurring/Daily/Campaign signal instead of category affinity alone
- Per-quest Skill allocation is stored and reused so reopening cannot subtract XP from different skills after an engine update
- Quest Board exposes one AI Console shortcut and the source contains only one actual Quest Console
- Height-aware auth structure and laptop two-column breakpoint are covered by regression assertions
- Short-screen mobile auth hides only nonessential marketing/privacy repetition while retaining credentials, Turnstile, status, and Guest actions
- Mobile System sheet is viewport-bounded, internally scrollable only as fallback, and compact below 760px viewport height
- Short desktop command rail preserves every action while suppressing its competing visible scrollbar
- Quest Console appears before Core Skills in the Command Center source order
- Single analyzed quest exposes both **Cancel** and **Review & Accept**
- Guided tutorial key bumped to `guidedTour.v3` with at least 13 current feature steps
- Behavioral storage-scope regression covers existing Guest, fresh Guest, Account A, Account B, a stale Guest-active flag, and a populated legacy device key
- Authenticated state hydration excludes generic device/Guest state and accepts only the authenticated user's cache or RLS cloud row
- Every save re-resolves the active namespace; identity-epoch guards reject stale async sync work after account switching
- The identity gate is visible before auth/Guest resolution to prevent cached-state flashes
- Fresh Guest markers, Guest resume controls, onboarding selection reset, selection count and **Deselect all** are present
- Deleted-account feedback is scoped to a locally hashed deletion marker rather than generic account enumeration
- Delete Account uses current-password reauthentication + acknowledgement checkbox + fresh Turnstile + final destructive confirmation
- Delete endpoint fails closed when the server-only Supabase admin secret is absent
- Supabase admin secret is not exposed through browser JS or `/api/config`
- Turnstile auth wiring remains present for sign in, sign up, resend, password recovery and delete-account reauthentication
- Strict AI language-contract markers are present for both single and batch classification
- Batch classification is guarded to remain one Gemini classification call; language enforcement after the batch is deterministic and does not fan out into per-objective repair calls
- Forced-local Arabic quest test verifies every populated user-visible field, including done criteria, breakdown, evidence, tags and anti-farm warning
- Forced-local explicit-English request verifies every populated user-visible field and confirms that requested language overrides Arabic input
- Gemini classification cache-key regression confirms the same objective with different selected categories receives a different context-scoped key
- Existing AES-GCM vault round-trip, RLS schema, date inference, batch classification, campaign quests, Guide, project, Directive, Review, rank-gate and XP smoke coverage remains active
- Daily Directive deadline priority is verified against the player's `localDate`, independent of server timezone

Result: **PASS**

## Manual verification already completed during beta testing before this patch

The beta test session also confirmed the surrounding authentication foundation:

- Wrong password is rejected with a clear auth error.
- Forgot Password email arrives; recovery link opens the password-change flow.
- Reusing the previous password was rejected during the tested recovery flow; a new password then signed in successfully.
- Turnstile visibly passed before authentication.
- Permanent test-account deletion completed successfully.
- The deleted email could be registered again and verified by email.
- Two different authenticated accounts were manually observed with separate quest state.

## Regression checks still recommended after installing v0.5.3.4.11

These checks specifically validate fixes introduced in this patch on the user's real browser/Supabase environment:

1. Guest -> authenticated account on the **same Chrome profile**: Guest quest must not appear in the account.
2. Authenticated account -> Guest: account quest must not appear in Guest.
3. Start Fresh Guest: onboarding must begin with zero selected categories.
4. Deselect all: selection count must return to `0 selected`.
5. Arabic quest through live Gemini: title and all prose should remain Arabic.
6. English quest through live Gemini: title and prose should remain English.
7. Explicit language override inside a quest should win over the input language.
8. Test the entry page at the same Windows scaling/browser zoom from the screenshots; the short laptop layout should use two columns and avoid page-length scrolling.
9. Open mobile System at short height; all controls including **Delete Guest Profile** should be compact and the sheet must stay within the viewport.
10. Replay the refreshed tutorial from System and confirm all 13 targets are reachable.
11. Confirm Core Skills are deduplicated, broadly named, and no Engineering-only CAD skill is forced onto the profile.
12. In Quests, press **AI Quest Console** and confirm it returns to Command and focuses the existing input without creating a second console.
