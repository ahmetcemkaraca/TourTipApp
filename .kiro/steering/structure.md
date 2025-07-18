# Project Structure

## Root Level Organization

```
TourTripapp/
├── .gradle/                 # Gradle cache and build files
├── .idea/                   # IntelliJ IDEA configuration
├── .kiro/                   # Kiro AI assistant configuration
│   ├── specs/               # Project specifications and requirements
│   └── steering/            # AI guidance documents
├── .kotlin/                 # Kotlin compiler cache
├── androidApp/              # Android-specific implementation
├── build/                   # Build output directory
├── gradle/                  # Gradle wrapper and version catalog
├── iosApp/                  # iOS-specific implementation
├── shared/                  # Kotlin Multiplatform shared code
├── build.gradle.kts         # Root build configuration
├── settings.gradle.kts      # Project settings and module inclusion
├── gradle.properties        # Gradle properties
└── local.properties         # Local environment configuration
```

## Shared Module Structure

The `shared/` directory contains the Kotlin Multiplatform code that's shared between Android and iOS:

```
shared/
├── src/
│   ├── commonMain/          # Platform-agnostic code
│   │   ├── kotlin/          # Shared Kotlin source code
│   │   └── resources/       # Shared resources
│   ├── androidMain/         # Android-specific shared code
│   │   ├── kotlin/          # Android-specific implementations
│   │   └── resources/       # Android-specific resources
│   ├── iosMain/             # iOS-specific shared code
│   │   └── kotlin/          # iOS-specific implementations
│   └── commonTest/          # Shared test code
└── build.gradle.kts         # Shared module build configuration
```

## Android App Structure

```
androidApp/
├── src/
│   ├── main/
│   │   ├── java/            # Android-specific Kotlin/Java code
│   │   ├── res/             # Android resources (layouts, strings, etc.)
│   │   └── AndroidManifest.xml
│   └── test/                # Android-specific tests
└── build.gradle.kts         # Android app build configuration
```

## iOS App Structure

```
iosApp/
├── iosApp/                  # iOS source code and resources
│   ├── ContentView.swift    # Main SwiftUI view
│   ├── iOSApp.swift         # App entry point
│   └── Info.plist           # iOS app configuration
└── iosApp.xcodeproj/        # Xcode project configuration
```

## Recommended Code Organization

### Shared Module (commonMain)

```
shared/src/commonMain/kotlin/com/ack/tourtripapp/
├── data/                    # Data layer
│   ├── api/                 # API client and endpoints
│   ├── db/                  # Database models and DAOs
│   ├── repository/          # Repository implementations
│   └── model/               # Data transfer objects
├── domain/                  # Business logic layer
│   ├── model/               # Domain models
│   ├── usecase/             # Use cases/interactors
│   └── repository/          # Repository interfaces
├── presentation/            # Presentation layer (shared ViewModels)
│   ├── viewmodel/           # Shared view models
│   └── state/               # UI state models
└── utils/                   # Utility classes and extensions
    ├── network/             # Network utilities
    ├── storage/             # Storage utilities
    └── extensions/          # Kotlin extensions
```

## Configuration Files

### Version Catalog (`gradle/libs.versions.toml`)
- Centralized dependency version management
- Shared across all modules
- Includes versions for Kotlin, Android, Compose, and other libraries

### Build Scripts
- **Root `build.gradle.kts`**: Plugin management and common configuration
- **`settings.gradle.kts`**: Module inclusion and repository configuration
- **Module `build.gradle.kts`**: Module-specific build configuration

## Package Naming Convention

- **Root package**: `com.ack.tourtripapp`
- **Android package**: `com.ack.tourtripapp.android`
- **Shared package**: `com.ack.tourtripapp`

## Development Workflow

1. **Shared Logic**: Implement business logic, data models, and API calls in `shared/commonMain`
2. **Platform-Specific**: Add platform-specific implementations in `androidMain` and `iosMain`
3. **UI Implementation**: Create platform-specific UI in `androidApp` and `iosApp`
4. **Testing**: Write shared tests in `commonTest` and platform-specific tests in respective test directories

## Module Dependencies

- `androidApp` depends on `shared`
- `shared` is a Kotlin Multiplatform library
- iOS app links to the generated framework from `shared`

## Build Outputs

- **Android**: APK/AAB files in `androidApp/build/outputs/`
- **iOS**: Framework in `shared/build/bin/`
- **Shared**: JAR files in `shared/build/libs/`

## Key Architectural Principles

- **Clean Architecture**: Separation of concerns with data, domain, and presentation layers
- **Dependency Inversion**: Interfaces in domain layer, implementations in data layer
- **Single Responsibility**: Each class/module has one reason to change
- **Platform Abstraction**: Common interfaces with platform-specific implementations