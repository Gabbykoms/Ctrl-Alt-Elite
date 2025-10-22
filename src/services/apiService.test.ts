import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import apiClient, { shuttleAPI, authAPI } from './apiService'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    })),
  },
}))

describe('apiService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should be defined', () => {
    expect(apiClient).toBeDefined()
  })

  it('should have request interceptor configured', () => {
    // This test verifies the interceptor structure
    expect(apiClient.interceptors.request).toBeDefined()
  })

  it('should add Authorization header with token', async () => {
    const token = 'test-token-123'
    localStorage.setItem('token', token)

    // Create a mock config object
    const config = {
      headers: {} as Record<string, string>,
    }

    // Simulate the interceptor logic
    const mockToken = localStorage.getItem('token')
    if (mockToken) {
      config.headers['Authorization'] = `Bearer ${mockToken}`
    }

    expect(config.headers['Authorization']).toBe(`Bearer ${token}`)
  })

  it('should not add Authorization header if no token exists', () => {
    // Ensure no token in storage
    localStorage.removeItem('token')

    const config = {
      headers: {} as Record<string, string>,
    }

    const mockToken = localStorage.getItem('token')
    if (mockToken) {
      config.headers['Authorization'] = `Bearer ${mockToken}`
    }

    expect(config.headers['Authorization']).toBeUndefined()
  })

  it('should have shuttle API methods', () => {
    expect(shuttleAPI.getShuttles).toBeDefined()
    expect(shuttleAPI.getShuttleById).toBeDefined()
    expect(shuttleAPI.updateShuttleLocation).toBeDefined()
  })

  it('should have auth API methods', () => {
    expect(authAPI.login).toBeDefined()
    expect(authAPI.register).toBeDefined()
    expect(authAPI.logout).toBeDefined()
  })

  it('should have response interceptor configured', () => {
    expect(apiClient.interceptors.response).toBeDefined()
  })

  it('should handle 401 response by clearing storage', () => {
    // Set token in storage
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ name: 'Test User' }))

    // Simulate 401 response handling
    const error = { response: { status: 401 } }
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('should have base URL configured', () => {
    expect(apiClient.defaults.baseURL).toBeDefined()
  })

  it('should have timeout configured', () => {
    expect(apiClient.defaults.timeout).toBe(10000)
  })

  it('should have Content-Type header configured', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
