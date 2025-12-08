import { useState, useEffect, useRef } from 'react'
import { Send, Clock, MapPin, HelpCircle } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'suggestions'
}

// Mock knowledge base for chatbot responses
const CHATBOT_RESPONSES: Record<string, string> = {
  'north campus': 'The North Campus Loop runs every 30 minutes from 6:30 AM to 10:00 PM. It stops at Main Quad, Long Walk, and Athletic Center. Current capacity is 18/25 passengers.',
  'south campus': 'The South Campus Loop operates every 30 minutes and serves Athletic Center, Science Center, and Main Quad. Estimated time: 20 minutes.',
  'arts sciences': 'The Arts & Sciences Shuttle runs every 45 minutes between McCook Center and Arts & Sciences building. Travel time: 15 minutes.',
  'schedule': 'You can view the complete schedule in the "Schedule" section of the app. We have routes starting from 6:30 AM throughout the day.',
  'delay': 'Real-time delay information is available in the live map. If you notice a delay, you can report it through the app.',
  'next shuttle': 'The next shuttle for North Campus Loop departs at 2:30 PM from Main Quad.',
  'how many': 'We currently operate 5 main routes with 12 total shuttles serving the campus.',
  'hello': 'Hi there! How can I help you with shuttle information today?',
  'help': 'I can help you with:\n• Route information and schedules\n• Shuttle locations and times\n• Current delays\n• General campus shuttle info',
  'thank': 'You\'re welcome! Feel free to ask if you have more questions.',
}

const QUICK_SUGGESTIONS = [
  { icon: Clock, text: 'Next Shuttle', query: 'When is the next shuttle?' },
  { icon: MapPin, text: 'North Campus', query: 'Tell me about North Campus Loop' },
  { icon: HelpCircle, text: 'Help', query: 'How can you help?' },
]

const findBotResponse = (userInput: string): string => {
  const lowerInput = userInput.toLowerCase()
  
  // Check for exact or partial matches
  for (const [key, response] of Object.entries(CHATBOT_RESPONSES)) {
    if (lowerInput.includes(key)) {
      return response
    }
  }
  
  // Default responses
  if (lowerInput.includes('?')) {
    return 'Great question! I can help with shuttle schedules, routes, and real-time information. What would you like to know?'
  }
  
  return 'I understand. For more specific shuttle information, you can check the Schedule or Map sections of the app, or ask me anything about our routes!'
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Hi! I\'m ShuttleBot. I can help you with shuttle times, routes, and campus transportation. What would you like to know?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'suggestions',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent | null, customText?: string) => {
    if (e) e.preventDefault()
    const textToSend = customText || inputValue.trim()
    if (!textToSend) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate bot response delay
    setTimeout(() => {
      const response = findBotResponse(textToSend)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 800)
  }

  // Show suggestions if this is the first message
  const showSuggestions = messages.length === 1 && messages[0].sender === 'bot'

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg whitespace-pre-wrap ${
                  message.sender === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-gray-200 text-dark rounded-bl-none'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>

            {/* Show suggestions after initial bot message */}
            {showSuggestions && message.sender === 'bot' && (
              <div className="flex justify-start mt-3">
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-xs text-gray-500 px-2">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SUGGESTIONS.map((suggestion) => {
                      const Icon = suggestion.icon
                      return (
                        <button
                          key={suggestion.text}
                          onClick={() => handleSendMessage(null, suggestion.query)}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-medium transition-colors border border-blue-200"
                        >
                          <Icon size={14} />
                          {suggestion.text}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-dark px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="bg-primary text-white p-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
