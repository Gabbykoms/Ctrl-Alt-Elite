import { describe, it, expect } from 'vitest'
import { z } from 'zod'

describe('Validation Schemas', () => {
  // Email validation
  describe('Email Validation', () => {
    const emailSchema = z.string().email('Invalid email address')

    it('should accept valid email addresses', () => {
      expect(() => emailSchema.parse('student@trincoll.edu')).not.toThrow()
      expect(() => emailSchema.parse('driver@trincoll.edu')).not.toThrow()
      expect(() => emailSchema.parse('admin@trincoll.edu')).not.toThrow()
    })

    it('should reject invalid email formats', () => {
      expect(() => emailSchema.parse('not-an-email')).toThrow()
      expect(() => emailSchema.parse('missing@domain')).toThrow()
      expect(() => emailSchema.parse('@domain.com')).toThrow()
      expect(() => emailSchema.parse('user@')).toThrow()
    })

    it('should reject empty strings', () => {
      expect(() => emailSchema.parse('')).toThrow()
    })
  })

  // Password validation
  describe('Password Validation', () => {
    const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')

    it('should accept passwords with 8+ characters', () => {
      expect(() => passwordSchema.parse('password123')).not.toThrow()
      expect(() => passwordSchema.parse('VerySecurePassword')).not.toThrow()
      expect(() => passwordSchema.parse('P@ssw0rd!')).not.toThrow()
    })

    it('should reject passwords shorter than 8 characters', () => {
      expect(() => passwordSchema.parse('pass')).toThrow()
      expect(() => passwordSchema.parse('short')).toThrow()
      expect(() => passwordSchema.parse('1234567')).toThrow()
    })

    it('should reject empty passwords', () => {
      expect(() => passwordSchema.parse('')).toThrow()
    })
  })

  // Name validation
  describe('Name Validation', () => {
    const nameSchema = z.string().min(2, 'Name must be at least 2 characters')

    it('should accept names with 2+ characters', () => {
      expect(() => nameSchema.parse('Jo')).not.toThrow()
      expect(() => nameSchema.parse('John Doe')).not.toThrow()
      expect(() => nameSchema.parse('Mary Jane Smith')).not.toThrow()
    })

    it('should reject names shorter than 2 characters', () => {
      expect(() => nameSchema.parse('J')).toThrow()
      expect(() => nameSchema.parse('')).toThrow()
    })
  })

  // Role validation
  describe('Role Validation', () => {
    const roleSchema = z.enum(['student', 'driver', 'admin']).default('student')

    it('should accept valid roles', () => {
      expect(() => roleSchema.parse('student')).not.toThrow()
      expect(() => roleSchema.parse('driver')).not.toThrow()
      expect(() => roleSchema.parse('admin')).not.toThrow()
    })

    it('should reject invalid roles', () => {
      expect(() => roleSchema.parse('superadmin')).toThrow()
      expect(() => roleSchema.parse('user')).toThrow()
      expect(() => roleSchema.parse('guest')).toThrow()
    })

    it('should default to student role', () => {
      const result = roleSchema.parse(undefined)
      expect(result).toBe('student')
    })
  })

  // Combined registration schema
  describe('Registration Schema', () => {
    const registerSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      role: z.enum(['student', 'driver', 'admin']).default('student'),
    })

    it('should accept valid registration data', () => {
      const validData = {
        email: 'student@trincoll.edu',
        password: 'password123',
        name: 'John Doe',
        role: 'student',
      }
      expect(() => registerSchema.parse(validData)).not.toThrow()
    })

    it('should accept registration with default role', () => {
      const data = {
        email: 'student@trincoll.edu',
        password: 'password123',
        name: 'John Doe',
      }
      const result = registerSchema.parse(data)
      expect(result.role).toBe('student')
    })

    it('should reject incomplete data', () => {
      const incompleteData = {
        email: 'student@trincoll.edu',
        password: 'password123',
      }
      expect(() => registerSchema.parse(incompleteData)).toThrow()
    })
  })

  // Combined login schema
  describe('Login Schema', () => {
    const loginSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    })

    it('should accept valid login data', () => {
      const validData = {
        email: 'student@trincoll.edu',
        password: 'password123',
      }
      expect(() => loginSchema.parse(validData)).not.toThrow()
    })

    it('should reject empty password', () => {
      const data = {
        email: 'student@trincoll.edu',
        password: '',
      }
      expect(() => loginSchema.parse(data)).toThrow()
    })

    it('should reject missing email', () => {
      const data = {
        password: 'password123',
      }
      expect(() => loginSchema.parse(data)).toThrow()
    })
  })
})
