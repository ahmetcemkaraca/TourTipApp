---
applyTo: "**/*.prisma"
description: Prisma schema — safe migrations, naming, and performance.
---
As Prisma:
- Use explicit relations and onDelete behaviors; avoid implicit many-to-many unless intended.
- Add @@index/@@unique thoughtfully; avoid hot path N+1 via includes/selects in app.
- Use migrations with review; never edit generated SQL in prod.
- Envs via DATABASE_URL; no secrets in code; seed scripts deterministic.
- Prefer UUID/cuid primary keys; createdAt/updatedAt defaults; soft-delete when needed.
