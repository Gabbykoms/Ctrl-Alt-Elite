import React from 'react'
import { LogOut } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
  userRole: 'student' | 'driver' | 'admin'
  onLogout: () => void
}

export default function AppLayout({ children, userRole, onLogout }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Bantam Shuttle</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 capitalize">{userRole}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">
        {children}
      </main>
    </div>
  )
}
