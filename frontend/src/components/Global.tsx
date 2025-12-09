import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

// Loading Components
export function Spinner() {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  )
}

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-2xl">
        <Spinner />
        <p className="text-center text-dark mt-4 font-medium">Loading...</p>
      </div>
    </div>
  )
}

export function InlineLoader() {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Spinner />
      <span>Loading...</span>
    </div>
  )
}

// Alert/Error Components
interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4 flex items-start gap-3">
      <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-800 font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 font-bold text-lg"
        >
          ×
        </button>
      )}
    </div>
  )
}

interface SuccessMessageProps {
  message: string
  onDismiss?: () => void
}

export function SuccessMessage({ message, onDismiss }: SuccessMessageProps) {
  return (
    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4 flex items-start gap-3">
      <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-green-800 font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-500 hover:text-green-700 font-bold text-lg"
        >
          ×
        </button>
      )}
    </div>
  )
}

interface InfoMessageProps {
  message: string
  onDismiss?: () => void
}

export function InfoMessage({ message, onDismiss }: InfoMessageProps) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4 flex items-start gap-3">
      <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-blue-800 font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-blue-500 hover:text-blue-700 font-bold text-lg"
        >
          ×
        </button>
      )}
    </div>
  )
}

// Toast Notifications
interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export function Toast({ type, message }: ToastProps) {
  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom z-50 ${
        type === 'success'
          ? 'bg-green-500'
          : type === 'error'
            ? 'bg-red-500'
            : 'bg-blue-500'
      } text-white`}
    >
      {type === 'success' && <CheckCircle size={20} />}
      {type === 'error' && <AlertTriangle size={20} />}
      {type === 'info' && <Info size={20} />}
      <p className="flex-1">{message}</p>
    </div>
  )
}

// Empty State Components
interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && <div className="text-6xl mb-4 opacity-50">{icon}</div>}
      <h3 className="text-xl font-semibold text-dark mb-2">{title}</h3>
      {description && <p className="text-gray-600 text-center mb-6 max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Skeleton Loader (for list items)
export function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-200 h-12 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}
