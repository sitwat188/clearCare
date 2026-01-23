# ClearCare+ 

**Post-Visit Care & Follow-Up Compliance Platform**

[![HIPAA Compliant](https://img.shields.io/badge/HIPAA-Compliant-green.svg)](https://www.hhs.gov/hipaa)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)

## Overview

ClearCare+ is a HIPAA-compliant web application designed to manage post-visit care instructions, patient acknowledgment, and follow-up compliance in outpatient healthcare settings. The platform ensures that patients clearly receive, understand, and act upon provider instructions after a visit, while giving providers and administrators verifiable audit evidence of instruction delivery, access, and acknowledgment.

### Key Features

- ✅ **HIPAA-Compliant**: Full adherence to HIPAA regulations for PHI handling
- 🔐 **OAuth 2.0 + OpenID Connect**: Secure authentication with PKCE
- 👥 **Role-Based Access Control**: Granular permissions for Patients, Providers, Administrators
- 📋 **Care Instruction Management**: Create, assign, and track post-visit instructions
- ✅ **Patient Acknowledgment System**: Track patient receipt and understanding of instructions
- 📊 **Compliance Tracking**: Monitor medication adherence, appointment attendance, and lifestyle compliance
- 📝 **Immutable Audit Trail**: Complete, tamper-evident logging of all PHI access
- 📈 **Compliance Reporting**: Generate reports for regulatory compliance

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **Routing**: React Router v6
- **UI Framework**: Material-UI or Ant Design
- **Form Management**: React Hook Form + Yup
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### Backend
- **Framework**: NestJS (Node.js) with TypeScript
- **Database**: PostgreSQL (primary), Redis (caching/sessions)
- **ORM**: TypeORM or Prisma
- **Authentication**: OAuth 2.0 + OpenID Connect (Passport.js)
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Winston or Pino
- **Testing**: Jest + Supertest

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (development)
- **CI/CD**: GitHub Actions or GitLab CI

## Project Structure

```
clearCare+/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # State management
│   │   ├── services/        # API service layer
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   └── package.json
├── backend/                  # NestJS application
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication & OAuth
│   │   │   ├── users/       # User management
│   │   │   ├── patients/    # Patient management
│   │   │   ├── providers/   # Provider management
│   │   │   ├── instructions/# Care instructions
│   │   │   ├── compliance/  # Compliance tracking
│   │   │   └── audit/       # Audit logging
│   │   ├── common/          # Shared code
│   │   └── config/          # Configuration
│   └── package.json
├── docs/                     # Documentation
│   ├── PROJECT_DOCUMENTATION.md
│   ├── API_SPECIFICATION.md
│   └── DEPLOYMENT.md
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **Yarn**: v1.22.x or higher (package manager)
- **PostgreSQL**: v14.x or higher
- **Redis**: v7.x or higher
- **Docker**: v20.x or higher (optional, for containerized setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clearCare+
   ```

2. **Install dependencies**

   Frontend:
   ```bash
   cd frontend
   yarn install
   ```

   Backend:
   ```bash
   cd backend
   yarn install
   ```

3. **Environment Configuration**

   Create environment files:

   **Backend** (`.env`):
   ```env
   # Database
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=clearcare
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=clearcare_db

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # OAuth Configuration
   OAUTH_CLIENT_ID=your_client_id
   OAUTH_CLIENT_SECRET=your_client_secret
   OAUTH_AUTHORIZATION_URL=http://localhost:3000/oauth/authorize
   OAUTH_TOKEN_URL=http://localhost:3000/oauth/token
   OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
   OAUTH_JWT_SECRET=your_jwt_secret_key
   OAUTH_JWT_PUBLIC_KEY=your_jwt_public_key

   # Application
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:5173

   # Security
   SESSION_SECRET=your_session_secret
   ENCRYPTION_KEY=your_encryption_key

   # Audit
   AUDIT_LOG_RETENTION_DAYS=2190  # 6 years (HIPAA requirement)
   ```

   **Frontend** (`.env`):
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   VITE_OAUTH_AUTHORIZATION_URL=http://localhost:3000/oauth/authorize
   VITE_OAUTH_TOKEN_URL=http://localhost:3000/oauth/token
   VITE_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
   VITE_OAUTH_CLIENT_ID=your_client_id
   ```

4. **Database Setup**

   ```bash
   # Create PostgreSQL database
   createdb clearcare_db

   # Run migrations (from backend directory)
   cd backend
   yarn typeorm migration:run
   # or with Prisma
   yarn prisma migrate dev
   ```

5. **Start Development Servers**

   **Backend** (Terminal 1):
   ```bash
   cd backend
   yarn start:dev
   ```
   Backend will run on `http://localhost:3000`

   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   yarn dev
   ```
   Frontend will run on `http://localhost:5173`

### Docker Setup (Alternative)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Authentication

ClearCare+ uses **OAuth 2.0 with OpenID Connect (OIDC)** for authentication.

### OAuth Flow

1. **Authorization Code Flow with PKCE** (recommended for web apps)
   - User initiates login from React frontend
   - Frontend generates PKCE code verifier and challenge
   - User redirected to OAuth authorization server
   - User authenticates (username/password + MFA)
   - Authorization server redirects back with authorization code
   - Frontend exchanges code + verifier for tokens
   - Access token used for API requests

### OAuth Scopes

- **Patient**: `read:own-instructions`, `write:own-acknowledgment`, `read:own-compliance`
- **Provider**: `read:patients`, `write:instructions`, `read:compliance`, `read:reports`
- **Administrator**: `admin:users`, `admin:roles`, `admin:audit`, `admin:system`
- **Compliance Officer**: `compliance:audit`, `compliance:reports`, `compliance:incidents`

## User Roles

### Patient
- View assigned care instructions
- Acknowledge receipt and understanding of instructions
- Track personal compliance metrics
- Access historical instructions

### Healthcare Provider
- Create and assign care instructions to patients
- Monitor patient acknowledgment status
- Track patient compliance
- Generate compliance reports
- Manage instruction templates

### Administrator
- Manage users, roles, and permissions
- View system-wide audit logs
- Configure system settings
- Generate system-wide compliance reports

### Compliance Officer (Optional)
- View all audit logs (read-only)
- Generate compliance reports
- Investigate security incidents
- Monitor HIPAA compliance

## API Documentation

Once the backend server is running, API documentation is available at:
- **Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI JSON**: `http://localhost:3000/api/docs-json`

## Development

### Code Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Git**: Feature branches, descriptive commit messages
- **Testing**: >80% code coverage target

### Running Tests

**Backend:**
```bash
cd backend
yarn test              # Unit tests
yarn test:e2e          # E2E tests
yarn test:cov          # Coverage report
```

**Frontend:**
```bash
cd frontend
yarn test              # Unit tests
yarn test:coverage     # Coverage report
yarn test:e2e          # E2E tests (Playwright)
```

### Database Migrations

**TypeORM:**
```bash
cd backend
yarn typeorm migration:generate -n MigrationName
yarn typeorm migration:run
```

**Prisma:**
```bash
cd backend
yarn prisma migrate dev --name migration_name
yarn prisma migrate deploy
```

## HIPAA Compliance

ClearCare+ implements comprehensive HIPAA safeguards:

### Administrative Safeguards
- Security management process
- Assigned security responsibility
- Workforce security
- Information access management
- Security awareness and training
- Security incident procedures
- Contingency plan
- Evaluation
- Business associate contracts

### Physical Safeguards
- Facility access controls
- Workstation use and security
- Device and media controls

### Technical Safeguards
- Access control (OAuth 2.0 + RBAC)
- Audit controls (immutable audit logs)
- Integrity (version control, electronic signatures)
- Transmission security (TLS 1.2+)
- Encryption (AES-256 at rest, TLS in transit)

## Security Best Practices

- ✅ OAuth 2.0 with PKCE for all public clients
- ✅ JWT tokens with RS256 signing
- ✅ Refresh token rotation
- ✅ Token storage in httpOnly cookies (never localStorage)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Comprehensive audit logging
- ✅ Encryption at rest and in transit
- ✅ Multi-factor authentication support

## Contributing

1. Create a feature branch from `main`
2. Make your changes following coding standards
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request with a clear description

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Documentation

- **[Project Documentation](./docs/PROJECT_DOCUMENTATION.md)**: Comprehensive project overview, roles, use cases, and architecture
- **[API Specification](./docs/API_SPECIFICATION.md)**: Detailed API endpoints and schemas
- **[Deployment Guide](./docs/DEPLOYMENT.md)**: Production deployment instructions

## License

[Specify your license here]

## Support

For questions, issues, or contributions, please [open an issue](link-to-issues) or contact the development team.

## Acknowledgments

Built with a focus on healthcare compliance, security, and user experience.

---

**⚠️ Important**: This application handles Protected Health Information (PHI). Ensure all security measures are properly configured before deployment to production. Regular security audits and compliance reviews are required.