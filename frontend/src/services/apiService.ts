import axios from 'axios'

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 10s to 30s for slower networks/Supabase operations
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add Authorization interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string, role: 'student' | 'driver' | 'admin' = 'student') =>
    apiClient.post('/auth/register', { name, email, password, role }),
  
  logout: () => apiClient.post('/auth/logout'),
  
  getCurrentUser: () => apiClient.get('/auth/me'),
  
  verifyEmail: (token: string, type: string) =>
    apiClient.post('/auth/verify-email', { token, type }),
  resendVerificationEmail: (email: string) => 
    apiClient.post('/auth/resend-verification', { email }),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
}



// ============================================
// SHUTTLE API
// ============================================
export const shuttleAPI = {
  getShuttles: () => apiClient.get('/shuttles'),
  
  getShuttleById: (id: string) => apiClient.get(`/shuttles/${id}`),
  
  createShuttle: (data: { name: string; vehicleNumber?: string; capacity?: number }) =>
    apiClient.post('/shuttles', data),
  
  updateShuttle: (id: string, data: any) =>
    apiClient.patch(`/shuttles/${id}`, data),
  
  deleteShuttle: (id: string) =>
    apiClient.delete(`/shuttles/${id}`),
  
  updateShuttleLocation: (id: string, data: { latitude: number; longitude: number; speed?: number; heading?: number }) =>
    apiClient.post(`/shuttles/${id}/location`, data),
}

// ============================================
// ROUTE API
// ============================================
export const routeAPI = {
  getRoutes: () => apiClient.get('/routes'),
  
  getRouteById: (id: string) => apiClient.get(`/routes/${id}`),
  
  createRoute: (data: { name: string; description?: string; distance?: number; duration?: number; frequency?: number; stops?: string[] }) =>
    apiClient.post('/routes', data),
  
  updateRoute: (id: string, data: any) =>
    apiClient.patch(`/routes/${id}`, data),
  
  deleteRoute: (id: string) =>
    apiClient.delete(`/routes/${id}`),
}

// ============================================
// STOP API
// ============================================
export const stopAPI = {
  getStops: () => apiClient.get('/stops'),
  
  getStopById: (id: string) => apiClient.get(`/stops/${id}`),
  
  createStop: (data: { name: string; description?: string; latitude: number; longitude: number }) =>
    apiClient.post('/stops', data),
  
  updateStop: (id: string, data: any) =>
    apiClient.patch(`/stops/${id}`, data),
  
  deleteStop: (id: string) =>
    apiClient.delete(`/stops/${id}`),
}

// ============================================
// RIDE API
// ============================================
export const rideAPI = {
  requestRide: (data: {
    pickupLatitude: number
    pickupLongitude: number
    dropoffLatitude: number
    dropoffLongitude: number
    startLocationId?: string
    endLocationId?: string
    pickupAddress?: string
    dropoffAddress?: string
    passengerCount?: number
    notes?: string
  }) => apiClient.post('/rides/request', data),
  
  getRides: () => apiClient.get('/rides'),
  
  getRideById: (id: string) => apiClient.get(`/rides/${id}`),
  
  cancelRide: (id: string, cancellationReason?: string) =>
    apiClient.patch(`/rides/${id}/cancel`, { cancellationReason }),
  
  updateRideStatus: (id: string, status: string) =>
    apiClient.patch(`/rides/${id}/status`, { status }),
  
  assignShuttle: (id: string, shuttleId: string) =>
    apiClient.patch(`/rides/${id}/assign-shuttle`, { shuttleId }),
}

// ============================================
// TRACKING-SERVICE API (direct integration)
// ============================================
const TRACKING_SERVICE_BASE = import.meta.env.VITE_TRACKING_SERVICE_URL || 'http://localhost:8081';

export const trackingAPI = {
  // ============ RIDE TRACKING ============
  // Start tracking a ride
  startRideTracking: (rideId: string, data: any) =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/rides/${rideId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    }).then(res => res.json()),

  // End tracking a ride
  endRideTracking: (rideId: string) =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/rides/${rideId}/end`, {
      method: 'POST',
      credentials: 'include',
    }),

  // Get latest driver location for a ride
  getDriverLocation: (rideId: string) =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/rides/${rideId}/driver-location`, {
      credentials: 'include',
    }).then(res => res.json()),

  // Get student pickup/dropoff locations for a ride
  getStudentLocation: (rideId: string) =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/rides/${rideId}/student-location`, {
      credentials: 'include',
    }).then(res => res.json()),

  // Get full ride tracking context
  getRideContext: (rideId: string) =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/rides/${rideId}/context`, {
      credentials: 'include',
    }).then(res => res.json()),

  // ============ STOP MANAGEMENT ============
  // Get all stops
  getAllStops: () =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/stops`, {
      credentials: 'include',
    }).then(res => res.json()),

  // Get a single stop by ID
  getStop: (stopId: string) =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/stops/${stopId}`, {
      credentials: 'include',
    }).then(res => res.json()),

  // Create a new stop (admin only)
  createStop: (data: { name: string; latitude: number; longitude: number; description?: string }) =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    }).then(res => res.json()),

  // Update a stop (admin only)
  updateStop: (stopId: string, data: { name?: string; latitude?: number; longitude?: number; description?: string }) =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/stops/${stopId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    }).then(res => res.json()),

  // Delete a stop (admin only)
  deleteStop: (stopId: string) =>
    fetch(`${TRACKING_SERVICE_BASE}/v1/stops/${stopId}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(res => res.json()),
};

// ============================================
// DRIVER API
// ============================================
export const driverAPI = {
  getDrivers: () => apiClient.get('/drivers'),
  
  getDriverById: (id: string) => apiClient.get(`/drivers/${id}`),
  
  createDriver: (data: {
    email: string
    password: string
    name: string
    phone?: string
    licenseNumber?: string
    vehicle?: {
      make?: string
      model?: string
      year?: number
      plate?: string
    }
  }) => apiClient.post('/drivers', data),
  
  updateDriver: (id: string, data: any) =>
    apiClient.patch(`/drivers/${id}`, data),
  
  deleteDriver: (id: string) =>
    apiClient.delete(`/drivers/${id}`),
  
  clockIn: (id: string, shuttleId?: string) =>
    apiClient.post(`/drivers/${id}/clock-in`, { shuttleId }),
  
  clockOut: (id: string) =>
    apiClient.post(`/drivers/${id}/clock-out`),
  
  getShifts: (id: string) =>
    apiClient.get(`/drivers/${id}/shifts`),
}

// ============================================
// USER/PROFILE API
// ============================================
export const userAPI = {
  getCurrentUser: () => apiClient.get('/users/me'),
  
  updateCurrentUser: (data: { name?: string }) =>
    apiClient.patch('/users/me', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/users/me/change-password', { currentPassword, newPassword }),
  
  deleteAccount: () => apiClient.delete('/users/me'),
  
  getAllUsers: () => apiClient.get('/users'),
}

// ============================================
// STUDENT API
// ============================================
export const studentAPI = {
  getStudentProfile: () => apiClient.get('/students/me'),
  
  createStudentProfile: (data: {
    student_id?: string
    grade_level?: string
    school?: string
    address?: string
    emergency_contact?: string
    emergency_phone?: string
  }) => apiClient.post('/students/me', data),
  
  updateStudentProfile: (data: any) =>
    apiClient.patch('/students/me', data),
}

