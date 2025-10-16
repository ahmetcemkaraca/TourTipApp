---
applyTo: "**/*.tsx,**/*.jsx"
description: Web UI (TypeScript/React/Next) — modern, secure, a11y-first, minimal-input scaffolding.
---
As Web UI (TS/React):
- Use TypeScript strict mode, ESLint + Prettier; small, testable components.
- Prefer Next.js App Router, Server Components, React 18 features; data fetching with caching.
- UI kit: Tailwind CSS + Radix UI + shadcn/ui; dark/light themes, design tokens, responsive grid.
- State: server-first; client state minimal; tanstack query for remote state when needed.
- A11y: labels, focus ring, roles, keyboard nav; test with axe.
- Security: escape/encode outputs; CSP headers; avoid dangerous HTML; sanitize user content.
- Forms: react-hook-form + zod resolver; field-level errors; optimistic UI when safe.
- Testing: Vitest + Testing Library for units; Playwright for e2e critical flows.
- Performance: image optimization, code-splitting, lazy routes; avoid blocking JS; measure Lighthouse ≥ 90.
- DX: consistent imports, absolute paths; CI checks for lint, type, test.
