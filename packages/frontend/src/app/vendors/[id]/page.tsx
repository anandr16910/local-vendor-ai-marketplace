'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface VendorProfile {
  id: string
  name: string
  businessName: string
  category: string
  location: string
  rating: number
  reviewCount: number
  specializations: string[]
  verified: boolean
  description: string
  yearsOfExperience: number
  contactInfo: {
    phone: string
    email?: string
    address: string
  }
  businessHours: {
    open: string
    close: string
    days: string[]
  }
  products: Array<{
    id: string
    name: string
    category: string
    basePrice: number
    image?: string
  }>
  reviews: Array<{
    id: string
    buyerName: string
    rating: number
    comment: string
    date: string
  }>
}

// Mock data
const mockVendorProfile: VendorProfile = {
  id: '1',
  name: 'Rajesh Kumar',
  businessName: 'Kumar Electronics',
  category: 'Electronics',
  location: 'Connaught Place, Delhi',
  rating: 4.5,
  reviewCount: 127,
  specializations: ['Mobile Phones', 'Laptops', 'Accessories'],
  verified: true,
  description: 'Established electronics store with over 15 years of experience in providing quality electronics and excellent customer service. We specialize in the latest mobile phones, laptops, and accessories from top brands.',
  yearsOfExperience: 15,
  contactInfo: {
    phone: '+91 98765 43210',
    email: 'rajesh@kumarelectronics.com',
    address: 'Shop No. 45, Connaught Place, New Delhi - 110001'
  },
  businessHours: {
    open: '10:00 AM',
    close: '8:00 PM',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  products: [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      category: 'Mobile Phones',
      basePrice: 134900
    },
    {
      id: '2',
      name: 'Samsung Galaxy S24',
      category: 'Mobile Phones',
      basePrice: 79999
    },
    {
      id: '3',
      name: 'MacBook Air M3',
      category: 'Laptops',
      basePrice: 114900
    }
  ],
  reviews: [
    {
      id: '1',
      buyerName: 'Amit Singh',
      rating: 5,
      comment: 'Excellent service and genuine products. Rajesh bhai helped me get the best deal on my new phone.',
      date: '2024-01-15'
    },
    {
      id: '2',
      buyerName: 'Priya Patel',
      rating: 4,
      comment: 'Good quality products and fair pricing. The negotiation process was smooth and respectful.',
      date: '2024-01-10'
    }
  ]
}

export default function VendorProfilePage({ params }: { params: { id: string } }) {
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'info'>('products')

  useEffect(() => {
    const loadVendor = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setVendor(mockVendorProfile)
      setLoading(false)
    }

    loadVendor()
  }, [params.id])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendor profile...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Vendor not found</p>
          <Link href="/vendors">
            <Button className="mt-4">← Back to Vendors</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/vendors">
              <Button variant="outline">← Back to Vendors</Button>
            </Link>
            <div className="flex space-x-2">
              <Button variant="outline">Share Profile</Button>
              <Link href={`/negotiate/${vendor.id}`}>
                <Button>Start Negotiation</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vendor Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mr-3">
                  {vendor.businessName}
                </h1>
                {vendor.verified && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✓ Verified Business
                  </span>
                )}
              </div>
              
              <p className="text-lg text-gray-600 mb-2">Owned by {vendor.name}</p>
              <p className="text-gray-600 mb-4">📍 {vendor.location}</p>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center mr-4">
                  {renderStars(vendor.rating)}
                  <span className="ml-2 text-lg font-medium text-gray-900">
                    {vendor.rating}
                  </span>
                </div>
                <span className="text-gray-600">
                  ({vendor.reviewCount} reviews)
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {vendor.specializations.map(spec => (
                  <span
                    key={spec}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed">
                {vendor.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'products', label: 'Products' },
                { key: 'reviews', label: 'Reviews' },
                { key: 'info', label: 'Business Info' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {vendor.products.map(product => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <p className="text-lg font-bold text-primary-600 mb-3">
                      Starting from {formatPrice(product.basePrice)}
                    </p>
                    <Button size="sm" fullWidth>
                      Get Quote
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {vendor.reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{review.buyerName}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Business Info Tab */}
            {activeTab === 'info' && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <p><strong>Phone:</strong> {vendor.contactInfo.phone}</p>
                    {vendor.contactInfo.email && (
                      <p><strong>Email:</strong> {vendor.contactInfo.email}</p>
                    )}
                    <p><strong>Address:</strong> {vendor.contactInfo.address}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h3>
                  <div className="space-y-2">
                    <p><strong>Open:</strong> {vendor.businessHours.open} - {vendor.businessHours.close}</p>
                    <p><strong>Days:</strong> {vendor.businessHours.days.join(', ')}</p>
                    <p><strong>Experience:</strong> {vendor.yearsOfExperience} years</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}