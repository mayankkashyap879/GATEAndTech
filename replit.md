# GATE And Tech - Exam Preparation Platform

## Project Overview
GATE And Tech is a comprehensive exam preparation platform for GATE (Graduate Aptitude Test in Engineering) aspirants. Built with Express + Vite + React stack, featuring full authentication, question bank management, mock testing engine, analytics, and community features.

## Recent Changes (October 11, 2025)

### Database & Schema Setup
- Created comprehensive PostgreSQL database schema with Drizzle ORM
- Implemented tables for: users, sessions, questions, topics, tests, test attempts, subscriptions, discussions, notifications
- Added role-based access control (student, moderator, admin)
- Set up storage layer with full CRUD operations for all entities

### Authentication System
- Implemented Passport.js authentication with local strategy (email/password)
- Added session management with express-session
- Created secure user registration and login flows with bcrypt password hashing
- Built authentication context (AuthProvider) for React frontend
- Developed Login, Register, and Dashboard pages with proper routing
- Updated Navbar with user menu and authentication state display
- Added role-based middleware for API route protection

### API Routes
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/logout` - User logout
- `/api/auth/me` - Get current user
- `/api/users/:id` - User profile management
- `/api/topics` - Topic management
- `/api/questions` - Question CRUD with filtering
- `/api/tests` - Test management with pro tier support
- `/api/attempts` - Test attempt tracking
- `/api/discussions` - Community discussion forums

## Project Architecture

### Backend (Express + TypeScript)
- **server/index.ts**: Main server setup with session middleware
- **server/auth.ts**: Passport.js configuration and auth middleware
- **server/routes.ts**: API route definitions
- **server/storage.ts**: DatabaseStorage implementation with Drizzle ORM
- **server/db.ts**: Database connection setup

### Frontend (React + Vite)
- **client/src/App.tsx**: Main app with routing
- **client/src/contexts/AuthContext.tsx**: Authentication state management
- **client/src/pages/**: Page components (Landing, Login, Register, Dashboard)
- **client/src/components/**: Reusable UI components (Navbar, etc.)

### Database Schema
- Users with role-based access (student, moderator, admin)
- Questions with topics, difficulty levels, and multiple types (MCQ, numerical)
- Tests with scheduling, pro tier support, and question management
- Test attempts with response tracking and analytics
- Subscriptions for Pro plan management
- Discussion threads and posts for community features
- Notifications system

## Tech Stack
- **Backend**: Express, TypeScript, Passport.js, bcrypt
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **Frontend**: React, Vite, Wouter (routing), TanStack Query
- **UI**: shadcn/ui components, Tailwind CSS
- **Auth**: Passport.js with local strategy, sessions

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `PORT`: Server port (default: 5000)

## User Preferences
None set yet.

## Next Steps
1. Build question bank management UI (admin panel)
2. Implement mock test engine with GATE-style interface
3. Create analytics and performance tracking
4. Add payment integration with Razorpay
5. Build community features UI
6. Add email notifications
7. Implement 2FA for enhanced security
