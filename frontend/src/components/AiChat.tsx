import React, { useState, useEffect, useRef } from 'react'
import { Send, Loader } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

const AiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Hi! I\'m your AI Assistant. How can I help you with shuttle information today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const AI_URL = import.meta.env.VITE_AI_SERVICE_URL

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const pollForResponse = async (requestId: string, messageId: string) => {
    const maxAttempts = 60 // 2 minutes max (60 * 2 seconds)
    let attempts = 0

    const poll = async () => {
      try {
        attempts++
        const response = await fetch(`${AI_URL}/chat/response/${requestId}`)
        
        if (!response.ok) {
          throw new Error(`Polling error: ${response.status}`)
        }

        const data = await response.json()

        if (data.status === 'completed') {
          // Update the placeholder message with the actual response
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, text: data.response || 'Response received but empty.' }
                : msg
            )
          )
          setLoading(false)
          inputRef.current?.focus()
        } else if (data.status === 'failed') {
          // Handle failed status
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, text: `Error: ${data.error_message || 'Request failed'}` }
                : msg
            )
          )
          setLoading(false)
          inputRef.current?.focus()
        } else if (attempts >= maxAttempts) {
          // Timeout
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, text: 'Request timed out. Please try again.' }
                : msg
            )
          )
          setLoading(false)
          inputRef.current?.focus()
        } else {
          // Still processing, poll again in 2 seconds
          setTimeout(poll, 2000)
        }
      } catch (error: any) {
        console.error('Polling Error:', error)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, text: 'Sorry, I encountered an error while processing your request.' }
              : msg
          )
        )
        setLoading(false)
        inputRef.current?.focus()
      }
    }

    poll()
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Submit request to queue
      const response = await fetch(`${AI_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      
      // Add placeholder message while processing
      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: Message = {
        id: aiMessageId,
        text: 'Your request is being processed...',
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])

      // Start polling for the response
      pollForResponse(data.request_id, aiMessageId)

    } catch (error: any) {
      console.error('AI Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-3 space-y-3 md:space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[85%] md:max-w-[80%] px-4 py-2.5 rounded-lg break-words leading-relaxed text-sm md:text-sm ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-sm'
              }`}
            >
              <p>{message.text}</p>
              <span className={`text-xs opacity-70 mt-1 block ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white text-gray-800 px-4 py-2.5 rounded-lg rounded-bl-none border border-gray-200 flex items-center gap-2 shadow-sm">
              <Loader size={16} className="animate-spin text-blue-600" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default AiChat
