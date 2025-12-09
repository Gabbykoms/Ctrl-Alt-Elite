import express, { Response } from 'express'
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js'
import { db, supabase } from '../services/database.js'

const router = express.Router()

// Get all drivers (admin only)
router.get('/', authenticateToken, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const { data: drivers, error } = await supabase
      .from('users')
      .select(`
        *,
        drivers (
          id,
          license_number,
          phone,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          vehicle_plate,
          is_available
        )
      `)
      .eq('role', 'driver')
      .order('name')

    if (error) throw error

    // Get current shifts for each driver
    const driversWithShifts = await Promise.all(
      (drivers || []).map(async (driver: any) => {
        const currentShift = await db.getCurrentShift(driver.id)
        
        // Calculate hours worked today (simplified)
        let hoursWorked = 0
        if (currentShift && currentShift.clock_in) {
          const clockInTime = new Date(currentShift.clock_in).getTime()
          const now = Date.now()
          hoursWorked = (now - clockInTime) / (1000 * 60 * 60) // Convert to hours
        }

        return {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.drivers?.phone || null,
          status: currentShift ? 'active' : 'offline',
          hoursWorked: Math.round(hoursWorked * 10) / 10, // Round to 1 decimal
          isAvailable: driver.drivers?.is_available || false,
          licenseNumber: driver.drivers?.license_number,
          vehicle: driver.drivers ? {
            make: driver.drivers.vehicle_make,
            model: driver.drivers.vehicle_model,
            year: driver.drivers.vehicle_year,
            plate: driver.drivers.vehicle_plate,
          } : null,
          currentShift: currentShift ? {
            id: currentShift.id,
            clockIn: currentShift.clock_in,
            shuttleId: currentShift.shuttle_id,
          } : null,
        }
      })
    )

    return res.json({
      drivers: driversWithShifts,
      total: driversWithShifts.length,
    })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch drivers',
      message: 'An error occurred while fetching drivers'
    })
  }
})

// Get single driver (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data: driver, error } = await supabase
      .from('users')
      .select(`
        *,
        drivers (*)
      `)
      .eq('id', req.params.id)
      .eq('role', 'driver')
      .single()

    if (error) throw error

    if (!driver) {
      return res.status(404).json({ 
        error: 'Driver not found',
        message: 'The requested driver does not exist'
      })
    }

    // Get current shift
    const currentShift = await db.getCurrentShift(driver.id)
    
    // Get shift history (last 10 shifts)
    const shifts = await db.getShiftsByDriver(driver.id)

    return res.json({
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.drivers?.phone,
      licenseNumber: driver.drivers?.license_number,
      isAvailable: driver.drivers?.is_available,
      vehicle: driver.drivers ? {
        make: driver.drivers.vehicle_make,
        model: driver.drivers.vehicle_model,
        year: driver.drivers.vehicle_year,
        plate: driver.drivers.vehicle_plate,
      } : null,
      currentShift,
      recentShifts: shifts.slice(0, 10),
    })
  } catch (error) {
    console.error('Error fetching driver:', error)
    return res.status(404).json({ 
      error: 'Driver not found',
      message: 'The requested driver does not exist'
    })
  }
})

// Create driver (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, phone, licenseNumber, vehicle } = req.body

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'email, password, and name are required'
      })
    }

    if (!email.endsWith('@trincoll.edu')) {
      return res.status(400).json({
        error: 'Invalid email domain',
        message: 'Only @trincoll.edu email addresses are allowed'
      })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created accounts
      user_metadata: {
        name,
        role: 'driver',
      }
    })

    if (authError || !authData.user) {
      console.error(' Auth creation error:', authError)
      return res.status(400).json({
        error: 'Driver creation failed',
        message: authError?.message || 'Failed to create driver account'
      })
    }

    // Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      name,
      role: 'driver',
    })

    if (profileError) {
      console.error(' Profile creation error:', profileError)
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({
        error: 'Driver creation failed',
        message: 'Failed to create driver profile'
      })
    }

    // Create driver profile
    const driverData = {
      user_id: authData.user.id,
      license_number: licenseNumber,
      phone,
      vehicle_make: vehicle?.make,
      vehicle_model: vehicle?.model,
      vehicle_year: vehicle?.year,
      vehicle_plate: vehicle?.plate,
      is_available: false,
    }

    await db.createDriver(driverData)

    console.log(` Driver created: ${name}`)
    return res.status(201).json({
      message: 'Driver created successfully',
      driver: {
        id: authData.user.id,
        email,
        name,
      }
    })
  } catch (error) {
    console.error(' Driver creation error:', error)
    return res.status(500).json({
      error: 'Driver creation failed',
      message: 'An unexpected error occurred'
    })
  }
})

