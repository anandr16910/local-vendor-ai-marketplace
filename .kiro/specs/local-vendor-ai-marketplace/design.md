# FreshMandi AI - Design Document

## 1. System Architecture

### 1.1 High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   AWS Bedrock   │
│   (AWS S3)      │◄──►│   (AWS EC2)      │◄──►│   AI Models     │
│   Static Site   │    │   Node.js/Python │    │   Claude/Titan  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌──────────────────┐               │
         │              │   PostgreSQL     │               │
         └──────────────┤   (AWS RDS)      │◄──────────────┘
                        │   Database       │
                        └──────────────────┘
```

### 1.2 Component Overview
- **Frontend**: Static HTML/CSS/JavaScript hosted on AWS S3
- **Backend**: RESTful API services on AWS EC2
- **Database**: PostgreSQL on AWS RDS for data persistence
- **AI Services**: AWS Bedrock for machine learning capabilities
- **CDN**: CloudFront for global content delivery (optional)

## 2. Frontend Design

### 2.1 User Interface Architecture
```
┌─────────────────────────────────────────┐
│              Header                     │
│         🌾 FreshMandi AI               │
├─────────────────────────────────────────┤
│              Hero Section               │
│    AI-powered agricultural marketplace │
├─────────────────────────────────────────┤
│           Product Categories            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │🥬   │ │🍎   │ │🌾   │ │🌰   │      │
│  │Veg  │ │Fruit│ │Rice │ │Grain│      │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│  ┌─────┐ ┌─────┐                      │
│  │📊   │ │🤖   │                      │
│  │Price│ │Chat │                      │
│  └─────┘ └─────┘                      │
├─────────────────────────────────────────┤
│           AI Features Demo              │
│     Technical Implementation Info       │
├─────────────────────────────────────────┤
│              Footer                     │
│    Created by Anand Rajgopalan         │
└─────────────────────────────────────────┘
```

### 2.2 Interactive Components

#### 2.2.1 Product Category Tiles
- **Design**: Semi-transparent cards with backdrop blur
- **Hover Effects**: Scale transform (1.05x) and opacity changes
- **Click Behavior**: Opens modal popup with AI demo content
- **Responsive**: Grid layout adapts to screen size

#### 2.2.2 Modal Popups
- **Background**: Dark overlay (80% opacity)
- **Content**: Gradient background matching main theme
- **Structure**: Title, demo content, close button
- **Animation**: Fade-in effect with center positioning

### 2.3 Visual Design System

#### 2.3.1 Color Palette
- **Primary Gradient**: Blue (#667eea) to Purple (#764ba2)
- **Success Green**: rgba(0, 255, 0, 0.2) for positive data
- **Text Colors**: White primary, gray-800 for content areas
- **Accent**: Yellow (rgba(255, 255, 0, 0.1)) for highlights

#### 2.3.2 Typography
- **Font Family**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Heading Sizes**: H1 (3rem), H2 (2rem), H3 (1.3rem)
- **Body Text**: 1.2rem with 0.9 opacity for descriptions

#### 2.3.3 Spacing and Layout
- **Container**: Max-width 800px, centered
- **Grid**: Auto-fit minmax(250px, 1fr) for responsive tiles
- **Padding**: 20px base, 40px for sections
- **Border Radius**: 10px for cards, 15px for modals

## 3. AI Integration Design

### 3.1 AWS Bedrock Integration Architecture
```
Frontend Request
       ↓
API Gateway/Backend
       ↓
AWS Bedrock Service
       ↓
AI Model Processing
       ↓
Formatted Response
       ↓
Frontend Display
```

### 3.2 AI Service Specifications

#### 3.2.1 Price Prediction Service
- **Model**: Claude 3 Haiku (cost-optimized)
- **Input**: Product type, location, season, quantity
- **Output**: Current price, predicted price, confidence level, recommendation
- **Response Time**: < 5 seconds
- **Cost**: ~$0.01 per prediction

#### 3.2.2 Quality Assessment Service
- **Model**: Claude 3 Sonnet + Titan Image
- **Input**: Product image (base64), product type
- **Output**: Quality score (0-100), defects detected, market grade
- **Response Time**: < 10 seconds
- **Cost**: ~$0.05 per assessment

#### 3.2.3 Multilingual Chat Assistant
- **Model**: Claude 3 Haiku
- **Input**: User query, preferred language
- **Output**: Response in requested language with English translation
- **Languages**: Hindi, Tamil, Telugu, English
- **Response Time**: < 3 seconds

### 3.3 Demo Data Structure
```javascript
const demoData = {
  vegetables: {
    title: "🥬 Vegetables AI Demo",
    content: {
      product: "Tomatoes",
      currentPrice: "₹45/kg",
      predictedPrice: "₹52/kg",
      confidence: "87%",
      recommendation: "Hold for better prices next week"
    }
  },
  // ... other categories
};
```

## 4. Backend API Design

### 4.1 RESTful API Endpoints
```
GET  /api/health              - Health check
POST /api/predict/price       - Price prediction
POST /api/assess/quality      - Quality assessment
POST /api/chat/assistant      - Chat assistant
GET  /api/products            - List products
GET  /api/markets             - Market data
```

### 4.2 Request/Response Formats

#### 4.2.1 Price Prediction API
```json
// Request
{
  "product": "tomatoes",
  "location": "Mumbai, Maharashtra",
  "season": "summer",
  "quantity": 100
}

