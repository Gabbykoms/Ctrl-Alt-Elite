# Bantam Shuttle - Trinity College Shuttle Tracking Application

A modern, full-featured shuttle tracking application built for Trinity College with React 18, Vite, TypeScript, and Tailwind CSS.

## Features

- **Student Portal**: Real-time shuttle tracking with interactive maps, route information, and stop details
- **Driver Dashboard**: Clock in/out functionality, status management, and live location tracking
- **Admin Dashboard**: Live view of all shuttles, routes, and analytics with charts
- **AI Chatbot**: Floating action button chatbot for shuttle inquiries
- **Authentication**: Secure login/register with @trincoll.edu email validation
- **Responsive Design**: Mobile-first, fully responsive interface
- **Real-time Updates**: Socket.IO integration for live shuttle location updates

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Context API
- **API Client**: Axios with interceptors
- **Real-time Communication**: Socket.IO
- **Maps**: Mapbox GL
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20.19.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd Ctrl-Alt-Elite
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your environment variables (especially Mapbox token):
```env
VITE_MAPBOX_TOKEN=your_mapbox_public_token
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Development

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

### Testing

Run tests:
```bash
npm run test
```

Run tests with UI:
```bash
npm run test:ui
```

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── LiveMap.tsx
│   ├── RouteSidebar.tsx
│   ├── Chatbot.tsx
│   ├── ChatbotUI.tsx
│   ├── ProtectedRoute.tsx
│   └── Global.tsx
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── VerifyEmailPage.tsx
│   ├── StudentDashboard.tsx
│   ├── DriverDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── Placeholders.tsx
│   └── NotFound404.tsx
├── layouts/            # Layout components
│   ├── AuthLayout.tsx
│   ├── AppLayout.tsx
│   └── AppLayout.test.tsx
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   └── ShuttleContext.tsx
├── services/           # API and Socket services
│   ├── apiService.ts
│   ├── apiService.test.ts
│   └── socketService.ts
├── test/              # Test configuration
│   └── setup.ts
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles

```

## Color Palette (Trinity College Brand)

- **Primary**: `#004179` (Trinity Blue)
- **Secondary**: `#F3C404` (Trinity Gold)
- **Accent**: `#6CACE4` (Light Blue)
- **Neutral**: `#F5F5F5` (Light Gray)
- **Dark**: `#1a1a1a` (Near Black)

## Routes

### Public Routes
- `/login` - Login page
- `/register` - Registration page (requires @trincoll.edu email)
- `/verify-email` - Email verification page

### Student Routes (Protected)
- `/app` - Main dashboard with live map
- `/app/schedule` - Schedule page
- `/app/profile` - User profile

### Driver Routes (Protected)
- `/driver/dashboard` - Driver dashboard with clock in/out

### Admin Routes (Protected)
- `/admin/dashboard` - Admin dashboard with live view and analytics
- `/admin/drivers` - Driver management
- `/admin/routes` - Route management

## Authentication

The app uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests via axios interceptors.

### Email Validation

- Registration requires a `@trincoll.edu` email address
- Custom error messages guide users through the process

## API Integration

The app is configured to connect to a backend API. Update the `VITE_API_BASE_URL` environment variable to point to your backend.

### Example API endpoints:
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /shuttles` - Get all shuttles
- `GET /routes` - Get all routes
- `GET /stops` - Get all stops

## Real-time Updates

The app uses Socket.IO for real-time shuttle location updates. Ensure your backend is running on the configured `VITE_SOCKET_URL`.

### Events:
- `shuttle-update` - Shuttle location/status changed
- `route-update` - Route information changed
- `stop-update` - Stop information changed

## Testing

The project includes comprehensive tests for:
- **LoginPage**: Email validation, form submission, error handling
- **AppLayout**: Navigation links, logout functionality, role-based UI
- **apiService**: Authorization header, interceptors, API methods

Run specific tests:
```bash
npm run test -- LoginPage
npm run test -- AppLayout
npm run test -- apiService
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_MAPBOX_TOKEN` | Mapbox public token for maps | - |
| `VITE_API_BASE_URL` | Backend API base URL | http://localhost:3000/api |
| `VITE_SOCKET_URL` | WebSocket server URL | http://localhost:3000 |

## Development Notes

### Adding New Features

1. Create components in `src/components/`
2. Create pages in `src/pages/`
3. Add routes in `src/App.tsx`
4. Use existing contexts (AuthContext, ShuttleContext)
5. Write tests for new functionality

### Common Tasks

**Add a new route:**
```tsx
<Route
  element={
    <ProtectedRoute>
      <AppLayout onLogout={logout} userRole="student">
        <YourPage />
      </AppLayout>
    </ProtectedRoute>
  }
  path="/your-path"
/>
```

**Use authentication:**
```tsx
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, token } = useAuth()
  // Use user and token
}
```

**Use shuttle data:**
```tsx
import { useShuttle } from '../contexts/ShuttleContext'

function MyComponent() {
  const { shuttles, stops, routes } = useShuttle()
  // Use data
}
```

## Deployment

Build the project for production:
```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## Support

For issues or questions, please contact the development team.

## License

© 2025 Trinity College. All rights reserved.
