// import express, { Request, Response } from 'express'

// const router = express.Router()

// const mockStops = [
//   { id: 'stop-1', name: 'Main Quad', lat: 41.77, lng: -72.64 },
//   { id: 'stop-2', name: 'Long Walk', lat: 41.768, lng: -72.638 },
//   { id: 'stop-3', name: 'Athletic Center', lat: 41.772, lng: -72.642 },
//   { id: 'stop-4', name: 'Science Center', lat: 41.766, lng: -72.636 },
//   { id: 'stop-5', name: 'Library', lat: 41.765, lng: -72.641 },
//   { id: 'stop-6', name: 'Crescent Neighborhood', lat: 41.774, lng: -72.645 },
//   { id: 'stop-7', name: 'Vernon Street', lat: 41.763, lng: -72.632 },
//   { id: 'stop-8', name: 'Summits', lat: 41.769, lng: -72.635 },
// ]

// router.get('/', (req: Request, res: Response) => {
//   return res.json({ stops: mockStops })
// })

// router.get('/:id', (req: Request, res: Response) => {
//   const stop = mockStops.find((s) => s.id === req.params.id)
//   return stop ? res.json(stop) : res.status(404).json({ error: 'Not found' })
// })

// router.post('/', (req: Request, res: Response) => {
//   return res.status(201).json({ message: 'Stop created' })
// })

// router.patch('/:id', (req: Request, res: Response) => {
//   return res.json({ message: 'Stop updated' })
// })

// router.delete('/:id', (req: Request, res: Response) => {
//   return res.json({ message: 'Stop deleted' })
// })

// export default router



import express, { Request, Response } from 'express'
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js'
import { db } from '../services/database.js'

const router = express.Router()

/**
 * @swagger
 * /api/stops:
 *   get:
 *     summary: Get all stops
 *     description: Retrieve all shuttle stops with their locations
 *     tags:
 *       - Stops
 *     responses:
 *       200:
 *         description: Successfully retrieved stops
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stops:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stop'
 *                 total:
 *                   type: integer
 *       500:
 *         description: Failed to fetch stops
 */
// Get all stops (public - anyone can view)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const stops = await db.getAllStops()
    return res.json({ 
      stops,
      total: stops.length 
    })
  } catch (error) {
    console.error('Error fetching stops:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch stops',
      message: 'An error occurred while fetching stops'
    })
  }
})

/**
 * @swagger
 * /api/stops/{id}:
 *   get:
 *     summary: Get a specific stop
 *     tags:
 *       - Stops
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Stop details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stop'
 *       404:
 *         description: Stop not found
 */
// Get single stop (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const stop = await db.getStop(req.params.id)
    return res.json(stop)
  } catch (error) {
    console.error('Error fetching stop:', error)
    return res.status(404).json({ 
      error: 'Stop not found',
      message: 'The requested stop does not exist'
    })
  }
})

/**
 * @swagger
 * /api/stops:
 *   post:
 *     summary: Create a new stop
 *     description: Create a new shuttle stop (admin only)
 *     tags:
 *       - Stops
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
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Stop created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stop'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
// Create stop (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, latitude, longitude } = req.body

    // Validation
    if (!name || !latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, latitude, and longitude are required'
      })
    }

    const stopData = {
      name,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      is_active: true,
    }

    const stop = await db.createStop(stopData)
    
    console.log(`✅ Stop created: ${stop.name}`)
    return res.status(201).json(stop)
  } catch (error) {
    console.error('Error creating stop:', error)
    return res.status(500).json({ 
      error: 'Failed to create stop',
      message: 'An error occurred while creating the stop'
    })
  }
})

/**
 * @swagger
 * /api/stops/{id}:
 *   patch:
 *     summary: Update a stop
 *     description: Update an existing shuttle stop (admin only)
 *     tags:
 *       - Stops
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
 *               description:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Stop updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stop'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
// Update stop (admin only)
router.patch('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, latitude, longitude, is_active } = req.body

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (latitude !== undefined) updates.latitude = parseFloat(latitude)
    if (longitude !== undefined) updates.longitude = parseFloat(longitude)
    if (is_active !== undefined) updates.is_active = is_active

    const stop = await db.updateStop(req.params.id, updates)
    
    console.log(`✅ Stop updated: ${stop.name}`)
    return res.json(stop)
  } catch (error) {
    console.error('Error updating stop:', error)
    return res.status(500).json({ 
      error: 'Failed to update stop',
      message: 'An error occurred while updating the stop'
    })
  }
})

/**
 * @swagger
 * /api/stops/{id}:
 *   delete:
 *     summary: Delete a stop
 *     description: Delete a shuttle stop (admin only)
 *     tags:
 *       - Stops
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
 *         description: Stop deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
// Delete stop (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await db.deleteStop(req.params.id)
    
    console.log(`✅ Stop deleted: ${req.params.id}`)
    return res.json({ 
      message: 'Stop deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting stop:', error)
    return res.status(500).json({ 
      error: 'Failed to delete stop',
      message: 'An error occurred while deleting the stop'
    })
  }
})

export default router