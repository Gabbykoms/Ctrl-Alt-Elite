import { useState } from 'react'
import { Clock, MapPin, Users, Edit2, Trash2, Plus } from 'lucide-react'

// Mock schedule data
const MOCK_SCHEDULE = [
  {
    id: 1,
    routeName: 'North Campus Loop',
    departure: '6:30 AM',
    arrival: '6:45 AM',
    stops: ['Main Quad', 'Long Walk', 'Athletic Center', 'Crescent Neighborhood'],
    capacity: 25,
    passengers: 18,
    status: 'scheduled',
  },
  {
    id: 2,
    routeName: 'North Campus Loop',
    departure: '7:00 AM',
    arrival: '7:15 AM',
    stops: ['Main Quad', 'Long Walk', 'Athletic Center', 'Crescent Neighborhood'],
    capacity: 25,
    passengers: 24,
    status: 'scheduled',
  },
  {
    id: 3,
    routeName: 'South Campus Loop',
    departure: '7:30 AM',
    arrival: '7:50 AM',
    stops: ['Athletic Center', 'Science Center', 'Vernon Street', 'Main Quad'],
    capacity: 30,
    passengers: 22,
    status: 'scheduled',
  },
  {
    id: 4,
    routeName: 'North Campus Loop',
    departure: '8:00 AM',
    arrival: '8:15 AM',
    stops: ['Main Quad', 'Long Walk', 'Athletic Center', 'Crescent Neighborhood'],
    capacity: 25,
    passengers: 25,
    status: 'active',
  },
  {
    id: 5,
    routeName: 'Arts & Sciences Shuttle',
    departure: '8:30 AM',
    arrival: '8:45 AM',
    stops: ['Vernon Street', 'Summits'],
    capacity: 15,
    passengers: 12,
    status: 'scheduled',
  },
  {
    id: 6,
    routeName: 'South Campus Loop',
    departure: '9:00 AM',
    arrival: '9:20 AM',
    stops: ['Athletic Center', 'Science Center', 'Vernon Street', 'Main Quad'],
    capacity: 30,
    passengers: 19,
    status: 'scheduled',
  },
  {
    id: 7,
    routeName: 'Crescent Express',
    departure: '8:45 AM',
    arrival: '9:00 AM',
    stops: ['Summits', 'Crescent Neighborhood', 'Vernon Street'],
    capacity: 20,
    passengers: 15,
    status: 'scheduled',
  },
]

