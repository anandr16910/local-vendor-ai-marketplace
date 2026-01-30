'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'
import { Button } from '@/components/ui/Button'
import { PWAInstaller } from '@/components/PWAInstaller'

export default function Home() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Local Vendor AI Marketplace
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            AI-driven price discovery and negotiation tools for local vendors in India
          </p>
          {!isOnline && (
            <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg max-w-md mx-auto">
              <p className="text-yellow-800 text-sm">
                You are currently offline. Some features may be limited.
              </p>
            </div>
          )}
        </header>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 max-w-md mx-auto">
          <Link href="/vendors" className="flex-1">
            <Button size="lg" fullWidth>
              Find Vendors
            </Button>
          </Link>
          <Link href="/products" className="flex-1">
            <Button variant="outline" size="lg" fullWidth>
              Browse Products
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-16">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🌐</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Multilingual Support
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Communicate with vendors in your preferred language with real-time translation
              and cultural context adaptation.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">💰</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Smart Pricing
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Get AI-powered price recommendations based on market data, seasonal trends,
              and local factors.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🤝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Fair Negotiations
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Engage in culturally-appropriate negotiations with AI assistance that
              respects traditional market practices.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">⭐</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Vendor Profiles
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Build trust with detailed vendor profiles, reputation scores, and
              verified business information.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Market Analytics
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Access comprehensive market insights, pricing trends, and demand patterns
              to make informed decisions.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">💳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Local Payments
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Seamless integration with UPI, Paytm, and other popular Indian payment
              systems for secure transactions.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of vendors and buyers already using our platform to make fair, 
            transparent deals in local markets across India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="sm:px-8">
                Sign Up Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="sm:px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Local Vendor AI Marketplace. Built for India's local markets.</p>
          </div>
        </div>
      </footer>

      {/* PWA Install Prompt */}
      <PWAInstaller />
    </div>
  )
}