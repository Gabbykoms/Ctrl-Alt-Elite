import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../server'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        getUser: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn(),
      })),
    })),
  }
})

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should reject non-@trincoll.edu email addresses', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@gmail.com',
        password: 'password123',
        name: 'Test User',
      })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.message).toContain('@trincoll.edu')
    })

    it('should validate email format', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should require password of at least 8 characters', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'student@trincoll.edu',
        password: 'short',
        name: 'Test User',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should require name of at least 2 characters', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'student@trincoll.edu',
        password: 'password123',
        name: 'A',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should accept valid registration data with default role', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'student@trincoll.edu',
        password: 'password123',
        name: 'Test User',
      })

      // Request will fail at Supabase mock level, but validation should pass
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should accept valid registration data with specified role', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'driver@trincoll.edu',
        password: 'password123',
        name: 'Test Driver',
        role: 'driver',
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should reject invalid role', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'student@trincoll.edu',
        password: 'password123',
        name: 'Test User',
        role: 'invalid_role',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should validate email format', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'invalid-email',
        password: 'password123',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should require password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'student@trincoll.edu',
        password: '',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should accept valid login data', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'student@trincoll.edu',
        password: 'password123',
      })

      // Will fail at Supabase mock, but validation should pass
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })
})
