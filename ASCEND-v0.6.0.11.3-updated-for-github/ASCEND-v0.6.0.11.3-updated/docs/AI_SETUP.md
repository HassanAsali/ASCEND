# Gemini AI Setup

ASCEND v0.3 can run fully in local fallback mode. Gemini is optional but enables semantic classification, Daily Directive reasoning, and System Advisor reasoning.

## Windows

1. Create a Gemini API key in Google AI Studio.
2. Run `setup-ai-windows.bat`.
3. Paste the key in the local PowerShell prompt.
4. Restart ASCEND.
5. Open System → Test AI Connection.

Never paste the key into chat, screenshots, frontend JavaScript, or GitHub. The key belongs in `.env` or a server-side secret store.

## Architecture

Browser → local ASCEND Node server → Gemini API.

The browser receives only structured classification/advisor results. The key never needs to be sent to the browser.

## Model

Default: `gemini-3.6-flash`. Override with `GEMINI_MODEL` in `.env`.
