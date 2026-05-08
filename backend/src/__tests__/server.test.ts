import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { app, io } from '../server'

describe('Backend Server', () => {
  // Health check endpoint
  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('message', 'Bantam Shuttle Backend is running')
      expect(response.body).toHaveProperty('timestamp')
    })

    it('should return valid timestamp in ISO format', async () => {
      const response = await request(app).get('/health')

      const timestamp = new Date(response.body.timestamp)
      expect(timestamp.toString()).not.toBe('Invalid Date')
    })
  })

  // Root endpoint
  describe('GET /', () => {
    it('should redirect to frontend URL', async () => {
      const response = await request(app).get('/')

      expect(response.status).toBe(302)
    })
  })

  // 404 error handling
  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Not found')
      expect(response.body).toHaveProperty('message')
    })

    it('should include route info in error message', async () => {
      const response = await request(app).get('/api/unknown-route')

      expect(response.body.message).toContain('GET')
      expect(response.body.message).toContain('/api/unknown-route')
    })
  })

  // CORS configuration
  describe('CORS', () => {
    it('should allow requests from frontend URL', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173')

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    })
  })

  // Socket.IO connection
  describe('Socket.IO', () => {
    it('should have io instance configured', () => {
      expect(io).toBeDefined()
      expect(io.engine).toBeDefined()
    })

    it('should have CORS enabled for Socket.IO', () => {
      expect(io.opts.cors).toBeDefined()
      expect(io.opts.cors?.origin).toContain('localhost:5173')
    })
  })

  // Content-Type handling
  describe('Content-Type', () => {
    it('should accept JSON body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@trincoll.edu', password: 'password123' })

      // Will fail auth but should parse JSON (not 400 for JSON parsing)
      expect(response.status).not.toBe(400)
    })
  })
})
