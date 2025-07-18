# Live Development Environment Setup Script for Windows

Write-Host "Setting up TourTrip.app Live Development Environment with Firebase..." -ForegroundColor Green

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

# Firebase authentication check
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
try {
    firebase projects:list | Out-Null
} catch {
    Write-Host "Please login to Firebase first:" -ForegroundColor Yellow
    firebase login
}

# Initialize Firebase project for live development
if (-not (Test-Path "firebase\.firebaserc")) {
    Write-Host "Initializing Firebase project for live development..." -ForegroundColor Yellow
    Set-Location firebase
    firebase init --project tourtrip-live-dev
    Set-Location ..
} else {
    Write-Host "Setting Firebase project to live development..." -ForegroundColor Yellow
    Set-Location firebase
    firebase use tourtrip-live-dev
    Set-Location ..
}

# Start development services (no emulators, using live Firebase)
Write-Host "Starting live development services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Build the project
Write-Host "Building the project..." -ForegroundColor Yellow
.\gradlew.bat build

Write-Host "Live development environment setup complete!" -ForegroundColor Green
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "- Live Firebase Project: tourtrip-live-dev" -ForegroundColor White
Write-Host "- Firebase Console: https://console.firebase.google.com/project/tourtrip-live-dev" -ForegroundColor White
Write-Host "- Redis: localhost:6379" -ForegroundColor White
Write-Host "- Development Dashboard: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Important: You are now connected to LIVE Firebase services!" -ForegroundColor Red
Write-Host "All data changes will be persistent and real." -ForegroundColor Red
Write-Host ""
Write-Host "To stop services: docker-compose down" -ForegroundColor Yellow
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "To access Firebase console: firebase open" -ForegroundColor Yellow