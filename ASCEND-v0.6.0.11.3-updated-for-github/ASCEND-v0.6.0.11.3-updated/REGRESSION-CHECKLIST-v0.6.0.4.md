# ASCEND v0.6.0.4 — Focused Manual Regression

Run only a few checks at a time.

## 1. External Request stays one Quest

1. Send one meeting request through the private link.
2. In Quests, press **Analyze with AI**.
3. Accept it.
4. Confirm the board shows one Quest card, not multiple Quest cards and not an automatic subquest stack.

## 2. Lists and Quest conversion

1. Open **Planner → Lists → New List**.
2. Create `Math 201` with `Section 1 | 45` and `Section 2 | 60`.
3. Check one item and confirm total XP does not change.
4. Press **Make Quest** on Section 2, accept it, and confirm one linked Quest appears on the Quest Board.

## 3. Semester and timetable

1. Create a Semester and two courses.
2. Give both courses overlapping times on the same day.
3. Open **Class Schedule** and confirm both meetings are highlighted with a conflict warning.
4. Add a **Fixed Time** that overlaps a class and confirm both are highlighted.
5. Edit the fixed time so it no longer overlaps and confirm the warning clears.

## 4. Project Map

1. Create a small Project with two required workstreams, one optional workstream, and a Final Quest.
2. Confirm the Final Quest is locked.
3. Complete only the two required workstreams and confirm the Final Quest unlocks; the optional one remains optional.
4. On a fresh unearned Project, edit the map and confirm the Quest acceptance metric is not counted twice.

## Automated verification

```text
npm test
ASCEND v0.6.0.4 smoke tests: PASS
```
