import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import AppLayout from './AppLayout'

const mockLogout = vi.fn()

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the app layout', () => {
    renderWithProviders(
      <AppLayout onLogout={mockLogout}>
        <div>Test Content</div>
      </AppLayout>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render sidebar navigation links for student role', () => {
    renderWithProviders(
      <AppLayout onLogout={mockLogout} userRole="student">
        <div>Test Content</div>
      </AppLayout>
    )

    expect(screen.getByRole('link', { name: /Map/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Schedule/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Profile/i })).toBeInTheDocument()
  })

  it('should render sidebar navigation links for admin role', () => {
    renderWithProviders(
      <AppLayout onLogout={mockLogout} userRole="admin">
        <div>Test Content</div>
      </AppLayout>
    )

    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Drivers/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Routes/i })).toBeInTheDocument()
  })

  it('should render logout button', () => {
    renderWithProviders(
      <AppLayout onLogout={mockLogout}>
        <div>Test Content</div>
      </AppLayout>
    )

    const logoutButton = screen.getByRole('button', { name: /Log Out/i })
    expect(logoutButton).toBeInTheDocument()
  })

  it('should call onLogout when logout button is clicked', () => {
    renderWithProviders(
      <AppLayout onLogout={mockLogout}>
        <div>Test Content</div>
      </AppLayout>
    )

    const logoutButton = screen.getByRole('button', { name: /Log Out/i })
    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
  })

  it('should render app logo in sidebar', () => {
    renderWithProviders(
      <AppLayout onLogout={mockLogout}>
        <div>Test Content</div>
      </AppLayout>
    )

    expect(screen.getByText('Bantam Shuttle')).toBeInTheDocument()
  })

  it('should render children content', () => {
    const testContent = 'This is test content for AppLayout'
    renderWithProviders(
      <AppLayout onLogout={mockLogout}>
        <div>{testContent}</div>
      </AppLayout>
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('should have responsive design for mobile', () => {
    renderWithProviders(
      <AppLayout onLogout={mockLogout}>
        <div>Test Content</div>
      </AppLayout>
    )

    // Check for mobile hamburger menu button
    const menuButton = screen.getByRole('button', { name: /Toggle menu/i })
    expect(menuButton).toBeInTheDocument()
  })
})
