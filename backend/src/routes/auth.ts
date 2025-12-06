import express, { Request, Response } from 'express'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

dotenv.config()

const router = express.Router()

// Initialize Supabase clients
// Anon key for regular auth
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
)

// Service role key for admin operations (bypasses RLS)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
if (!serviceRoleKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations may fail.')
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY is loaded (starts with: ' + serviceRoleKey.substring(0, 5) + '...)')
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
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

/**
 * @swagger
 * /api/auth/register:
 * post:
 * summary: Register a new user
 * description: Create a new account with @trincoll.edu email. Supported roles are student, driver, and admin.
 * tags:
 * - Authentication
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * - name
 * properties:
 * email:
 * type: string
 * format: email
 * example: student@trincoll.edu
 * password:
 * type: string
 * format: password
 * minLength: 8
 * name:
 * type: string
 * minLength: 2
 * example: John Doe
 * role:
 * type: string
 * enum: [student, driver, admin]
 * default: student
 * responses:
 * 201:
 * description: User registered successfully
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * user:
 * type: object
 * properties:
 * id:
 * type: string
 * format: uuid
 * email:
 * type: string
 * name:
 * type: string
 * role:
 * type: string
 * 400:
 * description: Invalid input or email domain
 * 500:
 * description: Registration failed
 */
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

    console.log('✅ Auth user created with ID:', authData.user.id)

    // Small delay to ensure auth.users record is fully committed
    await new Promise(resolve => setTimeout(resolve, 100))

    // Create user profile in database
    console.log('Attempting to create user profile with admin client...')
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: data.role,
    })

    if (profileError) {
      console.error('⚠️  Profile creation error:', profileError.message)
      console.error('Profile Error Details:', profileError)
      
      // This is critical - if profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return res.status(500).json({
        error: 'Profile creation failed',
        message: 'Failed to create user profile. Please try again.',
        details: profileError.message,
      })
    }

    console.log('✅ User profile created successfully in database')

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

/**
 * @swagger
 * /api/auth/login:
 * post:
 * summary: Login user
 * description: Authenticate with email and password to receive JWT token
 * tags:
 * - Authentication
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: student@trincoll.edu
 * password:
 * type: string
 * format: password
 * responses:
 * 200:
 * description: Login successful
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * token:
 * type: string
 * description: JWT access token for API requests
 * refreshToken:
 * type: string
 * user:
 * type: object
 * properties:
 * id:
 * type: string
 * format: uuid
 * email:
 * type: string
 * name:
 * type: string
 * role:
 * type: string
 * 401:
 * description: Invalid email or password
 * 400:
 * description: Validation failed
 */
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
    // FIX: Using 'profiles' table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.warn('⚠️  Profile not found for user:', authData.user.id)
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
    // FIX: Using 'profiles' table
    const { data: profile, error } = await supabase
      .from('profiles')
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