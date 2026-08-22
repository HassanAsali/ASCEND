<div align="center">

# 🌌 ASCEND // Personal Operating System (OS)
### *A custom-built, privacy-first productivity ecosystem born from the struggle against procrastination, engineered to turn real-world engineering, studies, and long-term grit into a rewarding RPG loop.*

![Version](https://img.shields.io/badge/Version-v0.6.0.11.3%20(Beta)-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Private_Beta-orange?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20(iOS%2C%20Android%2C%20Desktop)-lightgrey?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Supabase%20%7C%20Vanilla%20JS%20%7C%20AES-GCM-success?style=for-the-badge)

[The Origin Story](#-the-origin-story-why-i-built-ascend) • [Evolution & Architecture](#-system-evolution--architectural-milestones) • [Comprehensive Module Breakdown](#-comprehensive-system-modules-page-by-page) • [System Integrity](#-system-integrity-what-grants-xp) • [Security & Future Vision](#-security--future-commercial-vision)

</div>

---

## 🎯 The Origin Story: Why I Built ASCEND

Let’s be honest: **procrastination is the ultimate enemy.** Like many people, I struggled with inertia—looking at a messy, unorganized list of tasks only added mental weight and made me want to avoid them entirely. 

Moreover, standard productivity apps on the market either lacked key features unless you paid hefty monthly subscriptions, or felt disconnected from personal growth. Since I was already paying for AI tools, I asked myself: *Why not leverage that intelligence to build my own solution?*

That is how **ASCEND** was born. It started as a simple core idea: a task manager paired with an AI engine that parses plain text, breaks it down, and schedules it with matching XP and time values. But early on, it was too easy to exploit—I could artificially inflate rewards and farm massive XP with minor tweaks. So, I completely locked down the progression, making the rank system intentionally rigorous and multi-layered, featuring comic-inspired tier grades scaling up to **S-Rank (broken down into S1 through S5)**, where advancing requires genuine consistency, active days, completed volumes, and grueling milestone gates.

---

## 🛠️ System Evolution & Architectural Milestones

Building ASCEND wasn't a straight path; it was an iterative journey of tackling real-world engineering and software challenges:

1. **The AI & Data Layer:** Refined the intake engine so natural language inputs (or voice notes in Arabic/English) get accurately classified into correct quest types, priorities, and difficulty metrics without manual cheating.
2. **Multi-User Security & Isolation:** Moving beyond a single-user local tool, I introduced user accounts and cloud sync. This forced me down a rabbit hole of fixing critical security vulnerabilities, implementing strict Supabase Row-Level Security (RLS), and setting up end-to-end AES-256-GCM client-side encryption so that user state remains strictly private.
3. **Expanding the Scope:** Realizing I needed more than just a personal planner, I added a broad range of categories to fit different domains (engineering, academics, fitness, personal projects). 
4. **Peer Collaboration & Feedback:** I shared early concepts with close friends, whose feedback directly shaped major modules like **Habits** (routine tracking independent of quests) and the **Leaderboard / Focus Circles / Friends** systems, allowing real-time collaborative studying and friendly competition without breaking single-player progression integrity.
5. **Rigorous Debugging:** Every single feature addition—from the Planner and Semester timetables to the Project Architect, System Tour, and Feedback system—came with hours of intensive debugging behind the scenes to ensure smooth mobile PWA integration and absolute zero data leaks.

---

## 🏛️ Comprehensive System Modules: Page-by-Page Breakdown

ASCEND is partitioned into an intuitive, immersive command rail. Every screen is purposefully designed to minimize friction and maximize execution clarity:

### 1. 🎛️ Command Center (The Main Cockpit)
* **Player Status HUD:** Displays your identity badge, active specialization (e.g., Thermal Mechanical Engineer in Progress), current Level, and Rank tier (e.g., E-Rank: Initiation) alongside lifetime XP progress.
* **Today's Directive:** Surfaces your single highest-value objective for the day to eliminate morning decision fatigue.
* **Encrypted Shareable Request Channel:** Generates a secure, hashed link allowing outside peers to propose tasks or meetings directly to your private inbox via hybrid encryption.
* **AI Quest Console (Gemini Engine):** Bilingual natural language intake. Type or use voice recording to brain-dump your work; the AI handles classification, duration estimation, and subquest generation.
* **Core Skills Matrix (Attributes):** Real-time tracking of transferable capabilities (*Execution, Problem Solving, Planning, Systems Thinking, Decision Making, Consistency, etc.*) that grow organically through verified work.

> ![Command Center Preview](command-center.png)

---

### 2. 📋 Quest Board (Quest Management)
* **Operational Lanes:** Filter seamlessly across Daily Protocols, Main Objectives, Side Quests, Campaigns, and Boss tiers.
* **Dated Daily Protocols:** Unfinished daily items automatically reconcile to the current local date while preserving partial checklist progress.
* **The "Undo Today" Safeguard:** Accidental check-ins can be mathematically reversed to keep progression records completely honest.
* **System-Locked Reward Fields:** Input fields for difficulty, priority, and time lock instantly upon analysis or quick-add to block manual XP inflation.

> ![Quest Board Preview](quest-board.png)

---

### 3. 🗺️ Projects (Project Map & Architect)
* *“Build outcomes, not giant task lists.”* Breaks multi-week objectives into structured Workstreams (Quests) and concrete tactical steps (Subquests).
* **AI Project Architect:** Feeds ambitious outcomes into the engine to draft a complete work breakdown structure for your review.

> ![Project Map Preview](project-map.png)

---

### 4. 📅 Planner & Semester Engine (The XP-Free Zone)
* **Structured Lists & Semesters:** Manage course codes, target levels, reading queues, and preparation checklists.
* **7-Day Class & Commitment Timetable:** A visual grid tracking lectures, work blocks, and study periods with built-in overlap highlighting.

### 5. 🌱 Habits (Personal Rhythms & Consistency)
* Built for repetitive daily routines (hydration, reading, fitness) separated from main quest progression. Features 7-day rolling viewports, custom frequency selectors, reminder windows, and streak counters.

### 6. 🤝 Circles & Friends (Private Social & Focus Networks)
* **Private Focus Circles:** Create study groups via token invites to collaborate on shared sessions. Uses an isolated **Circle Contribution XP** system computed server-side from actual duration and capped daily to prevent farming.
* **Private Friends Network:** Connect via secure private codes (no public discovery) to coordinate tasks via a dedicated coordination-only shared board.

> ![Focus Circles Preview](focus-circles.png)

---

### 7. 📊 Progress, Guide & System (Intelligence & Configuration)
* **Progress Intelligence:** 7-day XP activity histograms, clear counts, active days, and strict multi-variable Advancement Protocols (e.g., E $\rightarrow$ D Rank Trials).
* **Progression Guide (Quest Tree):** A visual RPG map unlocking branches (*System Foundation, University Route, Career Route, Engineering Route*).
* **System Configuration:** Manages profile identity, active seasons, cloud sync vault keys, guided onboarding tours, notification centers, and a direct developer **Feedback & Development** channel.

> ![Progress Intelligence Preview](progress-intelligence.png)

---

## ⚖️ System Integrity: What Grants XP?

ASCEND enforces a strict boundary between planning, organizing, and executing:

| Operational Action | Grants Account XP? | Affects Rank? | Description |
|----------------|:---:|:---:|-------------|
| **Completing a Main/Side Quest** | ✅ Yes | ✅ Yes | Core progression based on AI-verified effort and difficulty. |
| **Completing a Subquest** | ✅ Yes | ✅ Yes | Incremental verified progress toward a larger Project milestone. |
| **Adding items to Planner** | ❌ No | ❌ No | Planning is a structural tool, not an execution of work. |
| **Checking off a Habit** | ❌ No | ❌ No | Personal rhythm consistency tracking only. Zero XP awarded. |
| **Focus Circle Activity** | 🟡 Isolated Only | ❌ No | Grants isolated *Circle Contribution XP* for group metrics only. |
| **Friends Shared Board** | ❌ No | ❌ No | Collaboration coordination only; preserves pure single-player integrity. |

---

## 🛡️ Security & Future Commercial Vision

### Security Architecture
* **Client-Side Vault Encryption (AES-256-GCM):** Data is encrypted directly inside the browser using authenticated encryption before uploading. The backend stores strictly ciphertext.
* **The Recovery File Mechanism:** Because data is client-encrypted, the server holds zero decryption keys. New devices require your immutable `.txt` Recovery File to unlock the vault.
* **Row-Level Security & Turnstile:** Strict Supabase RLS isolation paired with Cloudflare Turnstile bot defense across authentication gates.

### Potential Commercial Roadmap
While ASCEND was originally crafted as a deeply personal productivity tool built by a solo developer expanding his programming skills, scaling it into a commercial product would involve:
1. **Rebranding:** Transitioning the working title, assets, and branding to fit a broader commercial market and avoid legal overlap.
2. **Intensive Security Audits:** Conducting rigorous penetration testing and compliance checks.
3. **Sustainable Pricing:** Implementing a lightweight, accessible subscription model designed purely to cover cloud infrastructure and operational server costs with a minimal, fair margin—ensuring it remains affordable and friction-free for everyday users.

---

<div align="center">
<i><b>Project Status:</b><br>
ASCEND is a personal, non-commercial Private Beta project built to conquer procrastination and gamify real-world engineering and academic discipline.<br><br>
<b>Built from scratch to turn raw discipline into verifiable digital progression.</b></i>
</div>
