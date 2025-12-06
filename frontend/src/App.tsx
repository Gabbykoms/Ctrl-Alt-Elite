import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ShuttleProvider } from './contexts/ShuttleContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import NotFound404 from './pages/NotFound404'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import StudentDashboard from './pages/StudentDashboard'
import {
  SchedulePage,
  ProfilePage,
  DriverManagementPage,
  RouteManagementPage,
} from './pages/Placeholders'
import DriverDashboard from './pages/DriverDashboard'
import AdminDashboard from './pages/AdminDashboard'

function AppRoutes() {
  const { logout } = useAuth()

  return (
    <Routes>
      {/* Root redirect */}
      {/* <Route path="/" element={<Navigate to="/student" replace />} /> */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Public Routes - Direct access without authentication */}
      <Route element={<AuthLayout><LoginPage /></AuthLayout>} path="/login" />
      <Route element={<AuthLayout><RegisterPage /></AuthLayout>} path="/register" />
      <Route element={<AuthLayout><VerifyEmailPage /></AuthLayout>} path="/verify-email" />

      {/* Student Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout onLogout={logout} userRole="student">
              <StudentDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
        path="/student"
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout onLogout={logout} userRole="student">
              <SchedulePage />
            </AppLayout>
          </ProtectedRoute>
        }
        path="/student/schedule"
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout onLogout={logout} userRole="student">
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
        path="/student/profile"
      />

      {/* Driver Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout onLogout={logout} userRole="driver">
              <DriverDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
        path="/driver"
      />

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout onLogout={logout} userRole="admin">
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
        path="/admin"
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout onLogout={logout} userRole="admin">
              <DriverManagementPage />
            </AppLayout>
          </ProtectedRoute>
        }
        path="/admin/drivers"
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout onLogout={logout} userRole="admin">
              <RouteManagementPage />
            </AppLayout>
          </ProtectedRoute>
        }
        path="/admin/routes"
      />

      {/* Catch-all */}
      <Route element={<NotFound404 />} path="*" />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <ShuttleProvider>
        <AppRoutes />
      </ShuttleProvider>
    </AuthProvider>
  )
}

export default App
