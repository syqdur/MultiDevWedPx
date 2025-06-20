# Wedding Gallery Application

## Overview

This is a modern multi-user SaaS wedding gallery platform that allows users to create their own event pages with Instagram-like experiences. Each user can register their own account and create separate galleries for sharing photos, videos, stories, and messages with their guests. The application features a React frontend with Express.js backend, using Supabase for authentication and database management, with Firebase integration for media storage.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context for local state
- **Data Fetching**: TanStack React Query for server state management

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Management**: In-memory storage with interface for database persistence
- **Development**: tsx for TypeScript execution in development
- **Production**: esbuild for optimized server bundles

### Data Storage Solutions
- **Primary Database**: Supabase PostgreSQL for user authentication and data storage
- **Authentication**: Supabase Auth with email/password registration and login
- **Media Storage**: Firebase Storage for images and videos (existing integration)
- **Fallback**: Demo authentication system when Supabase credentials not configured
- **Session Storage**: Memory-based with PostgreSQL migration path via connect-pg-simple

## Key Components

### Media Management
- Instagram-style photo and video gallery
- Real-time stories feature with 24-hour expiration
- Direct camera integration for photo/video capture
- Bulk media download functionality with ZIP export
- Comment and like system for social interaction

### User Management
- Multi-user SaaS platform with individual user accounts
- Supabase authentication with email/password registration and login
- User-specific galleries, timelines, and content with complete data separation
- Demo authentication fallback for testing when Supabase not configured
- Real-time user presence indicators

### Content Features
- Timeline creation for relationship milestones
- Editable text notes and messages
- Spotify integration for music wishlist functionality
- Dark/light mode support with user preference persistence

### External Integrations
- **Supabase**: Authentication and PostgreSQL database backend
- **Firebase**: Media storage for images and videos
- **Spotify API**: Music playlist management with PKCE OAuth flow

## Data Flow

### Media Upload Flow
1. User selects or captures media through React frontend
2. Files uploaded to Firebase Storage via client-side SDK
3. Metadata stored in Firestore with user attribution
4. Real-time updates propagated to all connected clients

### Real-time Features
- Firestore onSnapshot listeners for live data updates
- Stories with automatic expiration and view tracking
- Live user presence with heartbeat mechanism
- Comment and like real-time synchronization

### State Management
- React Query for server state caching and synchronization
- Local React state for UI interactions
- localStorage for user preferences and device identification
- Firebase real-time listeners for live data

## External Dependencies

### Firebase Services
- **Authentication**: Device-based identification (no traditional auth)
- **Firestore**: Real-time database for all application data
- **Storage**: Media file hosting with CDN capabilities

### Spotify Integration
- OAuth 2.0 with PKCE for secure authentication
- Playlist management and track search
- Real-time playlist synchronization

### Development Tools
- **Replit**: Primary development environment with auto-deployment
- **TypeScript**: Type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Development Environment
- Replit-based development with hot reloading
- Vite dev server for frontend with Express proxy
- Environment variables for API keys and configuration

### Production Build
- Vite build for optimized frontend assets
- esbuild for server-side bundle optimization
- Static file serving through Express in production

### Database Strategy
- Current: Firebase-first approach for rapid development
- Future: Migration path to PostgreSQL using Drizzle ORM
- Session management ready for PostgreSQL with connect-pg-simple

### Hosting Configuration
- Single-page application with client-side routing
- Express server handling API routes with /api prefix
- Static asset serving with proper caching headers

## Changelog
- June 20, 2025. Initial setup
- June 20, 2025. Transformed single-user wedding gallery into multi-user SaaS platform with Supabase authentication

## Recent Changes
- ✓ Migrated project from Bolt to Replit environment
- ✓ Implemented complete multi-user authentication system with Supabase
- ✓ Created user registration and login functionality
- ✓ Added demo authentication fallback for testing
- ✓ Transformed architecture for user-specific data separation
- ✓ Configured Supabase credentials and environment variables
- ✓ Implemented unified authentication interface supporting both Supabase and demo modes
- ✓ Fixed TypeScript compatibility issues across authentication contexts
- ✓ Completed multi-user SaaS transformation
- ✓ Implemented file upload system with local storage for immediate functionality
- ✓ Added support for images, videos, notes, and stories
- ✓ Created user-specific data persistence across sessions
- ✓ Fixed Firebase Storage authentication issues with client-side solution
- ✓ Implemented dynamic ProfileHeader component with editable bio and profile image upload
- ✓ Created UserProfilePage component for individual user galleries
- ✓ Added user-specific routing system (/user/:username)
- ✓ Implemented profile update functionality with localStorage persistence
- ✓ Preserved original kristinundmauro.de profile as fallback for non-authenticated users
- ✓ Added comprehensive multi-user features: individual galleries, timelines, and content separation

## User Preferences

Preferred communication style: Simple, everyday language.
Project Goal: Convert wedding gallery into multi-user SaaS platform where users can register and create separate event pages.