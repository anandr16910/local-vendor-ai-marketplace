'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { apiService } from '../../services/api'

interface Product {
  productId: string
  vendorId: string
  vendorName: string
  vendorRating: number
  name: string
  description: string
  category: string
  subcategory: string
  basePrice: number
  images: string[]
  availability: {
    inStock: boolean
    quantity?: number
    unit?: string
    customOrderAvailable: boolean
    leadTime?: number
  }
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface ProductListProps {
  vendorId?: string
  onProductSelect?: (product: Product) => void
  onProductEdit?: (product: Product) => void
  onProductDelete?: (productId: string) => void
  showActions?: boolean
}

const PRODUCT_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'food_beverages', label: 'Food & Beverages' },
  { value: 'clothing_textiles', label: 'Clothing & Textiles' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home_garden', label: 'Home & Garden' },
  { value: 'health_beauty', label: 'Health & Beauty' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'books_media', label: 'Books & Media' },
  { value: 'sports_recreation', label: 'Sports & Recreation' },
  { value: 'jewelry_accessories', label: 'Jewelry & Accessories' },
  { value: 'handicrafts', label: 'Handicrafts' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' }
]

export function ProductList({ 
  vendorId, 
  onProductSelect, 
  onProductEdit, 
  onProductDelete, 
  showActions = false 
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const loadProducts = async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const filters: any = {
        page,
        limit: 20,
        sortBy
      }

      if (searchQuery.trim()) {
        filters.query = searchQuery.trim()
      }

      if (selectedCategory) {
        filters.category = selectedCategory
      }

      if (vendorId) {
        filters.vendorId = vendorId
      }

      if (minPrice && !isNaN(parseFloat(minPrice))) {
        filters.minPrice = parseFloat(minPrice)
      }

      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        filters.maxPrice = parseFloat(maxPrice)
      }

      const response = await apiService.getProducts(filters)
      
      setProducts(response.data.products || [])
      setTotalCount(response.data.total || 0)
      setCurrentPage(page)
      setTotalPages(Math.ceil((response.data.total || 0) / 20))
    } catch (err: any) {
      setError(err.message || 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts(1)
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy, vendorId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadProducts(1)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadProducts(page)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await apiService.deleteProduct(productId)
      setProducts(prev => prev.filter(p => p.productId !== productId))
      setTotalCount(prev => prev - 1)
      
      if (onProductDelete) {
        onProductDelete(productId)
      }
    } catch (err: any) {
      alert(`Failed to delete product: ${err.message}`)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading products...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  min="0"
                />
                <Input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Vendor Rating</option>
                <option value="relevance">Relevance</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {totalCount} product{totalCount !== 1 ? 's' : ''} found
            </p>
            <Button type="submit" size="sm">
              Apply Filters
            </Button>
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button 
            onClick={() => loadProducts(currentPage)} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.productId} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-t-lg overflow-hidden">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(product.basePrice)}
                  </span>
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {PRODUCT_CATEGORIES.find(cat => cat.value === product.category)?.label || product.category}
                  </span>
                  
                  <div className="flex items-center">
                    {product.availability.inStock ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    ) : product.availability.customOrderAvailable ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Custom Order
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {!vendorId && (
                  <div className="flex items-center mb-3">
                    <span className="text-sm text-gray-600">by </span>
                    <span className="text-sm font-medium text-gray-900 ml-1">
                      {product.vendorName}
                    </span>
                    {product.vendorRating > 0 && (
                      <div className="flex items-center ml-2">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-600 ml-1">
                          {product.vendorRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                    {product.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{product.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-3">
                  Updated {formatDate(product.updatedAt)}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {onProductSelect && (
                    <Button
                      onClick={() => onProductSelect(product)}
                      size="sm"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  )}
                  
                  {showActions && onProductEdit && (
                    <Button
                      onClick={() => onProductEdit(product)}
                      variant="outline"
                      size="sm"
                    >
                      Edit
                    </Button>
                  )}
                  
                  {showActions && onProductDelete && (
                    <Button
                      onClick={() => handleDeleteProduct(product.productId)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-800 hover:border-red-300"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || selectedCategory || minPrice || maxPrice
              ? 'Try adjusting your search filters.'
              : 'Get started by adding your first product.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages} ({totalCount} total products)
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return (
                <Button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  variant={pageNum === currentPage ? 'primary' : 'outline'}
                  size="sm"
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
            
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}