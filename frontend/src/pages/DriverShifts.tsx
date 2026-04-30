import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ShiftsList from '../components/ShiftsList'
import { getDriverShifts } from '../data/mockShifts'
import { useAuth } from '../contexts/AuthContext'
import type { Shift } from '../data/mockShifts'

export default function DriverShifts() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])

  useEffect(() => {
    if (!user?.id) return
    const data = getDriverShifts(user.id)
    setShifts(data)
  }, [user?.id])

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Shifts</h2>
          <Link to="/driver" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>

        <ShiftsList shifts={shifts} />
      </div>
    </div>
  )
}
