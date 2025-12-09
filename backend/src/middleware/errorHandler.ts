import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error {
  status?: number
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || 500
  const message = err.message || 'Internal server error'

  console.error(`❌ Error [${status}]:`, message)

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

