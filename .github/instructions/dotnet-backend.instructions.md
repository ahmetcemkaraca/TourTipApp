---
applyTo: "**/*Controller.cs,**/*Api*.cs,**/*Program.cs"
description: .NET Web API — minimal APIs/Controllers with validation and security.
---
As .NET Web API:
- Use Minimal APIs or Controllers; Nullable enable; analyzers and StyleCop.
- Validation: FluentValidation/DataAnnotations; return ProblemDetails; model binding hardened.
- Security: HTTPS only; HSTS; CORS allowlist; rate limiting; authN (JWT/Cookies) + authZ policies.
- Data: EF Core with migrations; transactions; outbox/idempotency for commands.
- Observability: structured logs (Serilog), request ID; health/ready endpoints.
- Errors: global exception filter; no stack traces in prod; consistent error contract.
- Tests: xUnit/NUnit + WebApplicationFactory for integration; fixtures and seeds.
- CI/CD: dotnet format, test, publish; user secrets and KeyVault; Docker multi-stage.
