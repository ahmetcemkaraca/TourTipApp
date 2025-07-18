# Development Environment Setup Script for Windows

Write-Host "Setting up TourTrip.app Development Environment with Firebase..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
} catch {
    Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    node --version | Out-Null
} catch {
    Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
} catch {
    Write-Host "Firebase CLI is not installed. Installing..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

# Create necessary directories
New-Item -ItemType Directory -Force -Path "firebase\functions"
New-Item -ItemType Directory -Force -Path "firebase\public"
New-Item -ItemType Directory -Force -Path "nginx"
New-Item -ItemType Directory -Force -Path "logs"

# Copy environment configuration
Copy-Item "environments\development.properties" ".env"

# Initialize Firebase project (if not already initialized)
if (-not (Test-Path "firebase\.firebaserc")) {
    Write-Host "Initializing Firebase project..." -ForegroundColor Yellow
    Set-Location firebase
    firebase init --project tourtrip-dev
    Set-Location ..
}

# Start Firebase emulators and development services
Write-Host "Starting Firebase emulators and development services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for Firebase emulators to be ready
Write-Host "Waiting for Firebase emulators to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Build the project
Write-Host "Building the project..." -ForegroundColor Yellow
.\gradlew.bat build

Write-Host "Development environment setup complete!" -ForegroundColor Green
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "- Firebase Emulator UI: http://localhost:4000" -ForegroundColor White
Write-Host "- Firebase Auth: localhost:9099" -ForegroundColor White
Write-Host "- Firebase Firestore: localhost:8085" -ForegroundColor White
Write-Host "- Firebase Functions: localhost:8080" -ForegroundColor White
Write-Host "- Firebase Storage: localhost:9199" -ForegroundColor White
Write-Host "- Redis: localhost:6379" -ForegroundColor White
Write-Host "- API Gateway: localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "To stop services: docker-compose down" -ForegroundColor Yellow
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "To access Firebase console: firebase open" -ForegroundColor Yellow