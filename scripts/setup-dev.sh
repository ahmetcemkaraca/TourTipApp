#!/bin/bash

# Live Development Environment Setup Script

echo "Setting up TourTrip.app Live Development Environment with Firebase..."

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

# Firebase authentication check
echo "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "Please login to Firebase first:"
    firebase login
fi

# Initialize Firebase project for live development
if [ ! -f "firebase/.firebaserc" ]; then
    echo "Initializing Firebase project for live development..."
    cd firebase
    firebase init --project tourtrip-live-dev
    cd ..
else
    echo "Setting Firebase project to live development..."
    cd firebase
    firebase use tourtrip-live-dev
    cd ..
fi

# Start development services (no emulators, using live Firebase)
echo "Starting live development services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Build the project
echo "Building the project..."
./gradlew build

echo "Live development environment setup complete!"
echo "Services running:"
echo "- Live Firebase Project: tourtrip-live-dev"
echo "- Firebase Console: https://console.firebase.google.com/project/tourtrip-live-dev"
echo "- Redis: localhost:6379"
echo "- Development Dashboard: http://localhost:3000"
echo ""
echo "Important: You are now connected to LIVE Firebase services!"
echo "All data changes will be persistent and real."
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo "To access Firebase console: firebase open"