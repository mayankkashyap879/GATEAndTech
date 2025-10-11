# GATE And Tech - Exam Preparation Platform

## Project Overview
GATE And Tech is a comprehensive exam preparation platform for GATE (Graduate Aptitude Test in Engineering) aspirants. Built with Express + Vite + React stack, featuring full authentication, question bank management, mock testing engine, analytics, and community features.

## Recent Changes (October 11, 2025)

### Database & Schema Setup
- Created comprehensive PostgreSQL database schema with Drizzle ORM
- Implemented tables for: users, sessions, questions, topics, tests, test attempts, subscriptions, discussions, notifications
- Added role-based access control (student, moderator, admin)
- Set up storage layer with full CRUD operations for all entities

### Authentication System (✅ Completed & Security Hardened)
- Implemented Passport.js authentication with local strategy (email/password)
- Added session management with express-session
- Created secure user registration and login flows with bcrypt password hashing
- Built authentication context (AuthProvider) for React frontend
- Developed Login, Register, and Dashboard pages with proper routing
- Updated Navbar with user menu and authentication state display
- Added role-based middleware for API route protection
- **Security Fix**: Implemented strict schema validation to prevent privilege escalation
  - Created `registerUserSchema` that only accepts name, email, password
  - Server-controlled defaults for role, authProvider, currentPlan
  - Separate validation schemas for regular users vs admins (`updateUserProfileSchema` vs `adminUpdateUserSchema`)
  - Prevents users from self-assigning admin role or pro plan

### Question Bank Management (✅ Completed)
- Built comprehensive question management system for GATE exam preparation
- Created Questions page with filtering by topic, difficulty, and type
- Implemented QuestionForm for creating/editing questions (admin/moderator only)
- Added QuestionDetail page showing full question with options and explanations
- Features:
  - Support for multiple question types: MCQ (single), MSQ (multiple), Numerical
  - Difficulty levels: Easy, Medium, Hard
  - Rich question content with optional images
  - Detailed explanations for answers
  - Topic-based categorization
  - Marks and negative marking configuration
  - Publish/draft status control
- Admin/moderator-only question creation and editing with proper access control
- Integrated question management into navigation menu
- Fixed topic filtering bug by properly joining questionTopics table

### Mock Test Engine (✅ Completed & Redesigned to Match GATE UI)
- Built authentic GATE-style exam interface with real-time response persistence
- **Backend API Routes**:
  - Test CRUD operations (create, read, update, delete)
  - Test attempt management with score calculation
  - Response upsert logic to handle answer changes without duplicates
  - Automatic score calculation with negative marking support
- **Test Creation & Management**:
  - Admin/moderator test creation form with question selection
  - Test editing capabilities with duration and marks configuration
  - Pro tier support for premium tests
  - Scheduling with start/end dates
- **Tests Browse Page**:
  - List all available tests with filtering (free/pro, active/upcoming/past)
  - Test card display with metadata (questions, duration, marks)
  - Start test functionality for students
- **GATE-Style Test Interface** (Redesigned):
  - **Instructions Page**: Detailed exam instructions, user info, test metadata, "I am ready to begin" button
  - **Blue Header**: Test title, timer, calculator button, instructions button
  - **Question Display**: Clean question area with marks display, question content, image support
  - **Answer Inputs**: Radio for MCQ single, Checkbox for MCQ multiple, Input for numerical
  - **Question Palette** (Right sidebar):
    - Color-coded status buttons (4-column grid)
    - 6 states: Current (Blue), Answered (Green), Not Answered (Red), Marked (Purple), Answered & Marked (Dark Purple), Not Visited (Gray)
    - Legend explaining all statuses
    - Live statistics card
  - **Action Buttons**: Mark for Review & Next, Clear Response, Save & Next, Submit
  - **Exam Summary Page**: Section-wise statistics table before final submission
  - **Calculator Dialog**: Placeholder for scientific calculator
- **Test Results Page**:
  - Detailed score display with percentage and performance metrics
  - Question-by-question review with correct answers
  - Performance analytics (correct, incorrect, unanswered counts)
  - Explanations for all questions
- **Critical Bug Fixes**:
  - Fixed response persistence during test-taking
  - Implemented upsert pattern to prevent duplicate responses
  - Added proper handling for cleared/empty answers (treated as unanswered)
  - Accurate score calculation with negative marking only for incorrect attempts
  - Implemented visited question tracking for accurate status display
  - Fixed question status priority (Marked shows purple before Not Answered red)
  - Fixed mark-for-review persistence (corrected inverted logic)
  - Corrected summary statistics to include all questions

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
  - Authentication: /, /login, /register, /dashboard
  - Questions: /questions, /questions/:id, /questions/:id/edit, /questions/new
  - Tests: /tests, /tests/new, /tests/:id/edit, /tests/:id/take, /tests/:id/results
- **client/src/contexts/AuthContext.tsx**: Authentication state management
- **client/src/pages/**: Page components
  - Landing, Login, Register, Dashboard
  - Questions, QuestionDetail, QuestionForm (question management)
  - Tests, TestForm, TakeTest, TestResults (mock test engine)
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
1. ✅ ~~Build question bank management UI (admin panel)~~ - Completed
2. ✅ ~~Build mock test engine with GATE-style interface~~ - Completed
3. Create analytics and performance tracking
4. Add payment integration with Razorpay
5. Build community features UI
6. Add email notifications
7. Implement 2FA for enhanced security
8. Add topic management UI for admins/moderators
9. Implement question import/export functionality
10. Add bulk question upload from CSV/Excel
