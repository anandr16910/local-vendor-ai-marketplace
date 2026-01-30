import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /local vendor ai marketplace/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Home />)
    expect(screen.getByText('Find Vendors')).toBeInTheDocument()
    expect(screen.getByText('Browse Products')).toBeInTheDocument()
  })

  it('renders feature cards', () => {
    render(<Home />)
    expect(screen.getByText('Multilingual Support')).toBeInTheDocument()
    expect(screen.getByText('Smart Pricing')).toBeInTheDocument()
    expect(screen.getByText('Fair Negotiations')).toBeInTheDocument()
    expect(screen.getByText('Vendor Profiles')).toBeInTheDocument()
    expect(screen.getByText('Market Analytics')).toBeInTheDocument()
    expect(screen.getByText('Local Payments')).toBeInTheDocument()
  })

  it('renders call-to-action buttons', () => {
    render(<Home />)
    expect(screen.getByText('Sign Up Now')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('shows offline indicator when offline', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    render(<Home />)
    
    // Simulate offline event
    window.dispatchEvent(new Event('offline'))
    
    expect(screen.getByText(/currently offline/i)).toBeInTheDocument()
  })
})