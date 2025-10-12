# GATE And Tech - Exam Preparation Platform

## Overview
GATE And Tech is a comprehensive exam preparation platform for GATE (Graduate Aptitude Test in Engineering) aspirants. It aims to provide a robust learning environment with features like full authentication, an extensive question bank, a realistic mock testing engine, detailed analytics, and community interaction. The platform is built with an Express + Vite + React stack and focuses on delivering a high-quality, secure, and user-friendly experience to help students excel in their GATE examinations.

## User Preferences
None set yet.

## System Architecture

### UI/UX Decisions
The platform features a clean, responsive design using `shadcn/ui` components and Tailwind CSS. The mock test engine is specifically designed to mimic the authentic GATE exam interface, including a color-coded question palette, real-time timer, and detailed instructions. Dashboards and analytics leverage `recharts` for clear data visualization. Role-switching capabilities are implemented for admins and moderators to manage content effectively.

### Technical Implementations
- **Authentication**: Implemented using Passport.js with local (email/password) and OAuth (Google, GitHub) strategies. Features include secure registration/login, session management, and role-based access control. Two-Factor Authentication (TOTP) is integrated for enhanced security. Password reset functionality uses cryptographically secure tokens with 1-hour expiry, email enumeration prevention, and dev-only console logging (production requires email service integration).
- **Question Bank Management**: Supports multiple question types (MCQ, MSQ, Numerical) with varying difficulty levels, rich content, explanations, and topic-based categorization. Access control ensures only authorized roles (admin/moderator) can manage the core question bank.
- **Mock Test Engine**: Provides an authentic GATE-style testing experience with real-time response persistence, automatic scoring (including negative marking), and a comprehensive exam summary. Numerical input handling includes debouncing to prevent race conditions.
- **Test Series & Purchase Model**: One-time purchase model with validity duration. Test series (collections of tests) can have tiers (free, premium, pro). Students purchase test series via Razorpay integration. Free tests (not in any test series) are accessible to all students. Purchased test series grant access until expiry date.
- **Tier-based Access Control**: Comprehensive access control system ensures students can only access free tests or tests from purchased test series with active status. Admin/moderator have full access to all tests. All test endpoints (`/api/tests`, `/api/tests/:id`, `/api/tests/:id/questions`, `/api/attempts`) enforce tier-based access control using the `userHasAccessToTest` helper function.
- **Analytics & Performance Tracking**: Offers detailed insights into user performance through an analytics dashboard. Metrics include overall performance, topic-wise accuracy, difficulty-wise performance, and score trends.
- **Discussion Forum**: A Q&A system allowing all authenticated users to create threads and post answers, fostering a community learning environment.

### Feature Specifications
- **User Management**: Role-based access control (student, moderator, admin).
- **Authentication**: Local, OAuth (Google, GitHub), 2FA/TOTP, password reset.
- **Question Management**: CRUD operations for questions, topics, difficulty, type, and status.
- **Test Management**: Test creation, scheduling, test series support, and attempt tracking.
- **Test Series Shop**: Browse and purchase test series with Razorpay integration, order verification, and persistent error handling.
- **My Purchases**: View purchased test series with status tracking (active/expired) and validity information.
- **Tier-based Access Control**: Students access free tests or purchased test series; admin/moderator access all content.
- **Performance Analytics**: Overall, topic-wise, difficulty-wise, and trend analysis.
- **Community**: Discussion forums/Q&A system.
- **Security**: Strict schema validation, role-based middleware, password hashing (bcrypt), secure session management, and tier-based access control.

### System Design Choices
- **Backend**: Node.js with Express.js for RESTful API services. Routes are modularized by domain for maintainability:
  - `server/routes/auth.routes.ts` - Authentication, OAuth, 2FA, password reset
  - `server/routes/user.routes.ts` - User profile management
  - `server/routes/topic.routes.ts` - Topic operations
  - `server/routes/question.routes.ts` - Question bank management
  - `server/routes/test.routes.ts` - Test and test attempt operations
  - `server/routes/payment.routes.ts` - Razorpay payment integration, order creation/verification, test series purchases
  - `server/routes/discussion.routes.ts` - Discussion forum
  - `server/routes/analytics.routes.ts` - Performance analytics
  - `server/routes/index.ts` - Route aggregator
- **Frontend**: React.js with Vite for a fast and reactive user interface.
- **Database**: PostgreSQL for robust data storage, managed with Drizzle ORM for type-safe interactions.
- **State Management**: React Context API for authentication, TanStack Query for data fetching and caching.
- **Routing**: Wouter for client-side navigation.

## External Dependencies

- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js (with `passport-google-oauth20`, `passport-github2`, `passport-local`)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Charting**: recharts
- **2FA**: speakeasy, qrcode
- **Hashing**: bcrypt