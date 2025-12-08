import { useState, useEffect } from 'react'
import LiveMap from '../components/LiveMap'
import { trackingAPI } from '../services/apiService'

interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
}

interface Shuttle {
  id: string
  name: string
  lat: number
  lng: number
  nextStop: string
  eta: string
  passengers: number
  capacity: number
}

export default function DriverDashboard() {
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [status, setStatus] = useState('offline')
  const [stops, setStops] = useState<Stop[]>([])
  const [isLoadingStops, setIsLoadingStops] = useState(false)
  const [shuttles, setShuttles] = useState<Shuttle[]>([])
  const [isLoadingShuttles, setIsLoadingShuttles] = useState(false)

  // Load stops from API
  useEffect(() => {
    const loadStops = async () => {
      try {
        setIsLoadingStops(true)
        const response = await trackingAPI.getAllStops()
        if (response && response.stops) {
          setStops(response.stops)
        }
      } catch (error) {
        console.error('Error loading stops:', error)
        // Fallback to default stops
        setStops([
          { id: 'stop-1', name: 'Main Quad', latitude: 41.747, longitude: -72.683 },
          { id: 'stop-2', name: 'Athletic Center', latitude: 41.745, longitude: -72.680 },
          { id: 'stop-3', name: 'Science Center', latitude: 41.748, longitude: -72.686 },
        ])
      } finally {
        setIsLoadingStops(false)
      }
    }
    loadStops()
  }, [])

  // Load shuttles from tracking service (real bus locations)
  useEffect(() => {
    const loadShuttles = async () => {
      try {
        setIsLoadingShuttles(true)
        const TRACKING_SERVICE_URL = import.meta.env.VITE_TRACKING_SERVICE_URL || 'http://localhost:8081'
        const response = await fetch(`${TRACKING_SERVICE_URL}/v1/locations/latest/org/trinity`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const buses = await response.json()
        
        if (Array.isArray(buses) && buses.length > 0) {
          // Convert microdegrees to decimal degrees and format as shuttles
          const formattedShuttles: Shuttle[] = buses.map((bus, index) => ({
            id: bus.deviceId || `bus-${index}`,
            name: `${bus.deviceId || 'Bus'}`,
            lat: bus.latMicro ? bus.latMicro / 1_000_000 : 41.77,
            lng: bus.lonMicro ? bus.lonMicro / 1_000_000 : -72.64,
            nextStop: 'In Transit',
            eta: `${Math.floor(Math.random() * 8) + 2} min`,
            passengers: Math.floor(Math.random() * 25),
            capacity: 25,
          }))
          
          console.log('Loaded shuttles from tracking service:', formattedShuttles)
          setShuttles(formattedShuttles)
        } else {
          console.warn('No buses found in tracking service')
          setShuttles([])
        }
      } catch (error) {
        console.error('Error loading shuttles from tracking service:', error)
        setShuttles([])
      } finally {
        setIsLoadingShuttles(false)
      }
    }
    
    // Load initially
    loadShuttles()
    
    // Poll for updates every 5 seconds to see buses move
    const interval = setInterval(loadShuttles, 5000)
    return () => clearInterval(interval)
  }, [])

  // Driver stops for the map
  const mapPins = [
    ...stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      type: 'stop' as const,
      lat: stop.latitude,
      lng: stop.longitude,
    })),
    // Add shuttle markers
    ...shuttles.map(shuttle => ({
      id: shuttle.id,
      type: 'shuttle' as const,
      name: shuttle.name,
      lat: shuttle.lat,
      lng: shuttle.lng,
      info: `${shuttle.passengers}/${shuttle.capacity} passengers · ${shuttle.eta}`,
    }))
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Top Panel */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Clock In/Out Toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dark">Driver Dashboard</h2>
            <button
              onClick={() => setIsClockedIn(!isClockedIn)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors text-white ${
                isClockedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </div>

          {/* Status Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary bg-opacity-10 rounded-lg p-4">
              <p className="text-sm text-gray-600">Current Status</p>
              <p className="text-xl font-bold text-dark capitalize">{status}</p>
            </div>
            <div className="bg-accent bg-opacity-10 rounded-lg p-4">
              <p className="text-sm text-gray-600">Clocked In</p>
              <p className="text-xl font-bold text-dark">{isClockedIn ? 'Yes' : 'No'}</p>
            </div>
            <div className="bg-secondary bg-opacity-10 rounded-lg p-4">
              <p className="text-sm text-gray-600">Current Route</p>
              <p className="text-xl font-bold text-dark">North Loop</p>
            </div>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Set Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!isClockedIn}
              className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="offline">Offline</option>
              <option value="on-route">On Route</option>
              <option value="on-break">On Break</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map using LiveMap component */}
      <div className="flex-1 relative">
        <LiveMap pins={mapPins} />
      </div>
    </div>
  )
}
