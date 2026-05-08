import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { app } from '../server'

describe('Error Handling', () => {
  it('should handle malformed JSON gracefully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')

    expect(response.status).toBe(400)
  })

  it('should return 404 for POST to non-existent routes', async () => {
    const response = await request(app)
      .post('/api/non-existent')
      .send({ test: 'data' })

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('Not found')
  })

  it('should return 404 for DELETE to non-existent routes', async () => {
    const response = await request(app).delete('/api/non-existent/123')

    expect(response.status).toBe(404)
  })

  it('should return 404 with timestamp', async () => {
    const response = await request(app).get('/api/nonexistent')

    expect(response.body).toHaveProperty('timestamp')
    expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date')
  })
})

describe('API Response Format', () => {
  it('health endpoint should return consistent response format', async () => {
    const response = await request(app).get('/health')

    expect(response.body).toHaveProperty('status')
    expect(response.body).toHaveProperty('message')
    expect(response.body).toHaveProperty('timestamp')
  })

  it('error endpoint should return consistent error format', async () => {
    const response = await request(app).get('/api/unknown')

    expect(response.body).toHaveProperty('error')
    expect(response.body).toHaveProperty('message')
    expect(response.body).toHaveProperty('timestamp')
  })
})

describe('Request Methods', () => {
  it('should handle GET requests', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
  })

  it('should handle POST requests', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@trincoll.edu', password: 'pass' })

    expect(response.status).not.toBe(405) // Method not allowed
  })

  it('should handle OPTIONS requests for CORS', async () => {
    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:5173')

    expect([200, 204]).toContain(response.status)
  })
})
