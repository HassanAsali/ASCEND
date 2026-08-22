# ASCEND v0.6.0.8 regression checklist

Use only a production/preview test account and non-sensitive sample text. Run a few groups at a time rather than rushing the whole list.

## Group A — Quest intake and review

1. Type one Quest through Quick Add and immediately press Accept. Confirm ASCEND waits for evaluation and does not save a stale/default reward.
2. Analyze one Quest, select/copy part of the analysis, then press Cancel. Confirm the result and original Console text are cleared.
3. Analyze three lines as a batch. Review the middle result and press Discard This. Confirm only that result disappears and the other two remain.
4. Accept one result. Confirm the Quest appears once, its input text is cleared, and its card shows Next action.

## Group B — Voice and mobile

1. On HTTPS Chrome/Safari, press Voice, allow the microphone, speak one Arabic Quest, stop, and review the transcript before Analyze.
2. Deny microphone permission and confirm ASCEND explains the problem without breaking typed input.
3. On installed iPhone PWA, confirm the Command title no longer collides with the status bar and the bottom dock remains usable.

## Group C — Projects and Planner

1. Create a Project with at least two workstream Quests; confirm the final Quest stays locked until required work is complete.
2. Create a List named Math, add three sections with time estimates, convert exactly one item to a Quest, and confirm the planning item itself awards no XP.
3. Create a Semester with two courses and overlapping class/fixed times; confirm the timetable highlights the overlap.

## Group D — Focus Circles

1. Run `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql` once and redeploy.
2. Account A creates a Circle and copies its invite code. Account B joins with the code.
3. Both accounts refresh. Confirm only display name, Rank, level, seven-day XP, and active-day summaries appear—never email, Quest text, or recovery data.
4. Add a shared lecture/session and mark it done from Account B. Confirm it never awards XP or changes Rank.
5. Switch A → B → Guest → A in one browser. Confirm Circle data never flashes in the wrong identity.

## Group E — Security and isolation

1. Verify Guest data remains local and separate from every signed-in account.
2. Verify Account A and Account B retain independent Quests, Planner data, Projects, encrypted vault keys, and Circles.
3. Confirm Circle tables cannot be read with browser anon/authenticated REST access.
4. Confirm `/api/health` reports `0.6.0.8`; no secret value appears in `/api/config`, source files, browser storage exports, feedback, or logs.

