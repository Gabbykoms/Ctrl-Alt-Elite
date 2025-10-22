import { useState, useEffect } from 'react'
import { Mail, AlertCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const [resendCooldown, setResendCooldown] = useState(0)
  const [hasResent, setHasResent] = useState(false)

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendEmail = () => {
    setResendCooldown(60)
    setHasResent(true)
    // TODO: Connect to backend to resend email
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="mb-6 flex justify-center">
        <div className="bg-secondary bg-opacity-20 p-4 rounded-full">
          <Mail size={40} className="text-secondary" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-dark mb-2">Verification Email Sent!</h2>
      
      <p className="text-gray-600 mb-6">
        Please check your <span className="font-semibold">@trincoll.edu</span> inbox for a link to activate your account.
      </p>

      {hasResent && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3 flex items-gap gap-2">
          <AlertCircle size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm">
            Verification email resent! Check your inbox.
          </p>
        </div>
      )}

      <button
        onClick={handleResendEmail}
        disabled={resendCooldown > 0}
        className={`px-6 py-2 rounded-lg font-semibold transition-all ${
          resendCooldown > 0
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-primary text-white hover:opacity-90'
        }`}
      >
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
      </button>

      <p className="text-gray-600 text-sm mt-6">
        Didn't receive the email? Check your spam folder or try resending.
      </p>
    </div>
  )
}
