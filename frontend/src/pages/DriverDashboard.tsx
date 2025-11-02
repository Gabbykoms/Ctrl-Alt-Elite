import { useState, useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'

export default function DriverDashboard() {
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [status, setStatus] = useState('offline')
  const [mapError, setMapError] = useState(false)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const token = (import.meta.env as any).VITE_MAPBOX_TOKEN
    
    if (!token) {
      setMapError(true)
      return
    }

    mapboxgl.accessToken = token

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-72.64, 41.77],
        zoom: 15,
      })

      // Add current location marker
      const el = document.createElement('div')
      el.className = 'w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg'
      el.textContent = 'D'

      new mapboxgl.Marker(el).setLngLat([-72.64, 41.77]).addTo(map.current)
    } catch (error) {
      console.error('Failed to initialize map:', error)
      setMapError(true)
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

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

      {/* Map */}
      <div className="flex-1 relative">
        {mapError ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-600">Map not available (add Mapbox token to .env)</p>
          </div>
        ) : (
          <div ref={mapContainer} className="w-full h-full" />
        )}
      </div>
    </div>
  )
}
