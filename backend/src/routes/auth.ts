import express, { Request, Response } from 'express'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

dotenv.config()

const router = express.Router()

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
)

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'driver', 'admin']).default('student'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body)

    // Validate @trincoll.edu email
    if (!data.email.endsWith('@trincoll.edu')) {
      return res.status(400).json({
        error: 'Invalid email domain',
        message: 'Only @trincoll.edu email addresses are allowed',
      })
    }

    console.log(`📝 Attempting to register user: ${data.email}`)

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
        },
        emailRedirectTo: `${process.env.FRONTEND_URL}/verify-email`,
      },
    })

    if (authError) {
      console.error('❌ Auth signup error:', authError.message)
      return res.status(400).json({
        error: 'Registration failed',
        message: authError.message,
      })
    }

    if (!authData.user) {
      return res.status(500).json({
        error: 'Registration failed',
        message: 'Failed to create user account',
      })
    }

    // Create user profile in database
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: data.role,
      created_at: new Date(),
    })

    if (profileError) {
      console.error('⚠️  Profile creation warning:', profileError.message)
      // Don't fail registration if profile creation fails - user can verify email
    }

    console.log(`✅ User registered successfully: ${data.email}`)

    return res.status(201).json({
      message: 'Registration successful! Please verify your email address.',
      user: {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    console.error('❌ Registration error:', error)
    return res.status(500).json({
      error: 'Registration failed',
      message: 'An unexpected error occurred during registration',
    })
  }
})

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body)

    console.log(`🔐 Attempting login for: ${data.email}`)

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      console.error('❌ Login error:', authError.message)
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      })
    }

    if (!authData.session) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Unable to create session',
      })
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.warn('⚠️  Profile not found for user:', authData.user.id)
      // Return user from auth, role defaults to student
      return res.json({
        message: 'Login successful',
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || 'User',
          role: authData.user.user_metadata?.role || 'student',
        },
      })
    }

    console.log(`✅ Login successful for: ${data.email}`)

    return res.json({
      message: 'Login successful',
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    console.error('❌ Login error:', error)
    return res.status(500).json({
      error: 'Login failed',
      message: 'An unexpected error occurred',
    })
  }
})

// Logout endpoint
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`👋 Logging out user: ${req.userId}`)

    // Sign out from Supabase
    await supabase.auth.signOut()

    return res.json({
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('❌ Logout error:', error)
    return res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout',
    })
  }
})

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No user ID in token',
      })
    }

    console.log(`👤 Fetching user profile: ${req.userId}`)

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('id', req.userId)
      .single()

    if (error || !profile) {
      console.error('❌ Profile fetch error:', error)
      return res.status(404).json({
        error: 'User not found',
        message: 'Could not find user profile',
      })
    }

    console.log(`✅ Retrieved profile for: ${profile.email}`)

    return res.json({
      user: profile,
    })
  } catch (error) {
    console.error('❌ Get user error:', error)
    return res.status(500).json({
      error: 'Failed to fetch user',
      message: 'An unexpected error occurred',
    })
  }
})

// Verify email endpoint
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token, type } = req.body

    if (!token || !type) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'token and type are required',
      })
    }

    console.log('🔗 Verifying email token')

    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    })

    if (error) {
      console.error('❌ Verification error:', error.message)
      return res.status(400).json({
        error: 'Verification failed',
        message: error.message,
      })
    }

    if (!data.user) {
      return res.status(400).json({
        error: 'Verification failed',
        message: 'No user found',
      })
    }

    console.log(`✅ Email verified for: ${data.user.email}`)

    return res.json({
      message: 'Email verified successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error('❌ Verification error:', error)
    return res.status(500).json({
      error: 'Verification failed',
      message: 'An unexpected error occurred',
    })
  }
})

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing refresh token',
      })
    }

    console.log('🔄 Refreshing access token')

    // Refresh session with Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      console.error('❌ Token refresh error:', error?.message)
      return res.status(401).json({
        error: 'Token refresh failed',
        message: 'Invalid refresh token',
      })
    }

    console.log('✅ Token refreshed successfully')

    return res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    })
  } catch (error) {
    console.error('❌ Refresh error:', error)
    return res.status(500).json({
      error: 'Token refresh failed',
      message: 'An unexpected error occurred',
    })
  }
})

export default router
