# Product Catalog System

## Overview

The Product Catalog System is a comprehensive solution for managing products in the Local Vendor AI Marketplace. It provides full CRUD operations, advanced search and filtering, image management, and integration with the vendor system.

## Features

### Core Product Management
- ✅ Create, read, update, and delete products
- ✅ Product specifications with negotiable attributes
- ✅ Availability management (in-stock, custom orders)
- ✅ Category and subcategory organization
- ✅ Tag-based classification
- ✅ Price management with validation

### Image Management
- ✅ Multiple image upload per product (up to 10 images)
- ✅ Automatic image processing and optimization
- ✅ Thumbnail generation
- ✅ Image format conversion to WebP
- ✅ Image deletion and cleanup
- ✅ URL validation and security

### Search and Discovery
- ✅ Full-text search across product names and descriptions
- ✅ Category and subcategory filtering
- ✅ Price range filtering
- ✅ Vendor-specific product listings
- ✅ Availability filtering
- ✅ Tag-based filtering
- ✅ Multiple sorting options (price, rating, date, relevance)
- ✅ Pagination support

### Advanced Features
- ✅ Bulk product upload with validation
- ✅ Product analytics and statistics
- ✅ Category management with product counts
- ✅ Search vector optimization for PostgreSQL
- ✅ Comprehensive validation and error handling

## API Endpoints

### Product Management

#### Create Product
```http
POST /api/products
Authorization: Bearer <vendor_token>
Content-Type: application/json

{
  "name": "Organic Apples",
  "description": "Fresh organic apples from local farm",
  "category": "food_beverages",
  "subcategory": "fruits",
  "basePrice": 120.50,
  "availability": {
    "inStock": true,
    "quantity": 100,
    "unit": "kg",
    "customOrderAvailable": true,
    "leadTime": 2
  },
  "specifications": [
    {
      "attribute": "Origin",
      "value": "Kashmir",
      "isNegotiable": false
    }
  ],
  "tags": ["organic", "fresh", "local"],
  "images": ["http://localhost:3001/uploads/products/image1.webp"]
}
```

#### Get Products (with search and filtering)
```http
GET /api/products?query=organic&category=food_beverages&minPrice=50&maxPrice=200&sortBy=price_low&limit=20&offset=0
Authorization: Bearer <token>
```

#### Get Single Product
```http
GET /api/products/:productId
Authorization: Bearer <token>
```

#### Update Product
```http
PUT /api/products/:productId
Authorization: Bearer <vendor_token>
Content-Type: application/json

{
  "name": "Premium Organic Apples",
  "basePrice": 150.00
}
```

#### Update Product Images
```http
PUT /api/products/:productId/images
Authorization: Bearer <vendor_token>
Content-Type: application/json

{
  "images": [
    "http://localhost:3001/uploads/products/image1.webp",
    "http://localhost:3001/uploads/products/image2.webp"
  ]
}
```

#### Delete Product
```http
DELETE /api/products/:productId
Authorization: Bearer <vendor_token>
```

#### Get Product Categories
```http
GET /api/products/categories/list
Authorization: Bearer <token>
```

#### Bulk Upload Products
```http
POST /api/products/bulk
Authorization: Bearer <vendor_token>
Content-Type: application/json

{
  "validateOnly": false,
  "products": [
    {
      "name": "Product 1",
      "category": "food_beverages",
      "basePrice": 100,
      "availability": {
        "inStock": true,
        "customOrderAvailable": false
      }
    }
  ]
}
```

### Image Management

#### Upload Single Image
```http
POST /api/upload/products/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
```

#### Upload Multiple Images
```http
POST /api/upload/products/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

images: <file1>
images: <file2>
```

#### Delete Image
```http
DELETE /api/upload/products/images/:filename
Authorization: Bearer <token>
```

#### Delete Multiple Images
```http
DELETE /api/upload/products/images
Authorization: Bearer <token>
Content-Type: application/json

{
  "urls": [
    "http://localhost:3001/uploads/products/image1.webp",
    "http://localhost:3001/uploads/products/image2.webp"
  ]
}
```

#### Validate Image URLs
```http
POST /api/upload/products/images/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "urls": [
    "http://localhost:3001/uploads/products/image1.webp",
    "http://external.com/invalid.jpg"
  ]
}
```

#### Get Upload Configuration
```http
GET /api/upload/config
Authorization: Bearer <token>
```

## Data Models

### Product
```typescript
interface Product {
  productId: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  specifications: ProductSpecification[];
  basePrice: number;
  availability: AvailabilityInfo;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Product Specification
```typescript
interface ProductSpecification {
  attribute: string;
  value: string;
  unit?: string;
  isNegotiable: boolean;
}
```

### Availability Info
```typescript
interface AvailabilityInfo {
  inStock: boolean;
  quantity?: number;
  unit?: string;
  restockDate?: Date;
  seasonalAvailability?: SeasonalAvailability;
  customOrderAvailable: boolean;
  leadTime?: number; // in days
}
```

## Database Schema

### Products Table
```sql
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    images TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '[]',
    base_price DECIMAL(10,2) NOT NULL,
    availability JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category, subcategory);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_price ON products(base_price);
