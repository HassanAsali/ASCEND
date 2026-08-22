# ASCEND Roadmap after v0.4.9

## v0.6.0.11.2 — delivered

- Circle Contribution XP: independent, server-computed, anti-farm system, fully separate from account XP/level/rank.
- Finish/Archive Circle: owner-only, idempotent, freezes writes, archived view.

## v0.6.0.11.3 — delivered

- Private Friends is separate from Focus Circles and uses private random codes only.
- Full request lifecycle: send, accept, decline, cancel, remove, and block.
- Shared study/task/meeting plans with independent completion and no XP/Rank effects.
- Opt-in Friends collaboration board with no public email search or account enumeration.

## v0.6.0.11.x — remaining deferred work

These were requested together with the above but are large enough (new schema, new UI, real security review) that building them without verifying each one properly would repeat the exact "claimed done, not actually checked" problem this project is trying to avoid. Tracked here so nothing gets lost:

- Session/item management: Edit and Delete (with confirmation) for circle items, clear owner/participant permissions, conflict handling.
- Collaborative-session extensions: invitation-level accept/decline, personal-schedule conflict detection, and reminders without awarding points for joining.
- First Action audit across every quest-creation path (single, batch, external request, back-from-review, delete-then-return, AI accept/reject) to eliminate stale carryover.
- Input-field cleanup: only clear on confirmed save, never on failure, never re-run stale analysis on Cancel/Back.
- Review/Batch Review polish: selectable/copyable analysis text, per-item discard before Accept All, confirmed Cancel All, no accidental duplicate accepts.
- Voice Input: verified Arabic + English recognition, explicit language choice, clear Listening/Stop/Error states, no auto-send before review, no server-side audio storage, iPhone/Safari/Chrome check.
- Notifications: due-task, habit, shared-session, and friend/circle-invite notifications; no duplicates; timezone-correct; per-type opt-out; nothing fires after the source item is deleted.
- Habits: hourly-interval recurrence with start/end window, correct midnight/timezone handling, broader categories, no double-crediting one occurrence, a safe Undo.
- Responsive UI pass: phone/tablet/laptop icon and safe-area checks, bottom nav not covering content, scrollable dialogs, RTL/Arabic card integrity — without a full visual redesign.
- Planner/Lists/Semester: verify and complete existing features (reordering, single-item-to-quest conversion, weekly conflict detection), confirm Guest/account data isolation.
- Projects: full test coverage — edit doesn't inflate the accepted counter, Final Quest stays locked until prerequisites are done, empty projects can't be marked complete, no XP from delete/edit.
- Security hardening pass 2: Friends/session endpoints specifically (IDOR, RLS, rate limiting, origin checks) once those systems exist; a general re-audit alongside them.
- Monetization documentation: what stays free, possible future Premium features, no paywalled security/data-recovery, rough Gemini/Supabase/Vercel cost estimate at small scale, private-beta AI usage limits.

Suggested order for the next release: Session/item edit+delete → Collaborative-session extensions → Notifications → Habits → Responsive UI → Planner/Projects test coverage → Security pass 2 → Monetization doc. Open to reprioritizing.

## v0.4.9 — Encrypted Beta

Final 0.4.x hardening build: generic clean defaults, one Analyze control, encrypted cloud vault, recovery-key device linking, guided onboarding, and mobile hardening.

## v0.5.x candidates

- Real hosted private-beta rollout and tester feedback cycle.
- More resilient conflict resolution than last-write-wins.
- Optional private/local AI mode and clearer provider-consent controls.
- Better account recovery design for encrypted vaults.
- Dynamic Guide path selection during onboarding.
- Notifications/recurring quests only after core sync behavior is proven.
- Final product-name decision after collision/trademark research.
