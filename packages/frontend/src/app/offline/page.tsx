'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-6xl mb-6">📱</div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You're Offline
          </h1>
          
          <p className="text-gray-600 mb-6">
            It looks like you've lost your internet connection. Don't worry, 
            you can still browse some cached content while offline.
          </p>

          {isOnline ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-800 text-sm">
                  ✅ Connection restored! You can now access all features.
                </p>
              </div>
              <Button onClick={handleRetry} fullWidth>
                Reload Page
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Still offline. Please check your internet connection.
                </p>
              </div>
              <Button onClick={handleRetry} variant="outline" fullWidth>
                Try Again
              </Button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Offline
            </h3>
            <div className="space-y-2 text-left">
              <Link href="/" className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <span className="font-medium">🏠 Home Page</span>
                <p className="text-sm text-gray-600">Browse cached content</p>
              </Link>
              <Link href="/vendors" className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <span className="font-medium">🏪 Cached Vendors</span>
                <p className="text-sm text-gray-600">View previously loaded vendors</p>
              </Link>
              <Link href="/products" className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <span className="font-medium">📦 Cached Products</span>
                <p className="text-sm text-gray-600">Browse previously viewed products</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}