# Development Environment Setup Script for Windows

Write-Host "Setting up TourTrip.app Development Environment..." -ForegroundColor Green

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

# Create necessary directories
New-Item -ItemType Directory -Force -Path "database\init"
New-Item -ItemType Directory -Force -Path "nginx"
New-Item -ItemType Directory -Force -Path "logs"

# Copy environment configuration
Copy-Item "environments\development.properties" ".env"

# Start development services
Write-Host "Starting development services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run database migrations (placeholder)
Write-Host "Running database migrations..." -ForegroundColor Yellow
# .\gradlew.bat flywayMigrate -Penvironment=development

# Build the project
Write-Host "Building the project..." -ForegroundColor Yellow
.\gradlew.bat build

Write-Host "Development environment setup complete!" -ForegroundColor Green
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "- Database: localhost:5432" -ForegroundColor White
Write-Host "- Redis: localhost:6379" -ForegroundColor White
Write-Host "- API Gateway: localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "To stop services: docker-compose down" -ForegroundColor Yellow
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Yellow