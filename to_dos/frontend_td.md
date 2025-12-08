# Frontend TODO

## High Priority

### 1. Complete API Integration (`src/services/apiService.ts`)
- [ ] Implement all CRUD endpoints for rides, shuttles, stops
- [ ] Add error handling & retry logic on network failures
- [ ] Implement automatic token refresh on 401 responses
- [ ] Add request/response interceptors for logging
- [ ] Handle API timeout scenarios

### 2. Implement Complete Authentication Context (`src/contexts/AuthContext.tsx`)
- [ ] Complete login flow with validation
- [ ] Implement register flow with email verification
- [ ] Add email verification UI component
- [ ] Implement persistent session storage (localStorage)
- [ ] Handle logout & token expiration
- [ ] Add user role detection (student/driver/admin)

### 3. Wire Real-time Updates with Socket.IO
- [ ] Complete Socket.IO connection setup
- [ ] Implement event listeners:
  - [ ] shuttle-location-update (for live bus tracking)
  - [ ] driver-status-update (for driver availability)
  - [ ] ride-status-update (for ride tracking)
- [ ] Add polling fallback for location updates (5-second intervals)
- [ ] Add notification system for ride status changes
- [ ] Handle Socket.IO connection loss & reconnection

### 4. Complete Student Ride Request Flow
- [ ] Build pickup location picker with map integration
- [ ] Build dropoff location picker with map integration
- [ ] Add passenger count & notes fields
- [ ] Implement ride request submission
- [ ] Add real-time ride status tracking UI
- [ ] Implement driver assignment notifications
- [ ] Add estimated pickup time display
- [ ] Implement ride cancellation

### 5. Integrate AI Chatbot
- [ ] Complete AiChat component connection to AI Service
- [ ] Add proper error handling & fallback UI
- [ ] Implement conversation history display
- [ ] Add loading/thinking indicators
- [ ] Test all shuttle inquiry scenarios

## Medium Priority

### 6. Implement Protected Routes (`src/components/ProtectedRoute.tsx`)
- [ ] Add role-based route access control
- [ ] Handle redirect on auth failure
- [ ] Show loading states during auth verification
- [ ] Prevent route access without valid token

### 7. Complete Dashboard Components
- [ ] **Student Dashboard:**
  - [ ] Live bus tracking with real-time markers
  - [ ] Route information display
  - [ ] Stop details sidebar
  - [ ] Ride history
- [ ] **Driver Dashboard:**
  - [ ] Clock in/out functionality
  - [ ] Active rides list
  - [ ] Real-time GPS location
  - [ ] Ride acceptance/pickup/completion buttons
- [ ] **Admin Dashboard:**
  - [ ] Live view of all buses on map
  - [ ] Analytics charts (peak usage, route popularity)
  - [ ] Stops management (create, update, delete)
  - [ ] Driver/shuttle/route management

### 8. Add Global Error Boundaries & Handling
- [ ] Create error boundary component
- [ ] Add global error catch handler
- [ ] Display user-friendly error messages
- [ ] Implement error logging/tracking

### 9. Improve UX with Loading States & Skeleton Screens
- [ ] Add loading spinners for async operations
- [ ] Create skeleton screen components
- [ ] Add optimistic UI updates where appropriate
- [ ] Improve perceived performance

### 10. Responsive Design & Mobile Optimization
- [ ] Test on mobile devices
- [ ] Optimize map interactions for touch
- [ ] Adjust layout for small screens
- [ ] Add mobile navigation improvements

## Low Priority

### 11. Add Unit Tests (Vitest + React Testing Library)
- [ ] Test authentication context
- [ ] Test API service functions
- [ ] Test component rendering & interactions
- [ ] Mock Socket.IO events in tests

### 12. Optimize Bundle Size
- [ ] Analyze bundle with webpack-bundle-analyzer
- [ ] Implement code splitting for routes
- [ ] Lazy load components where appropriate
- [ ] Remove unused dependencies

### 13. Add Analytics Tracking
- [ ] Track user interactions
- [ ] Monitor ride request flow completion
- [ ] Track feature usage metrics

### 14. Implement Offline Mode
- [ ] Cache critical data locally
- [ ] Show cached data when offline
- [ ] Queue requests for when online
- [ ] Sync data on reconnection

### 15. Performance Monitoring
- [ ] Add web vitals tracking
- [ ] Monitor API response times
- [ ] Track Socket.IO latency
- [ ] Set up performance dashboards
