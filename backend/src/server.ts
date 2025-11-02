import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Handle root route (for Supabase email verification redirects)
app.get('/', (req, res) => {
  // Check if this is an email verification callback
  if (req.query.token_hash && req.query.type) {
    // Redirect to the verification endpoint
    return res.redirect(`/api/auth/verify-email?token_hash=${req.query.token_hash}&type=${req.query.type}`)
  }
  // Otherwise, redirect to API docs or frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  res.redirect(frontendUrl)
})

// API Routes
app.use('/api/auth', authRoutes)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
})

