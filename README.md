<div align="center">

# 🌌 ASCEND // Personal Progression OS
### *A locally-encrypted, AI-assisted productivity ecosystem built entirely through AI-Driven Development (Vibe Coding).*

![Version](https://img.shields.io/badge/Version-v0.6.0.11.3%20(Beta)-blue?style=for-the-badge)
![Development](https://img.shields.io/badge/Development-100%25%20AI%20Generated%20(Vibe%20Coding)-purple?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20Node.js%20%7C%20Supabase-success?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-AES--256--GCM%20%7C%20RSA--OAEP-red?style=for-the-badge)

[The Vibe Coding Journey](#-the-vibe-coding-journey-building-without-typing) • [System Architecture](#-system-architecture--technical-deep-dive) • [Security & Encryption](#-security--cryptography-the-client-side-vault) • [Anti-Cheat Engine](#-database-design--anti-cheat-mechanics) • [Lessons Learned](#-lessons-learned-for-ai-driven-developers)

</div>

---

## 🤖 The Vibe Coding Journey: Building Without Typing

Let me be upfront: **I do not know how to code in the traditional sense.** 

I built ASCEND entirely through **AI-Driven Development (Vibe Coding)**. I acted as the systems architect, product manager, and prompt engineer, while AI tools wrote every single line of code. 

I started with a personal problem: extreme procrastination and the mental friction of managing messy tasks. I wanted a gamified system that strictly rewarded real-world execution, not just planning. However, I didn't want to pay monthly subscriptions for rigid apps, and since I was already paying for AI tools, I decided to prompt my way into building my own.

What started as a simple AI task parser evolved into a massive, highly secure Progressive Web App (PWA). Through hundreds of hours of prompting, debugging loops, and architectural refinements, I guided the AI to implement complex features like **client-side AES encryption, Supabase Row-Level Security (RLS), and zero-exploit RPG progression algorithms.**

This repository stands as proof of what is possible when you combine clear system logic with AI generation.

---

## 🏗️ System Architecture & Technical Deep Dive

To ensure the AI could reliably generate and debug code without hallucinating, I deliberately avoided heavy frontend frameworks like React or Vue. ASCEND is built on a lightweight, highly decoupled architecture.

### The Tech Stack
* **Frontend:** Vanilla HTML5, CSS3, and modular ES6 JavaScript (`app.js`, `planner-system.js`, `daily-cycle.js`). Keeping it vanilla allowed the AI to manipulate the DOM predictably.
* **Backend / Database:** Supabase (PostgreSQL) with strict Row-Level Security (RLS) policies enforcing user data isolation.
* **Serverless Middlewares:** Node.js Edge Functions (via Vercel) for secure API routing and Turnstile verification.
* **AI Engine:** Google Gemini API (Semantic analysis, text parsing).
* **Security:** Native Web Crypto API (AES-256-GCM, RSA-OAEP).

---

## 🔐 Security & Cryptography (The Client-Side Vault)

One of the most complex engineering challenges I prompted the AI to solve was ensuring absolute data privacy. **The server does not know what your tasks are.**

### 1. End-to-End Encryption (AES-256-GCM)
Instead of storing plaintext strings in the database, the `player_state` is encrypted locally inside the browser *before* any API call is made. 
* We utilize `window.crypto.subtle` to generate an AES-GCM encryption key.
* The encrypted payload is uploaded to Supabase.
* **The Recovery File:** Because the server holds zero decryption keys, the user is prompted to download a `.txt` Recovery File upon registration. This file acts as the local decryption key. If you log in on a new device, the system intercepts the onboarding flow and demands the Recovery Key to unlock the vault.

### 2. Hybrid Encryption for External Requests (RSA + AES)
To allow external friends to send tasks to a player without needing an account, I designed an inbox system using hybrid encryption:
1. The player generates a public/private RSA-OAEP-256 key pair. 
2. The private key is encrypted by the player's AES Recovery Key and stored in the database.
3. The public key is embedded in a shareable hashed URL.
4. When a guest submits a request, their browser encrypts the payload using a one-time AES key, which is then wrapped in the player's RSA public key.

---

## 🤖 AI Engine & Semantic Processing

ASCEND integrates the Gemini API not as a conversational chatbot, but as an invisible semantic parser that builds structured JSON data from natural language.

### Native Bilingual Processing
The prompt engineering forces the AI to respect the user's input language (Arabic or English) for visible UI elements, while keeping system enumerations (Quest Type, Difficulty, Priority) in strict English keys. This ensures the database logic never breaks regardless of the input language.

### State-Scoped Caching & Context Isolation
To prevent the Gemini API from hallucinating or mixing contexts across users, the AI requests are bundled with a sanitized version of the player's specific focus areas (e.g., Mechanical Engineering vs. Medicine). 

---

## 🛡️ Database Design & Anti-Cheat Mechanics

Gamified systems are notoriously easy to cheat. ASCEND solves "XP Farming" through strict database constraints and UI event blocking, which I heavily iterated on during the debugging phases.

### 1. Idempotent XP Calculations (The `SUM()` Method)
In the **Focus Circles** and **Friends** modules, XP is not pushed from the client. 
* When a user marks a shared session as complete, a unique row is inserted keyed by `(item_id, user_id)`.
* Circle Contribution XP is dynamically calculated server-side as a `SUM()` of the duration of valid rows. 
* **Anti-Farm Guarantee:** If a user rapidly clicks "Complete" and "Undo", the system simply inserts and deletes the exact same row. They can never accumulate more than the base XP of that specific item.

### 2. UI-Level System Locks
When a quest is analyzed by the AI or manually added via Quick-Add, the engine calculates the reward (XP) based on 6 factors: Difficulty, Type, Priority, Estimated Time, Long-term Value, and Life Impact.
* The instant the payload is processed, the DOM fields are locked (`disabled`). 
* The user cannot manipulate the hidden fields to inflate the output XP before saving it to the database.

### 3. Daily Recurrence Reconciliation
Handling daily tasks without creating endless duplicate rows in the database was solved via a startup reconciliation script:
* When the app initializes or regains tab focus, it checks the local date.
* If a scheduled Daily Quest is past due, the system pulls it forward to the current date and increments a "missed-day" audit counter.
* It strictly limits generation to **one active occurrence per day**, preventing backdated reward farming.

---

## 📚 Lessons Learned for AI-Driven Developers (Vibe Coders)

If you are a developer or a fellow "Vibe Coder" exploring this code, here are the key technical takeaways from building a massive system exclusively via AI prompting:

1. **Vanilla JS is King for AI:** AI models hallucinate less and write better, more predictable code when you strip away complex frameworks like React or Next.js. State management and DOM manipulation via modular ES6 imports (`app.js`, `state-scope.js`) kept the context window clean.
2. **Security by Explicit Prompting:** AI will naturally write insecure, plaintext CRUD apps if you let it. You must explicitly instruct it to implement `window.crypto.subtle` and define strict Supabase RLS policies (e.g., `auth.uid() = user_id`) to build secure software.
3. **Debugging Requires Architecture Context:** When an AI breaks your code, you cannot just paste the error. You must remind the AI of the system architecture (e.g., "Remember, we are using AES-GCM for the payload before uploading to Supabase") to get an accurate fix.
4. **Cloudflare Turnstile is Essential:** To prevent abuse on Vercel Edge Functions, integrating bot protection required careful prompting to ensure the Turnstile token is validated server-side before execution.

---

## ⚙️ Local Development & Setup

ASCEND supports full local deployment for testing the encrypted vault and offline PWA capabilities.

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR-USERNAME/ascend-system.git](https://github.com/YOUR-USERNAME/ascend-system.git)
   cd ascend-system
