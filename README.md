<div align="center">

# 🌌 ASCEND // Personal Progression OS

### **Your work. Your system. Your progression.**

*A privacy-first system that turns real work into visible, long-term progression.*

![Version](https://img.shields.io/badge/Version-v0.6.0.11.3%20Beta-blue?style=for-the-badge)
![Development](https://img.shields.io/badge/Development-AI--Driven-purple?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20Node.js%20%7C%20Supabase-success?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-AES--GCM%20%7C%20RLS-red?style=for-the-badge)

**PRIVATE BETA**

</div>

---

# 🌌 The Origin // Why ASCEND Exists

ASCEND started because normal task lists never made progress feel meaningful to me. I wanted something where finishing university work, projects, and everyday tasks actually built toward something instead of disappearing behind a checked box.

I liked the progression systems in games, so I brought that idea into real work: tasks became Quests, completed work earned XP, and progress built toward Levels and Ranks. That simple experiment eventually became **ASCEND**.

---

# ⚡ From an Idea to a System

The first version was simple: write a task, let AI analyze it, create a Quest, complete it, and earn XP. I kept using ASCEND myself, and almost every major feature came from something I felt was missing or something that did not make sense during real use.

Projects were added because large goals needed structure. Planner and Habits were separated because not everything should earn XP. Cloud sync led to accounts and encryption, while Friends and Focus Circles forced me to define how collaboration could exist without affecting personal progression.

ASCEND grew by solving those problems one by one.

---

# ⚖️ The Core Law // Progress Must Be Earned

ASCEND separates **organizing** from **executing**.

| Action                   | Personal XP | Rank |
| ------------------------ | :---------: | :--: |
| ⚔️ Complete a Quest      |      ✅      |   ✅  |
| 🧩 Complete project work |      ✅      |   ✅  |
| 📅 Planner               |      ❌      |   ❌  |
| 🔁 Habits                |      ❌      |   ❌  |
| 🤝 Friends               |      ❌      |   ❌  |
| 🔥 Focus Circles         | Separate XP |   ❌  |

> **If progression goes up, something should have actually been completed.**

---

# 🎛️ Command Center // Start Here

The Command Center brings the important parts of ASCEND into one place: Level, Rank, XP, today's main objective, Skills, incoming requests, and Quest creation.

The goal is to open ASCEND and quickly know **what matters next**.

![Command Center Preview](command-center.png)

---

# ✨ AI Quest Engine // Thought → Quest

ASCEND accepts natural-language input in Arabic or English, including voice input. Gemini helps turn that input into structured Quests by estimating things such as category, priority, difficulty, duration, and possible Subquests.

AI helps structure the work; **ASCEND controls the progression rules.**

---

# ⚔️ Quest Board // Where Work Happens

The Quest Board handles Main, Side, Daily, Project, and other Quest types along with their Subquests, dates, priorities, and completion state.

XP-related values are system-controlled, with safeguards against duplicate rewards and accidental completion.

---

# 🗺️ Projects // Break Down Big Goals

Large outcomes should not be one giant checkbox.

```text
Project
├── Workstream
│   ├── Quest
│   │   └── Subquest
│   └── Quest
└── Workstream
    └── Quest
```

The **AI Project Architect** can also generate an initial breakdown for larger goals, which can then be reviewed and adjusted before execution.

![Project Map Preview](project-map.png)

---

# 📅 Planner // Organize Without XP

The Planner handles semesters, courses, lists, schedules, commitments, and weekly timetables.

It exists for things that need structure but should not affect progression.

**Planning helps execution. It is not execution.**

---

# 🔁 Habits // Track Consistency

Habits track recurring routines using frequencies, streaks, reminders, and recent activity.

They remain separate from personal XP so repetitive actions cannot be used to farm progression.

---

# 🧠 Skills // What Am I Building?

ASCEND tracks broader capabilities such as:

**Execution • Problem Solving • Planning • Systems Thinking • Decision Making • Consistency**

Skills provide a long-term view of what kinds of abilities are being practiced through completed work.

---

# 🏆 Progression // Earn the Rank

ASCEND progression follows:

**XP → Levels → Milestones → Ranks**

Higher Ranks require more than simply collecting XP. The system is designed around sustained progress so the highest tiers represent long-term execution.

> **S-Rank should represent a history of progress, not one productive weekend.**

---

# 🌳 The Guide // See the Bigger Journey

The Guide turns long-term development into a visual progression tree with routes such as University, Career, Engineering, and System Foundation.

It keeps long-term goals visible without filling today's Quest Board with them.

---

# ☀️ Daily Quests // Win the Day

Daily Quests handle recurring day-to-day work with date-aware behavior and preserved checklist progress.

Features such as **Undo Today** also allow accidental completion to be reversed correctly.

---

# 🤝 Friends // Coordinate

Friends connect through private codes and can coordinate through shared functionality.

Friend activity cannot grant XP, promote Rank, or modify personal progression.

---

# 🔥 Focus Circles // Progress Together

Focus Circles support shared study and work sessions through a separate **Circle Contribution XP** system.

Circle XP is isolated from personal progression, keeping friendly competition without creating another way to farm Rank.

![Focus Circles Preview](focus-circles.png)

---

# 📡 Request Portal // Bring Work Into ASCEND

ASCEND can generate a private link that allows someone outside the system to propose a task or meeting.

Requests enter ASCEND for review without exposing the user's account or private data.

---

# 📊 Progress Intelligence // See the Progress

ASCEND keeps completed work visible through recent XP activity, completed Quest counts, active days, progression history, and Rank requirements.

The point is simple: **completed work should not disappear.**

![Progress Intelligence Preview](progress-intelligence.png)

---

# 🔐 The Vault // Privacy by Design

ASCEND encrypts application state in the browser using **AES-GCM** before syncing it to the cloud, so the backend stores encrypted state instead of normal readable user data.

The security model also includes:

* Supabase Authentication
* Row Level Security
* per-user isolation
* Recovery File support
* Cloudflare Turnstile
* encrypted cloud synchronization

> ⚠️ **ASCEND is currently a Private Beta and has not undergone an independent professional security audit.**

---

# 📱 ASCEND Everywhere // PWA

ASCEND is built as a Progressive Web App for desktop, tablet, and mobile.

Cross-device development required handling encrypted synchronization, authentication persistence, mobile layouts, PWA caching, offline behavior, and vault recovery on new devices.

---

# 🏗️ Under the System // Architecture

```text
ASCEND/
├── api/          # Serverless API routes
├── public/       # Frontend & system modules
├── supabase/     # Database, migrations & RLS
├── tests/        # Smoke & integrity tests
├── server.mjs
└── startup scripts
```

**Frontend:** HTML • CSS • Vanilla JavaScript • PWA
**Backend:** Node.js • Vercel
**Cloud:** Supabase • PostgreSQL • RLS
**AI:** Google Gemini
**Security:** AES-GCM • RLS • Turnstile

---

# 🤖 Built With AI // Directed by Human Decisions

ASCEND was built through **AI-driven development**. AI writes most of the implementation code, while I define the product, architecture, behavior, progression rules, and requirements, then test the results and iterate when something breaks or does not make sense.

The development loop is simple:

**Idea → Define → Build with AI → Test → Break → Fix → Repeat**

ASCEND has gone through many iterations this way, with real usage exposing everything from duplicate XP and UI issues to synchronization, encryption, account isolation, and progression edge cases.

---

# 🚫 What ASCEND Refuses to Become

ASCEND is not meant to turn every part of life into XP or pretend that numbers can measure someone's value.

The RPG layer exists to make real progress visible and satisfying while keeping the numbers connected to actual execution.

Sometimes the right reward for organizing something is simply **having it organized**.

---

# 🚧 System Status // Private Beta

**Current Version:** `v0.6.0.11.3`

ASCEND currently includes Quests, Projects, Planner, Habits, Skills, progression, Friends, Focus Circles, external requests, encrypted cloud sync, multi-account support, and PWA installation.

The focus now is less about adding everything possible and more about:

**Test → Feedback → Fix → Harden → Refine**

---

# 🧩 What Building ASCEND Taught Me

ASCEND started as a personal productivity experiment and pushed me into product design, system architecture, UX, databases, authentication, encryption, synchronization, PWAs, AI integration, testing, and progression design.

The biggest lesson was simple: **AI can generate code quickly, but deciding how hundreds of small decisions should work together as one system is the difficult part.**

---

<div align="center">

# 🌌 ASCEND

### **Your work. Your system. Your progression.**

**Plan what matters. Execute the work. Earn the progress.**

`v0.6.0.11.3 // PRIVATE BETA`

</div>
