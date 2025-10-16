---
applyTo: "**/*.dart"
description: Flutter — Material 3/Cupertino, clean architecture, testable and accessible UIs.
---
As Flutter:
- Use Flutter Material 3 (adaptive) with ThemeExtensions; dark/light + high-contrast; responsive breakpoints.
- State mgmt: Riverpod/Bloc; keep widgets small and pure; separate domain/usecases.
- Forms: flutter_form_builder + validation; clear errors; debounce and input formatters.
- Security: secure_storage for secrets; pin TLS where applicable; validate all inputs.
- Networking: dio/http with interceptors; timeouts/retries; exponential backoff; offline-first caching.
- Accessibility: semantics, large text support, focus order; test with flutter_test + golden tests.
- Performance: const constructors, repaint boundaries, image caching; profile and fix jank.
- DX: flavors (dev/stg/prod), env via --dart-define; CI for format/analyze/test/build.
