# ClearCare+ Frontend

React + TypeScript frontend application for ClearCare+ - Post-Visit Care & Follow-Up Compliance Platform.

## Features

- ✅ HIPAA-compliant PHI encryption
- ✅ OAuth 2.0 authentication (mock implementation)
- ✅ Role-based access control (Patient, Provider, Administrator)
- ✅ Material-UI professional design
- ✅ Redux Toolkit for state management
- ✅ React Query for server state
- ✅ TypeScript strict mode
- ✅ Mock data services for development

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Yarn package manager

### Installation

```bash
# Install dependencies
yarn install

# Create environment file
cp .env.example .env

# Start development server
yarn dev
```

The application will be available at `http://localhost:5173`

## Demo Credentials

- **Patient**: patient1@example.com / password123
- **Provider**: provider1@example.com / password123
- **Admin**: admin@example.com / password123

## Project Structure

```
src/
├── components/      # Reusable components
├── pages/          # Page components
├── services/       # API and mock data services
├── store/          # Redux store
├── types/          # TypeScript types
├── utils/          # Utilities (encryption, constants)
└── config/         # Configuration (theme, routes)
```

## Key Features

### PHI Encryption
All Protected Health Information (PHI) fields are encrypted using AES-256 encryption. See `src/utils/encryption.ts` for implementation.

### Authentication
OAuth 2.0 flow is implemented with mock data. Ready to connect to backend OAuth server.

### Mock Data
Mock data services provide realistic data for development. All PHI fields are encrypted in mock data.

## Development

```bash
# Development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Lint code
yarn lint
```

## Next Steps

1. Complete implementation of all page components
2. Connect to NestJS backend API
3. Implement full OAuth 2.0 flow
4. Add comprehensive error handling
5. Add unit and integration tests
