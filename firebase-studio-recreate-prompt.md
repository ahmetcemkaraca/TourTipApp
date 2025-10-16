# Firebase Studio Recreate Prompt for TourTrip.app

## Application Overview

TourTrip.app is a comprehensive mobile super application that connects tourists, locals, and activity seekers with service providers offering tours, trips, events, and activities. It serves as a platform for discovering, booking, and managing travel experiences across multiple platforms (Android, iOS, and web).

The app enables users to:
- Browse and search for tours, trips, and activities
- Book reservations with secure payment processing
- Leave reviews and ratings
- Manage user profiles and preferences
- Receive personalized recommendations
- Access real-time updates and notifications

Service providers can:
- List and manage their offerings
- Handle bookings and customer interactions
- Access analytics and insights
- Manage pricing and availability

## Technical Architecture

### Current Tech Stack
- **Frontend**: Kotlin Multiplatform (Android/iOS), Jetpack Compose (Android), SwiftUI (iOS), Next.js (Web)
- **Backend**: Firebase (Auth, Firestore, Functions, Storage, Analytics, Messaging, Crashlytics)
- **Shared Code**: Kotlin Multiplatform, Ktor, Kotlinx.serialization
- **Build System**: Gradle with Kotlin DSL
- **Deployment**: Docker, GitHub Actions

### Firebase Services Used
- **Authentication**: User registration, login, social auth
- **Firestore**: Real-time database for tours, bookings, users, reviews
- **Storage**: File uploads for images, documents
- **Functions**: Server-side logic for payments, notifications, data processing
- **Analytics**: User behavior tracking
- **Messaging**: Push notifications
- **Crashlytics**: Error reporting

## Detailed Feature Requirements

### User Features
1. **User Registration & Authentication**
   - Email/password registration
   - Social login (Google, Facebook)
   - Profile management
   - Password reset

2. **Tour/Activity Discovery**
   - Search by location, date, category, price
   - Filter by rating, duration, difficulty
   - Map-based discovery
   - Personalized recommendations

3. **Booking System**
   - Real-time availability checking
   - Secure payment processing (integrate with Stripe/PayPal)
   - Booking confirmation and management
   - Cancellation and refund policies

4. **Review & Rating System**
   - User reviews and ratings for tours/activities
   - Photo uploads with reviews
   - Review moderation

5. **User Dashboard**
   - Booking history
   - Wishlist/favorites
   - Notification preferences
   - Account settings

### Service Provider Features
1. **Provider Dashboard**
   - Tour/activity listing management
   - Pricing and availability management
   - Booking management
   - Customer communication

2. **Analytics Dashboard**
   - Booking statistics
   - Revenue tracking
   - Customer feedback analysis

### Admin Features
1. **Content Management**
   - Category management
   - Location management
   - User/provider moderation

2. **System Monitoring**
   - Performance metrics
   - Error tracking
   - Usage analytics

## Database Schema (Firestore)

### Collections
- `users` - User profiles
- `providers` - Service provider profiles
- `tours` - Tour/activity listings
- `bookings` - Reservation records
- `reviews` - User reviews
- `categories` - Tour categories
- `locations` - Geographic locations

### Key Data Models
- User: {id, email, name, profileImage, preferences, createdAt}
- Tour: {id, providerId, title, description, images, price, duration, location, category, availability, rating}
- Booking: {id, userId, tourId, date, participants, totalPrice, status, paymentId}

## API Requirements

### RESTful Endpoints (via Firebase Functions)
- `GET /tours` - List tours with filters
- `POST /bookings` - Create booking
- `GET /users/{id}/bookings` - User bookings
- `POST /reviews` - Submit review
- `GET /providers/{id}/tours` - Provider tours

## UI/UX Requirements

### Design System
- Material Design 3 (Android)
- Human Interface Guidelines (iOS)
- Modern web design with responsive layout
- Consistent branding and color scheme

### Key Screens
1. **Home/Dashboard** - Featured tours, search bar, categories
2. **Search Results** - List/grid view with filters
3. **Tour Details** - Images, description, reviews, booking form
4. **Booking Flow** - Date selection, participant details, payment
5. **User Profile** - Bookings, reviews, settings
6. **Provider Dashboard** - Tour management, analytics

## Security Requirements

- Input validation and sanitization
- Secure authentication flows
- Data encryption at rest and in transit
- GDPR compliance for user data
- Secure payment processing

## Performance Requirements

- Fast loading times (<2s for key screens)
- Offline capability for bookings
- Real-time updates for availability
- Scalable architecture for growing user base

## Integration Requirements

- Payment gateways (Stripe, PayPal)
- Maps integration (Google Maps)
- Social media sharing
- Email/SMS notifications

## Testing Requirements

- Unit tests for business logic
- Integration tests for Firebase services
- UI tests for critical flows
- End-to-end tests for booking flow

## Deployment Requirements

- CI/CD pipeline with automated testing
- Staging and production environments
- Rollback capabilities
- Monitoring and alerting

## Firebase Studio Recreate Instructions

Using Firebase Studio's App Prototyping agent (Gemini in Firebase), recreate this application as a modern web application with the following approach:

1. **Start with Core Features**: Begin with user authentication, basic tour listing, and booking functionality
2. **Use Templates**: Leverage Firebase Studio's Next.js template as the foundation
3. **Implement Firebase Integration**: Set up Firestore for data storage, Firebase Auth for authentication, and Storage for images
4. **Build Progressive Enhancement**: Start with MVP features, then add advanced functionality like reviews, provider dashboard, and analytics
5. **Ensure Responsive Design**: Make the web app mobile-friendly to complement the native apps
6. **Add AI Features**: Use Gemini assistance for code generation, bug fixing, and feature implementation
7. **Test Thoroughly**: Use Firebase Studio's built-in testing tools and emulators
8. **Deploy to Firebase**: Publish the web app using Firebase Hosting and App Hosting

Focus on creating a production-ready web version that can coexist with the existing mobile applications, providing a unified experience across platforms.