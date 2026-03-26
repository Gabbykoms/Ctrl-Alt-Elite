import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DriverDashboard from './DriverDashboard'

// Mock LiveMap (depends on mapbox-gl which doesn't work in jsdom)
vi.mock('../components/LiveMap', () => ({
  default: ({ pins }: { pins: unknown[] }) => (
    <div data-testid="live-map">Map with {pins.length} pins</div>
  ),
}))

// Mock apiService
vi.mock('../services/apiService', () => ({
  trackingAPI: {
    getAllStops: vi.fn().mockResolvedValue({ stops: [] }),
    getDriverShiftReportsByDriver: vi.fn().mockResolvedValue([]),
    startDriverShiftReport: vi.fn().mockResolvedValue({ id: 'report-123' }),
    endDriverShiftReport: vi.fn().mockResolvedValue({}),
  },
  TRACKING_SERVICE_URL: 'http://localhost:8081',
}))

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'driver-1', name: 'Test Driver', email: 'driver@test.com', role: 'driver' },
    token: 'fake-token',
    logout: vi.fn(),
  }),
}))

// Mock fetch for shuttle loading
globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }) as unknown as typeof fetch

describe('DriverDashboard', () => {
  // Rendering
  it('renders the dashboard heading', () => {
    render(<DriverDashboard />)
    expect(screen.getByText('Driver Dashboard')).toBeInTheDocument()
  })

  // TODO: Clock In / Clock Out toggle
  describe('Clock In/Out', () => {
    it.todo('toggles to Clock Out when clicked')
    it.todo('shows Clocked In as Yes after clocking in')
  })

  // TODO: Status dropdown (disabled when not clocked in, enabled when clocked in)
  describe('Status Dropdown', () => {
    it.todo('is disabled when not clocked in')
    it.todo('is enabled after clocking in')
    it.todo('can change status value')
  })

  // TODO: Shift Report form
  describe('Shift Report', () => {
    it.todo('pre-fills driver name from auth')
    it.todo('validation - starting mileage required')
    it.todo('validation - ending mileage >= starting mileage')
    it.todo('start shift report API call')
    it.todo('end shift report API call')
  })

  // TODO: Map rendering
  describe('Map', () => {
    it.todo('renders the map component')
  })
})
