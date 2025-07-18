#!/bin/bash

# Staging Environment Setup Script

echo "Setting up TourTrip.app Staging Environment..."

# Check required environment variables
required_vars=("STAGING_DB_USER" "STAGING_DB_PASSWORD" "STAGING_JWT_SECRET" "STAGING_PAYMENT_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Environment variable $var is not set"
        exit 1
    fi
done

# Create necessary directories
mkdir -p database/init
mkdir -p nginx
mkdir -p logs

# Copy environment configuration
cp environments/staging.properties .env

# Start staging services
echo "Starting staging services..."
docker-compose -f docker-compose.staging.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 15

# Run database migrations
echo "Running database migrations..."
# ./gradlew flywayMigrate -Penvironment=staging

# Build the project for staging
echo "Building the project for staging..."
./gradlew build -Penvironment=staging

echo "Staging environment setup complete!"
echo "Services running:"
echo "- Database: localhost:5433"
echo "- Redis: localhost:6380"
echo "- API Gateway: localhost:8081"