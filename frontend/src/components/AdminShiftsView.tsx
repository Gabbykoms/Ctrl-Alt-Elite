import { useState, useMemo } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { DriverShiftReport } from '../services/apiService'

interface AdminShiftsViewProps {
  shifts: DriverShiftReport[]
}

export default function AdminShiftsView({ shifts }: AdminShiftsViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const drivers = useMemo(() => {
    const seen = new Map<string, string>()
    shifts.forEach(s => {
      if (!seen.has(s.driver_id)) seen.set(s.driver_id, s.driver_name)
    })
    return Array.from(seen).map(([id, name]) => ({ id, name }))
  }, [shifts])

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const matchesSearch =
        !searchTerm ||
        shift.driver_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDriver = !selectedDriver || shift.driver_id === selectedDriver

      const matchesStatus = !selectedStatus || shift.status === selectedStatus

      const matchesDateStart = !dateRange.start || shift.report_date >= dateRange.start
      const matchesDateEnd = !dateRange.end || shift.report_date <= dateRange.end

      return matchesSearch && matchesDriver && matchesStatus && matchesDateStart && matchesDateEnd
    })
  }, [shifts, searchTerm, selectedDriver, selectedStatus, dateRange])

  const stats = {
    total: filteredShifts.length,
    completed: filteredShifts.filter(s => s.status === 'COMPLETED').length,
    inProgress: filteredShifts.filter(s => s.status === 'IN_PROGRESS').length,
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDriver('')
    setSelectedStatus('')
    setDateRange({ start: '', end: '' })
  }

  const hasActiveFilters = searchTerm || selectedDriver || selectedStatus || dateRange.start || dateRange.end

  const formatTime = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total Shifts</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
          <p className="text-sm text-green-700">Completed</p>
          <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
          <p className="text-sm text-blue-700">In Progress</p>
          <p className="text-2xl font-bold text-blue-900">{stats.inProgress}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Driver name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
            <select
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Drivers</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 w-full md:w-1/4">
          <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Driver</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clock In</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clock Out</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mileage</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No shifts found matching your filters
                  </td>
                </tr>
              ) : (
                filteredShifts.map(shift => (
                  <tr key={shift.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{shift.driver_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{shift.report_date}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatTime(shift.clock_in_time)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatTime(shift.clock_out_time)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{shift.vehicle_license ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {shift.ending_mileage != null
                        ? `${shift.ending_mileage - shift.starting_mileage} mi`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        shift.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {shift.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Showing {filteredShifts.length} of {shifts.length} shifts
      </div>
    </div>
  )
}
