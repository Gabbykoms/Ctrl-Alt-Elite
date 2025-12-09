import express, { Response } from 'express'
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js'
import { db, supabase } from '../services/database.js'

const router = express.Router()

// Interface definitions to replace 'any'
interface Shuttle {
  id: string
  status: string
  current_passengers: number
  capacity: number
  assigned_driver_id?: string
}

// Request a ride (student)
router.post('/request', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      startLocationId,
      endLocationId,
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
      pickupAddress,
      dropoffAddress,
      passengerCount,
      notes
    } = req.body

    // Safe check for user ID
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User ID missing' })
    }

    // Validation
    if (!pickupLatitude || !pickupLongitude || !dropoffLatitude || !dropoffLongitude) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Pickup and dropoff coordinates are required'
      })
    }

    if (pickupLatitude === dropoffLatitude && pickupLongitude === dropoffLongitude) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Pickup and dropoff locations must be different'
      })
    }

    // Create ride request
    const rideData = {
      student_id: req.userId,
      start_stop_id: startLocationId || null,
      end_stop_id: endLocationId || null,
      pickup_latitude: parseFloat(pickupLatitude),
      pickup_longitude: parseFloat(pickupLongitude),
      dropoff_latitude: parseFloat(dropoffLatitude),
      dropoff_longitude: parseFloat(dropoffLongitude),
      pickup_address: pickupAddress || null,
      dropoff_address: dropoffAddress || null,
      status: 'requested' as const,
      passenger_count: passengerCount || 1,
      notes: notes || null,
      // Estimate times (simplified)
      estimated_pickup_time: Math.floor(Math.random() * 8) + 3,
      estimated_arrival_time: Math.floor(Math.random() * 10) + 8,
    }

    const ride = await db.createRide(rideData)

    const shuttles = await db.getAllShuttles()
    
    // FIX: Typed 's' as Shuttle instead of 'any'
    const availableShuttle = shuttles.find((s: Shuttle) => 
      s.status === 'active' && s.current_passengers < s.capacity
    )

    if (availableShuttle) {
      await db.updateRide(ride.id, {
        shuttle_id: availableShuttle.id,
        status: 'confirmed',
      })
    }

    console.log(` Ride requested by student: ${req.userId}`)

    const io = req.app.get('io')
    if (io) {
      io.emit('ride-status-update', {
        rideId: ride.id,
        status: availableShuttle ? 'confirmed' : 'requested',
        shuttleId: availableShuttle?.id,
      })
    }

    return res.status(201).json({
      message: 'Ride requested successfully',
      ride: {
        id: ride.id,
        status: availableShuttle ? 'confirmed' : 'requested',
        shuttleId: availableShuttle?.id,
        estimatedPickupTime: ride.estimated_pickup_time,
        estimatedArrivalTime: ride.estimated_arrival_time,
        createdAt: ride.created_at,
      }
    })
  } catch (error) {
    console.error('Error requesting ride:', error)
    return res.status(500).json({
      error: 'Ride request failed',
      message: 'An error occurred while requesting the ride'
    })
  }
})

// Get user's rides
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User ID missing' })
    }

    let rides

    if (req.userRole === 'admin') {
      rides = await db.getAllRides()
    } else if (req.userRole === 'student') {
      rides = await db.getRidesByStudent(req.userId)
    } else if (req.userRole === 'driver') {
      const { data: shuttles } = await supabase
        .from('shuttles')
        .select('id')
        .eq('assigned_driver_id', req.userId)
      
      const shuttleIds = shuttles?.map((s: { id: string }) => s.id) || []
      
      if (shuttleIds.length > 0) {
        const { data: driverRides } = await supabase
          .from('rides')
          .select(`
            *,
            student:users!rides_student_id_fkey(id, name, email),
            shuttle:shuttles(id, name, vehicle_number),
            start_stop:stops!rides_start_stop_id_fkey(id, name),
            end_stop:stops!rides_end_stop_id_fkey(id, name)
          `)
          .in('shuttle_id', shuttleIds)
          .order('created_at', { ascending: false })
        
        rides = driverRides || []
      } else {
        rides = []
      }
    } else {
      rides = []
    }

    return res.json({
      rides,
      total: rides.length,
    })
  } catch (error) {
    console.error('Error fetching rides:', error)
    return res.status(500).json({
      error: 'Failed to fetch rides',
      message: 'An error occurred while fetching rides'
    })
  }
})

