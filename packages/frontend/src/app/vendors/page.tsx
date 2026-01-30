'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Vendor {
  id: string
  name: string
  businessName: string
  category: string
  location: string
  rating: number
  reviewCount: number
  specializations: string[]
  verified: boolean
  image?: string
}

// Mock data for demonstration
const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    businessName: 'Kumar Electronics',
    category: 'Electronics',
    location: 'Connaught Place, Delhi',
    rating: 4.5,
    reviewCount: 127,
    specializations: ['Mobile Phones', 'Laptops', 'Accessories'],
    verified: true
  },
  {
    id: '2',
    name: 'Priya Sharma',
    businessName: 'Sharma Textiles',
    category: 'Clothing',
    location: 'Karol Bagh, Delhi',
    rating: 4.8,
    reviewCount: 89,
    specializations: ['Sarees', 'Suits', 'Fabrics'],
    verified: true
  },
  {
    id: '3',
    name: 'Mohammed Ali',
    businessName: 'Ali Spices',
    category: 'Food & Spices',
    location: 'Chandni Chowk, Delhi',
    rating: 4.3,
    reviewCount: 156,
    specializations: ['Spices', 'Dry Fruits', 'Tea'],
    verified: false
  }
]

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    // Simulate API call
    const loadVendors = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setVendors(mockVendors)
      setLoading(false)
    }

    loadVendors()
  }, [])

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !selectedCategory || vendor.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(vendors.map(v => v.category)))

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Find Vendors</h1>
            <Link href="/">
              <Button variant="outline">← Home</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search vendors, businesses, or specializations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vendors...</p>
          </div>
        )}

        {/* Vendors Grid */}
        {!loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVendors.map(vendor => (
              <div key={vendor.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {vendor.businessName}
                      </h3>
                      <p className="text-gray-600 text-sm">by {vendor.name}</p>
                    </div>
                    {vendor.verified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">📍 {vendor.location}</p>
                    <p className="text-sm text-gray-600 mb-2">🏷️ {vendor.category}</p>
                    
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {renderStars(vendor.rating)}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {vendor.rating} ({vendor.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Specializations:</p>
                    <div className="flex flex-wrap gap-1">
                      {vendor.specializations.map(spec => (
                        <span
                          key={spec}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link href={`/vendors/${vendor.id}`} className="flex-1">
                      <Button variant="outline" fullWidth size="sm">
                        View Profile
                      </Button>
                    </Link>
                    <Link href={`/negotiate/${vendor.id}`} className="flex-1">
                      <Button fullWidth size="sm">
                        Start Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No vendors found matching your criteria.</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}