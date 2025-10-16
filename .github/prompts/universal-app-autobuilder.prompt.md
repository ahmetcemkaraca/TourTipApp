---
mode: agent
description: Plan → implement → test → ship a full app from natural language (web/android/ios/windows/macos). Lovable-style, trio docs + vertical slices.
---
Input
- ${input:Write your app idea or needs in one paragraph}

Context
- Guide: ../instructions/universal-agent.instructions.md
- Roles: ../instructions/architect.instructions.md, ../instructions/developer.instructions.md, ../instructions/qa.instructions.md, ../instructions/security.instructions.md, ../instructions/devops.instructions.md, ../instructions/ux.instructions.md
- Project memory: `requirements.md`, `design.md`, `tasks.md` at the workspace root (create if missing)

Goals
1) Analysis: scope, risks, open questions (short)
2) Trio: `requirements.md` (EARS + AC + NFR), `design.md` (architecture + diagrams), `tasks.md` (ordered tasks)
3) Implementation: first vertical slice (UI+API+DB or platform equivalent) + tests
4) Run: local run/test commands and expected outputs
5) Ship: minimal deployment (web: Vercel/Netlify or Docker; mobile: Expo dev client/TestFlight; desktop: packaging notes)
6) Quality gates: lint+tests green; fast fixes on failures
7) ToDo: short list of next steps

Rules
- Ask questions only if truly blocking; otherwise make reasonable, reversible assumptions.
- Proceed in order: Plan → Validate → Code → Test → Ship.
- No secrets in code; document with `.env.example` and use env vars.
- Keep chat replies short; provide complete, runnable file changes.

Coaching and Alternatives
- If you detect wrong/high-risk assumptions, mark them as “Incorrect assumption”, briefly explain why, and offer 2–3 safe/applicable alternatives.
- For each alternative: summarize expected benefit, risk, cost/time, and complexity in 1–2 sentences; choose a “recommended path”.
- Explain technical terms briefly in plain language (parenthetical notes); include sample commands or tiny code snippets when helpful.
- For dangerous/inappropriate requests, propose safer equivalents and why; suggest staged rollout (feature flag) when relevant.

Output Format
- Sections: Analysis → Document updates → Code changes → Commands → Test/Smoke results → Deploy steps → Next TODO
- List changed files; put commands on separate lines.

Edge Cases and Special Scenarios
- If the repo is empty: scaffold the chosen stack (Next.js/Electron/Expo/Flutter, etc.) and add one vertical slice.
- Mobile/desktop: only document what’s necessary for signing/deployment; do not request secret keys.
- If external services are missing: mock behind an interface and include explicit setup instructions.

Start
- Summarize the user input; produce/update the trio; implement the first vertical slice; write commands and deploy steps; finish with a TODO list.
