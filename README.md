<div align="center">

# ASCEND

### Build your system. Earn your progression.

A privacy-first personal progression system that turns real work into quests, projects, skills, ranks, and long-term progress.

![Version](https://img.shields.io/badge/Version-v0.6.0.11.3%20Beta-blue?style=for-the-badge)
![Development](https://img.shields.io/badge/Development-AI--Driven-purple?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20Node.js%20%7C%20Supabase-success?style=for-the-badge)
![Security](https://img.shields.io/badge/Data-AES--GCM%20Encrypted-red?style=for-the-badge)

**Private Beta**

[The Idea](#the-idea) •
[How It Evolved](#how-it-evolved) •
[How ASCEND Works](#how-ascend-works) •
[Progression](#progression-that-has-to-be-earned) •
[Privacy](#privacy-by-design) •
[Architecture](#architecture) •
[Development](#built-through-ai-driven-development)

</div>

---

# The Idea

ASCEND did not start as a plan to build a large productivity platform.

It started because I was dissatisfied with the way I was managing my own work.

I had tasks spread across lists, notes, ideas, university work, projects, and things I kept postponing. Normal task managers could tell me what I had left to do, but that was basically where they stopped.

I wanted something different.

I wanted a system where finishing something actually **meant something**.

Something that could answer:

* What am I actually progressing toward?
* Which projects am I moving forward?
* Am I becoming more consistent?
* What kind of work am I spending my time on?
* How much have I actually accomplished over weeks or months?
* What skills am I building through the things I finish?

The original idea was simple:

> **What if a task manager worked more like a progression system?**

Complete real work.

Earn XP.

Build skills.

Advance through levels and ranks.

See your progress accumulate over time.

That idea became **ASCEND**.

---

# It Started Much Smaller Than This

The first versions were nowhere near the current system.

ASCEND originally revolved around one core loop:

**Write a task → analyze it → turn it into a Quest → complete it → earn progression.**

AI was used to understand natural-language input and estimate things such as the type, difficulty, importance, and structure of a task.

Then I started actually using it.

That changed everything.

The more I used ASCEND for my own work, the more problems became obvious.

Some tasks were too large to be treated as one Quest.

Daily responsibilities behaved differently from long-term projects.

Habits should not reward XP the same way actual completed work does.

Planning something should not count as accomplishing it.

Repeated clicks should never be able to generate progression.

A leaderboard could easily destroy the meaning of personal progression if social activity affected Rank.

Syncing data across devices created an entirely different set of privacy and reliability problems.

And once other people could potentially use the system, "it works on my computer" stopped being good enough.

So ASCEND kept changing.

Not because I had a giant feature list from the beginning, but because every version exposed the next problem that needed to be solved.

---

# How It Evolved

ASCEND gradually moved from a local personal prototype into a much larger system.

The early versions focused mainly on:

**Quests → XP → Levels → Ranks**

Then came better task analysis, editing, review flows, milestones, and progression rules.

Projects introduced another layer:

**Project → Workstreams → Quests → Subquests**

That allowed large outcomes to be broken into actual executable work instead of becoming one giant checkbox.

Then ASCEND expanded beyond tasks.

The Planner was created for information that needs organization but should not generate XP.

Habits became their own system because repetition and consistency are useful to track, but checking off a routine should not inflate progression.

Daily Quests gained date-aware behavior.

Skills became a way to represent the capabilities being developed through completed work.

The Guide became a long-term progression map.

Eventually the project moved beyond a local browser application.

Accounts were introduced.

Then cloud synchronization.

Then encryption.

Then multi-device behavior.

Then PWA support.

Then external task requests.

Then private Friends and Focus Circles.

At that point, ASCEND was no longer just the task manager I originally intended to make.

It had become my attempt at building a complete **personal progression system**.

---

# The Rule Behind the Entire System

There is one rule I kept coming back to while building ASCEND:

> **Progression must come from execution, not organization.**

That distinction sounds small, but it affects almost every part of the system.

Creating twenty tasks does not mean you accomplished twenty things.

Writing a detailed plan does not mean the project moved forward.

Checking the same action twice should not generate twice the reward.

Joining a Focus Circle should not make your personal Rank easier to achieve.

Maintaining a habit is valuable, but it is different from completing a finite piece of work.

ASCEND therefore deliberately separates **planning**, **routine**, **collaboration**, and **progression**.

| Action                         |     Personal XP    | Rank Progress |
| ------------------------------ | :----------------: | :-----------: |
| Complete a Quest               |         Yes        |      Yes      |
| Complete eligible project work |         Yes        |      Yes      |
| Add something to the Planner   |         No         |       No      |
| Complete a Habit               |         No         |       No      |
| Coordinate through Friends     |         No         |       No      |
| Focus Circle contribution      | Separate Circle XP |       No      |

The goal is simple:

**If the number goes up, something should have actually happened.**

---

# How ASCEND Works

## Command Center

The Command Center is the main entry point into the system.

Instead of opening ASCEND and immediately seeing another giant list, it provides a snapshot of the current state:

* Level and Rank
* XP progression
* current identity/specialization
* today's main directive
* skill development
* incoming requests
* AI-assisted Quest creation

It is designed to answer one question quickly:

> **What should I be doing next?**

---

## AI Quest Intake

Tasks do not need to be entered through a rigid form.

ASCEND accepts natural-language input in Arabic or English and uses Gemini to interpret the task.

The system can help determine:

* Quest structure
* category
* estimated duration
* priority
* difficulty
* appropriate decomposition
* potential Subquests

Voice input can also be used when writing the task is slower than simply saying it.

The AI is not the progression system itself.

It helps translate messy human input into structured data that ASCEND can use.

---

# Quest Board

The Quest Board is where executable work lives.

Quests can be organized into different operational types instead of being thrown into one endless list.

The system handles:

* Main Quests
* Side Quests
* Daily Quests
* project-related work
* larger challenge tiers
* Subquests
* dates and deadlines
* completion state
* XP calculation

Reward-related fields are controlled by the system so progression cannot simply be inflated manually.

ASCEND also includes safeguards for accidental completion and duplicate reward events.

Because if XP can be farmed by clicking buttons, the entire progression system becomes meaningless.

---

# Projects

One of the biggest changes to ASCEND was realizing that:

> **A project is not a task.**

"Build an application."

"Finish a university project."

"Design and manufacture a robot."

These are outcomes, not checkboxes.

The Projects system therefore treats large objectives hierarchically.

```text
Project
│
├── Workstream
│   ├── Quest
│   │   ├── Subquest
│   │   └── Subquest
│   │
│   └── Quest
│
└── Workstream
    └── Quest
```

ASCEND also includes an **AI Project Architect** that can take a large outcome and propose a structured breakdown.

The generated structure is not treated as unquestionable truth.

It is a starting point that can be reviewed and adjusted before execution.

---

# Planner

Not everything belongs in the XP system.

ASCEND's Planner exists specifically for things that need structure without pretending they are accomplishments.

It supports areas such as:

* semester planning
* courses
* structured lists
* preparation lists
* schedules
* commitments
* weekly timetables

The timetable provides a seven-day view and can identify overlapping commitments.

And most importantly:

**Planning does not grant XP.**

That is intentional.

---

# Habits

Habits are another intentionally separate system.

They track repeated behaviors such as:

* reading
* exercise
* routines
* recurring personal commitments

Habits can use frequencies, streaks, reminder windows, and recent activity views.

But Habit completion does not increase personal XP.

A habit is about **consistency**.

A Quest is about **finishing a defined piece of work**.

ASCEND keeps those concepts separate.

---

# Skills

XP tells me how much work has been completed.

Skills try to answer a different question:

> **What am I getting better at while doing it?**

ASCEND tracks broader transferable attributes such as:

* Execution
* Problem Solving
* Planning
* Systems Thinking
* Decision Making
* Consistency

The intention is not to pretend that a number can perfectly measure human ability.

The Skills system is there to create a long-term picture of the types of work being practiced repeatedly.

---

# Progression That Has to Be Earned

ASCEND uses:

**XP → Levels → Milestones → Ranks**

But Rank is deliberately harder to increase than Level.

Higher progression is not based purely on accumulating XP quickly.

Long-term Rank advancement can require multiple conditions, including sustained activity and time.

This prevents someone from completing a huge number of tiny tasks in a short period and immediately reaching the highest tiers.

The upper progression path is intentionally long.

**S-Rank is supposed to represent long-term progression, not a productive weekend.**

---

# The Guide

The Guide turns long-term development into a visual progression tree.

Different branches can represent areas such as:

* System Foundation
* University
* Career
* Engineering
* long-term personal development

Milestones progress from smaller achievements toward much larger ones.

The idea is to provide direction without turning every future ambition into something that needs to sit on today's task list.

---

# Daily Quests

Daily Quests required their own behavior because real life does not reset perfectly at midnight.

ASCEND tracks Daily Quests against the local date while preserving valid checklist progress.

It also includes safeguards such as **Undo Today** so accidental completion can be reversed correctly instead of permanently corrupting progression data.

Small details like this became a major part of ASCEND's development.

A lot of the work on the project has not been adding impressive-looking features.

It has been fixing the weird edge cases that appear when the system is actually used every day.

---

# Friends

ASCEND includes a private Friends system, but it intentionally avoids turning personal productivity into a public social network.

Connections are made through private codes rather than public discovery.

Friends can coordinate work through shared functionality, but that activity does not modify personal Rank or progression.

The social layer is there to help people work together.

It is not there to provide another way to farm XP.

---

# Focus Circles

Focus Circles are private groups for shared study or work sessions.

They use their own **Circle Contribution XP**.

That XP is isolated from the main account progression system.

Contribution is calculated separately and can be limited to prevent obvious farming.

This keeps group competition useful without compromising the integrity of someone's personal ASCEND progression.

---

# External Requests

ASCEND can generate a private request link that can be shared with someone outside the system.

That person can propose a task or meeting without needing access to the user's account or data.

The request arrives inside ASCEND for review.

This feature came from a simple idea:

**If someone needs something from me, I want it to enter the same system where I manage everything else.**

---

# Progress Intelligence

ASCEND does not only show a lifetime XP number.

The Progress system provides a clearer view of actual activity through information such as:

* recent XP activity
* completed work
* active days
* progression history
* advancement requirements
* Rank eligibility

The purpose is not to produce as many graphs as possible.

It is to make progress visible enough that weeks of work do not disappear into memory.

---

# Privacy by Design

The biggest architectural change happened when ASCEND went from:

> "a personal app on my computer"

to:

> "something another person could actually use."

Once accounts and cloud synchronization existed, I did not want the database owner to automatically have readable access to everybody's private tasks.

So ASCEND uses a client-side encrypted vault.

User state is encrypted in the browser using **AES-GCM** before encrypted data is synchronized to the backend.

Supabase stores the encrypted state rather than the normal readable application state.

This also created a difficult consequence:

If the server does not hold the key, the server cannot magically recover it.

ASCEND therefore uses a recovery mechanism for accessing an encrypted vault from another device.

Security is also reinforced through:

* Supabase Authentication
* Row Level Security
* per-user ownership policies
* account isolation
* guest namespace isolation
* Cloudflare Turnstile
* protected external-request flows
* encrypted cloud synchronization

This architecture has required significantly more work than simply storing JSON in a database.

But privacy was one area where I did not want convenience to be the only design decision.

> **Important:** ASCEND is currently a Private Beta and has not undergone an independent professional security audit.

---

# Cross-Device & PWA

ASCEND is built as a Progressive Web App.

The goal is for the same system to work across desktop, tablet, and mobile instead of creating separate versions of the product.

That introduced its own set of problems:

* authentication persistence
* encrypted synchronization
* stale PWA caches
* mobile dialogs
* iPhone safe areas
* account switching
* language preservation
* offline/local fallback
* recovery on new devices

Many of these are invisible when everything works.

They became some of the most important parts of making ASCEND feel like an actual application rather than a prototype.

---

# Architecture

ASCEND intentionally avoids a heavy frontend framework.

```text
ASCEND/
│
├── api/
│   └── Serverless API routes
│
├── public/
│   ├── app.js
│   ├── planner-system.js
│   ├── habit-system.js
│   ├── skill-system.js
│   ├── state-scope.js
│   └── PWA assets and application modules
│
├── supabase/
│   ├── schemas
│   ├── migrations
│   └── security / RLS audits
│
├── tests/
│   └── automated smoke and integrity tests
│
├── server.mjs
├── start-windows.bat
└── start-mac-linux.sh
```

### Core Stack

**Frontend**

* HTML
* CSS
* Vanilla JavaScript / ES Modules
* Progressive Web App APIs

**Backend**

* Node.js
* Serverless API routes
* Vercel

**Cloud**

* Supabase Authentication
* PostgreSQL
* Row Level Security

**AI**

* Google Gemini

**Security**

* Browser-side AES-GCM encryption
* Supabase RLS
* Cloudflare Turnstile

The architecture has changed repeatedly as ASCEND moved from local storage toward accounts, encrypted synchronization, and multi-device usage.

---

# Built Through AI-Driven Development

ASCEND was built through **AI-driven development**.

I do not want to hide that.

I also do not think describing it as simply "AI made the app" accurately represents how the project was developed.

I did not manually write the majority of ASCEND's source code in the traditional way.

Instead, my role throughout the project has been closer to:

**Product Designer + System Architect + Tester + Decision Maker**

I define what the system should do.

I design its rules.

I decide how features should interact.

I define progression behavior.

I test generated implementations.

I reproduce bugs.

I reject approaches that do not work.

I change requirements when actual usage exposes a bad idea.

I inspect results.

Then I use AI to implement, modify, debug, and iterate on the code.

Sometimes a feature works immediately.

Often it does not.

A surprising amount of ASCEND has been built through cycles like this:

```text
Idea
 ↓
Define behavior
 ↓
AI implementation
 ↓
Test it
 ↓
Something breaks
 ↓
Understand why
 ↓
Change the approach
 ↓
Test again
 ↓
Find an edge case
 ↓
Fix it
 ↓
Repeat
```

ASCEND has gone through many versions because I use the system while developing it.

That means problems are discovered through actual use rather than only through planned test cases.

Duplicate XP.

Broken review states.

Incorrect counters.

Mobile overlays.

Cloud reconciliation.

Authentication problems.

PWA caching.

Daily Quest rollover.

Account isolation.

Recovery behavior.

AI duplicate generation.

Project hierarchy.

Encryption flows.

Social progression boundaries.

Most of these were not part of the original idea.

They appeared because the project kept becoming more real.

---

# Why Vanilla JavaScript?

ASCEND could have been rebuilt using a large frontend framework.

I deliberately kept the application relatively close to the platform instead.

Part of the reason is practical.

The project is developed heavily through AI-assisted iteration, and keeping the architecture understandable at the file and module level makes it easier to isolate behavior, inspect generated changes, and replace individual systems without introducing another large abstraction layer.

That decision has tradeoffs.

But ASCEND is also an experiment in how far a modular, AI-developed Vanilla JavaScript application can realistically be pushed.

So far, much further than I originally expected.

---

# What ASCEND Is Not

ASCEND is not intended to scientifically measure someone's intelligence, discipline, or value.

It is not supposed to turn every part of life into XP.

And it is not a replacement for actually doing the work.

The RPG layer exists for one reason:

**to make long-term progress visible and satisfying enough that I want to continue.**

The system only works if the numbers remain connected to reality.

That is why so many ASCEND features intentionally grant **nothing**.

Sometimes the correct reward for organizing something is simply having it organized.

---

# Current Status

**Version:** `v0.6.0.11.3`

**Stage:** `Private Beta`

The current version is no longer just an early proof of concept.

The core systems are operational, encrypted account synchronization is implemented, the application works as a PWA, and the project has expanded into Quests, Projects, Planner, Habits, Skills, progression, Friends, Focus Circles, and external requests.

But I still consider ASCEND a beta.

There are areas that need more real-user testing, more edge-case testing, and deeper security review before I would consider the system mature.

The next stage is less about adding another giant list of features and more about:

**testing → feedback → hardening → refinement**

---

# What I Learned Building It

ASCEND started because I wanted a better task system.

It ended up teaching me much more than that.

Building it forced me to think about:

* product design
* system architecture
* application state
* UX
* security
* authentication
* databases
* encryption
* synchronization
* PWA behavior
* AI integration
* progression design
* abuse prevention
* testing
* edge cases
* feature scope

Most importantly, it changed the way I think about building software with AI.

Generating code is the easy part.

Building a system where hundreds of small decisions still make sense together is the difficult part.

---

<div align="center">

## ASCEND

**Build your system. Earn your progression.**

From a personal task parser
to a private progression system built around real execution.

`v0.6.0.11.3 — Private Beta`

</div>
