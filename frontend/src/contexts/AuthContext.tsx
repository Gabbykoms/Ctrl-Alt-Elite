import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI } from '../services/apiService'

interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'driver' | 'admin'
  activeRideId?: string
  rideId?: string
}

interface AuthContextType {
  token: string | null
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role?: 'student' | 'driver' | 'admin') => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Check for test mode via URL query parameter
  const testMode = new URLSearchParams(window.location.search).get('testMode') === 'true'
  const testRole = (new URLSearchParams(window.location.search).get('role') || 'driver') as 'student' | 'driver' | 'admin'
  
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  // Fetch current user on mount if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      // Test mode: auto-login with demo user based on role
      if (testMode && !token) {
        const demoUsers: Record<'student' | 'driver' | 'admin', User> = {
          driver: {
            id: 'demo-driver-1',
            name: 'Demo Driver',
            email: 'driver@trincoll.edu',
            role: 'driver',
            activeRideId: 'demo-ride',
            rideId: 'demo-ride',
          },
          student: {
            id: 'demo-student-1',
            name: 'Demo Student',
            email: 'student@trincoll.edu',
            role: 'student',
            activeRideId: 'demo-ride',
            rideId: 'demo-ride',
          },
          admin: {
            id: 'demo-admin-1',
            name: 'Demo Admin',
            email: 'admin@trincoll.edu',
            role: 'admin',
            activeRideId: 'demo-ride',
            rideId: 'demo-ride',
          },
        }
        const demoUser = demoUsers[testRole]
        setToken('demo-token')
        setUser(demoUser)
        localStorage.setItem('token', 'demo-token')
        localStorage.setItem('user', JSON.stringify(demoUser))
        console.log(`✅ Test mode enabled as ${testRole}`)
        setLoading(false)
        return
      }

      if (token) {
        try {
          const response = await authAPI.getCurrentUser()
          setUser(response.data.user)
        } catch (error) {
          console.error('Failed to fetch current user:', error)
          // Token is invalid, clear it
          setToken(null)
          setUser(null)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    fetchCurrentUser()
  }, [token])

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password)
      const { token: newToken, user: newUser } = response.data

      setToken(newToken)
      setUser(newUser)
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const register = async (name: string, email: string, password: string, role: 'student' | 'driver' | 'admin' = 'student') => {
    try {
      const response = await authAPI.register(name, email, password, role)
      const { token: newToken, user: newUser } = response.data

      setToken(newToken)
      setUser(newUser)
    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  const logout = () => {
    try {
      authAPI.logout().catch(() => {
        // Ignore logout errors on backend
      })
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}