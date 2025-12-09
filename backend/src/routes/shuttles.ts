import express, { Request, Response } from 'express'
import { authenticateToken, requireAdmin, requireDriver, AuthRequest } from '../middleware/auth.js'
import { db } from '../services/database.js'

const router = express.Router()

/**
 * @swagger
 * /api/shuttles:
 *   get:
 *     summary: Get all shuttles
 *     description: Retrieve all active shuttles with their current status and location
 *     tags:
 *       - Shuttles
 *     responses:
 *       200:
 *         description: Successfully retrieved shuttles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shuttles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shuttle'
 *                 total:
 *                   type: integer
 *       500:
 *         description: Failed to fetch shuttles
 */
// Get all shuttles (public - anyone can view)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const shuttles = await db.getAllShuttles()
    
    // Format response to match frontend expectations
    const formattedShuttles = shuttles.map((shuttle: any) => ({
      id: shuttle.id,
      name: shuttle.name,
      vehicleNumber: shuttle.vehicle_number,
      capacity: shuttle.capacity,
      currentPassengers: shuttle.current_passengers,
      status: shuttle.status,
      lastLocation: shuttle.current_latitude && shuttle.current_longitude ? {
        lat: parseFloat(shuttle.current_latitude),
        lng: parseFloat(shuttle.current_longitude)
      } : null,
      lastLocationUpdate: shuttle.last_location_update,
      assignedDriver: shuttle.assigned_driver ? {
        id: shuttle.assigned_driver.id,
        name: shuttle.assigned_driver.name,
        email: shuttle.assigned_driver.email
      } : null,
      assignedRouteId: shuttle.assigned_route_id,
      createdAt: shuttle.created_at,
      updatedAt: shuttle.updated_at,
    }))
    
    return res.json({
      shuttles: formattedShuttles,
      total: shuttles.length,
    })
  } catch (error) {
    console.error('Error fetching shuttles:', error)
    return res.status(500).json({
      error: 'Failed to fetch shuttles',
      message: 'An error occurred while fetching shuttles'
    })
  }
})

/**
 * @swagger
 * /api/shuttles/{id}:
 *   get:
 *     summary: Get a specific shuttle
 *     tags:
 *       - Shuttles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Shuttle details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shuttle'
 *       404:
 *         description: Shuttle not found
 */
// Get single shuttle (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const shuttle = await db.getShuttle(req.params.id)
    
    // Format response
    const formattedShuttle = {
      id: shuttle.id,
      name: shuttle.name,
      vehicleNumber: shuttle.vehicle_number,
      capacity: shuttle.capacity,
      currentPassengers: shuttle.current_passengers,
      status: shuttle.status,
      lastLocation: shuttle.current_latitude && shuttle.current_longitude ? {
        lat: parseFloat(shuttle.current_latitude),
        lng: parseFloat(shuttle.current_longitude)
      } : null,
      lastLocationUpdate: shuttle.last_location_update,
      assignedDriver: shuttle.assigned_driver ? {
        id: shuttle.assigned_driver.id,
        name: shuttle.assigned_driver.name,
        email: shuttle.assigned_driver.email
      } : null,
      assignedRouteId: shuttle.assigned_route_id,
      createdAt: shuttle.created_at,
      updatedAt: shuttle.updated_at,
    }
    
    return res.json(formattedShuttle)
  } catch (error) {
    console.error('Error fetching shuttle:', error)
    return res.status(404).json({
      error: 'Shuttle not found',
      message: 'The requested shuttle does not exist'
    })
  }
})

/**
 * @swagger
 * /api/shuttles:
 *   post:
 *     summary: Create a new shuttle
 *     description: Create a new shuttle (admin only)
 *     tags:
 *       - Shuttles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               vehicleNumber:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Shuttle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shuttle'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
// Create shuttle (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, vehicleNumber, capacity } = req.body

    // Validation
    if (!name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name is required'
      })
    }

    const shuttleData = {
      name,
      vehicle_number: vehicleNumber,
      capacity: capacity || 25,
      current_passengers: 0,
      status: 'offline' as const,
      current_latitude: undefined,
      current_longitude: undefined,
      last_location_update: undefined,
      assigned_driver_id: undefined,
      assigned_route_id: undefined,
    }

    const shuttle = await db.createShuttle(shuttleData)
    
    console.log(` Shuttle created: ${shuttle.name}`)
    return res.status(201).json(shuttle)
  } catch (error) {
    console.error('Error creating shuttle:', error)
    return res.status(500).json({
      error: 'Failed to create shuttle',
      message: 'An error occurred while creating the shuttle'
    })
  }
})

/**
 * @swagger
 * /api/shuttles/{id}:
 *   patch:
 *     summary: Update a shuttle
 *     description: Update shuttle details (admin or assigned driver)
 *     tags:
 *       - Shuttles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               vehicleNumber:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               status:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               currentPassengers:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Shuttle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shuttle'
 *       403:
 *         description: Forbidden
 *       401:
 *         description: Unauthorized
 */
