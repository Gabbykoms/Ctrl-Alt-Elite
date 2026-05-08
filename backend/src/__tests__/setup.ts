import { afterEach, beforeEach, vi } from 'vitest'

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Clean up after each test
  vi.resetAllMocks()
})

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.PORT = '3000'
