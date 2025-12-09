import express, { Request, Response } from 'express'
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js'
import { db, supabase } from '../services/database.js'

const router = express.Router()

// Get all routes (public - anyone can view)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const routes = await db.getAllRoutes()
    
    // Format the response to match your frontend expectations
    const formattedRoutes = routes.map((route: any) => ({
      ...route,
      stops: route.route_stops
        ?.sort((a: any, b: any) => a.stop_order - b.stop_order)
        .map((rs: any) => rs.stops) || []
    }))
    
    return res.json({ 
      routes: formattedRoutes,
      total: routes.length 
    })
  } catch (error) {
    console.error('Error fetching routes:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch routes',
      message: 'An error occurred while fetching routes'
    })
  }
})

// Get single route (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const route = await db.getRoute(req.params.id)
    
    // Format stops in order
    const formattedRoute = {
      ...route,
      stops: route.route_stops
        ?.sort((a: any, b: any) => a.stop_order - b.stop_order)
        .map((rs: any) => rs.stops) || []
    }
    
    return res.json(formattedRoute)
  } catch (error) {
    console.error('Error fetching route:', error)
    return res.status(404).json({ 
      error: 'Route not found',
      message: 'The requested route does not exist'
    })
  }
})

// Create route (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, distance, duration, frequency, stops } = req.body

    // Validation
    if (!name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name is required'
      })
    }

    // Create the route
    const routeData = {
      name,
      description,
      distance: distance ? parseFloat(distance) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      frequency: frequency ? parseInt(frequency) : undefined,
      is_active: true,
    }

    const route = await db.createRoute(routeData)

    // If stops array is provided, add them to the route
    if (stops && Array.isArray(stops) && stops.length > 0) {
      const routeStops = stops.map((stopId: string, index: number) => ({
        route_id: route.id,
        stop_id: stopId,
        stop_order: index + 1,
      }))

      const { error: routeStopsError } = await supabase
        .from('route_stops')
        .insert(routeStops)

      if (routeStopsError) {
        console.error('Error adding stops to route:', routeStopsError)
        // Route is created but stops failed - you might want to rollback
      }
    }
    
    console.log(`✅ Route created: ${route.name}`)
    return res.status(201).json(route)
  } catch (error) {
    console.error('Error creating route:', error)
    return res.status(500).json({ 
      error: 'Failed to create route',
      message: 'An error occurred while creating the route'
    })
  }
})

// Update route (admin only)
router.patch('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, distance, duration, frequency, stops, is_active } = req.body

    // Update route metadata
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (distance !== undefined) updates.distance = parseFloat(distance)
    if (duration !== undefined) updates.duration = parseInt(duration)
    if (frequency !== undefined) updates.frequency = parseInt(frequency)
    if (is_active !== undefined) updates.is_active = is_active

    const route = await db.updateRoute(req.params.id, updates)

    // If stops array is provided, update the route stops
    if (stops && Array.isArray(stops)) {
      // Delete existing route stops
      await supabase
        .from('route_stops')
        .delete()
        .eq('route_id', req.params.id)

      // Insert new route stops
      if (stops.length > 0) {
        const routeStops = stops.map((stopId: string, index: number) => ({
          route_id: req.params.id,
          stop_id: stopId,
          stop_order: index + 1,
        }))

        await supabase
          .from('route_stops')
          .insert(routeStops)
      }
    }
    
    console.log(`✅ Route updated: ${route.name}`)
    return res.json(route)
  } catch (error) {
    console.error('Error updating route:', error)
    return res.status(500).json({ 
      error: 'Failed to update route',
      message: 'An error occurred while updating the route'
    })
  }
})

// Delete route (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Route stops will be automatically deleted due to CASCADE
    await db.deleteRoute(req.params.id)
    
    console.log(`✅ Route deleted: ${req.params.id}`)
    return res.json({ 
      message: 'Route deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting route:', error)
    return res.status(500).json({ 
      error: 'Failed to delete route',
      message: 'An error occurred while deleting the route'
    })
  }
})

export default router