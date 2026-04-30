import { useState, useEffect } from 'react'
import LiveMap from '../components/LiveMap'
import ShiftsList from '../components/ShiftsList'
import { DriverShiftReport, trackingAPI, TRACKING_SERVICE_URL } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'
import { getDriverShifts } from '../data/mockShifts'
import type { Shift } from '../data/mockShifts'

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
  const { user } = useAuth()
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [status, setStatus] = useState('offline')
  const [stops, setStops] = useState<Stop[]>([])
  const [_isLoadingStops, setIsLoadingStops] = useState(false)
  const [shuttles, setShuttles] = useState<Shuttle[]>([])
  const [_isLoadingShuttles, setIsLoadingShuttles] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'shifts'>('map')
  const [driverShifts, setDriverShifts] = useState<Shift[]>([])
  // Keep tabs internal to the dashboard page only
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [radioNumber, setRadioNumber] = useState('')
  const [driverName, setDriverName] = useState('')
  const [vehicleLicense, setVehicleLicense] = useState('')
  const [startingMileage, setStartingMileage] = useState('')
  const [endingMileage, setEndingMileage] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [activeReportId, setActiveReportId] = useState<string | null>(null)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportMessage, setReportMessage] = useState('')

  useEffect(() => {
    if (user?.name) {
      setDriverName(user.name)
    }
  }, [user])

  useEffect(() => {
    const loadOpenShiftReport = async () => {
      if (!user?.id) return

      try {
        const reports = await trackingAPI.getDriverShiftReportsByDriver(user.id)
        const openReport = reports.find((report: DriverShiftReport) =>
          report.reportDate === reportDate && (report.endingMileage === null || report.endingMileage === undefined)
        )

        if (openReport) {
          setActiveReportId(openReport.id)
          setRadioNumber(openReport.radioNumber || '')
          setDriverName(openReport.driverName || user.name)
          setVehicleLicense(openReport.vehicleLicense || '')
          setStartingMileage(String(openReport.startingMileage ?? ''))
          setConditionNotes(openReport.conditionNotes || '')
          setReportMessage(`Loaded existing open report: ${openReport.id}`)
        } else {
          setActiveReportId(null)
        }
      } catch (error) {
        console.error('Error loading shift reports:', error)
      }
    }

    loadOpenShiftReport()
  }, [user?.id, user?.name, reportDate])

  // Load driver's shifts from mock data
  useEffect(() => {
    if (user?.id) {
      const shifts = getDriverShifts(user.id)
      setDriverShifts(shifts)
    }
  }, [user?.id])

  const handleStartShiftReport = async () => {
    if (!user?.id) {
      setReportMessage('Driver identity is missing. Please log in again.')
      return
    }

    if (!startingMileage) {
      setReportMessage('Starting mileage is required.')
      return
    }

    const parsedStartingMileage = Number(startingMileage)
    if (Number.isNaN(parsedStartingMileage) || parsedStartingMileage < 0) {
      setReportMessage('Starting mileage must be a valid non-negative number.')
      return
    }

    setIsSubmittingReport(true)
    setReportMessage('')
    try {
      const created = await trackingAPI.startDriverShiftReport({
        report_date: reportDate,
        radio_number: radioNumber || undefined,
        driver_id: user.id,
        driver_name: driverName || user.name,
        vehicle_license: vehicleLicense || undefined,
        starting_mileage: parsedStartingMileage,
        condition_notes: conditionNotes || undefined,
      })
      setActiveReportId(created.id)
      setReportMessage(`Shift report started successfully (${created.id}).`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start shift report.'
      setReportMessage(message)
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const handleEndShiftReport = async () => {
    if (!activeReportId) {
      setReportMessage('No active report found for this date. Start a report first.')
      return
    }

    if (!endingMileage) {
      setReportMessage('Ending mileage is required to close the report.')
      return
    }

    const parsedEndingMileage = Number(endingMileage)
    const parsedStartingMileage = Number(startingMileage)
    if (Number.isNaN(parsedEndingMileage) || parsedEndingMileage < 0) {
      setReportMessage('Ending mileage must be a valid non-negative number.')
      return
    }

    if (!Number.isNaN(parsedStartingMileage) && parsedEndingMileage < parsedStartingMileage) {
      setReportMessage('Ending mileage must be greater than or equal to starting mileage.')
      return
    }

    setIsSubmittingReport(true)
    setReportMessage('')
    try {
      await trackingAPI.endDriverShiftReport(activeReportId, {
        ending_mileage: parsedEndingMileage,
        condition_notes: conditionNotes || undefined,
      })
      setReportMessage('Shift report ended successfully.')
      setActiveReportId(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to end shift report.'
      setReportMessage(message)
    } finally {
      setIsSubmittingReport(false)
    }
  }

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

          {/* Shift Report Form */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark">Shift Report</h3>
              <span className="text-sm text-gray-600">
                {activeReportId ? `Active Report: ${activeReportId}` : 'No active report'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Radio #</label>
                <input
                  type="text"
                  value={radioNumber}
                  onChange={(e) => setRadioNumber(e.target.value)}
                  placeholder="e.g., 12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Vehicle License</label>
                <input
                  type="text"
                  value={vehicleLicense}
                  onChange={(e) => setVehicleLicense(e.target.value)}
                  placeholder="e.g., ABC-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Starting Mileage</label>
                <input
                  type="number"
                  min="0"
                  value={startingMileage}
                  onChange={(e) => setStartingMileage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Ending Mileage</label>
                <input
                  type="number"
                  min="0"
                  value={endingMileage}
                  onChange={(e) => setEndingMileage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dark mb-1">Exterior Condition / Damage Notes</label>
                <textarea
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe exterior condition and any damage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {reportMessage && (
              <p className="text-sm text-gray-700">{reportMessage}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleStartShiftReport}
                disabled={isSubmittingReport || !user?.id || !!activeReportId}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Shift Report
              </button>
              <button
                onClick={handleEndShiftReport}
                disabled={isSubmittingReport || !activeReportId}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                End Shift Report
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'map'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'shifts'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Shifts ({driverShifts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative">
        {activeTab === 'map' ? (
          <LiveMap pins={mapPins} />
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <h3 className="text-2xl font-bold text-dark mb-4">My Shifts</h3>
              <ShiftsList shifts={driverShifts} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