// Update shuttle (admin or assigned driver)
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const shuttle = await db.getShuttle(req.params.id)
    
    // Check permissions: admin can update anything, driver can only update their assigned shuttle
    const isAdmin = req.userRole === 'admin'
    const isAssignedDriver = shuttle.assigned_driver_id === req.userId
    
    if (!isAdmin && !isAssignedDriver) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this shuttle'
      })
    }

    const { 
      name, 
      vehicleNumber, 
      capacity, 
      currentPassengers,
      status, 
      latitude, 
      longitude,
      assignedDriverId,
      assignedRouteId
    } = req.body

    const updates: any = {}
    
    // Admin can update everything
    if (isAdmin) {
      if (name !== undefined) updates.name = name
      if (vehicleNumber !== undefined) updates.vehicle_number = vehicleNumber
      if (capacity !== undefined) updates.capacity = parseInt(capacity)
      if (assignedDriverId !== undefined) updates.assigned_driver_id = assignedDriverId
      if (assignedRouteId !== undefined) updates.assigned_route_id = assignedRouteId
    }
    
    // Both admin and driver can update these
    if (status !== undefined) updates.status = status
    if (currentPassengers !== undefined) updates.current_passengers = parseInt(currentPassengers)
    if (latitude !== undefined && longitude !== undefined) {
      updates.current_latitude = parseFloat(latitude)
      updates.current_longitude = parseFloat(longitude)
      updates.last_location_update = new Date().toISOString()
    }

    const updatedShuttle = await db.updateShuttle(req.params.id, updates)
    
    console.log(` Shuttle updated: ${updatedShuttle.name}`)
    return res.json(updatedShuttle)
  } catch (error) {
    console.error('Error updating shuttle:', error)
    return res.status(500).json({
      error: 'Failed to update shuttle',
      message: 'An error occurred while updating the shuttle'
    })
  }
})

/**
 * @swagger
 * /api/shuttles/{id}:
 *   delete:
 *     summary: Delete a shuttle
 *     description: Delete a shuttle (admin only)
 *     tags:
 *       - Shuttles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Shuttle deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
// Delete shuttle (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await db.deleteShuttle(req.params.id)
    
    console.log(` Shuttle deleted: ${req.params.id}`)
    return res.json({
      message: 'Shuttle deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting shuttle:', error)
    return res.status(500).json({
      error: 'Failed to delete shuttle',
      message: 'An error occurred while deleting the shuttle'
    })
  }
})

/**
 * @swagger
 * /api/shuttles/{id}/location:
 *   post:
 *     summary: Update shuttle location
 *     description: Update real-time shuttle location (drivers only)
 *     tags:
 *       - Shuttles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               speed:
 *                 type: number
 *               heading:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not assigned to this shuttle
 */
// Update shuttle location (driver only - for real-time tracking)
router.post('/:id/location', authenticateToken, requireDriver, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'latitude and longitude are required'
      })
    }

    const shuttle = await db.getShuttle(req.params.id)
    
    // Verify driver is assigned to this shuttle
    if (shuttle.assigned_driver_id !== req.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not assigned to this shuttle'
      })
    }

    // Update shuttle location
    await db.updateShuttle(req.params.id, {
      current_latitude: parseFloat(latitude),
      current_longitude: parseFloat(longitude),
      last_location_update: new Date().toISOString(),
    })

    // Optionally store in location history for tracking
    // You can implement this later if needed

    return res.json({
      message: 'Location updated successfully',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating shuttle location:', error)
    return res.status(500).json({
      error: 'Failed to update location',
      message: 'An error occurred while updating shuttle location'
    })
  }
})

export default router
