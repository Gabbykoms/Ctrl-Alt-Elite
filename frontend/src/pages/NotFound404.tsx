import { Link } from 'react-router-dom'
import { MapPin, Home, Map } from 'lucide-react'

export default function NotFound404() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral to-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Animated Icon */}
        <div className="mb-8 flex justify-center animate-bounce">
          <div className="text-6xl">🚌</div>
        </div>

        <h1 className="text-8xl font-bold text-primary mb-4 animate-in slide-in-from-top">404</h1>
        <h2 className="text-3xl font-bold text-dark mb-3">Oops! Lost Route?</h2>
        
        <p className="text-gray-600 mb-8 text-lg">
          The page you're looking for doesn't exist. Maybe the shuttle already departed! 🚌
        </p>

        {/* Quick Navigation */}
        <div className="space-y-3 mb-10">
          <Link
            to="/student"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105"
          >
            <Home size={20} />
            Go to Dashboard
          </Link>

          <Link
            to="/student"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary bg-opacity-20 text-dark border border-secondary rounded-lg font-semibold hover:bg-opacity-30 transition-all"
          >
            <Map size={20} />
            View Map
          </Link>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-lg shadow-md p-6 text-left">
          <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
            <MapPin size={18} />
            Common Routes
          </h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>• <Link to="/student" className="text-primary hover:underline">Student Dashboard</Link></li>
            <li>• <Link to="/driver" className="text-primary hover:underline">Driver Dashboard</Link></li>
            <li>• <Link to="/admin" className="text-primary hover:underline">Admin Dashboard</Link></li>
            <li>• <Link to="/login" className="text-primary hover:underline">Login Page</Link></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
