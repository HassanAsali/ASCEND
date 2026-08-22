<div align="center">

# 🌌 ASCEND // Personal Operating System (OS)
### *A custom-built, privacy-first productivity system designed to turn real-world engineering, studies, and daily work into a rewarding game-like progression loop.*

![Version](https://img.shields.io/badge/Version-v0.6.0.11.3%20(Beta)-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Private_Beta-orange?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20(iOS%2C%20Android%2C%20Desktop)-lightgrey?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Supabase%20%7C%20Vanilla%20JS%20%7C%20AES-GCM-success?style=for-the-badge)

[Overview](#-overview) • [Core Modules](#-comprehensive-system-modules-page-by-page) • [System Integrity](#-system-integrity-what-grants-xp) • [Security & Architecture](#-security--architecture)

</div>

---

## 🎯 Overview

**ASCEND** is a private, custom-built productivity system created entirely through vibe-coding. Built out of a personal need to beat laziness and avoid expensive, restricted task apps, it combines an AI task parser with a strict leveling and ranking system. 

Instead of getting free XP for just organizing things, ASCEND follows one simple rule: **You only get XP and rank-ups by actually finishing real work.**

---

## 🏛️ Comprehensive System Modules: Page-by-Page Breakdown

ASCEND is organized into a clean sidebar menu, where every page has a specific purpose to keep things simple and clear:

### 1. 🎛️ Command Center (The Main Dashboard)
* **Player Status HUD:** Shows your name, current specialization (e.g., Thermal Mechanical Engineer in Progress), Level, and Rank tier alongside your total XP progress.
* **Today's Directive:** Highlights your most important task for the day so you don't waste time thinking about what to do first.
* **Encrypted Shareable Request Channel:** Creates a secure link that lets other people send task or meeting requests directly to your private inbox safely.
* **AI Quest Console (Gemini Engine):** Type or use voice notes in Arabic or English. The AI breaks down your text into tasks, estimates the time needed, and sets the XP.
* **Core Skills Matrix:** Tracks your practical skills (*Execution, Problem Solving, Planning, Decision Making, etc.*) as they grow naturally when you finish tasks.

> ![Command Center Preview](command-center.png)

---

### 2. 📋 Quest Board (Quest Management)
* **Operational Lanes:** Filter your tasks easily between Daily Protocols, Main Objectives, Side Quests, Campaigns, and Boss tiers.
* **Dated Daily Protocols:** Unfinished daily tasks automatically move to your current local date while keeping your partial progress saved.
* **The "Undo Today" Safeguard:** If you accidentally check off a daily task, you can reverse it so your progress stays honest.
* **System-Locked Reward Fields:** Task difficulty, priority, and time fields lock automatically after being created so nobody can cheat and inflate their XP.

> ![Quest Board Preview](quest-board.png)

---

### 3. 🗺️ Projects (Project Map & Architect)
* *“Build outcomes, not giant task lists.”* Breaks big multi-week projects down into smaller workstreams and step-by-step tasks.
* **AI Project Architect:** Takes a big project goal and automatically drafts a full breakdown structure for your review.

> ![Project Map Preview](project-map.png)

---

### 4. 📅 Planner & Semester Engine (The XP-Free Zone)
* **Structured Lists & Semesters:** Manage course codes, target levels, reading lists, and preparation checklists.
* **7-Day Class & Commitment Timetable:** A visual calendar tracking your lectures, work blocks, and study sessions with conflict detection.

### 5. 🌱 Habits (Personal Rhythms & Consistency)
* Built for daily habits (like drinking water or reading) that are kept separate from main tasks. Features 7-day viewports, custom schedules, and streak counters.

### 6. 🤝 Circles & Friends (Private Social & Focus Networks)
* **Private Focus Circles:** Create study groups using invite codes to collaborate on shared sessions. Uses an isolated **Circle Contribution XP** system calculated server-side based on actual active time.
* **Private Friends Network:** Connect using secure private codes to share tasks and view each other's progress on a clean shared board.

> ![Focus Circles Preview](focus-circles.png)

---

### 7. 📊 Progress, Guide & System (Intelligence & Configuration)
* **Progress Intelligence:** 7-day XP charts, completed task counts, active days, and Rank trial requirements.
* **Progression Guide (Quest Tree):** A visual map showing your unlocked branches (*System Foundation, University Route, Career Route, Engineering Route*).
* **System Configuration:** Manages your profile, active seasons, cloud sync recovery keys, guided tours, notification settings, and a direct **Feedback & Development** box.

> ![Progress Intelligence Preview](progress-intelligence.png)

---

## ⚖️ System Integrity: What Grants XP?

ASCEND keeps a clear line between planning and actual work:

| Action | Grants Account XP? | Affects Rank? | Description |
|----------------|:---:|:---:|-------------|
| **Completing a Main/Side Quest** | ✅ Yes | ✅ Yes | Core progression based on verified effort and difficulty. |
| **Completing a Subquest** | ✅ Yes | ✅ Yes | Smaller steps that contribute to a larger Project milestone. |
| **Adding items to Planner** | ❌ No | ❌ No | Planning is just for organizing, not actual execution. |
| **Checking off a Habit** | ❌ No | ❌ No | Personal routine tracking only. No XP given. |
| **Focus Circle Activity** | 🟡 Isolated Only | ❌ No | Gives group-only XP; never changes your main rank. |
| **Friends Shared Board** | ❌ No | ❌ No | Coordination only; keeps single-player progress honest. |

---

## 🛡️ Security & Architecture

* **Client-Side Vault Encryption (AES-256-GCM):** Data is encrypted directly inside your browser before uploading to the server, so the backend only stores encrypted text.
* **The Recovery File Mechanism:** Since data is client-encrypted, new devices require your `.txt` Recovery File to unlock your vault.
* **Row-Level Security & Turnstile:** Strict database security rules combined with Cloudflare Turnstile bot protection to keep accounts secure.

---

<div align="center">
<i><b>Project Status:</b><br>
ASCEND is a personal, non-commercial Private Beta project built to stop laziness and gamify real-world engineering and studies.<br><br>
<b>Built from scratch to turn daily effort into real digital growth.</b></i>
</div>
