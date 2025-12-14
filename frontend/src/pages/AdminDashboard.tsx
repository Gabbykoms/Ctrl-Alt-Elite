import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, Loader } from 'lucide-react'
import LiveMap from '../components/LiveMap'
import { trackingAPI } from '../services/apiService'

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

interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
  description?: string
  is_active?: boolean
}

interface ClickPosition {
  lat: number
  lng: number
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'live' | 'analytics' | 'stops'>('live')
  const [stops, setStops] = useState<Stop[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showAddStopModal, setShowAddStopModal] = useState(false)
  const [stopName, setStopName] = useState('')
  const [clickPosition, setClickPosition] = useState<ClickPosition | null>(null)
  const [_feedbackMessage, _setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [highlightedStopId, setHighlightedStopId] = useState<string | null>(null)
  const [shuttles, setShuttles] = useState<Shuttle[]>([])
  const [_isLoadingShuttles, setIsLoadingShuttles] = useState(false)

  // Load stops on mount
  useEffect(() => {
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
          
          console.log(' Loaded shuttles from tracking service:', formattedShuttles)
          setShuttles(formattedShuttles)
        } else {
          console.warn(' No buses found in tracking service')
          setShuttles([])
        }
      } catch (error) {
        console.error(' Error loading shuttles from tracking service:', error)
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

  const loadStops = async () => {
    try {
      setIsLoading(true)
      const response = await trackingAPI.getAllStops()
      if (response && response.stops) {
        setStops(response.stops)
      }
    } catch (error) {
      console.error('Error loading stops:', error)
      _setFeedbackMessage({ type: 'error', text: 'Failed to load stops' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStop = async () => {
    // Validate coordinates first
    if (!clickPosition) {
      _setFeedbackMessage({ type: 'error', text: 'Please click on the map to select a location' })
      return
    }

    // Validate name
    if (!stopName.trim()) {
      _setFeedbackMessage({ type: 'error', text: 'Stop name is required' })
      return
    }

    try {
      setIsLoading(true)
      const newStop = await trackingAPI.createStop({
        name: stopName,
        latitude: clickPosition.lat,
        longitude: clickPosition.lng,
      })

      if (newStop.id) {
        setStops([...stops, newStop])
        setShowNameModal(false)
        setShowAddStopModal(false)
        setStopName('')
        setClickPosition(null)
        _setFeedbackMessage({ type: 'success', text: `Stop "${newStop.name}" added successfully` })
      }
    } catch (error) {
      console.error('Error adding stop:', error)
      _setFeedbackMessage({ type: 'error', text: 'Failed to add stop' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStop = async (stopId: string, stopName: string) => {
    if (!window.confirm(`Delete stop "${stopName}"?`)) return

    try {
      setIsLoading(true)
      await trackingAPI.deleteStop(stopId)
      setStops(stops.filter(s => s.id !== stopId))
      _setFeedbackMessage({ type: 'success', text: `Stop "${stopName}" deleted` })
    } catch (error) {
      console.error('Error deleting stop:', error)
      _setFeedbackMessage({ type: 'error', text: 'Failed to delete stop' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    console.log('handleMapClick called:', { lat, lng, currentClickPosition: clickPosition })
    if (clickPosition && clickPosition.lat === lat && clickPosition.lng === lng) {
      // Same location clicked again - remove the pin
      console.log('Removing pin (same location clicked twice)')
      setClickPosition(null)
    } else {
      // New location - set the pin
      console.log('Setting pin to:', { lat, lng })
      setClickPosition({ lat, lng })
    }
  }

  // Handle stop click to highlight it on the map
  const handleStopClick = (stopId: string) => {
    setHighlightedStopId(stopId)
    // Remove highlight after 3 seconds
    setTimeout(() => {
      setHighlightedStopId(null)
    }, 3000)
  }

  // Map pins for live view
  const mapPins = [
    ...stops.map(stop => ({
      id: stop.id,
      name: stop.name,
      type: 'stop' as const,
      lat: stop.latitude,
      lng: stop.longitude,
      isHighlighted: highlightedStopId === stop.id,
    })),
    // Add shuttle markers
    ...shuttles.map(shuttle => ({
      id: shuttle.id,
      type: 'shuttle' as const,
      name: shuttle.name,
      lat: shuttle.lat,
      lng: shuttle.lng,
      info: `${shuttle.passengers}/${shuttle.capacity} passengers · ${shuttle.eta}`,
    })),
    // Add temporary pin being placed during add stop process
    ...(showAddStopModal && clickPosition ? [{
      id: 'temp-pin',
      name: stopName,
      type: 'stop' as const,
      lat: clickPosition.lat,
      lng: clickPosition.lng,
    }] : [])
  ]
  
  console.log('mapPins updated:', { showAddStopModal, clickPosition, mapPinsCount: mapPins.length, hasTempPin: mapPins.some(p => p.id === 'temp-pin') })

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
      <div className="flex-1 overflow-auto flex flex-col">
        {activeTab === 'live' ? (
          <div className="flex-1 relative flex flex-col">
            {/* Map takes up most of the space */}
            <div className="flex-1 relative">
              <LiveMap pins={mapPins} onMapClick={showAddStopModal ? handleMapClick : undefined} />
              
              {/* Top Info Banner - Only when in add mode */}
              {showAddStopModal && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border-l-4 border-primary text-primary px-6 py-3 rounded-lg shadow-lg z-40 max-w-md">
                  <p className="font-bold text-base mb-1">Click anywhere on the map to place your stop pin</p>
                  <p className="text-sm">Then click "Complete" to finish</p>
                </div>
              )}

              {/* Step 1: Name Modal */}
              {showNameModal && !showAddStopModal && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold mb-4">Create New Stop</h2>
                    
                    <p className="text-gray-600 mb-4">What would you like to name this stop?</p>

                    {/* Stop Name Input */}
                    <input
                      type="text"
                      placeholder="Enter stop name"
                      value={stopName}
                      onChange={e => setStopName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-primary text-lg"
                      autoFocus
                      onKeyPress={e => {
                        if (e.key === 'Enter' && stopName.trim()) {
                          setShowNameModal(false)
                          setShowAddStopModal(true)
                        }
                      }}
                    />

                    {/* Modal Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowNameModal(false)
                          setShowAddStopModal(true)
                        }}
                        disabled={!stopName.trim()}
                        className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => {
                          setShowNameModal(false)
                          setStopName('')
                        }}
                        className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Control Panel - Always visible */}
            <div className="bg-white border-t border-gray-300 shadow-2xl p-4 z-40">
              <div className="w-full">
                {/* Top row: Title and Add Button */}
                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Stop Management</h3>
                    <p className="text-sm text-gray-600">{stops.length} stop{stops.length !== 1 ? 's' : ''} created</p>
                  </div>
                  
                  <button
                    onClick={() => setShowNameModal(true)}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-base whitespace-nowrap disabled:opacity-50 transition-all flex-shrink-0 shadow-lg ${
                      showAddStopModal
                        ? 'bg-green-600 text-white ring-4 ring-offset-2 ring-green-400 animate-pulse' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    <Plus size={20} />
                    {showAddStopModal ? '← Click Map' : 'Add Stop'}
                  </button>
                </div>

                {/* Existing stops list */}
                {stops.length > 0 && (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-2 min-w-min">
                      {stops.map(stop => (
                        <div
                          key={stop.id}
                          onClick={() => handleStopClick(stop.id)}
                          className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 group relative border border-gray-200 flex-shrink-0 w-40 cursor-pointer transition-all"
                        >
                          <p className="font-semibold text-gray-900 text-sm truncate">{stop.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {stop.latitude.toFixed(3)}, {stop.longitude.toFixed(3)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteStop(stop.id, stop.name)
                            }}
                            disabled={isLoading}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50 shadow-md"
                            title={`Delete ${stop.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Map Pin Placement Panel */}
            {showAddStopModal && (
              <div className="absolute bottom-24 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl p-4 z-40">
                <div className="flex items-center justify-between max-w-6xl mx-auto px-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Placing: {stopName}</h3>
                    {clickPosition ? (
                      <>
                        <p className="text-sm text-green-600 font-semibold">
                           Location Selected: ({clickPosition.lat.toFixed(4)}, {clickPosition.lng.toFixed(4)})
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Click the same spot again to deselect, or click elsewhere to move the pin</p>
                      </>
                    ) : (
                      <p className="text-sm text-orange-600 font-semibold">
                        👆 Click on the map to place your stop pin
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddStop}
                      disabled={!clickPosition || isLoading}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center gap-2 whitespace-nowrap"
                    >
                      {isLoading ? <Loader size={20} className="animate-spin" /> : 'Add Stop'}
                      Complete
                    </button>
                    <button
                      onClick={() => {
                        setShowAddStopModal(false)
                        setShowNameModal(true)
                        setClickPosition(null)
                      }}
                      className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
