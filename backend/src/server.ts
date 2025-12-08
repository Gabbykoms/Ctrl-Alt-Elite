import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'

// Import routes
import authRoutes from './routes/auth.js'
import shuttleRoutes from './routes/shuttles.js'
import routeRoutes from './routes/routes.js'
import stopRoutes from './routes/stops.js'
import rideRoutes from './routes/rides.js'
import driverRoutes from './routes/drivers.js'

// Import middleware
import { errorHandler } from './middleware/errorHandler.js'

// Import Swagger config
import { swaggerSpec } from './config/swagger.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

const PORT = process.env.PORT || 8080

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Store io instance for use in routes
app.set('io', io)

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { 
  swaggerOptions: { 
    persistAuthorization: true,
  } 
}))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bantam Shuttle Backend is running',
    timestamp: new Date().toISOString(),
  })
})

// Root endpoint
app.get('/', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  res.redirect(frontendUrl)
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/shuttles', shuttleRoutes)
app.use('/api/routes', routeRoutes)
app.use('/api/stops', stopRoutes)
app.use('/api/rides', rideRoutes)
app.use('/api/drivers', driverRoutes)

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`)

  // Listen for shuttle location updates from drivers
  socket.on('shuttle-location-update', (data) => {
    console.log(` Shuttle location update from ${socket.id}:`, data)
    // Broadcast to all connected clients
    io.emit('shuttle-location-update', data)
  })

  // Listen for driver status updates
  socket.on('driver-status-update', (data) => {
    console.log(` Driver status update:`, data)
    io.emit('driver-status-update', data)
  })

  // Listen for ride status updates
  socket.on('ride-status-update', (data) => {
    console.log(` Ride status update:`, data)
    io.emit('ride-status-update', data)
  })

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`)
  })

  socket.on('error', (error) => {
    console.error(` Socket error:`, error)
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
httpServer.listen(PORT, () => {
  console.log(`\n Bantam Shuttle Backend Server`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(` Server running on http://localhost:${PORT}`)
  console.log(` API endpoints: http://localhost:${PORT}/api`)
  console.log(` Swagger UI: http://localhost:${PORT}/api-docs`)
  console.log(` Health check: http://localhost:${PORT}/health`)
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
})

export { app, io }

