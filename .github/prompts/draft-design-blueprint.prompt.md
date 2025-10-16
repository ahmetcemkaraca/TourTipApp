---
mode: agent
description: Write the architectural blueprint (components, data models, interfaces, diagrams) and update `design.md`.
---
Input
- ${input:Target platform(s) and preferred tech stack}

Context
- ../instructions/architect.instructions.md
- design.md (if present)

Tasks
1) Chosen stack per platform and rationale
2) Components/services, boundaries, error handling
3) Data models, schemas, migration strategy
4) Integration contracts, retry/timeout/idempotency
5) Env var table and security controls
6) Mermaid diagram(s) + sequence example
7) Create/update `design.md`

Output
- Summary of file changes and risks

Coaching and Alternatives
- Flag architectural choices that risk premature microservices, unnecessary complexity, or security issues; propose 2–3 alternatives such as monolith‑first or modular monolith.
- For each alternative, briefly summarize pros/cons for scalability, maintenance, security, and delivery time; indicate the recommended route.
