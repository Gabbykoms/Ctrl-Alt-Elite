// Mock shift data for demo purposes
export interface Shift {
  id: string
  driverId: string
  driverName: string
  shiftDate: string
  startTime: string
  endTime: string
  vehicle: string
  vehicleLicense: string
  radioNumber: string
  route: string
  startingMileage: number
  endingMileage: number
  status: 'completed' | 'in-progress' | 'scheduled' | 'cancelled'
  passengers: number
  notes?: string
  conditionNotes?: string
}

export const mockShifts: Shift[] = [
  {
    id: 'shift-1',
    driverId: 'driver-1',
    driverName: 'John Smith',
    shiftDate: '2026-04-28',
    startTime: '06:00',
    endTime: '14:00',
    vehicle: 'Shuttle-A1',
    vehicleLicense: 'CT-2024-001',
    radioNumber: 'RAD-001',
    route: 'North Loop',
    startingMileage: 1200,
    endingMileage: 1245,
    status: 'completed',
    passengers: 85,
    notes: 'Standard morning shift',
    conditionNotes: 'Vehicle in good condition',
  },
  {
    id: 'shift-2',
    driverId: 'driver-1',
    driverName: 'John Smith',
    shiftDate: '2026-04-29',
    startTime: '14:00',
    endTime: '22:00',
    vehicle: 'Shuttle-B2',
    vehicleLicense: 'CT-2024-002',
    radioNumber: 'RAD-002',
    route: 'South Loop',
    startingMileage: 1800,
    endingMileage: 1867,
    status: 'completed',
    passengers: 92,
    notes: 'Evening shift',
    conditionNotes: 'Minor fluid check needed',
  },
  {
    id: 'shift-3',
    driverId: 'driver-1',
    driverName: 'John Smith',
    shiftDate: '2026-04-30',
    startTime: '06:00',
    endTime: '14:00',
    vehicle: 'Shuttle-A1',
    vehicleLicense: 'CT-2024-001',
    radioNumber: 'RAD-001',
    route: 'North Loop',
    startingMileage: 1250,
    endingMileage: 1298,
    status: 'in-progress',
    passengers: 67,
    notes: 'Current shift',
    conditionNotes: 'Vehicle running smoothly',
  },
  {
    id: 'shift-4',
    driverId: 'driver-2',
    driverName: 'Sarah Johnson',
    shiftDate: '2026-04-28',
    startTime: '14:00',
    endTime: '22:00',
    vehicle: 'Shuttle-C3',
    vehicleLicense: 'CT-2024-003',
    radioNumber: 'RAD-003',
    route: 'Medical Center',
    startingMileage: 2100,
    endingMileage: 2156,
    status: 'completed',
    passengers: 78,
    notes: 'Evening shift',
    conditionNotes: 'No issues',
  },
  {
    id: 'shift-5',
    driverId: 'driver-2',
    driverName: 'Sarah Johnson',
    shiftDate: '2026-04-29',
    startTime: '06:00',
    endTime: '14:00',
    vehicle: 'Shuttle-D4',
    vehicleLicense: 'CT-2024-004',
    radioNumber: 'RAD-004',
    route: 'Arts & Sciences',
    startingMileage: 950,
    endingMileage: 1012,
    status: 'completed',
    passengers: 95,
    notes: 'Morning shift',
    conditionNotes: 'Battery warning light appeared',
  },
  {
    id: 'shift-6',
    driverId: 'driver-3',
    driverName: 'Mike Chen',
    shiftDate: '2026-04-28',
    startTime: '06:00',
    endTime: '14:00',
    vehicle: 'Shuttle-E5',
    vehicleLicense: 'CT-2024-005',
    radioNumber: 'RAD-005',
    route: 'Library Shuttle',
    startingMileage: 3200,
    endingMileage: 3267,
    status: 'completed',
    passengers: 102,
    notes: 'Morning shift',
    conditionNotes: 'No issues reported',
  },
  {
    id: 'shift-7',
    driverId: 'driver-3',
    driverName: 'Mike Chen',
    shiftDate: '2026-04-29',
    startTime: '14:00',
    endTime: '22:00',
    vehicle: 'Shuttle-F6',
    vehicleLicense: 'CT-2024-006',
    radioNumber: 'RAD-006',
    route: 'North Loop',
    startingMileage: 1500,
    endingMileage: 1551,
    status: 'scheduled',
    passengers: 0,
  },
  {
    id: 'shift-8',
    driverId: 'driver-3',
    driverName: 'Mike Chen',
    shiftDate: '2026-04-30',
    startTime: '14:00',
    endTime: '22:00',
    vehicle: 'Shuttle-F6',
    vehicleLicense: 'CT-2024-006',
    radioNumber: 'RAD-006',
    route: 'North Loop',
    startingMileage: 1500,
    endingMileage: 1551,
    status: 'cancelled',
    passengers: 0,
    notes: 'Cancelled due to vehicle maintenance',
  },
]

// Get shifts for a specific driver
export const getDriverShifts = (driverId: string): Shift[] => {
  return mockShifts.filter(shift => shift.driverId === driverId)
}

// Get all unique drivers from shifts
export const getAllDrivers = (): Array<{ id: string; name: string }> => {
  const driverMap = new Map<string, string>()
  mockShifts.forEach(shift => {
    if (!driverMap.has(shift.driverId)) {
      driverMap.set(shift.driverId, shift.driverName)
    }
  })
  return Array.from(driverMap).map(([id, name]) => ({ id, name }))
}
