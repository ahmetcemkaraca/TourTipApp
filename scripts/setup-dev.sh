#!/bin/bash

# Development Environment Setup Script

echo "Setting up TourTrip.app Development Environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
mkdir -p database/init
mkdir -p nginx
mkdir -p logs

# Copy environment configuration
cp environments/development.properties .env

# Start development services
echo "Starting development services..."
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations (placeholder)
echo "Running database migrations..."
# ./gradlew flywayMigrate -Penvironment=development

# Build the project
echo "Building the project..."
./gradlew build

echo "Development environment setup complete!"
echo "Services running:"
echo "- Database: localhost:5432"
echo "- Redis: localhost:6379"
echo "- API Gateway: localhost:8080"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"