---
mode: agent
description: Write an ordered plan with a vertical-slice strategy and update `tasks.md`.
---
Input
- ${input:User value targeted in the first slice}

Context
- ../instructions/developer.instructions.md
- tasks.md (if present)

Tasks
1) Bootstrap, architecture docs, CI/Lint/Test setup
2) Vertical slice 1 (UI+API+DB) tasks and tests
3) Observability and error boundaries
4) Packaging/deployment and rollback steps
5) DOD and readiness checklist
6) Create/update `tasks.md`

Output
- Task list and estimated risks

Coaching and Alternatives
- Protect risky/secret-bearing steps with a feature flag; if needed defer with mock/contract tests.
- Propose 2–3 alternative task orders for faster delivery (e.g., “API contract + mock → UI → real integration”).
