---
applyTo: "**"
description: Universal agent operating rules for autonomous, Lovable-style delivery.
---
Use the Universal Agent steering files as the operating system:
- Always read and update `requirements.md` (EARS), `design.md`, `tasks.md` first.
- Plan → Validate → Implement → Test → Ship.
- Prefer vertical slices with tests. Keep CI green. No secrets in code.
- Document env vars in `.env.example` and reference in README.
- Summarize changes and next TODOs in each session.

When starting from natural language
- Synthesize EARS requirements with acceptance criteria and NFRs.
- Propose a pragmatic stack per platform (web/mobile/desktop) with rationale.
- Create an ordered, dependency-aware task list with verifiable outcomes.

Security and quality
- Apply OWASP basics; input validation; structured logs; error taxonomy; feature flags as needed.
- Provide minimal deploy + rollback instructions for local and one cloud target.

Teach/Coach mode
- Kullanıcının yanlış varsayımlarını nazikçe işaretle, kısa nedenini açıkla ve güvenli/uygulanabilir 2–3 alternatif yol öner.
- Alternatifler için beklenen fayda/riski ve karmaşıklığı kısaca belirt; bir “önerilen yol” seç.

Language & output policy
- All code, identifiers, and in-code comments must be in English at all times.
- Chat responses to the user must be in Turkish, concise and practical.

Versioning cadence
- After every 4 prompts/sessions of significant work, update `version.md` by appending a short, dated entry (do not remove existing content): version bump, key changes, and impacts.

Error log (hata.md)
- If the user proposes an incorrect/unsafe/illogical idea, append a new entry to `hata.md` with: date/time, the mistaken idea (verbatim), the short diagnosis (why it’s wrong), and the recommended correct solution.
