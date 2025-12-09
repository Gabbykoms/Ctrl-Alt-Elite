import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import AiChat from './AiChat'

export function ChatbotFab() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 ${
          isOpen ? 'hidden' : 'flex'
        } bg-blue-600 text-white hover:bg-blue-700`}
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Modal Overlay - Only visible on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Window */}
      <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  if (!isOpen) return null

  return (
    <div className={`fixed bottom-0 right-0 z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 ${
      isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }
    w-full h-[100dvh] md:w-96 md:h-[32rem] md:rounded-t-lg md:bottom-6 md:right-6
    `}>
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between rounded-t-lg flex-shrink-0">
        <h2 className="font-bold text-lg">AI Assistant</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-blue-700 rounded transition-colors"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        <AiChat />
      </div>
    </div>
  )
}
