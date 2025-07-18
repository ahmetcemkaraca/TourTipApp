# Technology Stack

## Mobile Development

**Kotlin Multiplatform Mobile (KMM)** - Primary mobile development approach
- Shared business logic between Android and iOS
- Platform-specific UI implementations
- Code reuse for data models, networking, and business logic

### Android
- **Jetpack Compose** - Modern declarative UI toolkit
- **Material Design 3** - Design system and components
- **Android Architecture Components** - Lifecycle-aware components
- **Coil** - Image loading library

### iOS
- **SwiftUI** - Declarative UI framework
- **Combine** - Reactive programming framework
- **Kingfisher** - Image loading library

### Shared Dependencies
- **Ktor** - HTTP client for API communication
- **SQLDelight** - Type-safe SQL database access
- **Kotlinx.serialization** - JSON parsing and serialization
- **Kotlinx.coroutines** - Asynchronous programming

## Build System

**Gradle** with Kotlin DSL - Primary build system
- Version catalog management via `gradle/libs.versions.toml`
- Multi-module project structure
- Shared plugin configuration

### Key Versions
- Kotlin: 2.0.0
- Android Gradle Plugin: 8.9.2
- Compose: 1.5.4
- Compose Material3: 1.1.2

### Project Structure
- `shared/` - Kotlin Multiplatform shared code
- `androidApp/` - Android-specific implementation
- `iosApp/` - iOS-specific implementation

## Backend Architecture

**Microservices Architecture** - Cloud-native approach
- API Gateway for request routing and authentication
- Individual services for specific business domains
- Containerized deployment with Docker

### Core Services
- Authentication Service
- User Service
- Provider Service
- Booking Service
- Payment Service
- Search Service
- Review Service
- Taxi Service
- Loyalty Service
- Admin Service
- Marketplace Service

## Web Platform

**Next.js** - React-based web framework
- Server-side rendering for SEO optimization
- **React.js** - Component-based UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Redux** - State management

## Common Commands

### Mobile Development
```bash
# Build Android app
./gradlew :androidApp:assembleDebug

# Build iOS framework
./gradlew :shared:linkDebugFrameworkIosX64

# Run Android tests
./gradlew :shared:testDebugUnitTest

# Clean build
./gradlew clean
```

### Development Setup
```bash
# Install dependencies
./gradlew build

# Run in development mode
./gradlew :androidApp:installDebug

# Generate iOS framework for Xcode
./gradlew :shared:embedAndSignAppleFrameworkForXcode
```

## Target Specifications

### Android
- **Compile SDK**: 35
- **Min SDK**: 28 (Android 9.0)
- **Target SDK**: 35
- **Java Version**: 1.8

### iOS
- **Deployment Targets**: iOS 14.0+
- **Architectures**: x64, ARM64, Simulator ARM64

## Package Structure

```
com.ack.tourtripapp/
├── shared/           # Shared KMM code
├── androidApp/       # Android-specific code
└── iosApp/          # iOS-specific code
```

## Development Guidelines

- Use Kotlin DSL for Gradle scripts
- Follow clean architecture principles
- Implement shared business logic in common module
- Keep platform-specific code minimal
- Use type-safe builders and DSLs where possible
- Leverage Kotlin coroutines for asynchronous operations