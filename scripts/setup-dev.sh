#!/bin/bash

# Development Environment Setup Script

echo "Setting up TourTrip.app Development Environment with Firebase..."

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

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
fi

# Create necessary directories
mkdir -p firebase/functions
mkdir -p firebase/public
mkdir -p nginx
mkdir -p logs

# Copy environment configuration
cp environments/development.properties .env

# Initialize Firebase project (if not already initialized)
if [ ! -f "firebase/.firebaserc" ]; then
    echo "Initializing Firebase project..."
    cd firebase
    firebase init --project tourtrip-dev
    cd ..
fi

# Start Firebase emulators and other services
echo "Starting Firebase emulators and development services..."
docker-compose up -d

# Wait for Firebase emulators to be ready
echo "Waiting for Firebase emulators to be ready..."
sleep 15

# Build the project
echo "Building the project..."
./gradlew build

echo "Development environment setup complete!"
echo "Services running:"
echo "- Firebase Emulator UI: http://localhost:4000"
echo "- Firebase Auth: localhost:9099"
echo "- Firebase Firestore: localhost:8085"
echo "- Firebase Functions: localhost:8080"
echo "- Firebase Storage: localhost:9199"
echo "- Redis: localhost:6379"
echo "- API Gateway: localhost:3000"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo "To access Firebase console: firebase open"