import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email')
      return false
    }
    setEmailError('')
    return true
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (value) validateEmail(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setEmailError('Please fill in all fields')
      return
    }

    if (!validateEmail(email)) {
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/student')
    } catch (error) {
      setEmailError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-dark mb-6">Sign In</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
              emailError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
          />
          {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        <p>
          <Link to="#" className="text-primary hover:underline">
            Forgot Password?
          </Link>
        </p>
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-semibold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
