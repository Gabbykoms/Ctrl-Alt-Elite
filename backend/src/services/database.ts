import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Important: Use SERVICE_ROLE for backend
)

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'driver' | 'admin'
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  user_id: string
  student_id?: string
  grade_level?: string
  school?: string
  phone?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  created_at: string
}

export interface Driver {
  id: string
  user_id: string
  license_number?: string
  phone?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_plate?: string
  is_available: boolean
  created_at: string
}

export interface Stop {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Route {
  id: string
  name: string
  description?: string
  distance?: number
  duration?: number
  frequency?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RouteStop {
  id: string
  route_id: string
  stop_id: string
  stop_order: number
  created_at: string
}

export interface Shuttle {
  id: string
  name: string
  vehicle_number?: string
  capacity: number
  current_passengers: number
  status: 'active' | 'offline' | 'maintenance'
  current_latitude?: number
  current_longitude?: number
  last_location_update?: string
  assigned_driver_id?: string
  assigned_route_id?: string
  created_at: string
  updated_at: string
}

export interface Ride {
  id: string
  student_id: string
  shuttle_id?: string
  start_stop_id?: string
  end_stop_id?: string
  pickup_latitude: number
  pickup_longitude: number
  dropoff_latitude: number
  dropoff_longitude: number
  pickup_address?: string
  dropoff_address?: string
  status: 'requested' | 'confirmed' | 'driver_assigned' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
  estimated_pickup_time?: number
  estimated_arrival_time?: number
  actual_pickup_time?: string
  actual_dropoff_time?: string
  passenger_count: number
  notes?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

export interface Shift {
  id: string
  driver_id: string
  shuttle_id?: string
  clock_in: string
  clock_out?: string
  hours_worked?: number
  notes?: string
  created_at: string
}

// ============================================
// DATABASE OPERATIONS
// ============================================

export const db = {
  // User operations
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data as User
  },

  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data as User
  },

  // Student operations
  async getStudent(userId: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data as Student
  },

  async createStudent(studentData: Omit<Student, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single()
    
    if (error) throw error
    return data as Student
  },

  async updateStudent(userId: string, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data as Student
  },

  // Driver operations
  async getDriver(userId: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data as Driver
  },

  async createDriver(driverData: Omit<Driver, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driverData)
      .select()
      .single()
    
    if (error) throw error
    return data as Driver
  },

  async updateDriver(userId: string, updates: Partial<Driver>) {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data as Driver
  },

  // Stop operations
  async getAllStops() {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data as Stop[]
  },

  async getStop(stopId: string) {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('id', stopId)
      .single()
    
    if (error) throw error
    return data as Stop
  },

  async createStop(stopData: Omit<Stop, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('stops')
      .insert(stopData)
      .select()
      .single()
    
    if (error) throw error
    return data as Stop
  },

  async updateStop(stopId: string, updates: Partial<Stop>) {
    const { data, error } = await supabase
      .from('stops')
      .update(updates)
      .eq('id', stopId)
      .select()
      .single()
    
    if (error) throw error
    return data as Stop
  },

  async deleteStop(stopId: string) {
    const { error } = await supabase
      .from('stops')
      .delete()
      .eq('id', stopId)
    
    if (error) throw error
  },

  // Route operations
  async getAllRoutes() {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        route_stops (
          stop_order,
          stops (*)
        )
      `)
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data
  },

  async getRoute(routeId: string) {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        route_stops (
          stop_order,
          stops (*)
        )
      `)
      .eq('id', routeId)
      .single()
    
    if (error) throw error
    return data
  },

  async createRoute(routeData: Omit<Route, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('routes')
      .insert(routeData)
      .select()
      .single()
    
    if (error) throw error
    return data as Route
  },

  async updateRoute(routeId: string, updates: Partial<Route>) {
    const { data, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', routeId)
      .select()
      .single()
    
    if (error) throw error
    return data as Route
  },

  async deleteRoute(routeId: string) {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId)
    
    if (error) throw error
  },

  // Shuttle operations
  async getAllShuttles() {
    const { data, error } = await supabase
      .from('shuttles')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  async getShuttle(shuttleId: string) {
    const { data, error } = await supabase
      .from('shuttles')
      .select(`
        *,
        assigned_driver:users!shuttles_assigned_driver_id_fkey(id, name, email)
      `)
      .eq('id', shuttleId)
      .single()
    
    if (error) throw error
    return data
  },

  async createShuttle(shuttleData: Omit<Shuttle, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('shuttles')
      .insert(shuttleData)
      .select()
      .single()
    
    if (error) throw error
    return data as Shuttle
  },

  async updateShuttle(shuttleId: string, updates: Partial<Shuttle>) {
    const { data, error } = await supabase
      .from('shuttles')
      .update(updates)
      .eq('id', shuttleId)
      .select()
      .single()
    
    if (error) throw error
    return data as Shuttle
  },

  async deleteShuttle(shuttleId: string) {
    const { error } = await supabase
      .from('shuttles')
      .delete()
      .eq('id', shuttleId)
    
    if (error) throw error
  },

  // Ride operations
  async getAllRides() {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        student:users!rides_student_id_fkey(id, name, email),
        shuttle:shuttles(id, name, vehicle_number),
        start_stop:stops!rides_start_stop_id_fkey(id, name),
        end_stop:stops!rides_end_stop_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getRidesByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getRide(rideId: string) {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single()
    
    if (error) throw error
    return data
  },

  async createRide(rideData: Omit<Ride, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('rides')
      .insert(rideData)
      .select()
      .single()
    
    if (error) throw error
    return data as Ride
  },

  async updateRide(rideId: string, updates: Partial<Ride>) {
    const { data, error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', rideId)
      .select()
      .single()
    
    if (error) throw error
    return data as Ride
  },

  // Shift operations
  async getShiftsByDriver(driverId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('driver_id', driverId)
      .order('clock_in', { ascending: false })
    
    if (error) throw error
    return data as Shift[]
  },

  async getCurrentShift(driverId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('driver_id', driverId)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data as Shift | null
  },

  async clockIn(driverId: string, shuttleId?: string) {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        driver_id: driverId,
        shuttle_id: shuttleId,
      })
      .select()
      .single()
    
    if (error) throw error
    return data as Shift
  },

  async clockOut(shiftId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', shiftId)
      .select()
      .single()
    
    if (error) throw error
    return data as Shift
  },
}