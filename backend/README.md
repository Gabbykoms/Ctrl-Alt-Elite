# Bantam Shuttle - Backend Microservice

A robust backend microservice for the Bantam Shuttle tracking system serving Trinity College.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts              # Main server file
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   └── errorHandler.ts   # Error handling
│   ├── routes/
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── shuttles.ts       # Shuttle endpoints
│   │   ├── routes.ts         # Route endpoints
│   │   ├── stops.ts          # Stop endpoints
│   │   ├── rides.ts          # Ride request endpoints
│   │   └── drivers.ts        # Driver endpoints
│   ├── config/               # Configuration files (coming soon)
│   ├── models/               # Database models (coming soon)
│   └── services/             # Business logic (coming soon)
├── dist/                      # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Shuttles
- `GET /api/shuttles` - Get all shuttles
- `GET /api/shuttles/:id` - Get single shuttle
- `POST /api/shuttles` - Create shuttle (admin)
- `PATCH /api/shuttles/:id` - Update shuttle (admin)
- `DELETE /api/shuttles/:id` - Delete shuttle (admin)

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get single route
- `POST /api/routes` - Create route (admin)
- `PATCH /api/routes/:id` - Update route (admin)
- `DELETE /api/routes/:id` - Delete route (admin)

### Stops
- `GET /api/stops` - Get all stops
- `GET /api/stops/:id` - Get single stop
- `POST /api/stops` - Create stop (admin)
- `PATCH /api/stops/:id` - Update stop (admin)
- `DELETE /api/stops/:id` - Delete stop (admin)

### Rides ⭐
- `POST /api/rides/request` - Request a ride
- `GET /api/rides` - Get my rides
- `GET /api/rides/:id` - Get ride details
- `PATCH /api/rides/:id/cancel` - Cancel ride
- `PATCH /api/rides/:id/status` - Update ride status

### Drivers
- `GET /api/drivers` - Get all drivers (admin)
- `GET /api/drivers/:id` - Get single driver
- `POST /api/drivers` - Create driver (admin)
- `PATCH /api/drivers/:id` - Update driver (admin)
- `DELETE /api/drivers/:id` - Delete driver (admin)
- `POST /api/drivers/:id/clock-in` - Clock in
- `POST /api/drivers/:id/clock-out` - Clock out

## 🔌 WebSocket Events (Socket.IO)

### Server Events (to clients)
- `shuttle-location-update` - New shuttle location
- `driver-status-update` - Driver status changed
- `ride-status-update` - Ride status changed

### Client Events (from clients)
- `shuttle-location-update` - Driver sends location
- `driver-status-update` - Driver updates status
- `ride-status-update` - Ride status update

## 🗄️ Database Schema (Coming Soon)

- `users` - User accounts
- `shuttles` - Shuttle fleet
- `routes` - Shuttle routes
- `stops` - Route stops
- `schedules` - Shuttle schedules
- `rides` - Ride requests
- `drivers` - Driver information
- `shuttle_locations` - Location history

## 🔒 Authentication

Uses JWT tokens with Supabase Auth:
1. User registers/logs in
2. Supabase generates JWT token
3. Token sent in `Authorization: Bearer <token>` header
4. Backend validates token
5. Token refreshes automatically

## 🚀 Current Status

### ✅ Completed
- Server setup with Express & Socket.IO
- CORS configuration
- Error handling middleware
- Route structure
- Mock data endpoints
- WebSocket setup

### 🔄 In Progress
- Supabase integration
- Authentication implementation
- Database models
- Real-time location tracking

### 📋 TODO
- Implement Supabase auth
- Database migrations
- Business logic services
- Request validation
- Rate limiting
- Logging system
- Testing suite

## 📝 Environment Variables

See `.env.example` for all required variables:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

JWT_SECRET=your_secret
JWT_EXPIRATION=7d

SOCKET_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
```

## 🛠️ Available Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm start            # Start production server
npm run type-check   # Check TypeScript types
npm run lint         # Run linter (coming soon)
```

## 📦 Dependencies

- **express** - Web framework
- **socket.io** - Real-time communication
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **zod** - Schema validation
- **@supabase/supabase-js** - Supabase client

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Create pull request

## 📄 License

© 2025 Trinity College. All rights reserved.

## 🔗 Related

- Frontend: `/frontend` - React UI
- Docs: `/docs` - API documentation (coming soon)

---

**Status**: 🟢 Backend scaffold complete, ready for integration

