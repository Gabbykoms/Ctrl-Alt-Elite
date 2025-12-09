import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
  userRole?: string
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
)

/**
 * Middleware to verify JWT token from request headers
 * Extracts and validates the token from Authorization header
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      console.warn('⚠️  No token provided in request')
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      })
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.warn('⚠️  Invalid token:', error?.message)
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid or expired token',
      })
    }

    // Attach user info to request
    req.userId = user.id
    req.userEmail = user.email
    req.userRole = user.user_metadata?.role || 'student'

    console.log(`✅ Token verified for user: ${user.email}`)
    next()
  } catch (error) {
    console.error('❌ Token verification error:', error)
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to verify token',
    })
  }
}

/**
 * Middleware to check if user has required role
 * Use after authenticateToken middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.userRole) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User role not found',
      })
    }

    if (!allowedRoles.includes(req.userRole)) {
      console.warn(`⚠️  Access denied - Role '${req.userRole}' not in allowed roles:`, allowedRoles)
      return res.status(403).json({
        error: 'Forbidden',
        message: `You need one of these roles: ${allowedRoles.join(', ')}`,
      })
    }

    console.log(`✅ Role check passed for ${req.userRole}`)
    next()
  }
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  return requireRole(['admin'])(req, res, next)
}

/**
 * Middleware to require driver role
 */
export const requireDriver = (req: AuthRequest, _res: Response, next: NextFunction): void | Response => {
  return requireRole(['driver'])(req, _res, next)
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that can work with or without auth
 */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      // No token - continue without user info
      return next()
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (!error && user) {
      // Attach user info to request
      req.userId = user.id
      req.userEmail = user.email
      req.userRole = user.user_metadata?.role || 'student'
      console.log(`✅ Optional auth - User authenticated: ${user.email}`)
    } else {
      console.warn('⚠️  Optional auth - Invalid token, continuing without auth')
    }

    next()
  } catch (error) {
    console.error('❌ Optional auth error:', error)
    // Don't fail - continue without user info
    next()
  }
}