// Mock driver data
const MOCK_DRIVERS = [
  { id: 1, name: 'John Smith', email: 'john.smith@trincoll.edu', phone: '(860) 555-0101', status: 'active', hoursWorked: 8 },
  { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@trincoll.edu', phone: '(860) 555-0102', status: 'active', hoursWorked: 6 },
  { id: 3, name: 'Michael Chen', email: 'michael.chen@trincoll.edu', phone: '(860) 555-0103', status: 'inactive', hoursWorked: 0 },
  { id: 4, name: 'Emma Davis', email: 'emma.davis@trincoll.edu', phone: '(860) 555-0104', status: 'active', hoursWorked: 7 },
  { id: 5, name: 'James Wilson', email: 'james.wilson@trincoll.edu', phone: '(860) 555-0105', status: 'on-break', hoursWorked: 4 },
]

// Mock route data
const MOCK_ROUTES_DATA = [
  { id: 1, name: 'North Campus Loop', description: 'Circular route around north campus', stops: 4, distance: '2.5 mi', duration: '15 min', frequency: 'Every 30 min' },
  { id: 2, name: 'South Campus Loop', description: 'Circular route around south campus', stops: 4, distance: '2.1 mi', duration: '20 min', frequency: 'Every 30 min' },
  { id: 3, name: 'Arts & Sciences Shuttle', description: 'Point-to-point shuttle service', stops: 2, distance: '0.8 mi', duration: '15 min', frequency: 'Every 45 min' },
  { id: 4, name: 'Crescent Express', description: 'Express route to Crescent neighborhood', stops: 3, distance: '1.5 mi', duration: '12 min', frequency: 'Every 20 min' },
  { id: 5, name: 'Vernon Street Connector', description: 'Connect to Vernon Street area', stops: 2, distance: '1.1 mi', duration: '10 min', frequency: 'Every 25 min' },
]

// Mock user profile
const MOCK_USER_PROFILE = {
  name: 'Alex Rivera',
  email: 'alex.rivera@trincoll.edu',
  phone: '(860) 555-0150',
  role: 'student',
  joinDate: '2024-09-15',
  favoriteRoutes: ['North Campus Loop', 'Arts & Sciences Shuttle'],
  bio: 'Junior studying Computer Science',
}

export function SchedulePage() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled'>('all')

  const filteredSchedule = selectedRoute
    ? MOCK_SCHEDULE.filter((item) => item.routeName === selectedRoute && (filter === 'all' || item.status === filter))
    : MOCK_SCHEDULE.filter((item) => filter === 'all' || item.status === filter)

  const routes = Array.from(new Set(MOCK_SCHEDULE.map((item) => item.routeName)))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">Shuttle Schedule</h1>
        <p className="text-gray-600">View and manage all shuttle departures for today</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="font-semibold text-dark">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Route Filter */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Route</label>
            <select
              value={selectedRoute || ''}
              onChange={(e) => setSelectedRoute(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Routes</option>
              {routes.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Route</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Departure</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Arrival</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Stops</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Capacity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSchedule.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-dark">{item.routeName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} />
                      {item.departure}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.arrival}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      {item.stops.length} stops
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-600" />
                      <span className="font-medium">{item.passengers}</span>
                      <span className="text-gray-500">{item.capacity > item.passengers ? `/${item.capacity}` : ' (Full)'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {item.status === 'active' ? '🟢 Active' : '🔵 Scheduled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSchedule.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No schedules found for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(MOCK_USER_PROFILE)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">My Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Edit2 size={18} />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        {/* Profile Info */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mb-4">
              <span className="text-5xl font-bold text-primary">{profile.name.charAt(0)}</span>
            </div>
            <h2 className="text-2xl font-bold text-dark">{profile.name}</h2>
            <p className="text-gray-600 capitalize">{profile.role}</p>
          </div>

          {/* Details Section */}
          <div className="flex-1 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-medium text-dark">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-lg font-medium text-dark">{profile.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bio</p>
                  <p className="text-lg text-dark">{profile.bio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-lg font-medium text-dark">
                    {new Date(profile.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Favorite Routes */}
        {!isEditing && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-dark mb-4">Favorite Routes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.favoriteRoutes.map((route, idx) => (
                <div key={idx} className="bg-primary bg-opacity-10 rounded-lg p-4">
                  <p className="font-medium text-dark">{route}</p>
                  <p className="text-sm text-gray-600">Saved for quick access</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function DriverManagementPage() {
  const [drivers, setDrivers] = useState(MOCK_DRIVERS)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleDelete = (id: number) => {
    setDrivers(drivers.filter((d) => d.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">Driver Management</h1>
          <p className="text-gray-600">Manage all drivers and their assignments</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          Add Driver
        </button>
      </div>

      {/* Add Driver Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
          <h3 className="text-lg font-semibold text-dark mb-4">Add New Driver</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Name" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="email" placeholder="Email" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="tel" placeholder="Phone" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>On Break</option>
            </select>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium">
              Save Driver
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Hours</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-dark">{driver.name}</td>
                  <td className="px-6 py-4 text-gray-600">{driver.email}</td>
                  <td className="px-6 py-4 text-gray-600">{driver.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        driver.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : driver.status === 'on-break'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {driver.status === 'active' ? '🟢' : driver.status === 'on-break' ? '🟡' : '⚫'} {driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-dark">{driver.hoursWorked}h</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600">
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function RouteManagementPage() {
  const [routes, setRoutes] = useState(MOCK_ROUTES_DATA)
  const [showForm, setShowForm] = useState(false)

  const handleDelete = (id: number) => {
    setRoutes(routes.filter((r) => r.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">Route Management</h1>
          <p className="text-gray-600">Manage shuttle routes and schedules</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          Add Route
        </button>
      </div>

      {/* Add Route Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
          <h3 className="text-lg font-semibold text-dark mb-4">Create New Route</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Route Name" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="text" placeholder="Distance (e.g., 2.5 mi)" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <textarea placeholder="Description" className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" rows={2} />
            <input type="text" placeholder="Duration (e.g., 15 min)" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="text" placeholder="Frequency (e.g., Every 30 min)" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="mt-4 flex gap-3">
            <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium">
              Create Route
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <div key={route.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-dark mb-2">{route.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{route.description}</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin size={16} className="text-primary" />
                <span>{route.stops} stops • {route.distance}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock size={16} className="text-primary" />
                <span>{route.duration}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Frequency: {route.frequency}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(route.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
