

import { useEffect, useRef, useState } from 'react'
import { trackingAPI } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'
import mapboxgl from 'mapbox-gl'

interface MapPin {
  id: string
  lat: number
  lng: number
  type: 'stop' | 'shuttle'
  name: string
  info?: string
  onPopupOpen?: (id: string) => void
  isHighlighted?: boolean
}

interface LiveMapProps {
  pins: MapPin[]
  routes?: Array<{ id: string; coordinates: [number, number][] }>
  activeRouteIds?: string[]
  onMapClick?: (lat: number, lng: number) => void
}

export default function LiveMap({ pins, routes = [], activeRouteIds = [], onMapClick }: LiveMapProps) {
  const { user } = useAuth() || {};
  const [_driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [busPin, setBusPin] = useState<MapPin | null>(null);
  const rideId = user?.activeRideId || user?.rideId; // Only use real ride IDs
  
  // Effect: If user is a driver with active ride, send their location to tracking service periodically
  useEffect(() => {
    if (!user || user.role !== 'driver' || !rideId) return;
    let watchId: number;
    let intervalId: number;

    // Get and send location every 5 seconds
    const sendLocation = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      trackingAPI.startRideTracking(rideId, {
        driverId: user.id,
        latitude,
        longitude,
        timestamp: Date.now(),
      });
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(sendLocation);
      // Also send every 5 seconds in case watchPosition is slow
      intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(sendLocation);
      }, 5000);
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, rideId]);
  
  // Effect: For all users with active ride, fetch latest driver location and update bus pin
  useEffect(() => {
    if (!rideId) return; // Don't fetch if no active ride
    
    let intervalId: number;
    const fetchDriverLocation = async () => {
      try {
        console.log(`[LiveMap] Fetching driver location for rideId: ${rideId}`);
        const data = await trackingAPI.getDriverLocation(rideId);
        console.log(`[LiveMap] Driver location response:`, data);
        if (data && data.latitude && data.longitude) {
          console.log(`[LiveMap] Setting bus pin at ${data.latitude}, ${data.longitude}`);
          setDriverLocation({ lat: data.latitude, lng: data.longitude });
          setBusPin({
            id: 'bus',
            lat: data.latitude,
            lng: data.longitude,
            type: 'shuttle',
            name: 'Bus',
            info: `Last updated: ${new Date(data.timestamp || Date.now()).toLocaleTimeString()}`,
          });
        } else {
          console.warn(`[LiveMap] Invalid driver location data:`, data);
        }
      } catch (e) {
        console.error(`[LiveMap] Error fetching driver location:`, e);
      }
    };
    fetchDriverLocation();
    intervalId = setInterval(fetchDriverLocation, 5000);
    return () => clearInterval(intervalId);
  }, [rideId]);
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

      // Add click handler for admin stop placement
      if (onMapClick) {
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat
          console.log('Map clicked:', { lat, lng })
          onMapClick(lat, lng)
        })
      }
    } catch (error) {
      console.error('Failed to initialize map:', error)
      setMapError(true)
    }

    // Cleanup function
    return () => {
      map.current?.remove()
    }
  }, [onMapClick])

  // Effect 2: Update markers when pins or busPin change
  useEffect(() => {
    if (!map.current) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    const allPins = busPin ? [...pins, busPin] : pins;
    allPins.forEach((pin) => {
      const el = document.createElement('div');
      const isDriver = pin.id === 'bus';
      const isTemporaryPin = pin.id === 'temp-pin';
      const isHighlighted = pin.isHighlighted;
      
      // Determine color based on pin type
      let bgColor = 'bg-red-600'; // Default for stops
      if (isTemporaryPin) {
        bgColor = 'bg-yellow-400';
      } else if (pin.type === 'shuttle') {
        bgColor = 'bg-green-600'; // Green for buses/shuttles
      }
      
      const size = isDriver ? 'w-12 h-12' : 'w-8 h-8';
      const fontSize = isDriver ? 'text-lg' : 'text-sm';
      const cursorStyle = isTemporaryPin ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer';
      const blinkAnimation = isHighlighted ? 'animate-pulse' : '';
      const extraStyle = isHighlighted ? 'ring-4 ring-yellow-300 ring-offset-2' : '';
      el.className = `${size} rounded-full flex items-center justify-center ${cursorStyle} ${bgColor} text-white font-bold ${fontSize} shadow-lg border-2 border-white ${isDriver ? 'animate-pulse' : isTemporaryPin ? 'animate-bounce' : ''} ${blinkAnimation} ${extraStyle}`;
      el.textContent = pin.type === 'stop' ? (isTemporaryPin ? '📍' : 'S') : 'B';
      
      const marker = new mapboxgl.Marker(el, { draggable: isTemporaryPin })
        .setLngLat([pin.lng, pin.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-1 font-sans"><strong>${pin.name}</strong>${pin.info ? `<p class="text-sm mt-1">${pin.info}</p>` : ''}</div>`
          )
        )
        .addTo(map.current!);
      
      // Handle drag events for temporary pin
      if (isTemporaryPin) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          if (onMapClick) {
            onMapClick(lngLat.lat, lngLat.lng);
          }
        });
      }
      
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isTemporaryPin) {
          marker.togglePopup();
          pin.onPopupOpen?.(pin.id);
        }
      });
      markersRef.current.set(pin.id, marker);
    });
  }, [pins, busPin, onMapClick]);

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