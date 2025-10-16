---
mode: agent
description: Code, test, and deliver the first vertical slice (UI+API+DB) with runnable commands.
---
Input
- ${input:Language/Framework preference and target platform}

Context
- ../instructions/developer.instructions.md

Tasks
1) Scaffold the appropriate skeleton (Next.js/Expo/Electron/Flutter/.NET, etc.)
2) Implement the feature end-to-end (form, validation, API, data persistence)
3) Add unit/integration/e2e tests (at least 1–2)
4) Provide run and test commands (Windows PowerShell compatible)
5) Update `.env.example` and README

Output
- Changed files, commands, and expected outputs

Coaching and Alternatives
- If the requested solution is unsafe or painful to maintain, offer 2–3 safer alternatives (e.g., SSG + incremental revalidation instead of SSR); briefly justify and mark the recommended path.
- “Teach” mode: add 1–2 sentence callouts at critical steps (why this library, why this validation schema, etc.).
