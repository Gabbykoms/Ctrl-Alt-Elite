
import { Link, useLocation } from 'react-router-dom'
import { LogOut, MapPin, Calendar, User, BarChart3, Settings } from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  userRole?: 'student' | 'driver' | 'admin'
  onLogout: () => void
}

export default function Sidebar({ isOpen = true, onClose, userRole = 'student', onLogout }: SidebarProps) {
  const location = useLocation()
  
  const isActive = (path: string) => location.pathname.startsWith(path)

  const getNavItems = () => {
    if (userRole === 'driver') {
      return [
        { label: 'Dashboard', path: '/driver', icon: BarChart3 },
        { label: 'Settings', path: '/driver/settings', icon: Settings },
      ]
    }

    if (userRole === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin', icon: BarChart3 },
        { label: 'Drivers', path: '/admin/drivers', icon: User },
        { label: 'Routes', path: '/admin/routes', icon: MapPin },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
      ]
    }

    // Student items
    return [
      { label: 'Map', path: '/student', icon: MapPin },
      { label: 'Schedule', path: '/student/schedule', icon: Calendar },
      { label: 'Settings', path: '/student/settings', icon: Settings },
    ]
  }

  const navItems = getNavItems()

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-opacity-20 border-white">
        <h1 className="text-2xl font-bold text-white">Bantam Shuttle</h1>
      </div>
      
      <nav className="flex-1 p-6 space-y-2">
        {navItems.map(({ label, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(path)
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-white hover:bg-blue-500'
            }`}
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-200">
  <button
    onClick={onLogout}
    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
  >
    <LogOut size={20} />
    <span>Log Out</span>
  </button>
</div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      {/* CHANGED: md:bg-primary to md:bg-blue-600 */}
      <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 md:w-64 md:bg-blue-600 md:flex-col md:shadow-lg">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          {/* CHANGED: bg-primary to bg-blue-600 */}
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-blue-600 flex flex-col shadow-lg z-50 mt-16">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}