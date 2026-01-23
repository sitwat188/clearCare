# API Endpoints Documentation

This file documents all API endpoints available in the application. Currently, all endpoints return mock data. When the backend is implemented, these endpoints will be replaced with actual API calls.

## Structure

All endpoints are organized by role and resource in `apiEndpoints.ts`:

- `authEndpoints` - Authentication endpoints
- `patientEndpoints` - Patient-specific endpoints
- `providerEndpoints` - Provider-specific endpoints
- `adminEndpoints` - Admin-specific endpoints
- `notificationEndpoints` - Notification endpoints (shared)

## Usage

```typescript
import { apiEndpoints } from './services/apiEndpoints';

// Example: Login
const response = await apiEndpoints.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

if (response.success) {
  console.log(response.data); // { user, token }
}

// Example: Get patient instructions
const instructionsResponse = await apiEndpoints.patient.getMyInstructions();
if (instructionsResponse.success) {
  console.log(instructionsResponse.data); // CareInstruction[]
}
```

## Replacing with Backend

When the backend is ready, simply uncomment the actual API calls and remove the mock implementations:

```typescript
// Before (mock):
const response = await mockApi.login(credentials.email, credentials.password);
return { data: response, success: true };

// After (real API):
return api.post('/auth/login', credentials);
```

The axios instance (`api`) is already configured with:
- Base URL from environment variables
- Authentication token injection
- Error handling
- Token refresh logic

## Endpoint List

### Authentication Endpoints

- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/logout` - Logout current user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/auth/me` - Get current user

### Patient Endpoints

- `GET /api/v1/patients/me/instructions` - Get patient's instructions
- `GET /api/v1/patients/me/instructions/:id` - Get instruction by ID
- `POST /api/v1/patients/me/instructions/:id/acknowledge` - Acknowledge instruction
- `GET /api/v1/patients/me/compliance` - Get compliance records
- `GET /api/v1/patients/me/compliance/metrics` - Get compliance metrics
- `PUT /api/v1/patients/me/compliance/:recordId` - Update compliance record
- `GET /api/v1/patients/me/profile` - Get patient profile
- `PUT /api/v1/patients/me/profile` - Update patient profile

### Provider Endpoints

- `GET /api/v1/providers/patients` - Get assigned patients
- `GET /api/v1/providers/patients/:id` - Get patient by ID
- `GET /api/v1/providers/instructions` - Get provider's instructions
- `GET /api/v1/providers/instructions/:id` - Get instruction by ID
- `POST /api/v1/providers/instructions` - Create new instruction
- `PUT /api/v1/providers/instructions/:id` - Update instruction
- `DELETE /api/v1/providers/instructions/:id` - Delete instruction
- `GET /api/v1/providers/patients/:patientId/compliance` - Get patient compliance
- `GET /api/v1/providers/patients/:patientId/compliance/metrics` - Get patient compliance metrics
- `GET /api/v1/providers/templates` - Get instruction templates
- `POST /api/v1/providers/templates` - Create instruction template

### Admin Endpoints

- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/users/:id` - Get user by ID
- `POST /api/v1/admin/users` - Create new user
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user
- `GET /api/v1/admin/roles` - Get all roles
- `GET /api/v1/admin/roles/:id` - Get role by ID
- `POST /api/v1/admin/roles` - Create new role
- `PUT /api/v1/admin/roles/:id` - Update role
- `DELETE /api/v1/admin/roles/:id` - Delete role
- `GET /api/v1/admin/audit-logs` - Get audit logs (with filters)
- `GET /api/v1/admin/settings` - Get system settings
- `PUT /api/v1/admin/settings` - Update system settings
- `GET /api/v1/admin/reports` - Get all reports
- `POST /api/v1/admin/reports` - Generate new report

### Notification Endpoints

- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark notification as read
- `PUT /api/v1/notifications/read-all` - Mark all notifications as read
- `DELETE /api/v1/notifications/:id` - Delete notification

## Response Format

All endpoints return an `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}
```

Paginated endpoints return `ApiResponse<PaginatedResponse<T>>`:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## Error Handling

Errors are thrown as exceptions. The axios interceptor in `api.ts` handles:
- 401 Unauthorized (token refresh)
- Error formatting
- Logout on refresh failure

## Environment Variables

Set the API base URL in `.env`:

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Notes

- All endpoints currently use mock data from `mockData.ts`
- User IDs are hardcoded in mock implementations (will come from auth context in real API)
- All endpoints include TODO comments indicating where real API calls should be added
- The axios instance is configured with authentication headers automatically
