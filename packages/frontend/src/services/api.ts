const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

interface ApiError {
  message: string
  code?: string
  details?: any
}

class ApiService {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async login(phoneNumber: string, password: string) {
    return this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
    })
  }

  async register(userData: {
    name: string
    phoneNumber: string
    email?: string
    password: string
    userType: 'buyer' | 'vendor'
    preferredLanguage: string
  }) {
    return this.request<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async verifyOTP(phoneNumber: string, otp: string) {
    return this.request<{ verified: boolean }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    })
  }

  // Vendor endpoints
  async getVendors(filters?: {
    search?: string
    category?: string
    location?: string
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    return this.request<{ vendors: any[]; total: number; page: number; totalPages: number }>(
      `/api/vendors${queryString ? `?${queryString}` : ''}`
    )
  }

  async getVendor(vendorId: string) {
    return this.request<any>(`/api/vendors/${vendorId}`)
  }

  async createVendorProfile(profileData: any) {
    return this.request<any>('/api/vendors/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    })
  }

  async updateVendorProfile(vendorId: string, updates: any) {
    return this.request<any>(`/api/vendors/${vendorId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // Product endpoints
  async getProducts(filters?: {
    search?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    vendorId?: string
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })
    }
    
    const queryString = params.toString()
    return this.request<{ products: any[]; total: number; page: number; totalPages: number }>(
      `/api/products${queryString ? `?${queryString}` : ''}`
    )
  }

  async getProduct(productId: string) {
    return this.request<any>(`/api/products/${productId}`)
  }

  async createProduct(productData: any) {
    return this.request<any>('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })
  }

  async updateProduct(productId: string, updates: any) {
    return this.request<any>(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteProduct(productId: string) {
    return this.request<any>(`/api/products/${productId}`, {
      method: 'DELETE',
    })
  }

  async updateProductImages(productId: string, images: string[]) {
    return this.request<any>(`/api/products/${productId}/images`, {
      method: 'PUT',
      body: JSON.stringify({ images }),
    })
  }

  async getProductCategories() {
    return this.request<{ categories: any[] }>('/api/products/categories/list')
  }

  async bulkUploadProducts(products: any[], validateOnly: boolean = false) {
    return this.request<any>('/api/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ products, validateOnly }),
    })
  }

  // Image upload endpoints
  async uploadProductImage(imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)

    // Remove Content-Type header to let browser set it with boundary
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseURL}/api/upload/products/image`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async uploadProductImages(imageFiles: File[]) {
    const formData = new FormData()
    imageFiles.forEach(file => {
      formData.append('images', file)
    })

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseURL}/api/upload/products/images`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async deleteProductImage(filename: string) {
    return this.request<any>(`/api/upload/products/images/${filename}`, {
      method: 'DELETE',
    })
  }

  async deleteProductImages(imageUrls: string[]) {
    return this.request<any>('/api/upload/products/images', {
      method: 'DELETE',
      body: JSON.stringify({ urls: imageUrls }),
    })
  }

  async validateImageUrls(imageUrls: string[]) {
    return this.request<{
      validation: {
        valid: string[]
        invalid: string[]
        totalCount: number
        validCount: number
        invalidCount: number
      }
    }>('/api/upload/products/images/validate', {
      method: 'POST',
      body: JSON.stringify({ urls: imageUrls }),
    })
  }

  async getUploadConfig() {
    return this.request<{
      config: {
        maxFileSize: number
        maxImagesPerProduct: number
        allowedImageTypes: string[]
        allowedDocumentTypes: string[]
        supportedFormats: string[]
        processedFormat: string
        maxDimensions: { width: number; height: number }
        thumbnailDimensions: { width: number; height: number }
      }
    }>('/api/upload/config')
  }

  // Translation endpoints
  async translateText(text: string, sourceLang: string, targetLang: string, context?: any) {
    return this.request<{
      translatedText: string
      confidence: number
      culturalAdaptations: string[]
      alternativeTranslations: string[]
      requiresVerification: boolean
    }>('/api/translation/translate', {
      method: 'POST',
      body: JSON.stringify({ text, sourceLang, targetLang, context }),
    })
  }

  // Price discovery endpoints
  async getPriceRecommendation(productInfo: any, vendorInfo: any, locationInfo: any) {
    return this.request<{
      suggestedPrice: number
      priceRange: { min: number; max: number }
      confidence: number
      reasoning: string[]
      marketFactors: any[]
      seasonalAdjustments: number
    }>('/api/pricing/recommendation', {
      method: 'POST',
      body: JSON.stringify({ productInfo, vendorInfo, locationInfo }),
    })
  }

  // Negotiation endpoints
  async startNegotiation(vendorId: string, buyerId: string, productId: string) {
    return this.request<any>('/api/negotiation/start', {
      method: 'POST',
      body: JSON.stringify({ vendorId, buyerId, productId }),
    })
  }

  async submitOffer(sessionId: string, offer: any) {
    return this.request<any>('/api/negotiation/offer', {
      method: 'POST',
      body: JSON.stringify({ sessionId, offer }),
    })
  }

  // Analytics endpoints
  async getMarketTrends(category: string, location: string, timeRange: any) {
    return this.request<any[]>('/api/analytics/market-trends', {
      method: 'POST',
      body: JSON.stringify({ category, location, timeRange }),
    })
  }

  async getDashboardStats() {
    return this.request<{
      totalVendors: number
      totalProducts: number
      activeNegotiations: number
      completedTransactions: number
    }>('/api/analytics/dashboard')
  }
}

// Create singleton instance
export const apiService = new ApiService()

// Export types for use in components
export type { ApiResponse, ApiError }