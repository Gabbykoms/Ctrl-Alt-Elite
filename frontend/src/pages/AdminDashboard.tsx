import { useState, useRef, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import mapboxgl from 'mapbox-gl'

const PEAK_USAGE_DATA = [
  { time: '6 AM', count: 45 },
  { time: '8 AM', count: 120 },
  { time: '10 AM', count: 85 },
  { time: '12 PM', count: 150 },
  { time: '2 PM', count: 95 },
  { time: '4 PM', count: 110 },
  { time: '6 PM', count: 160 },
]

const ROUTE_POPULARITY = [
  { name: 'North Loop', riders: 450 },
  { name: 'South Loop', riders: 380 },
  { name: 'Arts & Sciences', riders: 320 },
  { name: 'Medical Center', riders: 290 },
  { name: 'Library Shuttle', riders: 210 },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'live' | 'analytics'>('live')
  const [mapError, setMapError] = useState(false)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (activeTab !== 'live' || !mapContainer.current || map.current) return

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
        zoom: 14,
      })

      // Add route lines and shuttles
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('div')
        el.className = 'w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shadow-lg'
        el.textContent = 'S'

        const lat = 41.77 + (Math.random() - 0.5) * 0.02
        const lng = -72.64 + (Math.random() - 0.5) * 0.02

        new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Shuttle ${i + 1}</strong><p>Passengers: ${Math.floor(Math.random() * 30 + 10)}</p>`))
          .addTo(map.current!)
      }
    } catch (error) {
      console.error('Failed to initialize map:', error)
      setMapError(true)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [activeTab])

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 py-4 font-semibold transition-colors ${
            activeTab === 'live'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Live View
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-4 font-semibold transition-colors ${
            activeTab === 'analytics'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'live' ? (
          mapError ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-600">Map not available (add Mapbox token to .env)</p>
            </div>
          ) : (
            <div ref={mapContainer} className="w-full h-full" />
          )
        ) : (
          <div className="p-6 space-y-8">
            {/* Peak Usage Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-dark mb-4">Peak Usage by Hour</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={PEAK_USAGE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#004179" name="Number of Riders" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Route Popularity Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-dark mb-4">Route Popularity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ROUTE_POPULARITY}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="riders" stroke="#F3C404" name="Total Riders" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary bg-opacity-10 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Shuttles</p>
                <p className="text-3xl font-bold text-primary">12</p>
              </div>
              <div className="bg-accent bg-opacity-10 rounded-lg p-4">
                <p className="text-sm text-gray-600">Active Routes</p>
                <p className="text-3xl font-bold text-accent">5</p>
              </div>
              <div className="bg-secondary bg-opacity-10 rounded-lg p-4">
                <p className="text-sm text-gray-600">Today's Riders</p>
                <p className="text-3xl font-bold text-secondary">2,145</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
