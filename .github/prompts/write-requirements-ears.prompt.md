---
mode: agent
description: Generate EARS-format requirements + acceptance criteria + NFRs from free text and update `requirements.md`.
---
Input
- ${input:Feature list or product idea}

Context
- ../instructions/architect.instructions.md
- requirements.md (if present)

Tasks
1) Write items under Ubiquitous / Event-driven / State-driven / Unwanted / Optional
2) Add Given/When/Then acceptance criteria to each item
3) NFR matrix (performance, security, accessibility, observability)
4) Traceability template and glossary
5) Create/update the `requirements.md` file

Coaching and Alternatives
- Collect ambiguous/conflicting/risky requirements in a “Clarify” list; provide a brief explanation and clear suggestion.
- Propose 2–3 safer/easier alternative requirement phrasings for the same goal and update the acceptance criteria.

Output
- Summary of file changes and open questions
