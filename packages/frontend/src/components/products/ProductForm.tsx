'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { apiService } from '../../services/api'

interface ProductFormProps {
  product?: any
  onSubmit: (productData: any) => void
  onCancel: () => void
  isLoading?: boolean
}

interface ProductFormData {
  name: string
  description: string
  category: string
  subcategory: string
  basePrice: number
  availability: {
    inStock: boolean
    quantity?: number
    unit?: string
    customOrderAvailable: boolean
    leadTime?: number
  }
  specifications: Array<{
    attribute: string
    value: string
    unit?: string
    isNegotiable: boolean
  }>
  tags: string[]
  images: string[]
}

const PRODUCT_CATEGORIES = [
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

export function ProductForm({ product, onSubmit, onCancel, isLoading = false }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    basePrice: 0,
    availability: {
      inStock: true,
      customOrderAvailable: false
    },
    specifications: [],
    tags: [],
    images: []
  })

  const [uploadConfig, setUploadConfig] = useState<any>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load upload configuration
    apiService.getUploadConfig()
      .then(response => setUploadConfig(response.data.config))
      .catch(error => console.error('Failed to load upload config:', error))

    // Populate form if editing existing product
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        basePrice: product.basePrice || 0,
        availability: product.availability || {
          inStock: true,
          customOrderAvailable: false
        },
        specifications: product.specifications || [],
        tags: product.tags || [],
        images: product.images || []
      })
    }
  }, [product])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleAvailabilityChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [field]: value
      }
    }))
  }

  const handleSpecificationChange = (index: number, field: string, value: any) => {
    const newSpecs = [...formData.specifications]
    newSpecs[index] = { ...newSpecs[index], [field]: value }
    setFormData(prev => ({ ...prev, specifications: newSpecs }))
  }

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        { attribute: '', value: '', isNegotiable: false }
      ]
    }))
  }

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }))
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setFormData(prev => ({ ...prev, tags }))
  }

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return

    if (!uploadConfig) {
      alert('Upload configuration not loaded. Please try again.')
      return
    }

    // Validate files
    const validFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!uploadConfig.allowedImageTypes.includes(file.type)) {
        alert(`File type ${file.type} not allowed. Allowed types: ${uploadConfig.allowedImageTypes.join(', ')}`)
        continue
      }
      
      if (file.size > uploadConfig.maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size: ${uploadConfig.maxFileSize / (1024 * 1024)}MB`)
        continue
      }
      
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    if (formData.images.length + validFiles.length > uploadConfig.maxImagesPerProduct) {
      alert(`Maximum ${uploadConfig.maxImagesPerProduct} images allowed per product`)
      return
    }

    setUploadingImages(true)
    try {
      const response = await apiService.uploadProductImages(validFiles)
      const newImageUrls = response.images.map((img: any) => img.url)
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls]
      }))
    } catch (error) {
      console.error('Image upload failed:', error)
      alert('Failed to upload images. Please try again.')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = async (imageUrl: string) => {
    try {
      const filename = imageUrl.split('/').pop()
      if (filename) {
        await apiService.deleteProductImage(filename)
      }
      
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(url => url !== imageUrl)
      }))
    } catch (error) {
      console.error('Failed to delete image:', error)
      // Still remove from UI even if deletion failed
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(url => url !== imageUrl)
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'Price must be greater than 0'
    }

    if (formData.availability.inStock && (!formData.availability.quantity || formData.availability.quantity <= 0)) {
      newErrors.quantity = 'Quantity is required when product is in stock'
    }

    if (formData.availability.customOrderAvailable && (!formData.availability.leadTime || formData.availability.leadTime <= 0)) {
      newErrors.leadTime = 'Lead time is required for custom orders'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">
        {product ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter product name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <Input
              type="text"
              value={formData.subcategory}
              onChange={(e) => handleInputChange('subcategory', e.target.value)}
              placeholder="Enter subcategory (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price (₹) *
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className={errors.basePrice ? 'border-red-500' : ''}
            />
            {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your product..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Availability */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Availability</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.availability.inStock}
                  onChange={(e) => handleAvailabilityChange('inStock', e.target.checked)}
                  className="mr-2"
                />
                In Stock
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.availability.customOrderAvailable}
                  onChange={(e) => handleAvailabilityChange('customOrderAvailable', e.target.checked)}
                  className="mr-2"
                />
                Custom Order Available
              </label>
            </div>

            {formData.availability.inStock && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.availability.quantity || ''}
                    onChange={(e) => handleAvailabilityChange('quantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className={errors.quantity ? 'border-red-500' : ''}
                  />
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <Input
                    type="text"
                    value={formData.availability.unit || ''}
                    onChange={(e) => handleAvailabilityChange('unit', e.target.value)}
                    placeholder="kg, pieces, liters, etc."
                  />
                </div>
              </div>
            )}

            {formData.availability.customOrderAvailable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Time (days) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.availability.leadTime || ''}
                  onChange={(e) => handleAvailabilityChange('leadTime', parseInt(e.target.value) || 0)}
                  placeholder="Number of days"
                  className={errors.leadTime ? 'border-red-500' : ''}
                />
                {errors.leadTime && <p className="text-red-500 text-sm mt-1">{errors.leadTime}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Specifications */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Specifications</h3>
            <Button type="button" onClick={addSpecification} variant="outline" size="sm">
              Add Specification
            </Button>
          </div>

          {formData.specifications.map((spec, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded">
              <Input
                type="text"
                value={spec.attribute}
                onChange={(e) => handleSpecificationChange(index, 'attribute', e.target.value)}
                placeholder="Attribute name"
              />
              <Input
                type="text"
                value={spec.value}
                onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                placeholder="Value"
              />
              <Input
                type="text"
                value={spec.unit || ''}
                onChange={(e) => handleSpecificationChange(index, 'unit', e.target.value)}
                placeholder="Unit (optional)"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={spec.isNegotiable}
                    onChange={(e) => handleSpecificationChange(index, 'isNegotiable', e.target.checked)}
                    className="mr-2"
                  />
                  Negotiable
                </label>
                <Button
                  type="button"
                  onClick={() => removeSpecification(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <Input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="organic, fresh, local, handmade"
          />
          <p className="text-sm text-gray-500 mt-1">
            Add tags to help customers find your product
          </p>
        </div>

        {/* Images */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Product Images</h3>
          
          <div className="mb-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              {uploadingImages ? 'Uploading...' : 'Upload Images'}
            </label>
            {uploadConfig && (
              <p className="text-sm text-gray-500 mt-2">
                Max {uploadConfig.maxImagesPerProduct} images, {Math.round(uploadConfig.maxFileSize / (1024 * 1024))}MB each.
                Supported: {uploadConfig.allowedImageTypes.join(', ')}
              </p>
            )}
          </div>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((imageUrl, index) => (
                <div key={index} className="relative">
                  <img
                    src={imageUrl}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(imageUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || uploadingImages}>
            {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}