```

## Image Processing

### Configuration
- **Max file size**: 10MB per image
- **Max images per product**: 10
- **Supported formats**: JPEG, PNG, WebP
- **Output format**: WebP (optimized)
- **Main image dimensions**: 1200x1200px (max, maintains aspect ratio)
- **Thumbnail dimensions**: 300x300px (cropped to center)
- **Quality**: 85% for main images, 75% for thumbnails

### Processing Pipeline
1. **Validation**: File type, size, and count validation
2. **Processing**: Resize, format conversion, and optimization using Sharp
3. **Storage**: Save to local filesystem with UUID-based filenames
4. **Thumbnail Generation**: Create square thumbnails for quick loading
5. **URL Generation**: Generate accessible URLs for frontend consumption

### Security Features
- File type validation (only images allowed)
- Filename sanitization (UUID-based naming)
- Size limits to prevent abuse
- URL validation for updates
- Orphaned image cleanup

## Search Features

### Full-Text Search
- PostgreSQL `tsvector` for efficient text search
- Searches across product name, description, category, and tags
- Relevance-based ranking
- Support for partial matches

### Filtering Options
- **Category/Subcategory**: Exact match filtering
- **Price Range**: Min/max price filtering
- **Availability**: In-stock, custom order, or all
- **Vendor**: Filter by specific vendor
- **Vendor Rating**: Minimum rating threshold
- **Tags**: Array-based tag filtering

### Sorting Options
- **Relevance**: Search relevance (default for text searches)
- **Price**: Low to high or high to low
- **Rating**: Vendor rating (highest first)
- **Date**: Newest first (default for non-search queries)

## Validation

### Product Validation
- **Name**: 2-255 characters, required
- **Category**: Must be from predefined list
- **Price**: Must be positive number
- **Availability**: Proper structure with required fields
- **Specifications**: Max 20 specifications per product
- **Tags**: Max 20 tags, each 1-50 characters
- **Images**: Max 10 images, valid URLs only

### Image Validation
- **File Type**: JPEG, PNG, WebP only
- **File Size**: Max 10MB per file
- **Count**: Max 10 images per product
- **URL Format**: Must match expected pattern

## Error Handling

### Common Error Responses
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed: Name is required",
    "details": {
      "field": "name",
      "value": "",
      "constraint": "required"
    }
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `PRODUCT_NOT_FOUND`: Product doesn't exist
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Insufficient permissions
- `FILE_TOO_LARGE`: Image file exceeds size limit
- `INVALID_FILE_TYPE`: Unsupported file format
- `TOO_MANY_FILES`: Exceeds image count limit

## Performance Optimizations

### Database
- Proper indexing on frequently queried fields
- Search vector for full-text search
- Pagination to limit result sets
- Connection pooling for database connections

### Images
- WebP format for smaller file sizes
- Thumbnail generation for quick loading
- CDN-ready URL structure
- Lazy loading support

### Caching
- Redis caching for frequently accessed data
- Search result caching
- Image metadata caching

## Testing

### Unit Tests
- Product CRUD operations
- Image upload and processing
- Validation logic
- Search and filtering
- Error handling

### Integration Tests
- End-to-end product creation with images
- Search functionality
- Bulk operations
- Authentication and authorization

### Test Coverage
- All API endpoints
- All validation scenarios
- Error conditions
- Edge cases

## Security Considerations

### Authentication & Authorization
- JWT-based authentication required for all endpoints
- Role-based access control (vendors can only modify their products)
- Owner verification for product operations

### Input Validation
- Comprehensive validation on all inputs
- SQL injection prevention
- XSS protection
- File upload security

### Image Security
- File type validation
- Size limits
- Secure filename generation
- Path traversal prevention

## Deployment

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
MONGODB_URL=mongodb://localhost:27017/marketplace
REDIS_URL=redis://localhost:6379

# File Upload
UPLOAD_DIR=./uploads
BASE_URL=http://localhost:3001

# Security
JWT_SECRET=your-secret-key
```

### File System
- Ensure upload directory exists and is writable
- Configure proper file permissions
- Set up backup strategy for uploaded images
- Consider using cloud storage for production

### Monitoring
- Log all product operations
- Monitor image upload performance
- Track search query performance
- Set up alerts for errors

## Future Enhancements

### Planned Features
- [ ] Product variants (size, color, etc.)
- [ ] Inventory tracking and alerts
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Product recommendations
- [ ] Advanced analytics dashboard
- [ ] Multi-language product descriptions
- [ ] Product comparison features
- [ ] Bulk import from CSV/Excel
- [ ] Product templates for quick creation

### Technical Improvements
- [ ] Cloud storage integration (AWS S3, Google Cloud)
- [ ] CDN integration for image delivery
- [ ] Elasticsearch for advanced search
- [ ] Real-time inventory updates
- [ ] Image optimization pipeline
- [ ] Automated testing for image processing
- [ ] Performance monitoring and optimization
- [ ] API rate limiting per user
- [ ] Advanced caching strategies
- [ ] Microservice architecture migration

## Support

For technical support or questions about the Product Catalog System, please refer to:
- API documentation
- Test files for usage examples
- Error logs for troubleshooting
- Database schema for data structure understanding