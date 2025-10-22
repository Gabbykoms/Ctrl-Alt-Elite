import axios from 'axios'

// Get API base URL from environment or use default
const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:3000/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

// Example API methods
export const shuttleAPI = {
  getShuttles: () => apiClient.get('/shuttles'),
  getShuttleById: (id: string) => apiClient.get(`/shuttles/${id}`),
  updateShuttleLocation: (id: string, data: { lat: number; lng: number }) =>
    apiClient.patch(`/shuttles/${id}`, data),
}

export const routeAPI = {
  getRoutes: () => apiClient.get('/routes'),
  getRouteById: (id: string) => apiClient.get(`/routes/${id}`),
}

export const stopAPI = {
  getStops: () => apiClient.get('/stops'),
  getStopById: (id: string) => apiClient.get(`/stops/${id}`),
}

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    apiClient.post('/auth/register', { name, email, password }),
  logout: () => apiClient.post('/auth/logout'),
}
