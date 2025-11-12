import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

let socket: Socket | null = null

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
    })

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })
  }

  return socket
}

export const getSocket = (): Socket | null => {
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// React hook for using socket in components
export const useSocket = () => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null)

  useEffect(() => {
    const sock = initSocket()
    setSocketInstance(sock)

    return () => {
      // Don't disconnect on unmount, keep connection alive
    }
  }, [])

  return socketInstance
}

// Helper functions for emitting events
export const emitShuttleLocation = (data: {
  shuttleId: string
  latitude: number
  longitude: number
  heading?: number
  speed?: number
}) => {
  const sock = getSocket()
  if (sock) {
    sock.emit('shuttle-location-update', data)
  }
}

export const emitDriverStatus = (data: {
  driverId: string
  status: string
  shuttleId?: string
}) => {
  const sock = getSocket()
  if (sock) {
    sock.emit('driver-status-update', data)
  }
}

export const emitRideStatus = (data: {
  rideId: string
  status: string
  location?: { latitude: number; longitude: number }
}) => {
  const sock = getSocket()
  if (sock) {
    sock.emit('ride-status-update', data)
  }
}