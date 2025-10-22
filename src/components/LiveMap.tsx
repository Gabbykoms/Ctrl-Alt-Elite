import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

interface MapPin {
  id: string
  lat: number
  lng: number
  type: 'stop' | 'shuttle'
  name: string
  info?: string
  onPopupOpen?: (id: string) => void
}

interface LiveMapProps {
  pins: MapPin[]
  routes?: Array<{ id: string; coordinates: [number, number][] }>
  activeRouteIds?: string[]
}

export default function LiveMap({ pins, routes = [], activeRouteIds = [] }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map - using a basic MapBox style
    // Note: You'll need to set your Mapbox token in environment variables
    const token = (import.meta.env as any).VITE_MAPBOX_TOKEN
    
    if (!token) {
      setMapError(true)
      console.warn('Mapbox token not configured. Map will not display.')
      return
    }

    mapboxgl.accessToken = token

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-72.64, 41.77], // Trinity College coordinates
        zoom: 15,
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    } catch (error) {
      console.error('Failed to initialize map:', error)
      setMapError(true)
    }

    return () => {
      map.current?.remove()
    }
  }, [])

  // Update markers when pins change
  useEffect(() => {
    if (!map.current) return

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    // Add new markers
    pins.forEach((pin) => {
      const el = document.createElement('div')
      el.className = `w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
        pin.type === 'stop' ? 'bg-primary' : 'bg-accent'
      } text-white font-bold text-sm shadow-lg`
      el.textContent = pin.type === 'stop' ? 'S' : 'B'

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2"><strong>${pin.name}</strong>${pin.info ? `<p class="text-sm mt-1">${pin.info}</p>` : ''}</div>`
          )
        )
        .addTo(map.current!)

      el.addEventListener('click', () => {
        marker.togglePopup()
        pin.onPopupOpen?.(pin.id)
      })

      markersRef.current.set(pin.id, marker)
    })
  }, [pins])

  // Draw routes when they change
  useEffect(() => {
    if (!map.current) return

    // Remove old route layers
    activeRouteIds.forEach((routeId) => {
      const layerId = `route-${routeId}`
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId)
      }
      const sourceId = `route-source-${routeId}`
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId)
      }
    })

    // Add new route layers
    activeRouteIds.forEach((routeId) => {
      const route = routes.find((r) => r.id === routeId)
      if (!route) return

      const sourceId = `route-source-${routeId}`
      const layerId = `route-${routeId}`

      if (!map.current?.getSource(sourceId)) {
        map.current?.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates,
            },
            properties: {},
          },
        })
      }

      if (!map.current?.getLayer(layerId)) {
        map.current?.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#004179',
            'line-width': 3,
            'line-opacity': 0.7,
          },
        })
      }
    })
  }, [routes, activeRouteIds])

  if (mapError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-2">Map Preview Not Available</p>
          <p className="text-sm text-gray-500">Add your Mapbox token to .env to enable the map</p>
        </div>
      </div>
    )
  }

  return <div ref={mapContainer} className="w-full h-full" />
}
