# GATE And Tech 🎓

> Comprehensive GATE exam preparation platform with realistic test environment, analytics, and community features.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)](https://www.postgresql.org/)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### For Students
- 🎯 **Realistic GATE-like Test Interface** - Section-wise tests with timer, calculator, and question palette
- 📊 **Comprehensive Analytics** - Percentile ranking, topic-wise performance, and weak area identification
- 💳 **Flexible Pricing** - Free tests and premium test series with secure payment processing
- 🏆 **Gamification** - Points, badges, streaks, and leaderboards to stay motivated
- 💬 **Community Discussions** - Ask questions, share explanations, and learn collaboratively
- 📱 **Responsive Design** - Seamless experience across desktop, tablet, and mobile

### For Moderators
- ✏️ **Rich Question Editor** - LaTeX support, image uploads, and markdown formatting
- 📚 **Question Bank Management** - Organize by subjects, topics, and difficulty levels
- 🔄 **Version Control** - Track changes, view diffs, and revert to previous versions
- 📥 **Bulk Import** - CSV and QTI question import with validation and error handling
- 📈 **Analytics Dashboard** - Test performance insights and question difficulty analysis
- 🎨 **Test Builder** - Create section-wise tests with custom timing and scoring rules

### For Administrators
- 👥 **User Management** - Role assignment, access control, and activity monitoring
- 🔐 **RBAC System** - Fine-grained permissions with CASL ability-based access control
- 💰 **Payment Management** - Coupons, refunds, invoices, and revenue reports
- 📊 **System Analytics** - User activity, revenue trends, and platform health metrics
- 🔍 **Audit Logs** - Complete history of changes with before/after diffs
- 📧 **Notification System** - Email and in-app notifications with scheduling

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with RESTful API design
- **Database**: PostgreSQL 14+ with Drizzle ORM
- **Authentication**: Passport.js (Local, Google OAuth, GitHub OAuth)
- **Authorization**: CASL (attribute-based access control)
- **Caching & Queues**: Redis + BullMQ (optional, graceful degradation)
- **Email**: Nodemailer with SMTP (console fallback)
- **Payments**: Razorpay integration
- **File Storage**: DigitalOcean Spaces / AWS S3 compatible

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (lightweight)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Markdown**: react-markdown with LaTeX support (KaTeX)

### DevOps & Monitoring
- **Error Tracking**: Sentry (optional)
- **Analytics**: PostHog (optional)
- **Logging**: Pino
- **Process Manager**: PM2 (production)
- **Containerization**: Docker support

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))
- **Redis** (optional, recommended for production) ([Download](https://redis.io/download/))
- **Git** ([Download](https://git-scm.com/))
- **npm** or **pnpm** (comes with Node.js)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gateandtech.git
cd gateandtech
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Generate a secure session secret
npm run generate-secret

# Edit .env and update with your configuration
```

### 4. Set Up Database

```bash
# Create PostgreSQL database
createdb gateandtech_dev

# Or using psql
psql -U postgres -c "CREATE DATABASE gateandtech_dev;"

# Push schema to database
npm run db:push

# (Optional) Seed with sample data
npm run seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

🎉 **You're all set!** The app is now running with:
- Backend API at `http://localhost:5000/api`
- Frontend at `http://localhost:5000`
- API docs at `http://localhost:5000/api/docs` (if configured)

## ⚙️ Environment Configuration

See [.env.example](.env.example) for a comprehensive list of configuration options.

### Required Variables

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/gateandtech_dev?sslmode=disable"
SESSION_SECRET="your-32-character-minimum-secret-here"
```

### Optional but Recommended

```env
# Redis (for caching and background jobs)
REDIS_URL="redis://localhost:6379"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Razorpay (for payments)
RAZORPAY_KEY_ID="your-key-id"
RAZORPAY_KEY_SECRET="your-key-secret"
```

## 🗄️ Database Setup

### Using Docker (Recommended for Development)

```bash
# Start PostgreSQL
docker run -d \
  --name gateandtech-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=gateandtech_dev \
  -p 5432:5432 \
  postgres:14

# Start Redis (optional)
docker run -d \
  --name gateandtech-redis \
  -p 6379:6379 \
  redis:7
```

### Manual Setup

1. **Install PostgreSQL** from [postgresql.org](https://www.postgresql.org/download/)
2. **Create database**:
   ```bash
   createdb gateandtech_dev
   ```
3. **Apply schema**:
   ```bash
   npm run db:push
   ```

### Database Management

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (GUI)
npm run db:studio

# Push schema changes (dev only)
npm run db:push
```

## 💻 Development

### Running the Development Server

```bash
npm run dev
```

This starts both the backend (Express) and frontend (Vite) in watch mode.

### Type Checking

```bash
npm run check
```

### Code Quality

```bash
# Lint (to be configured)
npm run lint

# Format (to be configured)
npm run format
```

### Database Migrations

```bash
# Make schema changes in shared/schema.ts, then:
npm run db:generate  # Generate migration SQL
npm run db:migrate   # Apply to database
```

## 🚀 Production Deployment

### Building for Production

```bash
npm run build
```

This creates:
- Frontend build in `dist/public/`
- Backend bundle in `dist/index.js`

### Starting Production Server

```bash
npm start
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `SESSION_SECRET` (32+ characters)
- [ ] Enable SSL for `DATABASE_URL` (sslmode=require)
- [ ] Use encrypted Redis connection (rediss://)
- [ ] Configure SMTP with verified domain
- [ ] Set up OAuth callback URLs with production domain
- [ ] Enable Sentry for error tracking
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Configure CDN for static assets

### Deployment Options

#### DigitalOcean App Platform

1. Connect your Git repository
2. Set environment variables
3. Configure build command: `npm run build`
4. Configure run command: `npm start`

#### Docker

```bash
# Build image
docker build -t gateandtech .

# Run container
docker run -d \
  -p 5000:5000 \
  --env-file .env \
  gateandtech
```

#### PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name gateandtech

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

## 📁 Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── test/         # Test player components
│   │   │   └── dashboard/    # Dashboard components
│   │   ├── pages/            # Route pages
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   └── App.tsx           # Main app component
│   └── index.html
│
├── server/                    # Backend Express application
│   ├── routes/               # API route handlers
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── question.routes.ts
│   │   ├── test.routes.ts
│   │   └── ...
│   ├── storage/              # Data access layer
│   │   ├── user.storage.ts
│   │   ├── question.storage.ts
│   │   └── index.ts
│   ├── workers/              # Background job workers
│   │   ├── test-scoring.worker.ts
│   │   └── analytics.worker.ts
│   ├── casl/                 # Permission definitions
│   ├── middleware/           # Express middleware
│   ├── migrations/           # Database migrations
│   ├── auth.ts               # Passport configuration
│   ├── db.ts                 # Database connection
│   ├── queue.ts              # BullMQ setup
│   ├── redis.ts              # Redis client
│   ├── email.ts              # Email service
│   ├── swagger.ts            # API documentation
│   └── index.ts              # Server entry point
│
├── shared/                    # Shared code between client and server
│   └── schema.ts             # Drizzle schema + types
│
├── migrations/               # Generated SQL migrations
├── .env.example              # Environment variables template
├── drizzle.config.ts         # Drizzle ORM configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 📚 API Documentation

API documentation is available at `/api/docs` when the server is running (requires swagger-ui-express).

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA code

#### Tests
- `GET /api/tests` - List available tests
- `GET /api/tests/:id` - Get test details
- `POST /api/attempts` - Start test attempt
- `POST /api/attempts/:id/responses` - Save responses (autosave)
- `PATCH /api/attempts/:id/submit` - Submit test
- `GET /api/attempts/:id/results` - Get results

#### Questions
- `GET /api/questions` - List questions (filtered)
- `POST /api/questions` - Create question (moderator)
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

For complete API documentation, visit `/api/docs` in your browser.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (if using Docker)
docker start gateandtech-postgres

# Verify DATABASE_URL in .env
```

### Redis Connection Issues

**Problem**: `Error: Redis connection failed`

**Solution**:
- Redis is optional - the app will work without it
- Start Redis: `docker start gateandtech-redis`
- Or remove `REDIS_URL` from .env to disable caching

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Kill process using port 5000
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Linux/Mac:
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=3000 npm run dev
```

### OAuth Redirect URI Mismatch

**Problem**: `Error: redirect_uri_mismatch`

**Solution**:
- Update OAuth provider settings with correct callback URL
- Google: `{APP_URL}/api/auth/google/callback`
- GitHub: `{APP_URL}/api/auth/github/callback`
- Ensure `APP_URL` in .env matches your domain

### Email Not Sending

**Problem**: Emails not being sent

**Solution**:
- Emails are logged to console by default if SMTP not configured
- For Gmail: Enable 2FA and use App Password
- Check `SMTP_*` variables in .env
- Test SMTP connection: `telnet smtp.gmail.com 587`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)
- LaTeX rendering via [KaTeX](https://katex.org/)

## 📧 Support

- 📧 Email: support@gateandtech.com
- 💬 Discord: [Join our community](https://discord.gg/gateandtech)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/gateandtech/issues)
- 📖 Docs: [Documentation](https://docs.gateandtech.com)

---

Made with ❤️ for GATE aspirants