// Update driver (admin only)
router.patch('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, licenseNumber, isAvailable, vehicle } = req.body

    // Update user profile
    const userUpdates: any = {}
    if (name !== undefined) userUpdates.name = name
    if (email !== undefined) userUpdates.email = email

    if (Object.keys(userUpdates).length > 0) {
      await db.updateUser(req.params.id, userUpdates)
    }

    // Update driver profile
    const driverUpdates: any = {}
    if (phone !== undefined) driverUpdates.phone = phone
    if (licenseNumber !== undefined) driverUpdates.license_number = licenseNumber
    if (isAvailable !== undefined) driverUpdates.is_available = isAvailable
    if (vehicle?.make !== undefined) driverUpdates.vehicle_make = vehicle.make
    if (vehicle?.model !== undefined) driverUpdates.vehicle_model = vehicle.model
    if (vehicle?.year !== undefined) driverUpdates.vehicle_year = vehicle.year
    if (vehicle?.plate !== undefined) driverUpdates.vehicle_plate = vehicle.plate

    if (Object.keys(driverUpdates).length > 0) {
      await db.updateDriver(req.params.id, driverUpdates)
    }

    console.log(` Driver updated: ${req.params.id}`)
    return res.json({ 
      message: 'Driver updated successfully' 
    })
  } catch (error) {
    console.error('Error updating driver:', error)
    return res.status(500).json({
      error: 'Failed to update driver',
      message: 'An error occurred while updating the driver'
    })
  }
})

// Delete driver (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Delete from auth (will cascade to users, drivers, shifts tables)
    const { error } = await supabase.auth.admin.deleteUser(req.params.id)
    
    if (error) throw error

    console.log(` Driver deleted: ${req.params.id}`)
    return res.json({ 
      message: 'Driver deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting driver:', error)
    return res.status(500).json({
      error: 'Failed to delete driver',
      message: 'An error occurred while deleting the driver'
    })
  }
})

// Clock in (driver or admin)
router.post('/:id/clock-in', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.params.id
    const { shuttleId } = req.body

    // Check permission: driver can clock in themselves, admin can clock in anyone
    if (req.userRole !== 'admin' && req.userId !== driverId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only clock in yourself'
      })
    }

    // Check if already clocked in
    const currentShift = await db.getCurrentShift(driverId)
    if (currentShift) {
      return res.status(400).json({
        error: 'Already clocked in',
        message: 'Driver is already clocked in. Please clock out first.'
      })
    }

    // Clock in
    const shift = await db.clockIn(driverId, shuttleId)

    // If shuttle is assigned, update shuttle status to active
    if (shuttleId) {
      await db.updateShuttle(shuttleId, {
        status: 'active',
        assigned_driver_id: driverId,
      })
    }

    console.log(` Driver clocked in: ${driverId}`)
    return res.json({
      message: 'Clocked in successfully',
      shift: {
        id: shift.id,
        clockIn: shift.clock_in,
        shuttleId: shift.shuttle_id,
      }
    })
  } catch (error) {
    console.error('Error clocking in:', error)
    return res.status(500).json({
      error: 'Clock in failed',
      message: 'An error occurred while clocking in'
    })
  }
})

// Clock out (driver or admin)
router.post('/:id/clock-out', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.params.id

    // Check permission: driver can clock out themselves, admin can clock out anyone
    if (req.userRole !== 'admin' && req.userId !== driverId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only clock out yourself'
      })
    }

    // Get current shift
    const currentShift = await db.getCurrentShift(driverId)
    if (!currentShift) {
      return res.status(400).json({
        error: 'Not clocked in',
        message: 'Driver is not currently clocked in'
      })
    }

    // Clock out
    const shift = await db.clockOut(currentShift.id)

    // If shuttle was assigned, update shuttle status to offline
    if (currentShift.shuttle_id) {
      await db.updateShuttle(currentShift.shuttle_id, {
        status: 'offline',
        assigned_driver_id: undefined,
      })
    }

    console.log(` Driver clocked out: ${driverId}`)
    return res.json({
      message: 'Clocked out successfully',
      shift: {
        id: shift.id,
        clockIn: shift.clock_in,
        clockOut: shift.clock_out,
        hoursWorked: shift.hours_worked,
      }
    })
  } catch (error) {
    console.error('Error clocking out:', error)
    return res.status(500).json({
      error: 'Clock out failed',
      message: 'An error occurred while clocking out'
    })
  }
})

// Get driver's shifts (driver can see own, admin can see all)
router.get('/:id/shifts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.params.id

    // Check permission
    if (req.userRole !== 'admin' && req.userId !== driverId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own shifts'
      })
    }

    const shifts = await db.getShiftsByDriver(driverId)
    
    return res.json({
      shifts,
      total: shifts.length,
    })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return res.status(500).json({
      error: 'Failed to fetch shifts',
      message: 'An error occurred while fetching shifts'
    })
  }
})

export default router
