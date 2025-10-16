---
applyTo: "**/*.ts,**/*.js"
description: Node backend (Express/Fastify/Nest) — secure-by-default APIs with schema validation.
---
As Node backend:
- Prefer Fastify or Nest for performance and structure; use ESM/TypeScript with strict true.
- Validate all inputs/outputs with zod or TypeBox + fastify-type-provider; centralize schemas.
- Security: helmet, CORS allowlist, rate limiting, CSRF where relevant; no secrets committed.
- Errors: typed error classes, problem+json responses; never leak stack traces in prod.
- Auth: session cookies (HttpOnly/SameSite) or JWT with rotation; RBAC/ABAC guards.
- Observability: pino structured logs (requestId, userId), healthz/readyz endpoints.
- Data: Postgres with drizzle/prisma; safe migrations; transactions; idempotency for writes.
- Tests: Vitest + Supertest for API; contract tests for external deps; seed fixtures.
- Performance: timeouts, retry/backoff, circuit breaker; cache headers and Redis where useful.
- DX: npm scripts for dev/test/build; .env.example documented; GitHub Actions CI (lint→test→build).
