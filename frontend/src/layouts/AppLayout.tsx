import { useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { ChatbotFab } from '../components/ChatbotUI'

interface AppLayoutProps {
  children: React.ReactNode
  userRole?: 'student' | 'driver' | 'admin'
  onLogout: () => void
}

export default function AppLayout({ children, userRole = 'student', onLogout }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-neutral">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
        onLogout={onLogout}
      />

      {/* Mobile Header */}
      <Header
        onMenuToggle={setSidebarOpen}
        isMenuOpen={sidebarOpen}
        userRole={userRole}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 md:mt-0 mt-16 overflow-auto">
        {children}
      </main>

      {/* Chatbot FAB */}
      <ChatbotFab />
    </div>
  )
}
