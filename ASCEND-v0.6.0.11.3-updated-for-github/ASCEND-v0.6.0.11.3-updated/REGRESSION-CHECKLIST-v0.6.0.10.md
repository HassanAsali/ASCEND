# ASCEND v0.6.0.10 Regression Checklist

## Batch First Action

1. Submit three unrelated Arabic objectives, one per line.
2. Confirm the batch overview shows a different, relevant Arabic First Action under each item.
3. Review one item, cancel it, delete another item, then reopen the remaining item.
4. Confirm no title or First Action moves to a different objective.

## Voice and responsive UI

1. Choose Arabic beside the microphone, record one Arabic sentence, and confirm Arabic text appears.
2. Choose English and repeat with English.
3. Resize to laptop and phone widths; confirm the Shareable Request link and every action button stay inside the card.

## Habit reminders

1. Enable notifications from Habits.
2. Add a Health & Wellness Habit with `Repeat in a window`, 60 minutes, 08:00–12:00.
3. Reopen Edit and confirm the mode, interval, window, and category are preserved.
4. Confirm checking the Habit still grants zero XP.

## Focus Circles

1. If the Circle schema is absent, confirm ASCEND shows the exact SQL filename and Retry instead of loading forever.
2. Run `SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql` once as owner, redeploy/retry, then create a Circle.
3. Confirm a signed-out or non-member user cannot read Circle data.

No new secret or environment variable is required. The Circle SQL is required only when Focus Circles were never installed.
