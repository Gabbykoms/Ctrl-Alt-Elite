import { useState, useMemo } from 'react'
import { Clock, MapPin, AlertCircle, Plus, X, CheckCircle, Loader } from 'lucide-react'
import LiveMap from '../components/LiveMap'
import RouteSidebar from '../components/RouteSidebar'

// Mock data
const MOCK_ROUTES = [
  { id: 'north-loop', name: 'North Campus Loop', description: 'Circular route around north campus' },
  { id: 'south-loop', name: 'South Campus Loop', description: 'Circular route around south campus' },
  { id: 'arts-shuttle', name: 'Arts & Sciences', description: 'Point-to-point shuttle' },
]

const MOCK_STOPS = [
  { id: 'stop-1', name: 'Main Quad' },
  { id: 'stop-2', name: 'Long Walk' },
  { id: 'stop-3', name: 'Athletic Center' },
  { id: 'stop-4', name: 'Science Center' },
  { id: 'stop-5', name: 'Library' },
  { id: 'stop-6', name: 'Crescent Neighborhood' },
  { id: 'stop-7', name: 'Vernon Street' },
  { id: 'stop-8', name: 'Summits' },
]

const MOCK_SHUTTLES = [
  { id: 'shuttle-1', name: 'Shuttle 1', lat: 41.77, lng: -72.64, nextStop: 'Main Quad', eta: '5 min', passengers: 18, capacity: 25 },
  { id: 'shuttle-2', name: 'Shuttle 2', lat: 41.768, lng: -72.638, nextStop: 'Athletic Center', eta: '8 min', passengers: 22, capacity: 25 },
]

const ALERTS = [
  { id: 1, type: 'delay', message: 'North Campus Loop delayed by 5 minutes due to traffic', icon: AlertCircle },
]

interface RideRequest {
  id: string
  startLocation: string
  endLocation: string
  status: 'pending' | 'confirmed' | 'arrived' | 'completed'
  pickupTime?: string
  shuttleAssigned?: string
  estimatedArrival?: string
}

