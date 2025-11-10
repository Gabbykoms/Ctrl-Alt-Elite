import { useState, useEffect } from 'react'
import { Mail, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'

export default function VerifyEmailPage() {
  const [resendCooldown, setResendCooldown] = useState(0)
  const [hasResent, setHasResent] = useState(false)
  const [searchParams] = useSearchParams()
  const isVerified = searchParams.get('verified') === 'true'
  const verificationError = searchParams.get('error')

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendEmail = () => {
    setResendCooldown(60)
    setHasResent(true)
  }

  if (isVerified) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-auto">
        <div className="mb-6 flex justify-center animate-in scale-in">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle size={48} className="text-green-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-dark mb-2">Email Verified!</h2>
        
        <p className="text-gray-600 mb-8">
          Your email has been successfully verified. You can now access your account.
        </p>

        <Link
          to="/login"
          className="inline-block px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  if (verificationError) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertCircle size={48} className="text-red-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-dark mb-2">Verification Failed</h2>
        
        <p className="text-gray-600 mb-8">
          The verification link may have expired or is invalid. Please request a new one.
        </p>

        <button
          onClick={handleResendEmail}
          disabled={resendCooldown > 0}
          className={`inline-block px-8 py-3 rounded-lg font-semibold transition-all ${
            resendCooldown > 0
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-primary text-white hover:opacity-90'
          }`}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-auto">
      <div className="mb-6 flex justify-center animate-bounce">
        <div className="bg-secondary bg-opacity-20 p-4 rounded-full">
          <Mail size={48} className="text-secondary" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-dark mb-2">Verification Email Sent!</h2>
      
      <p className="text-gray-600 mb-6">
        Please check your <span className="font-semibold">@trincoll.edu</span> inbox for a verification link to activate your account.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Clock size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-left">
          <p className="text-blue-900 font-medium text-sm">Link expires in 24 hours</p>
          <p className="text-blue-800 text-xs mt-1">Check your spam folder if you don't see it.</p>
        </div>
      </div>

      {hasResent && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2 animate-in fade-in">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-sm text-left">
            Verification email resent! Check your inbox.
          </p>
        </div>
      )}

      <button
        onClick={handleResendEmail}
        disabled={resendCooldown > 0}
        className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
          resendCooldown > 0
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-primary text-white hover:opacity-90'
        }`}
      >
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
      </button>

      <p className="text-gray-600 text-sm mt-6">
        Already verified? <Link to="/login" className="text-primary hover:underline font-semibold">Go to login</Link>
      </p>
    </div>
  )
}
