export interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: 'student' | 'driver' | 'admin'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: 'student' | 'driver' | 'admin'
  } | null
  token: string | null
  error?: string
}

