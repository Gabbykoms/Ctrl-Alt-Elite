# Database Setup Guide

This guide walks you through setting up the Bantam Shuttle backend database using Supabase.

## Prerequisites

- Supabase account (free tier works fine)
- Node.js 18+
- Backend repository cloned

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `bantam-shuttle-backend` (or your choice)
   - Database Password: Create a secure password
   - Region: Choose closest to your location
4. Click "Create New Project"
5. Wait for project to initialize (~2 minutes)

## Step 2: Get Your Credentials

1. In Supabase project dashboard, click "Settings" → "API"
2. Copy the following values:
   - `Project URL` (looks like `https://xxxxx.supabase.co`)
   - `anon public` key
   - `service_role` key (under "Service role token")

## Step 3: Create Database Tables

1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy the entire contents of `backend/database-migration.sql`
4. Paste into the SQL editor
5. Click "Run"
6. Wait for all tables to be created (you'll see success messages)

**Expected output:**
- CREATE TABLE commands
- CREATE INDEX commands
- CREATE POLICY commands (if RLS is enabled)
- INSERT INTO commands for sample data

## Step 4: Configure Environment Variables

1. In the `backend` folder, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in the values:
   ```env
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   
   # From Supabase API settings
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   
   JWT_SECRET=your_secure_random_string_here
   TRACKING_SERVICE_URL=http://localhost:8080
   AI_SERVICE_URL=http://localhost:8083
   ```

   **Generate a secure JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Step 5: Install Dependencies

```bash
cd backend
npm install
```

## Step 6: Test Database Connection

1. Run the database test:
   ```bash
   npm run dev
   ```

   Or run the test script directly:
   ```bash
   npx tsx src/utils/testDatabase.ts
   ```

2. You should see output like:
   ```
   🔧 Testing database connection...

   1️⃣ Testing Supabase connection...
   ✅ Supabase connection successful

   2️⃣ Querying stops...
   ✅ Found 6 active stops
      Sample: Main Gate (41.7454, -72.6892)

   3️⃣ Querying routes...
   ✅ Found 3 active routes
      Sample: Campus Loop

   4️⃣ Querying shuttles...
   ✅ Found 0 shuttles

   5️⃣ Querying rides...
   ✅ Found 0 rides

   🎉 All database tests passed!
   ```

## Troubleshooting

### "Connection refused"
- Check that `SUPABASE_URL` is correct
- Check that internet connection is working
- Try in Supabase SQL Editor first

### "Invalid API Key"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (copy carefully, no extra spaces)
- Make sure you're using `service_role` key, not `anon` key for backend operations

### "Table already exists"
- This is normal if running migration twice
- Migration uses `IF NOT EXISTS`, so it's safe to re-run

### Tables not showing up
- Refresh the Supabase dashboard
- Check the "Tables" section in the left sidebar
- Verify SQL editor showed success messages

## Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | All user accounts (students, drivers, admins) |
| `students` | Student profile information |
| `drivers` | Driver profile and vehicle info |
| `stops` | Shuttle bus stops with GPS coordinates |
| `routes` | Pre-defined shuttle routes |
| `route_stops` | Many-to-many: which stops are on which routes |
| `shuttles` | Shuttle bus fleet vehicles |
| `rides` | Individual ride requests |
| `shifts` | Driver shift tracking (clock in/out) |

### Key Features

✅ **Foreign Keys** - Referential integrity maintained
✅ **Indexes** - Optimized for common queries
✅ **Timestamps** - `created_at` and `updated_at` on all tables
✅ **Row Level Security** - Ready for production RLS policies
✅ **Sample Data** - 6 stops, 3 routes for testing

## Next Steps

1. **Test with the Backend API:**
   ```bash
   npm run dev
   ```
   Server will start on `http://localhost:3000`

2. **Create First User:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "student@trincoll.edu",
       "password": "securepassword",
       "name": "Test Student"
     }'
   ```

3. **Test Ride Creation:**
   - Login with the test user
   - Create a ride request through the frontend

## Database Queries

### Common Queries

```sql
-- Get all students
SELECT u.*, s.* FROM users u 
LEFT JOIN students s ON u.id = s.user_id 
WHERE u.role = 'student';

-- Get active shuttles
SELECT * FROM shuttles WHERE status = 'active';

-- Get rides by student
SELECT * FROM rides 
WHERE student_id = 'user-id' 
ORDER BY created_at DESC;

-- Get route with all stops
SELECT r.*, rs.stop_order, s.* FROM routes r
JOIN route_stops rs ON r.id = rs.route_id
JOIN stops s ON rs.stop_id = s.id
WHERE r.id = 'route-id'
ORDER BY rs.stop_order;
```

## Backing Up Your Database

In Supabase dashboard:
1. Go to "Settings" → "Backups"
2. Enable daily backups (recommended for production)
3. Download backups manually when needed

## Need Help?

- Check Supabase docs: https://supabase.com/docs
- Review the SQL migration script: `backend/database-migration.sql`
- Check server logs: `npm run dev` shows all errors
- Test manually in Supabase SQL Editor
