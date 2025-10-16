# TourTrip.app

A comprehensive mobile super application connecting tourists, locals, and activity seekers with service providers offering tours, trips, events, and activities.

## 🏗️ Architecture


### Tech Stack
- **Shared**: Kotlin Multiplatform, Ktor, Kotlinx.serialization
- **Android**: Jetpack Compose, Material Design 3, Coil, Firebase SDK
- **iOS**: SwiftUI, Combine, Kingfisher, Firebase SDK
- **Backend**: Firebase (Auth, Firestore, Functions, Storage, Analytics)
- **Build**: Gradle with Kotlin DSL

### Firebase Services
- **Authentication**: Firebase Auth for user management
- **Database**: Cloud Firestore for real-time data
- **Storage**: Firebase Storage for file uploads
- **Functions**: Cloud Functions for server-side logic
- **Analytics**: Firebase Analytics for user insights
- **Messaging**: Firebase Cloud Messaging for push notifications
- **Crashlytics**: Firebase Crashlytics for crash reporting

## 🚀 Quick Start

### Prerequisites
- JDK 17 or higher
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Docker & Docker Compose (for local services)

### Development Setup

#### Windows
```powershell
# Clone the repository
git clone <repository-url>
cd tourtrip.app

# Run development setup
.\scripts\setup-dev.ps1
```

#### Linux/macOS
```bash
# Clone the repository
git clone <repository-url>
cd tourtrip.app

# Run development setup
./scripts/setup-dev.sh
```

### Manual Setup
1. **Start local services**:
   ```bash
   docker-compose up -d
   ```

2. **Build the project**:
   ```bash
   ./gradlew build
   ```

3. **Run Android app**:
   ```bash
   ./gradlew :androidApp:installDebug
   ```

4. **Build iOS framework**:
   ```bash
   ./gradlew :shared:linkDebugFrameworkIosX64
   ```

## 🏢 Environments

### Live Development
- **Firebase Project**: tourtrip-live-dev (LIVE Firebase services)
- **Firebase Console**: https://console.firebase.google.com/project/tourtrip-live-dev
- **Redis**: localhost:6379
- **Development Dashboard**: http://localhost:3000
- **Configuration**: `environments/development.properties`
- **⚠️ Important**: Uses real Firebase services with persistent data

### Staging
- **Firebase Project**: tourtrip-staging
- **Setup**: `./scripts/setup-staging.sh`
- **Configuration**: `environments/staging.properties`
- **Docker**: `docker-compose.staging.yml`

### Production
- **Firebase Project**: tourtrip-prod
- **Configuration**: `environments/production.properties`
- **Deployment**: Automated via GitHub Actions

## 🔄 Development Workflow

### Branching Strategy
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/**: New features
- **release/**: Release preparation
- **hotfix/**: Critical fixes

See [BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md) for detailed workflow.

### Common Commands

```bash
# Build all modules
./gradlew build

# Run tests
./gradlew test

# Build Android debug
./gradlew :androidApp:assembleDebug

# Build Android release
./gradlew :androidApp:assembleRelease

# Generate iOS framework
./gradlew :shared:linkDebugFrameworkIosX64

# Clean build
./gradlew clean
```

## 📱 Project Structure

```
TourTrip.app/
├── shared/                 # Kotlin Multiplatform shared code
│   ├── src/commonMain/     # Platform-agnostic code
│   ├── src/androidMain/    # Android-specific shared code
│   └── src/iosMain/        # iOS-specific shared code
├── androidApp/             # Android application
├── iosApp/                 # iOS application
├── environments/           # Environment configurations
├── scripts/                # Setup and utility scripts
└── docs/                   # Documentation
```

## 🧪 Testing

```bash
# Run all tests
./gradlew test

# Run Android tests
./gradlew :androidApp:testDebugUnitTest

# Run shared module tests
./gradlew :shared:testDebugUnitTest
```

## 🚀 Deployment

### Staging
Automatically deployed on push to `develop` branch.

### Production
Automatically deployed on version tags (e.g., `v1.0.0`).

## 🔧 Configuration

Environment-specific configurations are stored in the `environments/` directory:
- `development.properties` - Local development
- `staging.properties` - Staging environment
- `production.properties` - Production environment

## 📚 Documentation

- [Branching Strategy](docs/BRANCHING_STRATEGY.md)
- [API Documentation](docs/API.md) _(coming soon)_
- [Architecture Guide](docs/ARCHITECTURE.md) _(coming soon)_

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Create a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.