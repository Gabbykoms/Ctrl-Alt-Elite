# Authentication System Status Guide

## Authentication Implementation - Status

**COMPLETE** - Ready to use with Supabase

## What's Implemented

### Routes (`src/routes/auth.ts`)

1. **POST /api/auth/register**
   - Create new user account
   - Validates @trincoll.edu email
   - Creates user profile in database
   - Sends verification email
   - Returns user info

2. **POST /api/auth/login**
   - Authenticate user credentials
   - Returns JWT access token + refresh token
   - Returns user profile

3. **POST /api/auth/logout**
   - Sign user out
   - Clears session

4. **GET /api/auth/me**
   - Get current user profile
   - Requires authentication
   - Returns user details

5. **POST /api/auth/verify-email**
   - Verify email with token
   - Called when user clicks email link
   - Activates account

6. **POST /api/auth/refresh**
   - Refresh access token
   - Uses refresh token
   - Returns new access token

### Middleware (`src/middleware/auth.ts`)

1. **authenticateToken()**
   - Verifies JWT token from headers
   - Extracts user info
   - Protects routes

2. **requireRole(roles)**
   - Checks if user has required role
   - Supports multiple roles
   - Returns 403 if unauthorized

3. **requireAdmin()**
   - Shorthand for admin-only routes

4. **requireDriver()**
   - Shorthand for driver-only routes

5. **optionalAuth()**
   - Optional authentication
   - Works with or without token

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `@supabase/supabase-js` - Supabase client
- `express` - Web framework
- `zod` - Validation
- `dotenv` - Environment variables
- All TypeScript types

### 2. Update TypeScript Config

The `tsconfig.json` already includes necessary compiler options, but verify:

```json
{
  "compilerOptions": {
    "lib": ["ES2020"],  // Must include this for console
    "target": "ES2020",
    "moduleResolution": "bundler"
  }
}
```

### 3. Set Up Environment Variables

Create `.env` file in backend root:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
```

### 4. Create Supabase Tables

Run these SQL queries in Supabase:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'driver', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON users
  USING (auth.role() = 'service_role');
```

### 5. Start Backend Server

```bash
npm run dev
```

Server will run on `http://localhost:3000`

## Usage Examples

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d {
    "email": "student@trincoll.edu",
    "password": "SecurePass123",
    "name": "John Student",
    "role": "student"
  }
```

**Response:**
```json
{
  "message": "Registration successful!",
  "user": {
    "id": "uuid-here",
    "email": "student@trincoll.edu",
    "name": "John Student",
    "role": "student"
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d {
    "email": "student@trincoll.edu",
    "password": "SecurePass123"
  }
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "...",
  "user": {
    "id": "uuid-here",
    "email": "student@trincoll.edu",
    "name": "John Student",
    "role": "student"
  }
}
```

### Get Current User (Protected)

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "student@trincoll.edu",
    "name": "John Student",
    "role": "student",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

## Using Protected Routes

### Example: Admin-Only Endpoint

```typescript
// In your routes file
import { requireAdmin } from '../middleware/auth.js'

router.post('/api/admin/action', requireAdmin, async (req, res) => {
  // Only admins can access this
  res.json({ message: 'Admin action executed' })
})
```

### Example: Driver-Only Endpoint

```typescript
import { requireDriver } from '../middleware/auth.js'

router.patch('/api/drivers/:id/location', requireDriver, async (req, res) => {
  // Only drivers can access this
  res.json({ message: 'Location updated' })
})
```

### Example: Optional Auth

```typescript
import { optionalAuth } from '../middleware/auth.js'

router.get('/api/stops', optionalAuth, async (req, res) => {
  // Works with or without authentication
  if (req.userId) {
    // User is authenticated
    return res.json({ stops: 'private-data' })
  } else {
    // User is not authenticated
    return res.json({ stops: 'public-data' })
  }
})
```

## Token Refresh Flow

1. Access token expires after 1 hour
2. Client uses refresh token to get new access token
3. Refresh endpoint returns new access token
4. Client updates token and continues

```typescript
// Frontend example
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken: refreshToken })
})

const { token } = await response.json()
localStorage.setItem('token', token)
```

## Features

-  Email validation (Trinity only)
-  Password hashing (Supabase handles)
-  JWT tokens with refresh
-  Email verification
-  Role-based access control
-  Error handling
-  Logging
-  Type safety with TypeScript
-  Input validation with Zod

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

```bash
npm install @supabase/supabase-js
```

### "No token provided"

Make sure to include Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### "Invalid or expired token"

Token may have expired. Use refresh endpoint to get new token.

### "Only @trincoll.edu emails allowed"

Registration only accepts Trinity College email addresses.

## Connect to Frontend

Update frontend API service to use real endpoints:

```typescript
// frontend/src/services/apiService.ts
export const authAPI = {
  register: (name: string, email: string, password: string) =>
    apiClient.post('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
}
```

## Next Steps

1. Auth system complete
2. Update rides/shuttles/drivers to use authenticated endpoints
3. Add role-based access control
4. Implement database persistence
5. Add email notifications

---

**Status**: Ready to use!

