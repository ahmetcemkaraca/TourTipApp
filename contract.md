# TourTipp Backend API Contract

This document outlines the API contract for the TourTipp backend.

## Data Models

### User

Represents a user of the application.

- `id`: string (unique identifier)
- `name`: string
- `email`: string (unique)
- `password`: string (hashed)
- `roles`: Array<string> (e.g., 'user', 'provider', 'admin')
- `createdAt`: ISO 8601 Date
- `updatedAt`: ISO 8601 Date

### Tour

Represents a tour available for booking.

- `id`: string (unique identifier)
- `providerId`: string (ID of the user who is the tour provider)
- `title`: string
- `description`: string
- `images`: Array<string> (URLs to images)
- `location`: string
- `price`: number
- `duration`: number (in hours)
- `availability`: Array<{ date: ISO 8601 Date, slots: number }>
- `createdAt`: ISO 8601 Date
- `updatedAt`: ISO 8601 Date

### Booking

Represents a booking made by a user for a tour.

- `id`: string (unique identifier)
- `userId`: string (ID of the user who made the booking)
- `tourId`: string (ID of the tour being booked)
- `date`: ISO 8601 Date (yyyy-mm-dd)
- `participants`: number
- `totalPrice`: number
- `status`: string ('confirmed', 'pending', 'cancelled')
- `createdAt`: ISO 8601 Date
- `updatedAt`: ISO 8601 Date

### Review

Represents a review left by a user for a tour.

- `id`: string (unique identifier)
- `userId`: string (ID of the user who left the review)
- `tourId`: string (ID of the tour being reviewed)
- `rating`: number (1-5)
- `comment`: string
- `createdAt`: ISO 8601 Date
- `updatedAt`: ISO 8601 Date

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user.
  - **Request Body:** `{ "name": "...", "email": "...", "password": "..." }`
  - **Response:** `{ "token": "...", "user": { ... } }`
- `POST /api/auth/login`: Log in a user.
  - **Request Body:** `{ "email": "...", "password": "..." }`
  - **Response:** `{ "token": "...", "user": { ... } }`

### Users

- `GET /api/users`: Get a list of users. (Admin only)
- `GET /api/users/{id}`: Get a single user by ID.
- `PUT /api/users/{id}`: Update a user's profile.
  - **Request Body:** `{ "name": "...", "email": "..." }`
- `GET /api/users/{id}/bookings`: Get all bookings for a user.

### Tours

- `GET /api/tours`: Get a list of all tours.
  - **Query Params:** `search`, `category`, `minPrice`, `maxPrice`, `date`
- `GET /api/tours/{id}`: Get a single tour by ID.
- `POST /api/tours`: Create a new tour. (Provider only)
- `PUT /api/tours/{id}`: Update a tour. (Provider only)
- `DELETE /api/tours/{id}`: Delete a tour. (Provider only)
- `GET /api/tours/{id}/reviews`: Get all reviews for a tour.
- `POST /api/tours/{id}/reviews`: Create a new review for a tour.
  - **Request Body:** `{ "rating": 5, "comment": "..." }`

### Bookings

- `POST /api/bookings`: Create a new booking.
  - **Request Body:** `{ "tourId": "...", "date": "...", "participants": 2 }`
- `GET /api/bookings/{id}`: Get a single booking by ID.
- `PUT /api/bookings/{id}`: Update a booking (e.g., cancel).
  - **Request Body:** `{ "status": "cancelled" }`
