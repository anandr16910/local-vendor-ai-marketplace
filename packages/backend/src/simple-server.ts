import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mock API endpoints for basic functionality
app.get('/api/vendors', (req, res) => {
  res.json({
    vendors: [
      {
        id: '1',
        name: 'Rajesh Vegetables',
        category: 'Food & Beverages',
        location: 'Mumbai, Maharashtra',
        rating: 4.5,
        specialties: ['Fresh Vegetables', 'Organic Produce'],
        verified: true
      },
      {
        id: '2',
        name: 'Priya Textiles',
        category: 'Clothing & Textiles',
        location: 'Delhi, Delhi',
        rating: 4.2,
        specialties: ['Cotton Fabrics', 'Traditional Wear'],
        verified: true
      },
      {
        id: '3',
        name: 'Kumar Electronics',
        category: 'Electronics',
        location: 'Bangalore, Karnataka',
        rating: 4.7,
        specialties: ['Mobile Accessories', 'Home Appliances'],
        verified: false
      }
    ]
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    products: [
      {
        id: '1',
        name: 'Fresh Tomatoes',
        category: 'Vegetables',
        price: 40,
        unit: 'kg',
        vendor: 'Rajesh Vegetables',
        location: 'Mumbai',
        inStock: true,
        image: '/api/placeholder/tomatoes.jpg'
      },
      {
        id: '2',
        name: 'Cotton Kurta',
        category: 'Clothing',
        price: 800,
        unit: 'piece',
        vendor: 'Priya Textiles',
        location: 'Delhi',
        inStock: true,
        image: '/api/placeholder/kurta.jpg'
      },
      {
        id: '3',
        name: 'Smartphone Case',
        category: 'Electronics',
        price: 250,
        unit: 'piece',
        vendor: 'Kumar Electronics',
        location: 'Bangalore',
        inStock: true,
        image: '/api/placeholder/phone-case.jpg'
      }
    ]
  });
});

app.get('/api/vendors/:id', (req, res) => {
  const vendorId = req.params.id;
  const vendor = {
    id: vendorId,
    name: 'Rajesh Vegetables',
    category: 'Food & Beverages',
    location: 'Mumbai, Maharashtra',
    rating: 4.5,
    totalReviews: 127,
    specialties: ['Fresh Vegetables', 'Organic Produce'],
    verified: true,
    description: 'Family-owned vegetable business serving fresh, quality produce for over 20 years.',
    contact: {
      phone: '+91 98765 43210',
      email: 'rajesh.vegetables@example.com'
    },
    businessHours: {
      monday: '6:00 AM - 8:00 PM',
      tuesday: '6:00 AM - 8:00 PM',
      wednesday: '6:00 AM - 8:00 PM',
      thursday: '6:00 AM - 8:00 PM',
      friday: '6:00 AM - 8:00 PM',
      saturday: '6:00 AM - 9:00 PM',
      sunday: '7:00 AM - 7:00 PM'
    }
  };
  res.json(vendor);
});

// Mock authentication endpoints
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      userType: 'buyer'
    },
    token: 'demo-jwt-token'
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: '2',
      name: req.body.name || 'New User',
      email: req.body.email || 'newuser@example.com',
      userType: 'buyer'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.originalUrl
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple backend server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local access: http://localhost:${PORT}/health`);
  console.log(`🌐 Network access: http://10.94.237.60:${PORT}/health`);
  console.log(`📱 Mobile access: Use http://10.94.237.60:${PORT} in your mobile browser`);
});

export default app;