

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

  // Effect 1: Initialize the map
  useEffect(() => {
    if (!mapContainer.current) return

    const token = import.meta.env.VITE_MAPBOX_TOKEN
    
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
        center: [-72.685, 41.746], // Centered on Trinity College
        zoom: 15,
      })

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    } catch (error) {
      console.error('Failed to initialize map:', error)
      setMapError(true)
    }

    // Cleanup function
    return () => {
      map.current?.remove()
    }
  }, []) // Empty dependency array ensures this runs only once

  // Effect 2: Update markers when pins change
  useEffect(() => {
    if (!map.current) return

    // This logic is fine: remove all markers and add the new set
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    pins.forEach((pin) => {
      const el = document.createElement('div')
      // Using your project's Tailwind colors (primary/accent)
      el.className = `w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
        pin.type === 'stop' ? 'bg-primary' : 'bg-accent'
      } text-white font-bold text-sm shadow-lg border-2 border-white`
      el.textContent = pin.type === 'stop' ? 'S' : 'B' // 'S' for Stop, 'B' for Bantam/Bus

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-1 font-sans"><strong>${pin.name}</strong>${pin.info ? `<p class="text-sm mt-1">${pin.info}</p>` : ''}</div>`
          )
        )
        .addTo(map.current!)

      // Using 'click' on the custom element is more reliable
      el.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent map click event
        marker.togglePopup()
        pin.onPopupOpen?.(pin.id)
      })

      markersRef.current.set(pin.id, marker)
    })
  }, [pins]) // Re-runs whenever the pins prop changes

  // Effect 3: Draw routes when routes or activeRouteIds change
  useEffect(() => {
    if (!map.current) return

    // This function contains the logic to update routes
    const updateMapRoutes = () => {
      // 1. FIX FOR DESELECTION BUG:
      // Get all route layers currently on the map
      const allMapLayers = map.current?.getStyle().layers || []
      const currentRouteLayerIds = allMapLayers
        .map((layer) => layer.id)
        .filter((id) => id.startsWith('route-'))

      // Loop over layers ON THE MAP and remove any that are NOT active
      currentRouteLayerIds.forEach((layerId) => {
        const routeId = layerId.replace('route-', '')
        
        // If this map layer is NOT in our activeRouteIds, remove it
        if (!activeRouteIds.includes(routeId)) {
          const sourceId = `route-source-${routeId}`
          if (map.current?.getLayer(layerId)) {
            map.current.removeLayer(layerId)
          }
          if (map.current?.getSource(sourceId)) {
            map.current.removeSource(sourceId)
          }
        }
      })

      // 2. ADD NEW/ACTIVE ROUTES
      activeRouteIds.forEach((routeId) => {
        const route = routes.find((r) => r.id === routeId)
        if (!route) return // This route isn't in our props, skip

        const sourceId = `route-source-${routeId}`
        const layerId = `route-${routeId}`

        // Only add if it doesn't already exist on the map
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
              'line-color': '#004179', // Trinity Blue (bg-primary)
              'line-width': 4,
              'line-opacity': 0.75,
            },
          })
        }
      })
    }

    // 3. FIX FOR RACE CONDITION:
    // Check if the map's style is loaded.
    if (!map.current.isStyleLoaded()) {
      // If not, wait for it to load ('load' fires only once)
      map.current.once('load', updateMapRoutes)
    } else {
      // If it is loaded, update routes immediately.
      updateMapRoutes()
    }

  }, [routes, activeRouteIds]) // Re-runs when route data or active toggles change

  // Error fallback UI
  if (mapError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Map Error</h3>
          <p className="text-sm text-gray-600">
            Could not load map. Please ensure your
            <code className="text-xs bg-gray-200 p-1 rounded mx-1">VITE_MAPBOX_TOKEN</code>
            is set correctly in your <code className="text-xs bg-gray-200 p-1 rounded mx-1">.env</code> file.
          </p>
        </div>
      </div>
    )
  }

  // The map container
  return <div ref={mapContainer} className="w-full h-full" />
}