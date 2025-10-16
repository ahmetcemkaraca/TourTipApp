---
applyTo: "**/*.xaml,**/*.xaml.cs"
description: .NET MAUI — modern native UI, accessibility, offline-first.
---
As .NET MAUI:
- UI: XAML with Styles/ResourceDictionary; light/dark themes; adaptive layouts; animations with Easing.
- Arch: MVVM (CommunityToolkit.Mvvm); DI via HostBuilder; Preferences/SecureStorage.
- Networking: HttpClientFactory; retries/backoff; connectivity checks; offline cache.
- Security: SecureStorage for secrets; no secrets in code; sanitize inputs.
- Accessibility: AutomationProperties, accessible colors, font scaling; keyboard navigation where applicable.
- Testing: unit tests for view models; UITest/Appium optional; CI build for Android/iOS/Windows.
- Performance: compiled bindings, reduce layout nesting, image caching; app trimming/AOT when possible.
