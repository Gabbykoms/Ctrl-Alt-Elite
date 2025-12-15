import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bantam Shuttle Backend API',
      version: '1.0.0',
      description:
        'API for Trinity College Bantam Shuttle tracking system. Real-time shuttle tracking, ride booking, and driver management.',
      contact: {
        name: 'Ctrl-Alt-Elite Team',
        email: 'support@bantamshuttle.local',
      },
    },
    servers: [
      {
        url: 'http://shuttle.javajon-gke.duckdns.org',
        description: 'Production server (GKE)',
      },
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://api.bantamshuttle.local',
        description: 'Production server (backup)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'student', 'driver'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Stop: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            address: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Route: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Shuttle: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            shuttle_number: { type: 'string' },
            capacity: { type: 'integer' },
            status: { type: 'string', enum: ['active', 'inactive', 'maintenance'] },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        Ride: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            shuttle_id: { type: 'string', format: 'uuid' },
            pickup_stop_id: { type: 'string', format: 'uuid' },
            dropoff_stop_id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  // EDITED: Now looks for .ts in src AND .js in dist
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
}

export const swaggerSpec = swaggerJsdoc(options)