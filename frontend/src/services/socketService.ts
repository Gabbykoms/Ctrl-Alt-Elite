import { io, Socket } from 'socket.io-client'

const SOCKET_URL = (import.meta.env as any).VITE_SOCKET_URL || 'http://localhost:3000'

class SocketService {
  private socket: Socket | null = null
  private isConnected = false

  connect(token: string) {
    if (this.socket?.connected) {
      return
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    this.socket.on('connect', () => {
      this.isConnected = true
      console.log('Socket connected')
    })

    this.socket.on('disconnect', () => {
      this.isConnected = false
      console.log('Socket disconnected')
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    this.setupListeners()
  }

  private setupListeners() {
    if (!this.socket) return

    // Listen for shuttle updates
    this.socket.on('shuttle-update', (data) => {
      console.log('Shuttle update received:', data)
      // Dispatch event or update context here
    })

    this.socket.on('route-update', (data) => {
      console.log('Route update received:', data)
    })

    this.socket.on('stop-update', (data) => {
      console.log('Stop update received:', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('Socket not connected. Cannot emit event:', event)
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event)
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
    }
  }
}

export default new SocketService()