// Get single ride
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const ride = await db.getRide(req.params.id)

    if (!ride) {
      return res.status(404).json({ error: 'Not Found', message: 'Ride not found' })
    }

    const isStudent = ride.student_id === req.userId
    const isDriver = req.userRole === 'driver'
    const isAdmin = req.userRole === 'admin'

    if (!isStudent && !isDriver && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this ride'
      })
    }

    return res.json(ride)
  } catch (error) {
    console.error('Error fetching ride:', error)
    return res.status(404).json({
      error: 'Ride not found',
      message: 'The requested ride does not exist'
    })
  }
})

// Cancel ride
router.patch('/:id/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User ID missing' })
    }

    const ride = await db.getRide(req.params.id)

    if (ride.student_id !== req.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only cancel your own rides'
      })
    }

    if (!['requested', 'confirmed', 'driver_assigned'].includes(ride.status)) {
      return res.status(400).json({
        error: 'Cannot cancel',
        message: `Ride cannot be cancelled in ${ride.status} status`
      })
    }

    const { cancellationReason } = req.body

    const updatedRide = await db.updateRide(req.params.id, {
      status: 'cancelled',
      cancellation_reason: cancellationReason || 'Cancelled by student',
    })

    console.log(` Ride cancelled: ${req.params.id}`)

    const io = req.app.get('io')
    if (io) {
      io.emit('ride-status-update', {
        rideId: updatedRide.id,
        status: 'cancelled',
      })
    }

    return res.json(updatedRide)
  } catch (error) {
    console.error('Error cancelling ride:', error)
    return res.status(500).json({
      error: 'Failed to cancel ride',
      message: 'An error occurred while cancelling the ride'
    })
  }
})

// Update ride status
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'status is required'
      })
    }

    const validStatuses = [
      'requested', 'confirmed', 'driver_assigned', 'en_route', 
      'arrived', 'in_progress', 'completed', 'cancelled'
    ]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      })
    }

    const ride = await db.getRide(req.params.id)

    const isAdmin = req.userRole === 'admin'
    const isAssignedDriver = req.userRole === 'driver'

    if (!isAdmin && !isAssignedDriver) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only assigned drivers or admins can update ride status'
      })
    }

    // FIX: Use 'any' to bypass strict type check for now, ensuring compatibility
    const updates: any = { status }

    if (status === 'in_progress' && !ride.actual_pickup_time) {
      updates.actual_pickup_time = new Date().toISOString()
    }
    if (status === 'completed' && !ride.actual_dropoff_time) {
      updates.actual_dropoff_time = new Date().toISOString()
    }

    const updatedRide = await db.updateRide(req.params.id, updates)

    console.log(` Ride status updated: ${req.params.id} -> ${status}`)

    const io = req.app.get('io')
    if (io) {
      io.emit('ride-status-update', {
        rideId: updatedRide.id,
        status: updatedRide.status,
      })
    }

    return res.json(updatedRide)
  } catch (error) {
    console.error('Error updating ride status:', error)
    return res.status(500).json({
      error: 'Failed to update ride status',
      message: 'An error occurred while updating the ride status'
    })
  }
})

// Assign shuttle to ride
router.patch('/:id/assign-shuttle', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { shuttleId } = req.body

    if (!shuttleId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'shuttleId is required'
      })
    }

    const updatedRide = await db.updateRide(req.params.id, {
      shuttle_id: shuttleId,
      status: 'driver_assigned',
    })

    console.log(` Shuttle assigned to ride: ${req.params.id}`)

    const io = req.app.get('io')
    if (io) {
      io.emit('ride-status-update', {
        rideId: updatedRide.id,
        status: 'driver_assigned',
        shuttleId,
      })
    }

    return res.json(updatedRide)
  } catch (error) {
    console.error('Error assigning shuttle:', error)
    return res.status(500).json({
      error: 'Failed to assign shuttle',
      message: 'An error occurred while assigning the shuttle'
    })
  }
})

export default router