import { db, supabase } from '../services/database.js'

/**
 * Test database connection and basic operations
 */
async function testDatabaseConnection() {
  console.log('🔧 Testing database connection...\n')

  try {
    // Test 1: Check Supabase connection
    console.log('1️ Testing Supabase connection...')
    const { error: testError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true })

    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`)
    }
    console.log(' Supabase connection successful\n')

    // Test 2: Query all stops
    console.log('2️ Querying stops...')
    const stops = await db.getAllStops()
    console.log(` Found ${stops?.length || 0} active stops`)
    if (stops && stops.length > 0) {
      console.log(`   Sample: ${stops[0].name} (${stops[0].latitude}, ${stops[0].longitude})\n`)
    }

    // Test 3: Query all routes
    console.log('3️ Querying routes...')
    const routes = await db.getAllRoutes()
    console.log(` Found ${routes?.length || 0} active routes`)
    if (routes && routes.length > 0) {
      console.log(`   Sample: ${routes[0].name}\n`)
    }

    // Test 4: Query all shuttles
    console.log('4️ Querying shuttles...')
    const shuttles = await db.getAllShuttles()
    console.log(` Found ${shuttles?.length || 0} shuttles`)
    if (shuttles && shuttles.length > 0) {
      console.log(`   Sample: ${shuttles[0].name} (Status: ${shuttles[0].status})\n`)
    }

    // Test 5: Query all rides
    console.log('5️ Querying rides...')
    const rides = await db.getAllRides()
    console.log(` Found ${rides?.length || 0} rides\n`)

    console.log(' All database tests passed!')
  } catch (error) {
    console.error(' Database test failed:')
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run tests
testDatabaseConnection()
