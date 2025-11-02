import { createContext, useContext, useState, ReactNode } from 'react'

export interface ShuttleLocation {
  id: string
  name: string
  lat: number
  lng: number
  heading: number
  passengers: number
}

export interface Stop {
  id: string
  name: string
  lat: number
  lng: number
}

export interface Route {
  id: string
  name: string
  description: string
  stops: string[]
}

interface ShuttleContextType {
  shuttles: ShuttleLocation[]
  stops: Stop[]
  routes: Route[]
  updateShuttleLocation: (shuttleId: string, location: Partial<ShuttleLocation>) => void
  setShuttles: (shuttles: ShuttleLocation[]) => void
  setStops: (stops: Stop[]) => void
  setRoutes: (routes: Route[]) => void
}

const ShuttleContext = createContext<ShuttleContextType | undefined>(undefined)

export function ShuttleProvider({ children }: { children: ReactNode }) {
  const [shuttles, setShuttles] = useState<ShuttleLocation[]>([
    {
      id: 'shuttle-1',
      name: 'Shuttle 1',
      lat: 41.77,
      lng: -72.64,
      heading: 45,
      passengers: 15,
    },
    {
      id: 'shuttle-2',
      name: 'Shuttle 2',
      lat: 41.768,
      lng: -72.638,
      heading: 180,
      passengers: 22,
    },
  ])

  const [stops, setStops] = useState<Stop[]>([
    { id: 'stop-1', name: 'Main Quad', lat: 41.77, lng: -72.64 },
    { id: 'stop-2', name: 'Long Walk', lat: 41.768, lng: -72.638 },
    { id: 'stop-3', name: 'Athletic Center', lat: 41.772, lng: -72.642 },
    { id: 'stop-4', name: 'Science Center', lat: 41.766, lng: -72.636 },
  ])

  const [routes, setRoutesState] = useState<Route[]>([
    {
      id: 'north-loop',
      name: 'North Campus Loop',
      description: 'Circular route around north campus',
      stops: ['stop-1', 'stop-2', 'stop-3'],
    },
    {
      id: 'south-loop',
      name: 'South Campus Loop',
      description: 'Circular route around south campus',
      stops: ['stop-3', 'stop-4', 'stop-1'],
    },
  ])

  const updateShuttleLocation = (shuttleId: string, location: Partial<ShuttleLocation>) => {
    setShuttles((prev) =>
      prev.map((shuttle) =>
        shuttle.id === shuttleId ? { ...shuttle, ...location } : shuttle
      )
    )
  }

  const setRoutes = (routes: Route[]) => {
    setRoutesState(routes)
  }

  return (
    <ShuttleContext.Provider
      value={{
        shuttles,
        stops,
        routes,
        updateShuttleLocation,
        setShuttles,
        setStops,
        setRoutes,
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
