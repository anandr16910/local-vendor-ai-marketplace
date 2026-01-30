'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Product {
  id: string
  name: string
  category: string
  subcategory: string
  basePrice: number
  priceRange: {
    min: number
    max: number
  }
  vendor: {
    id: string
    name: string
    businessName: string
    rating: number
    verified: boolean
  }
  location: string
  description: string
  specifications: Array<{
    attribute: string
    value: string
  }>
  availability: 'in_stock' | 'limited' | 'out_of_stock'
  tags: string[]
}

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    category: 'Electronics',
    subcategory: 'Mobile Phones',
    basePrice: 134900,
    priceRange: { min: 130000, max: 139900 },
    vendor: {
      id: '1',
      name: 'Rajesh Kumar',
      businessName: 'Kumar Electronics',
      rating: 4.5,
      verified: true
    },
    location: 'Connaught Place, Delhi',
    description: 'Latest iPhone 15 Pro with titanium design and advanced camera system',
    specifications: [
      { attribute: 'Storage', value: '128GB' },
      { attribute: 'Color', value: 'Natural Titanium' },
      { attribute: 'Warranty', value: '1 Year Apple Warranty' }
    ],
    availability: 'in_stock',
    tags: ['Apple', 'Smartphone', 'Premium']
  },
  {
    id: '2',
    name: 'Basmati Rice Premium',
    category: 'Food & Groceries',
    subcategory: 'Rice & Grains',
    basePrice: 180,
    priceRange: { min: 160, max: 200 },
    vendor: {
      id: '2',
      name: 'Mohammed Ali',
      businessName: 'Ali Spices',
      rating: 4.3,
      verified: false
    },
    location: 'Chandni Chowk, Delhi',
    description: 'Premium quality aged Basmati rice, perfect for biryanis and special occasions',
    specifications: [
      { attribute: 'Weight', value: '1 KG' },
      { attribute: 'Grade', value: 'Premium' },
      { attribute: 'Origin', value: 'Punjab' }
    ],
    availability: 'in_stock',
    tags: ['Organic', 'Premium', 'Aged']
  },
  {
    id: '3',
    name: 'Cotton Kurta Set',
    category: 'Clothing',
    subcategory: 'Traditional Wear',
    basePrice: 1200,
    priceRange: { min: 1000, max: 1500 },
    vendor: {
      id: '3',
      name: 'Priya Sharma',
      businessName: 'Sharma Textiles',
      rating: 4.8,
      verified: true
    },
    location: 'Karol Bagh, Delhi',
    description: 'Comfortable cotton kurta set perfect for daily wear and casual occasions',
    specifications: [
      { attribute: 'Size', value: 'M, L, XL' },
      { attribute: 'Material', value: '100% Cotton' },
      { attribute: 'Color', value: 'White, Blue, Beige' }
    ],
    availability: 'limited',
    tags: ['Cotton', 'Comfortable', 'Traditional']
  }
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProducts(mockProducts)
      setLoading(false)
    }

    loadProducts()
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    
    const matchesPrice = (!priceRange.min || product.basePrice >= parseInt(priceRange.min)) &&
                        (!priceRange.max || product.basePrice <= parseInt(priceRange.max))
    
    return matchesSearch && matchesCategory && matchesPrice
  })

  const categories = Array.from(new Set(products.map(p => p.category)))

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

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

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in_stock': return 'bg-green-100 text-green-800'
      case 'limited': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'in_stock': return 'In Stock'
      case 'limited': return 'Limited Stock'
      case 'out_of_stock': return 'Out of Stock'
      default: return 'Unknown'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Browse Products</h1>
            <Link href="/">
              <Button variant="outline">← Home</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
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
            <div className="flex space-x-2">
              <Input
                placeholder="Min ₹"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                type="number"
              />
              <Input
                placeholder="Max ₹"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                type="number"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{product.category} • {product.subcategory}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(product.availability)}`}>
                      {getAvailabilityText(product.availability)}
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-primary-600">
                        {formatPrice(product.basePrice)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Range: {formatPrice(product.priceRange.min)} - {formatPrice(product.priceRange.max)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link 
                        href={`/vendors/${product.vendor.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        {product.vendor.businessName}
                      </Link>
                      <div className="flex items-center">
                        {product.vendor.verified && (
                          <span className="text-green-600 text-xs mr-1">✓</span>
                        )}
                        <div className="flex items-center">
                          {renderStars(product.vendor.rating)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">📍 {product.location}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {product.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" fullWidth size="sm">
                      View Details
                    </Button>
                    <Link href={`/negotiate/${product.vendor.id}?product=${product.id}`} className="flex-1">
                      <Button fullWidth size="sm" disabled={product.availability === 'out_of_stock'}>
                        Get Quote
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}