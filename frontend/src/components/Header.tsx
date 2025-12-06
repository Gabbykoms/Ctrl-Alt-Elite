import { useState, useEffect, useRef } from 'react'
import { Menu, X, User, Settings, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  onMenuToggle: (open: boolean) => void
  isMenuOpen: boolean
  userRole?: 'student' | 'driver' | 'admin'
  onLogout?: () => void
}

export default function Header({ onMenuToggle, isMenuOpen, userRole = 'student', onLogout }: HeaderProps) {
  const { user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    setShowDropdown(false)
    if (onLogout) {
      onLogout()
    } else {
      logout()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getSettingsPath = () => {
    if (userRole === 'driver') return '/driver/settings'
    if (userRole === 'admin') return '/admin/settings'
    return '/student/settings'
  }

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-primary text-white h-16 flex items-center justify-between px-4 z-50 shadow-md">
      <h1 className="text-xl font-bold">Bantam Shuttle</h1>
      
      <div className="flex items-center gap-3">
        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-opacity-90 rounded-full bg-white bg-opacity-20"
            aria-label="User menu"
          >
            <User size={20} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 text-gray-800">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              
              <Link
                to={getSettingsPath()}
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-red-600"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Menu Toggle */}
        <button
          onClick={() => onMenuToggle(!isMenuOpen)}
          className="p-2 hover:bg-opacity-90"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  )
}
