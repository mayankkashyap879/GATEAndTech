# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
- **Start dev server**: `npm run dev`
  - Runs Express backend and Vite frontend concurrently on port 5000
  - Backend uses tsx watch mode for hot reload
  
### Building & Production
- **Build for production**: `npm run build`
  - Builds frontend with Vite → `dist/public/`
  - Bundles backend with esbuild → `dist/index.js`
- **Start production server**: `npm start`
  - Runs compiled code from `dist/`

### Database
- **Push schema changes**: `npm run db:push`
  - Applies Drizzle schema changes to PostgreSQL
  - Schema defined in `shared/schema.ts`
  - Configuration in `drizzle.config.ts`

### Type Checking
- **Type check entire codebase**: `npm run check`
  - Runs TypeScript compiler in noEmit mode
  - Checks client, server, and shared code

## Architecture Overview

### Tech Stack
- **Backend**: Express.js (Node.js) serving RESTful APIs
- **Frontend**: React + Vite with wouter for routing
- **Database**: PostgreSQL with Drizzle ORM
- **Session**: PostgreSQL-backed sessions (connect-pg-simple)
- **Auth**: Passport.js (local + OAuth: Google, GitHub) with optional 2FA/TOTP
- **Caching/Queues**: Redis + BullMQ (optional, gracefully degrades if unavailable)
- **Payments**: Razorpay integration
- **UI**: shadcn/ui components + Tailwind CSS
- **State**: React Context for auth, TanStack Query for data fetching

### Directory Structure
```
client/
  src/
    components/    # UI components including shadcn/ui
    pages/         # Route pages
    contexts/      # React contexts (Auth, ViewAsRole)
    hooks/         # Custom React hooks
    lib/           # Utilities and query client
    
server/
  routes/          # API route handlers by domain
  storage/         # Data access layer (modularized)
  casl/            # Permission/ability definitions
  middleware/      # Express middleware (auth, permissions)
  workers/         # BullMQ background workers
  migrations/      # Database migrations
  *.ts             # Core server modules (auth, db, queue, redis, email, storage)
  
shared/
  schema.ts        # Drizzle schema + types (single source of truth)
```

### Monorepo Structure
This is a full-stack monorepo with shared types:
- **Client imports**: Use `@/` for client code, `@shared/` for shared types
- **Server imports**: Use `@shared/` for shared types, relative for server code
- **Shared schema**: All database tables, types, and Zod schemas in `shared/schema.ts`

### Authentication & Authorization
- **Authentication**: Passport.js handles login strategies (local, Google, GitHub)
  - Session serialization/deserialization in `server/auth.ts`
  - Auth routes in `server/routes/auth.routes.ts`
- **Authorization**: Two-layer system:
  1. **CASL (permissions)**: Fine-grained ability-based access control
     - Abilities defined in `server/casl/abilities.ts`
     - Middleware in `server/middleware/permissions.ts` (`can`, `canAny`, `canAll`)
     - Supports custom roles with dynamic permission assignment
     - Actions: create, read, update, delete, publish, manage, assign, revoke, export, moderate
     - Subjects: Question, Test, Topic, User, Role, Permission, Analytics, Discussion, TestSeries, Payment, AuditLog
  2. **Purchase-based access**: Students need active purchases to access paid test series
     - Access checks in `server/storage/payment.storage.ts`
     - Enforced in test routes for students

### Storage Layer Pattern
- **Modularized storage**: `server/storage/` contains domain-specific storage modules
  - `user.storage.ts`: User, session, auth tokens
  - `question.storage.ts`: Questions, topics, subjects
  - `test.storage.ts`: Tests, attempts, responses
  - `payment.storage.ts`: Test series, purchases, transactions
  - `discussion.storage.ts`: Forums, threads, posts
  - `role.storage.ts`: Roles, permissions, audit logs
- **Aggregator**: `server/storage/index.ts` exports unified `storage` object
- **Pattern**: Use `storage.methodName()` throughout the application
- When adding new data operations, add to appropriate storage module and re-export from index

