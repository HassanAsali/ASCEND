(function habitSystemFactory(root) {
  'use strict';

  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function dateKey(value) {
    const raw = String(value || '');
    return /^20\d\d-\d\d-\d\d$/.test(raw) ? raw : '';
  }

  function addDays(key, amount = 1) {
    if (!dateKey(key)) return '';
    const [year, month, day] = key.split('-').map(Number);
    const result = new Date(Date.UTC(year, month - 1, day + Number(amount || 0)));
    return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`;
  }

  function dayIndex(key) {
    if (!dateKey(key)) return -1;
    const [year, month, day] = key.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  function cleanText(value, max = 140) {
    return String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').slice(0, max);
  }

  function cleanId(value, idFactory) {
    return String(value || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) || (idFactory ? idFactory() : root.crypto?.randomUUID?.() || `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  }

  function scheduleDays(value) {
    const days = Array.isArray(value) ? [...new Set(value.map(Number).filter(day => Number.isInteger(day) && day >= 0 && day <= 6))].sort() : [];
    return days.length ? days : [0,1,2,3,4,5,6];
  }

  function validTime(value, fallback = '') {
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value || '')) ? String(value) : fallback;
  }

  function minutesFromTime(value) {
    const time = validTime(value);
    if (!time) return -1;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function timeFromMinutes(value) {
    const minutes = Math.max(0, Math.min(1439, Number(value) || 0));
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }

  function normalizeReminder(habit = {}) {
    const requested = ['none','once','interval'].includes(habit.reminderMode) ? habit.reminderMode : (validTime(habit.time) ? 'once' : 'none');
    const start = validTime(habit.windowStart, '08:00');
    const end = validTime(habit.windowEnd, '20:00');
    const interval = [30,60,90,120,180,240].includes(Number(habit.intervalMinutes)) ? Number(habit.intervalMinutes) : 60;
    if (requested === 'interval' && minutesFromTime(end) <= minutesFromTime(start)) {
      return { reminderMode:'interval', time:'', windowStart:start, windowEnd:'20:00', intervalMinutes:interval };
    }
    return {
      reminderMode:requested,
      time:requested === 'once' ? validTime(habit.time, '09:00') : '',
      windowStart:requested === 'interval' ? start : '',
      windowEnd:requested === 'interval' ? end : '',
      intervalMinutes:requested === 'interval' ? interval : 60
    };
  }

  function normalizeHabit(habit = {}, idFactory, today = '') {
    const checkIns = Object.fromEntries(Object.entries(habit.checkIns || {})
      .filter(([key, completed]) => dateKey(key) && completed === true)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-5000));
    const intervalCheckIns = Object.fromEntries(Object.entries(habit.intervalCheckIns || {})
      .filter(([key, values]) => dateKey(key) && Array.isArray(values))
      .map(([key, values]) => [key, values.map(value => new Date(value)).filter(value => Number.isFinite(value.getTime())).map(value => value.toISOString()).sort().slice(-96)])
      .filter(([, values]) => values.length)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-5000));
    const createdDate = dateKey(habit.createdDate) || dateKey(String(habit.createdAt || '').slice(0, 10)) || dateKey(today) || '2026-01-01';
    const reminder = normalizeReminder(habit);
    return {
      id: cleanId(habit.id, idFactory),
      title: cleanText(habit.title, 100) || 'Untitled habit',
      category: cleanText(habit.category, 60) || 'Discipline & Habits',
      note: String(habit.note || '').trim().slice(0, 600),
      ...reminder,
      days: scheduleDays(habit.days),
      checkIns,
      intervalCheckIns,
      createdDate,
      createdAt: habit.createdAt || new Date().toISOString(),
      updatedAt: habit.updatedAt || habit.createdAt || new Date().toISOString()
    };
  }

  function migrateHabits(source = [], idFactory, today = '') {
    return Array.isArray(source) ? source.slice(0, 100).map(habit => normalizeHabit(habit, idFactory, today)) : [];
  }

  function isScheduled(habit, key) {
    const index = dayIndex(key);
    return index >= 0 && scheduleDays(habit?.days).includes(index) && (!dateKey(habit?.createdDate) || key >= habit.createdDate);
  }

  function isDone(habit, key) {
    return Boolean(dateKey(key) && (habit?.checkIns?.[key] === true || habit?.intervalCheckIns?.[key]?.length));
  }

  function intervalEvents(habit, key) {
    return dateKey(key) && Array.isArray(habit?.intervalCheckIns?.[key]) ? habit.intervalCheckIns[key] : [];
  }

  function intervalStatus(habit, key, now = new Date()) {
    const events = intervalEvents(habit, key);
    const intervalMinutes = Math.max(30, Number(habit?.intervalMinutes) || 60);
    const last = events.length ? new Date(events[events.length - 1]) : null;
    const nextAt = last && Number.isFinite(last.getTime()) ? new Date(last.getTime() + intervalMinutes * 60000) : null;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const start = minutesFromTime(habit?.windowStart);
    const end = minutesFromTime(habit?.windowEnd);
    const inWindow = start >= 0 && end > start && currentMinutes >= start && currentMinutes <= end;
    return { count:events.length, lastAt:last, nextAt, inWindow, available:inWindow && (!nextAt || now >= nextAt) };
  }

  function recordInterval(habit, key, now = new Date()) {
    const normalized = normalizeHabit(habit, null, key);
    if (!isScheduled(normalized, key) || normalized.reminderMode !== 'interval') return normalized;
    const status = intervalStatus(normalized, key, now);
    if (!status.available) return normalized;
    normalized.intervalCheckIns[key] = [...intervalEvents(normalized, key), now.toISOString()].slice(-96);
    normalized.checkIns[key] = true;
    normalized.updatedAt = now.toISOString();
    return normalized;
  }

  function toggleDate(habit, key) {
    const normalized = normalizeHabit(habit, null, key);
    if (!isScheduled(normalized, key)) return normalized;
    if (isDone(normalized, key)) delete normalized.checkIns[key];
    else normalized.checkIns[key] = true;
    normalized.updatedAt = new Date().toISOString();
    return normalized;
  }

  function currentStreak(habit, today) {
    if (!dateKey(today)) return 0;
    let cursor = today;
    if (isScheduled(habit, cursor) && !isDone(habit, cursor)) cursor = addDays(cursor, -1);
    let streak = 0;
    for (let guard = 0; guard < 5000; guard += 1) {
      if (dateKey(habit?.createdDate) && cursor < habit.createdDate) break;
      if (isScheduled(habit, cursor)) {
        if (!isDone(habit, cursor)) break;
        streak += 1;
      }
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  function windowProgress(habit, today, days = 7) {
    let due = 0;
    let done = 0;
    const slots = [];
    for (let offset = Math.max(1, Number(days) || 7) - 1; offset >= 0; offset -= 1) {
      const key = addDays(today, -offset);
      const scheduled = isScheduled(habit, key);
      const completed = scheduled && isDone(habit, key);
      if (scheduled) due += 1;
      if (completed) done += 1;
      slots.push({ key, day:SHORT_DAYS[dayIndex(key)] || '', scheduled, completed });
    }
    return { due, done, percent:due ? Math.round(done / due * 100) : 0, slots };
  }

  function missedCount(habit, today, lookbackDays = 30) {
    let missed = 0;
    for (let offset = 1; offset <= Math.max(1, Number(lookbackDays) || 30); offset += 1) {
      const key = addDays(today, -offset);
      if (dateKey(habit?.createdDate) && key < habit.createdDate) break;
      if (isScheduled(habit, key) && !isDone(habit, key)) missed += 1;
    }
    return missed;
  }

  function scheduleLabel(habit) {
    const days = scheduleDays(habit?.days);
    if (days.length === 7) return 'Every day';
    if (days.join(',') === '0,1,2,3,4') return 'Sunday–Thursday';
    if (days.join(',') === '1,2,3,4,5') return 'Weekdays';
    return days.map(day => SHORT_DAYS[day]).join(' • ');
  }

  function reminderSlots(habit, key) {
    if (!isScheduled(habit, key) || habit?.reminderMode === 'none') return [];
    if (habit?.reminderMode === 'once') return validTime(habit.time) ? [habit.time] : [];
    if (habit?.reminderMode !== 'interval') return [];
    const start = minutesFromTime(habit.windowStart);
    const end = minutesFromTime(habit.windowEnd);
    const interval = Number(habit.intervalMinutes) || 60;
    if (start < 0 || end <= start || interval < 30) return [];
    const slots = [];
    for (let cursor = start; cursor <= end && slots.length < 48; cursor += interval) slots.push(timeFromMinutes(cursor));
    return slots;
  }

  function reminderLabel(habit) {
    if (habit?.reminderMode === 'once' && validTime(habit.time)) return `At ${habit.time}`;
    if (habit?.reminderMode === 'interval') {
      const interval = Number(habit.intervalMinutes) || 60;
      const cadence = interval === 60 ? 'Every hour' : interval < 60 ? `Every ${interval} minutes` : `Every ${interval / 60} hours`;
      return `${cadence}, ${habit.windowStart}–${habit.windowEnd}`;
    }
    return 'No reminder';
  }

  root.AscendHabitSystem = Object.freeze({ DAY_NAMES, SHORT_DAYS, dateKey, addDays, dayIndex, normalizeHabit, migrateHabits, isScheduled, isDone, toggleDate, intervalEvents, intervalStatus, recordInterval, currentStreak, windowProgress, missedCount, scheduleLabel, reminderSlots, reminderLabel });
})(typeof globalThis !== 'undefined' ? globalThis : window);
