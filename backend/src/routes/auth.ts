import express, { Request, Response } from 'express'
import { supabase } from '../config/supabase.js'
import { validateRegister, validateLogin } from '../middleware/validation.js'
import { RegisterRequest, LoginRequest } from '../types/auth.js'

const router = express.Router()

// Register new user
router.post('/register', validateRegister, async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'student' }: RegisterRequest = req.body

    // Validate email domain if needed (Trinity College requirement)
    if (!email.endsWith('@trincoll.edu')) {
      return res.status(400).json({
        error: 'Invalid email domain',
        message: 'Only Trinity College email addresses (@trincoll.edu) are allowed',
      })
    }

    // Create user in Supabase Auth
    // Set redirect URL to frontend verification page
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
        emailRedirectTo: `${redirectUrl}/verify-email`,
      },
    })

    if (authError) {
      return res.status(400).json({
        error: 'Registration failed',
        message: authError.message,
      })
    }

    if (!authData.user) {
      return res.status(500).json({
        error: 'Registration failed',
        message: 'Failed to create user',
      })
    }

    // Create user profile in database
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        name,
        role,
      })

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      // For now, just log the error
      console.error('Failed to create user profile:', profileError)
    }

    // Return user data
    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role,
      },
      // Note: Supabase requires email verification by default
      // The user won't get a session token until they verify their email
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during registration',
    })
  }
})

// Login user
router.post('/login', validateLogin, async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: authError.message,
      })
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials',
      })
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'User profile not found',
        message: 'Please contact support',
      })
    }

    // Return user data and session token
    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      },
      token: authData.session.access_token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during login',
    })
  }
})

// Logout user (optional - mostly handled client-side)
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (token) {
      await supabase.auth.signOut()
    }

    res.json({
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

// Email verification callback
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token_hash, type } = req.query

    if (!token_hash || !type) {
      return res.status(400).json({
        error: 'Invalid verification link',
        message: 'Missing required parameters',
      })
    }

    // Verify the email with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token_hash as string,
      type: type as any,
    })

    if (error) {
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

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/verify-email?verified=true`)
  } catch (error) {
    console.error('Email verification error:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/verify-email?verified=false&error=verification_failed`)
  }
})

// Get current user (for token verification)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      })
    }

    // Set the session for Supabase client
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'User profile not found',
      })
    }

    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Internal server error',
    })
  }
})

export default router

