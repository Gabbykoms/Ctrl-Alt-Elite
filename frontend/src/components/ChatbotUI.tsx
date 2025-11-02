import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import Chatbot from './Chatbot'

export function ChatbotFab() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 ${
          isOpen ? 'hidden' : 'flex'
        } bg-secondary text-dark hover:bg-opacity-90`}
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
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
    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-96 h-96 sm:h-screen sm:rounded-l-lg shadow-2xl flex flex-col bg-white">
      {/* Header */}
      <div className="bg-secondary text-dark px-4 py-4 flex items-center justify-between rounded-t-lg sm:rounded-t-lg">
        <h2 className="font-bold text-lg">Bantam ShuttleBot</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-opacity-80 hover:bg-dark rounded"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Chat Content */}
      <Chatbot />
    </div>
  )
}
