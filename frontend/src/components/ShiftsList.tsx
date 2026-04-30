import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, MapPin, Users, Gauge } from 'lucide-react'
import { Shift } from '../data/mockShifts'

interface ShiftsListProps {
  shifts: Shift[]
  onlyShowUpcoming?: boolean
}

const StatusBadge = ({ status }: { status: Shift['status'] }) => {
  const statusConfig = {
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
    scheduled: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Scheduled' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  }
  const config = statusConfig[status]
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

export default function ShiftsList({ shifts, onlyShowUpcoming = false }: ShiftsListProps) {
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null)

  const displayShifts = onlyShowUpcoming
    ? shifts.filter(shift => new Date(shift.shiftDate) >= new Date())
    : shifts

  const sortedShifts = [...displayShifts].sort(
    (a, b) => new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime()
  )

  if (sortedShifts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-500 text-lg">No shifts found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedShifts.map(shift => (
        <div
          key={shift.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Header - Always Visible */}
          <div
            onClick={() => setExpandedShiftId(expandedShiftId === shift.id ? null : shift.id)}
            className="p-4 cursor-pointer flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {shift.shiftDate} • {shift.startTime} - {shift.endTime}
                </h3>
                <StatusBadge status={shift.status} />
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {shift.route}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {shift.passengers} passengers
                </div>
              </div>
            </div>
            <div>
              {expandedShiftId === shift.id ? (
                <ChevronUp className="h-6 w-6 text-gray-400" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {expandedShiftId === shift.id && (
            <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Vehicle</p>
                    <p className="font-semibold text-gray-900">{shift.vehicle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle License</p>
                    <p className="font-semibold text-gray-900">{shift.vehicleLicense}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Radio Number</p>
                    <p className="font-semibold text-gray-900">{shift.radioNumber}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Mileage</p>
                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      <Gauge className="h-4 w-4" />
                      {shift.startingMileage} → {shift.endingMileage} ({shift.endingMileage - shift.startingMileage} mi)
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Route</p>
                    <p className="font-semibold text-gray-900">{shift.route}</p>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {(shift.notes || shift.conditionNotes) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {shift.notes && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="text-gray-900">{shift.notes}</p>
                    </div>
                  )}
                  {shift.conditionNotes && (
                    <div>
                      <p className="text-sm text-gray-500">Condition Notes</p>
                      <p className="text-gray-900">{shift.conditionNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
