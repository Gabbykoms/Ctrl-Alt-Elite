import React, { createContext, useContext, ReactNode } from 'react'

interface Shuttle {
  id: string
  name: string
  vehicleNumber: string
  capacity: number
  currentPassengers: number
  status: 'active' | 'inactive' | 'maintenance'
  lastLocation?: {
    lat: number
    lng: number
  }
  lastLocationUpdate?: string
}

interface ShuttleContextType {
  shuttles: Shuttle[]
  loading: boolean
  error: string | null
  fetchShuttles: () => Promise<void>
}

const ShuttleContext = createContext<ShuttleContextType | undefined>(undefined)

export const ShuttleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shuttles, setShuttles] = React.useState<Shuttle[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchShuttles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shuttles')
      if (!response.ok) throw new Error('Failed to fetch shuttles')
      const data = await response.json()
      setShuttles(data.shuttles || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchShuttles()
  }, [])

  return (
    <ShuttleContext.Provider value={{ shuttles, loading, error, fetchShuttles }}>
      {children}
    </ShuttleContext.Provider>
  )
}

export const useShuttle = () => {
  const context = useContext(ShuttleContext)
  if (context === undefined) {
    throw new Error('useShuttle must be used within ShuttleProvider')
  }
  return context
}
