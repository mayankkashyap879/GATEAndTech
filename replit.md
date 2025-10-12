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
- **CASL Permission System**: Dynamic, granular permission management using @casl/ability. Admins can create custom roles, assign specific permissions (create, read, update, delete) to roles, and track all changes via audit logs. System roles (student, moderator, admin) are protected from modification. Permissions cover all major resources (Question, Test, Topic, User, Role, Permission, Discussion, TestSeries, Analytics, AuditLog). Fallback role-based logic ensures backward compatibility. Admin UI at `/admin/roles` provides comprehensive role and permission management.
- **Question Bank Management**: Supports multiple question types (MCQ, MSQ, Numerical) with varying difficulty levels, rich content, explanations, and topic-based categorization. Access control enforced via CASL permissions (create:Question, read:Question, update:Question, delete:Question).
- **Mock Test Engine**: Provides an authentic GATE-style testing experience with real-time response persistence, automatic scoring (including negative marking), and a comprehensive exam summary. Numerical input handling includes debouncing to prevent race conditions.
- **Test Series & Purchase Model**: One-time purchase model with validity duration. Test series (collections of tests) can have tiers (free, premium, pro). Students purchase test series via Razorpay integration. Free tests (not in any test series) are accessible to all students. Purchased test series grant access until expiry date.
- **Tier-based Access Control**: Multi-layer access control system. First layer: CASL permission checks (read:Test, create:Test, update:Test, delete:Test). Second layer: purchase-based access control ensures students can only access free tests or tests from purchased test series with active status. Admin/moderator have full access to all tests via CASL permissions.
- **Analytics & Performance Tracking**: Offers detailed insights into user performance through an analytics dashboard. Metrics include overall performance, topic-wise accuracy, difficulty-wise performance, and score trends.
- **Discussion Forum**: A Q&A system allowing all authenticated users to create threads and post answers, fostering a community learning environment.

### Feature Specifications
- **User Management**: Dynamic role-based access control with CASL. Admins can create custom roles and assign granular permissions.
- **Permission Management**: Create, read, update, delete permissions for all resources. System roles (student, moderator, admin) are immutable. Audit logging tracks all permission changes.
- **Authentication**: Local, OAuth (Google, GitHub), 2FA/TOTP, password reset.
- **Question Management**: CRUD operations for questions, topics, difficulty, type, and status. Protected by CASL permissions.
- **Test Management**: Test creation, scheduling, test series support, and attempt tracking. Protected by CASL permissions with additional purchase-based access control.
- **Test Series Shop**: Browse and purchase test series with Razorpay integration, order verification, and persistent error handling.
- **My Purchases**: View purchased test series with status tracking (active/expired) and validity information.
- **Tier-based Access Control**: Multi-layer: CASL permission checks + purchase-based access for students.
- **Performance Analytics**: Overall, topic-wise, difficulty-wise, and trend analysis.
- **Community**: Discussion forums/Q&A system.
- **Security**: CASL permission system, strict schema validation, password hashing (bcrypt), secure session management, audit logging, and system role protection.

### System Design Choices
- **Backend**: Node.js with Express.js for RESTful API services. Routes are modularized by domain for maintainability:
  - `server/routes/auth.routes.ts` - Authentication, OAuth, 2FA, password reset
  - `server/routes/user.routes.ts` - User profile management
  - `server/routes/topic.routes.ts` - Topic operations (CASL protected)
  - `server/routes/question.routes.ts` - Question bank management (CASL protected)
  - `server/routes/test.routes.ts` - Test and test attempt operations (CASL protected with purchase-based access)
  - `server/routes/role.routes.ts` - Role and permission management (CASL admin UI backend)
  - `server/routes/payment.routes.ts` - Razorpay payment integration, order creation/verification, test series purchases
  - `server/routes/discussion.routes.ts` - Discussion forum
  - `server/routes/analytics.routes.ts` - Performance analytics
  - `server/routes/index.ts` - Route aggregator
  - `server/casl/abilities.ts` - CASL ability definitions and permission logic
  - `server/middleware/permissions.ts` - CASL permission middleware (can/canAny/canAll)
- **Storage Layer**: Modularized data access layer for better maintainability:
  - `server/storage/user.storage.ts` (175 lines) - User, session, and authentication token operations
  - `server/storage/question.storage.ts` (126 lines) - Question and topic CRUD operations
  - `server/storage/test.storage.ts` (163 lines) - Test, attempt, and response management
  - `server/storage/payment.storage.ts` (206 lines) - Test series, purchases, and transaction operations
  - `server/storage/discussion.storage.ts` (298 lines) - Discussion threads, posts, and analytics
  - `server/storage/role.storage.ts` - Role, permission, role-permission assignment, and audit log operations
  - `server/storage/index.ts` (483 lines) - Main aggregator maintaining IStorage interface for backward compatibility
- **Frontend**: React.js with Vite for a fast and reactive user interface. Large components have been refactored for maintainability:
  - `client/src/pages/TakeTest.tsx` (549 lines) - Main test taking logic, state management, and API integration
  - `client/src/pages/RoleManagement.tsx` - CASL admin UI for role and permission management (admin only)
  - `client/src/components/test/QuestionPalette.tsx` (152 lines) - Question navigation sidebar with status indicators
  - `client/src/components/test/TestInstructions.tsx` (123 lines) - Pre-test instructions and rules
  - `client/src/components/test/TestSummary.tsx` (143 lines) - Pre-submission summary view
  - `client/src/components/test/CalculatorDialog.tsx` (31 lines) - Calculator popup component
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