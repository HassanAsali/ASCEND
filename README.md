<div align="center">

# 🌌 ASCEND // Personal Operating System (OS)
### *A custom-built, privacy-first productivity ecosystem engineered to turn real-world engineering, studies, and long-term grit into a rewarding RPG progression loop.*

![Version](https://img.shields.io/badge/Version-v0.6.0.11.3%20(Beta)-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Private_Beta-orange?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20(iOS%2C%20Android%2C%20Desktop)-lightgrey?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Supabase%20%7C%20Vanilla%20JS%20%7C%20AES-GCM-success?style=for-the-badge)

[Overview](#-overview) • [Core Modules](#-comprehensive-system-modules-page-by-page) • [System Integrity](#-system-integrity-what-grants-xp) • [Security Vault](#-security--privacy-architecture)

</div>

---

## 🎯 Overview

**ASCEND** is a private, custom-built productivity and progression ecosystem crafted entirely through vibe-coding. Built out of a personal need to conquer procrastination and avoid costly, rigid subscription apps, it combines a natural-language AI task parser with a strict, multi-layered RPG progression engine. 

Instead of cheap "XP farming" for simply organizing tasks, ASCEND enforces one absolute rule: **Progression comes exclusively from executing real, verified work.**

---

## 🏛️ Comprehensive System Modules: Page-by-Page Breakdown

ASCEND is partitioned into an intuitive command rail designed to minimize friction and maximize execution clarity:

### 1. 🎛️ Command Center (The Main Cockpit)
* **Player Status HUD:** Displays your identity badge, active specialization (e.g., Thermal Mechanical Engineer in Progress), current Level, and Rank tier alongside lifetime XP progress.
* **Today's Directive:** Surfaces your single highest-value objective for the day to eliminate morning decision fatigue.
* **Encrypted Shareable Request Channel:** Generates a secure, hashed link allowing outside peers to propose tasks or meetings directly to your private inbox via hybrid encryption.
* **AI Quest Console (Gemini Engine):** Bilingual natural language intake. Type or use voice recording; the AI handles classification, duration estimation, and subquest generation.
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
* **Progress Intelligence:** 7-day XP activity histograms, clear counts, active days, and strict multi-variable Advancement Protocols.
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

## 🛡️ Security & Architecture

* **Client-Side Vault Encryption (AES-256-GCM):** Data is encrypted directly inside the browser using authenticated encryption before uploading. The backend stores strictly ciphertext.
* **The Recovery File Mechanism:** Because data is client-encrypted, the server holds zero decryption keys. New devices require your immutable `.txt` Recovery File to unlock the vault.
* **Row-Level Security & Turnstile:** Strict Supabase RLS isolation paired with Cloudflare Turnstile bot defense across authentication gates.

---

<div align="center">
<i><b>Project Status:</b><br>
ASCEND is a personal, non-commercial Private Beta project built to conquer procrastination and gamify real-world engineering and academic discipline.<br><br>
<b>Built from scratch to turn raw discipline into verifiable digital progression.</b></i>
</div>