### Route Organization
Routes are modularized by domain in `server/routes/`:
- `auth.routes.ts`: Login, register, OAuth callbacks, 2FA, password reset
- `user.routes.ts`: Profile management
- `topic.routes.ts`: Subject/topic operations (CASL protected)
- `question.routes.ts`: Question bank CRUD (CASL protected)
- `test.routes.ts`: Tests, attempts, submissions (CASL + purchase protected)
- `role.routes.ts`: Role/permission management (admin only)
- `payment.routes.ts`: Razorpay orders, verification, purchases
- `discussion.routes.ts`: Forum threads and posts
- `analytics.routes.ts`: Performance metrics
- `health.routes.ts`: Health check endpoints

All routes registered in `server/routes/index.ts`

### Background Jobs (Optional)
- **Redis + BullMQ**: Used for async processing when available
- **Graceful degradation**: If Redis unavailable, processes synchronously
- **Workers**: 
  - `server/workers/test-scoring.worker.ts`: Scores submitted tests
  - `server/workers/analytics.worker.ts`: Updates analytics caches
- **Queue helpers**: `server/queue.ts` exports `queueHelpers` for job enqueueing

### Database Schema
- **Single source of truth**: `shared/schema.ts`
- **Key entities**:
  - Users with role-based access (student, moderator, admin)
  - Questions (mcq_single, mcq_multiple, numerical) with topics and difficulty
  - Tests with questions and student attempts
  - Test series (collections of tests) with purchases
  - Discussion threads and posts
  - Transactions (Razorpay payments)
  - Roles, permissions, and audit logs
- **Indexes**: 44 composite indexes optimized for high-concurrency queries
- **Relations**: Drizzle relations defined for ORM convenience

### State Management (Frontend)
- **AuthContext**: Current user, authentication state
- **ViewAsRoleContext**: Admin/moderator role switching for testing
- **TanStack Query**: API data fetching, caching, mutations
  - Query client configured in `client/src/lib/queryClient.ts`

## Key Patterns & Conventions

### Adding a New Feature
1. **Define schema**: Add/modify tables in `shared/schema.ts`
2. **Push schema**: Run `npm run db:push`
3. **Create storage methods**: Add data access methods to appropriate `server/storage/*.storage.ts`
4. **Create routes**: Add API endpoints in `server/routes/*.routes.ts`
5. **Add CASL permissions**: Define abilities in `server/casl/abilities.ts` if needed
6. **Create UI**: Add pages to `client/src/pages/` and components to `client/src/components/`
7. **Update routing**: Add routes in `client/src/App.tsx`

### Permission Checks
Use CASL middleware in routes:
```typescript
import { can } from '../middleware/permissions';

app.get('/api/questions', requireAuth, can('read', 'Question'), async (req, res) => {
  // handler
});
```

For complex checks, use `canAny` or `canAll` middleware.

### API Response Patterns
- Success: `res.json({ data: ... })` or just `res.json(...)`
- Error: `res.status(4xx/5xx).json({ error: 'message' })`
- Validation: Use Zod schemas from `shared/schema.ts`

### Component Organization
- **Pages**: Top-level route components in `client/src/pages/`
- **Shared components**: Reusable UI in `client/src/components/`
- **Domain components**: Group by feature (e.g., `components/test/` for test-related components)

## Environment Setup

### Required Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SESSION_SECRET`: Random string for session encryption (required)

### Optional Environment Variables
- `REDIS_URL`: Redis connection for caching/queues (supports `redis://` and `rediss://`)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`: Payment integration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: GitHub OAuth
- `SMTP_*`: Email service configuration (falls back to console logging)
- `APP_URL`: Application URL for email links (default: `http://localhost:5000`)

## Design Guidelines

Refer to `design_guidelines.md` for detailed UI/UX specifications including:
- Dark theme with emerald green accents
- Typography (Inter, Plus Jakarta Sans)
- Component patterns (navigation, cards, forms)
- Responsive breakpoints
- Animation/interaction standards

## Important Notes

- **Port**: Always use port 5000 (or `PORT` env var), other ports are firewalled
- **Trust proxy**: Configured for rate limiting behind reverse proxies (Replit)
- **Security**: Passwords hashed with bcrypt, sessions in PostgreSQL, CSRF protection via sameSite cookies
- **Testing**: Realistic GATE exam interface with timer, question palette, and auto-save
- **Access control**: Multi-layer (CASL permissions + purchase-based access for students)
- **Graceful degradation**: Redis/BullMQ optional, system works without them
