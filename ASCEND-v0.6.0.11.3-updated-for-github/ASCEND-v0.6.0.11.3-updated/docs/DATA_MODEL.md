# ASCEND v0.6.0.10 Data Model

The encrypted player-state schema is version `10`. Migration remains compatible with older local and cloud payloads.

Core state includes profile, selected focus areas, season, system context, AI cache, XP, category stats, transferable Skills, Quests, Projects, Planner, Habits, activity, dates/streaks, Milestones/titles, ranks, metrics, External Request key envelope, and timestamps.

Planning data is account-scoped player-state. It is encrypted before cloud upload and never awards XP on its own:

- `planner.lists[]`: named checklists with ordered items and estimates.
- `planner.semesters[]`: semester dates/purpose, courses, and fixed weekly commitments.
- `course.sections[]`: study units with estimates and optional linked Quest IDs.
- `course.classes[]`: weekly day/start/end/type/location records.
- `semester.commitments[]`: work, protected study, appointment, or other fixed times.

Daily Quest records store `dailySeriesId`, `dailyScheduledFor`, `dailyPreviousId`, `dailyHistory`, `dailyAwards`, `dailyMissedCount`, `dailyLastMissedFrom`, and `dailyLastRolledAt`. Each generated occurrence owns one scheduled day and starts with no earned progress. When an active occurrence becomes stale, its scheduled date advances to the current local day without changing its reward/progress fields or creating another occurrence.

Habits are deliberately separate from Quests and progression. `habits[]` stores `id`, `title`, `category`, scheduled weekday indices, optional `time`/`note`, a bounded map of completed local date keys, and created/updated timestamps. Habit records contain no XP or reward fields; checking one does not mutate Rank, active days, Quest metrics, or Circle summaries.

## Browser namespaces

- Base local state: `ascend.system.state.v4`
- Guest state: `ascend.system.guest.state`
- Per-account state: `ascend.system.state.v4.user.<user_id>`
- Cloud auth session: session storage only
- Per-account recovery key: `ascend.cloud.vaultKey.v1.<user_id>`

An authenticated identity always resolves its user-ID namespace. Guest state is never a cloud-sync candidate.

## Cloud row

`player_state.encrypted_state` contains an AES-GCM envelope created in the browser:

```json
{
  "encrypted": true,
  "format": "ascend-aes-gcm-v1",
  "iv": "...",
  "ciphertext": "...",
  "stateUpdatedAt": "..."
}
```

Supabase RLS scopes rows to `auth.uid() = user_id`. A locked new device cannot replace the remote row until the Recovery File/key unlocks it.
