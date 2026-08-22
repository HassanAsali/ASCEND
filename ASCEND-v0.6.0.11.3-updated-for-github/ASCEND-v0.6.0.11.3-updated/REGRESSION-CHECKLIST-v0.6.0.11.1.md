# ASCEND v0.6.0.11.1 regression checklist

Run only a few checks at a time.

## Projects

- Create a Project and verify its workstreams appear inside Projects.
- Confirm Project work is hidden from the default standalone Quest Board.
- Complete/reopen a workstream and verify Project progress changes.
- Delete an unstarted Project and confirm its linked workstreams are removed.

## Reminders and sessions

- Open a Quest reminder and confirm ASCEND scrolls to that exact item.
- Close and reopen ASCEND on a remembered device; Sign In must not flash.

## Habits and responsive layout

- Check an interval Habit at an off-grid time and confirm its next availability is calculated from that real time.
- Confirm repeated Habit check-ins never add XP.
- Narrow a desktop window and confirm hero text, icons, and actions remain readable and inside their cards.

## Automated verification

- `node --check public/app.js`
- `node --check public/habit-system.js`
- `node --check server.mjs`
- `npm test`
