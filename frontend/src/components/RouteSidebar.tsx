import { useState, useMemo } from 'react'
import { ChevronLeft, Search } from 'lucide-react'

interface Route {
  id: string
  name: string
  description?: string
}

interface Stop {
  id: string
  name: string
}

interface RouteSidebarProps {
  routes: Route[]
  stops: Stop[]
  activeRouteIds: string[]
  onRouteToggle: (routeId: string) => void
  onStopSelect: (stopId: string) => void
  isOpen?: boolean
  onClose?: () => void
}

export default function RouteSidebar({
  routes,
  stops,
  activeRouteIds,
  onRouteToggle,
  onStopSelect,
  isOpen = true,
  onClose,
}: RouteSidebarProps) {
  const [activeTab, setActiveTab] = useState<'routes' | 'stops'>('routes')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStops = useMemo(
    () => stops.filter((stop) => stop.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [stops, searchQuery]
  )

  const content = (
    <div className="h-full flex flex-col bg-white shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-bold text-dark">Information</h3>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1">
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('routes')}
          className={`flex-1 py-3 font-medium transition-colors ${
            activeTab === 'routes'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Routes
        </button>
        <button
          onClick={() => setActiveTab('stops')}
          className={`flex-1 py-3 font-medium transition-colors ${
            activeTab === 'stops'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Stops
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'routes' ? (
          <div className="p-4 space-y-2">
            {routes.length === 0 ? (
              <p className="text-gray-500 text-sm">No routes available</p>
            ) : (
              routes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={activeRouteIds.includes(route.id)}
                    onChange={() => onRouteToggle(route.id)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-dark">{route.name}</p>
                    {route.description && <p className="text-xs text-gray-600">{route.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search stops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            {/* Stops List */}
            <div className="space-y-1">
              {filteredStops.length === 0 ? (
                <p className="text-gray-500 text-sm">No stops found</p>
              ) : (
                filteredStops.map((stop) => (
                  <button
                    key={stop.id}
                    onClick={() => onStopSelect(stop.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors text-dark font-medium text-sm"
                  >
                    {stop.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-96 md:flex-col md:border-r md:border-gray-200 md:flex-shrink-0">{content}</aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={onClose} />
          <aside className="md:hidden fixed left-0 top-16 bottom-0 w-80 z-40 flex flex-col">{content}</aside>
        </>
      )}
    </>
  )
}