// Response
{
  "currentPrice": 45,
  "predictedPrice": 52,
  "confidence": 0.87,
  "recommendation": "Hold for better prices next week",
  "factors": ["High summer demand", "Mumbai market premium"]
}
```

#### 4.2.2 Quality Assessment API
```json
// Request
{
  "image": "base64_encoded_image",
  "productType": "mangoes"
}

// Response
{
  "qualityScore": 92,
  "grade": "Excellent",
  "defects": [],
  "marketValue": "Premium grade",
  "ripeness": "Perfect for selling"
}
```

## 5. Database Design

### 5.1 Core Tables
```sql
-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Price history table
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  price DECIMAL(10,2) NOT NULL,
  location VARCHAR(100),
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Quality assessments table
CREATE TABLE quality_assessments (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  quality_score INTEGER,
  assessment_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Data Relationships
- Products → Price History (1:many)
- Products → Quality Assessments (1:many)
- Users → Transactions (1:many) [Future]

## 6. Deployment Architecture

### 6.1 AWS Infrastructure
```
Internet Gateway
       ↓
Application Load Balancer
       ↓
┌─────────────┐    ┌─────────────┐
│   EC2 AZ-1  │    │   EC2 AZ-2  │
│   Backend   │    │   Backend   │
└─────────────┘    └─────────────┘
       ↓                   ↓
┌─────────────────────────────────┐
│         RDS PostgreSQL          │
│      Multi-AZ Deployment        │
└─────────────────────────────────┘
```

### 6.2 Static Website Hosting (Current)
```
GitHub Repository
       ↓
AWS S3 Bucket
       ↓
Static Website Hosting
       ↓
Public URL Access
```

### 6.3 Security Design
- **HTTPS**: All traffic encrypted in transit
- **IAM Roles**: Least privilege access for AWS services
- **VPC**: Private subnets for database and backend
- **Security Groups**: Restrictive firewall rules
- **WAF**: Web Application Firewall for DDoS protection

## 7. Performance Optimization

### 7.1 Frontend Optimization
- **Minification**: CSS and JavaScript compression
- **Image Optimization**: WebP format with fallbacks
- **Caching**: Browser caching headers
- **CDN**: CloudFront for global delivery

### 7.2 Backend Optimization
- **Connection Pooling**: Database connection management
- **Caching**: Redis for frequently accessed data
- **Load Balancing**: Multiple EC2 instances
- **Auto Scaling**: Based on CPU and memory metrics

### 7.3 AI Service Optimization
- **Model Selection**: Cost-effective models (Haiku vs Sonnet)
- **Request Batching**: Multiple predictions in single call
- **Caching**: Common predictions cached for reuse
- **Fallback**: Graceful degradation when AI unavailable

## 8. Monitoring and Logging

### 8.1 Application Monitoring
- **CloudWatch**: AWS native monitoring
- **Custom Metrics**: API response times, error rates
- **Alarms**: Automated alerts for issues
- **Dashboards**: Real-time system health

### 8.2 Cost Monitoring
- **AWS Cost Explorer**: Monthly spend tracking
- **Budgets**: Alerts when approaching limits
- **Resource Tagging**: Cost allocation by feature
- **Optimization**: Regular review and rightsizing

## 9. Correctness Properties

### 9.1 Functional Properties
- **P1**: All interactive tiles must respond to click events
- **P2**: Modal popups must display correct demo content for each category
- **P3**: Price predictions must include all required fields (current, predicted, confidence)
- **P4**: Quality assessments must return scores between 0-100

### 9.2 Performance Properties
- **P5**: Page load time must be under 3 seconds
- **P6**: AI predictions must return within 10 seconds
- **P7**: Modal animations must complete within 300ms

### 9.3 Security Properties
- **P8**: All external requests must use HTTPS
- **P9**: No sensitive data exposed in client-side code
- **P10**: API endpoints must validate input parameters

## 10. Testing Strategy

### 10.1 Unit Testing
- Frontend JavaScript functions
- Backend API endpoints
- Database query functions
- AI service integrations

### 10.2 Integration Testing
- Frontend-backend communication
- AWS Bedrock API integration
- Database connectivity
- Third-party service dependencies

### 10.3 Property-Based Testing
- Input validation across all ranges
- AI response format consistency
- Error handling scenarios
- Performance under load

---

**Document Version**: 1.0  
**Last Updated**: January 31, 2026  
**Status**: Approved