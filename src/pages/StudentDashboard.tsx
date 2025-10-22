import { useState, useMemo } from 'react'
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
]

const MOCK_SHUTTLES = [
  { id: 'shuttle-1', name: 'Shuttle 1', lat: 41.77, lng: -72.64 },
  { id: 'shuttle-2', name: 'Shuttle 2', lat: 41.768, lng: -72.638 },
]

export default function StudentDashboard() {
  const [activeRouteIds, setActiveRouteIds] = useState<string[]>(['north-loop'])
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      info: 'Next stop: Main Quad - 5 min',
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

  return (
    <div className="w-full h-full flex">
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

      {/* Map */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <LiveMap pins={mapPins} routes={routes} activeRouteIds={activeRouteIds} />
        </div>
      </div>
    </div>
  )
}