export default function StudentDashboard() {
  const [activeRouteIds, setActiveRouteIds] = useState<string[]>(['north-loop'])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedShuttle, setSelectedShuttle] = useState<string | null>(null)
  const [showRideModal, setShowRideModal] = useState(false)
  const [startLocation, setStartLocation] = useState<string>('')
  const [endLocation, setEndLocation] = useState<string>('')
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const mapPins = useMemo(() => {
    const stops = MOCK_STOPS.map((stop) => ({
      id: stop.id,
      type: 'stop' as const,
      name: stop.name,
      lat: 41.77 + Math.random() * 0.01,
      lng: -72.64 + Math.random() * 0.01,
    }))

    const shuttles = MOCK_SHUTTLES.map((shuttle) => ({
      id: shuttle.id,
      type: 'shuttle' as const,
      name: shuttle.name,
      lat: shuttle.lat,
      lng: shuttle.lng,
      info: `Next stop: ${shuttle.nextStop} - ${shuttle.eta}`,
    }))

    return [...stops, ...shuttles]
  }, [])

  const routes = useMemo(
    () =>
      MOCK_ROUTES.map((route) => ({
        id: route.id,
        coordinates: [[-72.64, 41.77], [-72.642, 41.768], [-72.638, 41.77]] as [number, number][],
      })),
    []
  )

  const handleOrderRide = async () => {
    if (!startLocation || !endLocation) {
      alert('Please select both start and end locations')
      return
    }

    if (startLocation === endLocation) {
      alert('Start and end locations must be different')
      return
    }

    setIsProcessing(true)

    // Simulate API call
    setTimeout(() => {
      const startStop = MOCK_STOPS.find((s) => s.id === startLocation)
      const endStop = MOCK_STOPS.find((s) => s.id === endLocation)
      const randomShuttle = MOCK_SHUTTLES[Math.floor(Math.random() * MOCK_SHUTTLES.length)]
      const pickupMinutes = Math.floor(Math.random() * 8) + 3

      const newRide: RideRequest = {
        id: `ride-${Date.now()}`,
        startLocation: startStop?.name || 'Unknown',
        endLocation: endStop?.name || 'Unknown',
        status: 'confirmed',
        pickupTime: `${pickupMinutes} min`,
        shuttleAssigned: randomShuttle.name,
        estimatedArrival: `${pickupMinutes + Math.floor(Math.random() * 5) + 3} min`,
      }

      setRideRequests((prev) => [newRide, ...prev])
      setShowRideModal(false)
      setStartLocation('')
      setEndLocation('')
      setIsProcessing(false)
    }, 1500)
  }

  const cancelRide = (rideId: string) => {
    setRideRequests((prev) => prev.filter((r) => r.id !== rideId))
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row">
      {/* Route Sidebar */}
      <RouteSidebar
        routes={MOCK_ROUTES}
        stops={MOCK_STOPS}
        activeRouteIds={activeRouteIds}
        onRouteToggle={(routeId) => {
          setActiveRouteIds((prev) =>
            prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId]
          )
        }}
        onStopSelect={(stopId) => {
          console.log('Stop selected:', stopId)
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Alerts */}
        {ALERTS.length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-3 space-y-2 animate-in fade-in">
            {ALERTS.map((alert) => (
              <div key={alert.id} className="flex items-center gap-2 text-yellow-800">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Active Rides */}
        {rideRequests.length > 0 && (
          <div className="bg-green-50 border-b border-green-200 p-4 space-y-3">
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              <CheckCircle size={18} />
              Active Rides ({rideRequests.length})
            </h3>
            <div className="space-y-2">
              {rideRequests.map((ride) => (
                <div key={ride.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-dark">
                      {ride.startLocation} → {ride.endLocation}
                    </p>
                    <p className="text-sm text-gray-600">
                       {ride.shuttleAssigned} arriving in {ride.pickupTime}
                    </p>
                  </div>
                  <button
                    onClick={() => cancelRide(ride.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Ride Button
        <div className="bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => setShowRideModal(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-opacity-90 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg border-2 border-primary"
          > */}
          <div className="bg-white border-b border-gray-200 p-4">
            <button
              onClick={() => setShowRideModal(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"      >



            <Plus size={24} />
            <span className="text-lg">Order a Ride</span>
          </button>
        </div>

        {/* Shuttle Info Cards */}
        <div className="bg-white border-b border-gray-200 p-4 overflow-x-auto">
          <p className="text-xs text-gray-600 mb-2 px-2">Available Shuttles</p>
          <div className="flex gap-4 min-w-min">
            {MOCK_SHUTTLES.map((shuttle) => (
              <div
                key={shuttle.id}
                onClick={() => setSelectedShuttle(shuttle.id)}
                className={`flex-shrink-0 p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                  selectedShuttle === shuttle.id
                    ? 'border-primary bg-primary bg-opacity-10'
                    : 'border-gray-200 bg-white hover:border-primary'
                }`}
              >
                <div className="w-48">
                  <h3 className="font-semibold text-dark mb-2">{shuttle.name}</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin size={16} className="text-primary" />
                      <span>{shuttle.nextStop}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={16} className="text-primary" />
                      <span>ETA: {shuttle.eta}</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Capacity</p>
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            shuttle.passengers / shuttle.capacity > 0.8
                              ? 'bg-red-500'
                              : shuttle.passengers / shuttle.capacity > 0.5
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${(shuttle.passengers / shuttle.capacity) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{shuttle.passengers}/{shuttle.capacity}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 overflow-hidden">
          <LiveMap pins={mapPins} routes={routes} activeRouteIds={activeRouteIds} />
        </div>
      </div>

      {/* Ride Ordering Modal */}
      {showRideModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowRideModal(false)}
          />

          
          <div className="fixed bottom-0 left-0 right-0 md:right-auto md:left-auto md:top-1/2 md:transform md:-translate-y-1/2 md:max-w-md z-50 bg-white rounded-t-lg md:rounded-lg shadow-2xl max-h-96 overflow-y-auto md:m-auto md:inset-auto md:w-96">
              <div className="sticky top-0 bg-blue-600 text-white p-4 flex items-center justify-between rounded-t-lg">
              <h2 className="font-bold text-lg">🚕 Order a Ride</h2>
              <button
                onClick={() => setShowRideModal(false)}
                className="p-1 hover:bg-opacity-80 rounded"
              >
                <X size={20} />
              </button>
            </div>


            <div className="p-6 space-y-4">
              {/* Start Location */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Pickup Location</label>
                <select
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select pickup location</option>
                  {MOCK_STOPS.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Location */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Destination</label>
                <select
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select destination</option>
                  {MOCK_STOPS.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.name}
                    </option>
                  ))}
                </select>
              </div>

             
              {/* Order Button */}
              <button
                onClick={handleOrderRide}
                disabled={isProcessing || !startLocation || !endLocation}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >

                {isProcessing ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Searching for shuttle...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Order Ride
                  </>
                )}
              </button>

              {/* Info */}
              <p className="text-xs text-gray-600 text-center">
                No charges • Rides are free for Trinity students
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
