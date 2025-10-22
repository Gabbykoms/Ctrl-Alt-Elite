import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import LoginPage from './LoginPage'

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the login form', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('should show error for invalid email format', async () => {
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
  })

  it('should show error for empty fields on submit', async () => {
    renderWithProviders(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: /Sign In/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
    })
  })

  it('should clear email error when valid email is entered', async () => {
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('your@email.com') as HTMLInputElement
    
    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid' } })
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })

    // Enter valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email')).not.toBeInTheDocument()
    })
  })

  it('should toggle password visibility', async () => {
    renderWithProviders(<LoginPage />)
    
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    const toggleButton = screen.getByRole('button', { name: /toggle/i })
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(passwordInput.type).toBe('text')
    })
  })

  it('should display sign up link', () => {
    renderWithProviders(<LoginPage />)
    const signUpLink = screen.getByRole('link', { name: /Sign Up/i })
    expect(signUpLink).toHaveAttribute('href', '/register')
  })

  it('should display forgot password link', () => {
    renderWithProviders(<LoginPage />)
    const forgotLink = screen.getByRole('link', { name: /Forgot Password/i })
    expect(forgotLink).toBeInTheDocument()
  })
})
