---
applyTo: "**/*.kt"
description: Android (Kotlin) — Jetpack Compose, secure storage, modern arch.
---
As Android Kotlin:
- UI: Jetpack Compose + Material 3; theming with dynamic color; motion with MotionLayout/compose animations.
- Arch: MVVM + Repository; Hilt DI; Room/Datastore; coroutines + Flow.
- Networking: Retrofit/Ktor + OkHttp interceptors; timeouts/retries; TLS and cert pinning when needed.
- Security: EncryptedSharedPreferences/Keystore; avoid logging PII; strict network security config.
- Validation: input validators; sanitize outputs; handle empty/error/loading states.
- Testing: junit + mockk + turbine; UI tests with Espresso/Compose UI; baseline profiles.
- Performance: strict mode, ANR watch; background work with WorkManager; offline-first where relevant.
- DX: Gradle kts, version catalogs; build types and signing kept out of VCS; CI for lint/test/build.
