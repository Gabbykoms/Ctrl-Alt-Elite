import AdminShiftsView from '../components/AdminShiftsView'
import { mockShifts } from '../data/mockShifts'
import { Link } from 'react-router-dom'

export default function AdminShifts() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">All Shifts</h2>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>

        <AdminShiftsView shifts={mockShifts} />
      </div>
    </div>
  )
}
