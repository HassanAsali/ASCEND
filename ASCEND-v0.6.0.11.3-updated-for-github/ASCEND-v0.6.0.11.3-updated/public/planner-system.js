(function plannerSystemFactory(root) {
  'use strict';

  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function text(value, max = 160) {
    return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
  }

  function dateKey(value) {
    const raw = String(value || '');
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
  }

  function timeKey(value) {
    const raw = String(value || '');
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : '';
  }

  function id(idFactory) {
    return idFactory ? idFactory() : root.crypto?.randomUUID?.() || `planner-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function identifier(value, idFactory) {
    return String(value || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) || id(idFactory);
  }

  const DAY_ALIASES = Object.freeze({Sunday:'Sunday',Monday:'Monday',Tuesday:'Tuesday',Wednesday:'Wednesday',Thursday:'Thursday',Friday:'Friday',Saturday:'Saturday','الأحد':'Sunday','الاحد':'Sunday','الاثنين':'Monday','الإثنين':'Monday','الثلاثاء':'Tuesday','الأربعاء':'Wednesday','الاربعاء':'Wednesday','الخميس':'Thursday','الجمعة':'Friday','السبت':'Saturday'});
  function canonicalDay(value) { return DAY_ALIASES[text(value, 20)] || ''; }

  function minutes(value, fallback = 30) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(5, Math.min(100000, Math.round(number))) : fallback;
  }

  function normalizeItem(item = {}, idFactory) {
    return {
      id: identifier(item.id, idFactory),
      title: text(item.title, 140) || 'Untitled item',
      estimatedMinutes: minutes(item.estimatedMinutes),
      dueDate: dateKey(item.dueDate) || null,
      notes: String(item.notes || '').trim().slice(0, 1200),
      status: item.status === 'completed' ? 'completed' : 'active',
      completedAt: item.status === 'completed' ? item.completedAt || new Date().toISOString() : null,
      convertedQuestId: String(item.convertedQuestId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80),
      order: Math.max(0, Number(item.order) || 0)
    };
  }

  function normalizeList(list = {}, idFactory) {
    const items = Array.isArray(list.items) ? list.items.slice(0, 300).map((entry, index) => ({ ...normalizeItem(entry, idFactory), order:index })) : [];
    return {
      id: identifier(list.id, idFactory),
      title: text(list.title, 100) || 'Untitled list',
      category: text(list.category, 60) || 'Personal',
      description: String(list.description || '').trim().slice(0, 1000),
      dueDate: dateKey(list.dueDate) || null,
      courseId: String(list.courseId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80),
      items,
      createdAt: list.createdAt || new Date().toISOString(),
      updatedAt: list.updatedAt || list.createdAt || new Date().toISOString()
    };
  }

  function normalizeClassMeeting(meeting = {}, idFactory) {
    const start = timeKey(meeting.start) || '08:00';
    const proposedEnd = timeKey(meeting.end) || '09:00';
    return {
      id: identifier(meeting.id, idFactory),
      day: canonicalDay(meeting.day) || 'Sunday',
      start,
      end: proposedEnd > start ? proposedEnd : start,
      location: text(meeting.location, 100),
      type: ['Class','Lab','Tutorial','Office Hours','Work','Study Block'].includes(meeting.type) ? meeting.type : 'Class'
    };
  }

  function normalizeCommitment(commitment = {}, idFactory) {
    return {
      ...normalizeClassMeeting(commitment, idFactory),
      title:text(commitment.title, 100) || 'Fixed commitment',
      color:['cyan','violet','green','amber','blue','rose'].includes(commitment.color) ? commitment.color : 'amber',
      type:['Work','Study Block','Commitment','Appointment'].includes(commitment.type) ? commitment.type : 'Commitment',
      reminderEnabled:Boolean(commitment.reminderEnabled),
      reminderMinutes:[5,10,15,30,60].includes(Number(commitment.reminderMinutes))?Number(commitment.reminderMinutes):15
    };
  }

  function normalizeCourse(course = {}, idFactory) {
    return {
      id: identifier(course.id, idFactory),
      code: text(course.code, 30),
      name: text(course.name, 100) || 'Untitled course',
      focus: Math.max(1, Math.min(5, Number(course.focus) || 3)),
      target: text(course.target, 120),
      notes: String(course.notes || '').trim().slice(0, 1200),
      color: ['cyan','violet','green','amber','blue','rose'].includes(course.color) ? course.color : 'cyan',
      reminderEnabled:Boolean(course.reminderEnabled),
      reminderMinutes:[5,10,15,30,60].includes(Number(course.reminderMinutes)) ? Number(course.reminderMinutes) : 15,
      sections: Array.isArray(course.sections) ? course.sections.slice(0, 300).map((entry, index) => ({ ...normalizeItem(entry, idFactory), order:index })) : [],
      classes: Array.isArray(course.classes) ? course.classes.slice(0, 40).map(entry => normalizeClassMeeting(entry, idFactory)) : []
    };
  }

  function normalizeSemester(semester = {}, idFactory) {
    const start = dateKey(semester.start) || '';
    const end = dateKey(semester.end) || '';
    return {
      id: identifier(semester.id, idFactory),
      name: text(semester.name, 100) || 'Current Semester',
      start,
      end: end && (!start || end >= start) ? end : start,
      purpose: String(semester.purpose || '').trim().slice(0, 1000),
      courses: Array.isArray(semester.courses) ? semester.courses.slice(0, 40).map(entry => normalizeCourse(entry, idFactory)) : [],
      commitments:Array.isArray(semester.commitments) ? semester.commitments.slice(0, 60).map(entry=>normalizeCommitment(entry,idFactory)) : [],
      createdAt: semester.createdAt || new Date().toISOString()
    };
  }

  function migratePlanner(source = {}, idFactory) {
    const lists = Array.isArray(source?.lists) ? source.lists.slice(0, 80).map(entry => normalizeList(entry, idFactory)) : [];
    const semesters = Array.isArray(source?.semesters) ? source.semesters.slice(0, 12).map(entry => normalizeSemester(entry, idFactory)) : [];
    const active = String(source?.activeSemesterId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
    return {
      version: 1,
      lists,
      semesters,
      activeSemesterId: semesters.some(item => item.id === active) ? active : semesters.at(-1)?.id || ''
    };
  }

  function progress(items = []) {
    const total = items.length;
    const completed = items.filter(item => item.status === 'completed').length;
    return { completed, total, percent:total ? Math.round(completed / total * 100) : 0 };
  }

  function scheduleConflicts(courses = [], commitments = []) {
    const meetings = courses.flatMap(course => (course.classes || []).map(meeting => ({ ...meeting, courseId:course.id, courseName:course.name }))).concat((commitments||[]).map(item=>({...item,courseId:`commitment-${item.id}`,courseName:item.title})));
    const conflicts = [];
    for (let first = 0; first < meetings.length; first += 1) {
      for (let second = first + 1; second < meetings.length; second += 1) {
        const a = meetings[first]; const b = meetings[second];
        if (a.day === b.day && a.start < b.end && b.start < a.end) conflicts.push({ first:a, second:b });
      }
    }
    return conflicts;
  }

  function questDraft(item, context = {}) {
    return {
      title: text(item?.title, 110) || 'Planned objective',
      category: text(context.category, 60) || 'Personal',
      secondaryCategory: '',
      questType: 'Side Quest',
      priority: item?.dueDate ? 'High' : 'Medium',
      difficulty: minutes(item?.estimatedMinutes) >= 180 ? 'C' : minutes(item?.estimatedMinutes) >= 60 ? 'D' : 'E',
      estimatedMinutes: minutes(item?.estimatedMinutes),
      dueDate: dateKey(item?.dueDate) || null,
      longTermValue: 2,
      impactScore: 2,
      successCriteria: `Finish the planned item${context.parentTitle ? ` in ${text(context.parentTitle, 100)}` : ''}.`,
      rationale: String(item?.notes || context.notes || '').trim().slice(0, 1200),
      suggestedSubquests: []
    };
  }

  const api = Object.freeze({ DAYS, canonicalDay, migratePlanner, normalizeList, normalizeSemester, normalizeCourse, normalizeItem, normalizeClassMeeting, normalizeCommitment, progress, scheduleConflicts, questDraft });
  root.AscendPlanner = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
