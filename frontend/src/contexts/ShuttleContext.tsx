import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { shuttleAPI, stopAPI, routeAPI } from '../services/apiService'
import { useSocket } from '../services/socketService'

export interface ShuttleLocation {
  id: string
  name: string
  lat: number
  lng: number
  heading?: number
  passengers: number
  status: 'active' | 'offline' | 'maintenance'
  vehicleNumber?: string
  assignedDriver?: {
    id: string
    name: string
    email: string
  }
}

export interface Stop {
  id: string
  name: string
  description?: string
  lat: number
  lng: number
}

export interface Route {
  id: string
  name: string
  description?: string
  stops: Stop[]
  distance?: number
  duration?: number
  frequency?: number
}

interface ShuttleContextType {
  shuttles: ShuttleLocation[]
  stops: Stop[]
  routes: Route[]
  loading: boolean
  updateShuttleLocation: (shuttleId: string, location: Partial<ShuttleLocation>) => void
  setShuttles: (shuttles: ShuttleLocation[]) => void
  setStops: (stops: Stop[]) => void
  setRoutes: (routes: Route[]) => void
  refreshShuttles: () => Promise<void>
  refreshStops: () => Promise<void>
  refreshRoutes: () => Promise<void>
}

const ShuttleContext = createContext<ShuttleContextType | undefined>(undefined)

export function ShuttleProvider({ children }: { children: ReactNode }) {
  const [shuttles, setShuttles] = useState<ShuttleLocation[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  const socket = useSocket()

  // Fetch shuttles from backend
  const refreshShuttles = async () => {
    try {
      const response = await shuttleAPI.getShuttles()
      const shuttlesData = response.data.shuttles.map((shuttle: any) => ({
        id: shuttle.id,
        name: shuttle.name,
        lat: shuttle.lastLocation?.lat || 0,
        lng: shuttle.lastLocation?.lng || 0,
        heading: 0,
        passengers: shuttle.currentPassengers || 0,
        status: shuttle.status,
        vehicleNumber: shuttle.vehicleNumber,
        assignedDriver: shuttle.assignedDriver,
      }))
      setShuttles(shuttlesData)
    } catch (error) {
      console.error('Failed to fetch shuttles:', error)
    }
  }

  // Fetch stops from backend
  const refreshStops = async () => {
    try {
      const response = await stopAPI.getStops()
      const stopsData = response.data.stops.map((stop: any) => ({
        id: stop.id,
        name: stop.name,
        description: stop.description,
        lat: parseFloat(stop.latitude),
        lng: parseFloat(stop.longitude),
      }))
      setStops(stopsData)
    } catch (error) {
      console.error('Failed to fetch stops:', error)
    }
  }

  // Fetch routes from backend
  const refreshRoutes = async () => {
    try {
      const response = await routeAPI.getRoutes()
      const routesData = response.data.routes.map((route: any) => ({
        id: route.id,
        name: route.name,
        description: route.description,
        stops: route.stops || [],
        distance: route.distance,
        duration: route.duration,
        frequency: route.frequency,
      }))
      setRoutes(routesData)
    } catch (error) {
      console.error('Failed to fetch routes:', error)
    }
  }

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        refreshShuttles(),
        refreshStops(),
        refreshRoutes(),
      ])
      setLoading(false)
    }

    loadData()
  }, [])

  // Listen for real-time shuttle location updates via Socket.IO
  useEffect(() => {
    if (!socket) return

    socket.on('shuttle-location-update', (data: any) => {
      updateShuttleLocation(data.shuttleId, {
        lat: data.latitude,
        lng: data.longitude,
        heading: data.heading,
      })
    })

    return () => {
      socket.off('shuttle-location-update')
    }
  }, [socket])

  const updateShuttleLocation = (shuttleId: string, location: Partial<ShuttleLocation>) => {
    setShuttles((prev) =>
      prev.map((shuttle) =>
        shuttle.id === shuttleId ? { ...shuttle, ...location } : shuttle
      )
    )
  }

  return (
    <ShuttleContext.Provider
      value={{
        shuttles,
        stops,
        routes,
        loading,
        updateShuttleLocation,
        setShuttles,
        setStops,
        setRoutes,
        refreshShuttles,
        refreshStops,
        refreshRoutes,
      }}
    >
      {children}
    </ShuttleContext.Provider>
  )
}

export function useShuttle() {
  const context = useContext(ShuttleContext)
  if (!context) {
    throw new Error('useShuttle must be used within a ShuttleProvider')
  }
  return context
}