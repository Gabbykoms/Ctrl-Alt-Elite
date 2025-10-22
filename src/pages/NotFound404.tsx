import { Link } from 'react-router-dom'

export default function NotFound404() {
  return (
    <div className="min-h-screen bg-neutral flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold text-dark mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8 text-lg">Sorry, the page you're looking for doesn't exist.</p>
        <Link
          to="/app"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
