Project-wide Copilot instructions for Lovable-style autonomous app building across web/android/ios/windows/macos. Keep answers concise; code complete and runnable.

Principles
- Treat the trio (`requirements.md`, `design.md`, `tasks.md`) as the single source of truth. If your repo includes extra steering files (for example, `rules/universal-agent/*.mdc` or `UniversalAgent/*.md`), use them; otherwise, synthesize and create what’s needed.
- Follow the trio workflow: update or create `requirements.md` (EARS), `design.md` (architecture), `tasks.md` (ordered tasks) before coding.
- Default to secure, test-first, deployable slices. Never hardcode secrets. Prefer env vars with `.env.example`.
- Ask questions only when blocked; otherwise assume reversible defaults and proceed.
- Output: minimal prose + explicit file edits + run/test/deploy commands. Summarize results.

Platform guidance
- Web: Next.js/React (Node 20), Tailwind or CSS modules, API routes or lightweight Express/Nest.
- Mobile: React Native/Expo or Flutter; for native (Android/iOS) document signing and store steps.
- Desktop: Electron or .NET MAUI/Swift where suitable; include packaging and updater notes.

Quality gates
- Lint/format, unit + integration, smoke/e2e. Ship only when green. Provide rollback steps.

Artifacts to maintain
- README.md (how to run, test, deploy)
- CHANGELOG.md (semantic, user-facing)
- ADRs for significant decisions
- RISKS.md for top risks + mitigations

Security defaults
- Validate inputs (schema), sanitize outputs, authn/authz where relevant, secret hygiene, dependency audits.

When asked for help
- Provide a short analysis, then update the trio, then code edits with tests, then run instructions.

Copilot behavior
- Keep chat replies compact. Prefer bullet lists and fenced code for commands when needed. Cite files you change.
- Use `.github/instructions/*.instructions.md` for role-specific rules, and `.github/prompts/*.prompt.md` for reusable tasks.

Semantic Versioning (SemVer)
- Use SemVer: MAJOR.MINOR.PATCH (e.g., 1.4.2).
- Bump MAJOR for incompatible API/behavior changes, data migrations without backward compatibility, or breaking CLI flags.
- Bump MINOR for backward-compatible feature additions, new endpoints/flags, or deprecations (without removal).
- Bump PATCH for backward-compatible bug fixes, performance tweaks without API change, or doc/CI fixes.
- Keep a CHANGELOG.md with entries grouped by Added/Changed/Fixed/Removed/Deprecated/Security.
- Tie bumps to Conventional Commits: feat → MINOR, fix/perf → PATCH, refactor/docs/chore/test → PATCH (unless breaking), feat! or fix! → MAJOR.
- Tag releases (e.g., v1.5.0) and reference in version.md entries; provide rollback notes for MAJOR changes.
