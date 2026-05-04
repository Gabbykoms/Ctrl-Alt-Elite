import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DriverShiftReport, trackingAPI } from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'

export default function DriverShifts() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState<DriverShiftReport[]>([])

  useEffect(() => {
    const loadShifts = async () => {
      if (!user?.id) return
      try {
        const data = await trackingAPI.getDriverShiftReportsByDriver(user.id)
        setShifts(data)
      } catch (error) {
        console.error('Error loading shifts:', error)
      }
    }
    loadShifts()
  }, [user?.id])

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Shifts</h2>
          <Link to="/driver" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>

        {shifts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No shifts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shifts.map(shift => (
              <div key={shift.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{shift.report_date}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    shift.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {shift.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <p>Clock In: {shift.clock_in_time ? new Date(shift.clock_in_time).toLocaleTimeString() : '—'}</p>
                  <p>Clock Out: {shift.clock_out_time ? new Date(shift.clock_out_time).toLocaleTimeString() : '—'}</p>
                  <p>Start Mileage: {shift.starting_mileage}</p>
                  <p>End Mileage: {shift.ending_mileage ?? '—'}</p>
                  {shift.vehicle_license && <p>Vehicle: {shift.vehicle_license}</p>}
                  {shift.radio_number && <p>Radio #: {shift.radio_number}</p>}
                </div>
                {shift.condition_notes && (
                  <p className="text-sm text-gray-500 border-t pt-2">Notes: {shift.condition_notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
