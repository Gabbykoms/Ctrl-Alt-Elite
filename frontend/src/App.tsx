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
          <AppLayout onLogout={logout} userRole="student">
            <StudentDashboard />
          </AppLayout>
        }
        path="/student"
      />
      <Route
        element={
          <AppLayout onLogout={logout} userRole="student">
            <SchedulePage />
          </AppLayout>
        }
        path="/student/schedule"
      />
      <Route
        element={
          <AppLayout onLogout={logout} userRole="student">
            <ProfilePage />
          </AppLayout>
        }
        path="/student/profile"
      />

      {/* Driver Routes */}
      <Route
        element={
          <AppLayout onLogout={logout} userRole="driver">
            <DriverDashboard />
          </AppLayout>
        }
        path="/driver"
      />

      {/* Admin Routes */}
      <Route
        element={
          <AppLayout onLogout={logout} userRole="admin">
            <AdminDashboard />
          </AppLayout>
        }
        path="/admin"
      />
      <Route
        element={
          <AppLayout onLogout={logout} userRole="admin">
            <DriverManagementPage />
          </AppLayout>
        }
        path="/admin/drivers"
      />
      <Route
        element={
          <AppLayout onLogout={logout} userRole="admin">
            <RouteManagementPage />
          </AppLayout>
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
