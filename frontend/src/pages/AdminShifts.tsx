import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminShiftsView from '../components/AdminShiftsView'
import { DriverShiftReport, trackingAPI } from '../services/apiService'

export default function AdminShifts() {
  const [shifts, setShifts] = useState<DriverShiftReport[]>([])

  useEffect(() => {
    const loadShifts = async () => {
      try {
        const data = await trackingAPI.getAllDriverShiftReports()
        setShifts(data)
      } catch (error) {
        console.error('Error loading shifts:', error)
      }
    }
    loadShifts()
  }, [])

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">All Shifts</h2>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>

        <AdminShiftsView shifts={shifts} />
      </div>
    </div>
  )
}
