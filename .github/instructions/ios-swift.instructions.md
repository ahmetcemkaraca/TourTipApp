---
applyTo: "**/*.swift"
description: iOS (Swift) — SwiftUI, Combine/async-await, secure and testable.
---
As iOS Swift:
- UI: SwiftUI with SF Symbols + dynamic type + dark mode; smooth animations; accessibility labels and traits.
- Arch: MVVM; dependency injection via protocols; persistence with CoreData/Realm; Keychain for secrets.
- Networking: URLSession/Alamofire; async/await; retries/backoff; TLS/cert pinning where required.
- Security: avoid storing secrets in plist; Keychain; App Transport Security hardened.
- Validation: strict input validation; safe output encoding; graceful error states and empty views.
- Testing: XCTest + async tests; UI tests with XCUITest; snapshot tests where helpful.
- Performance: Instruments for leaks/jank; background tasks with BGTaskScheduler.
- DX: Schemes/configurations; .xcconfig for env; CI for build/test; fastlane optional for distribution.
