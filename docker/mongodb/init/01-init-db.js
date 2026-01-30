// Switch to the local_vendor_ai database
db = db.getSiblingDB('local_vendor_ai');

// Create collections with validation schemas
db.createCollection('market_data', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['category', 'location', 'timestamp'],
      properties: {
        category: {
          bsonType: 'string',
          description: 'Product category'
        },
        subcategory: {
          bsonType: 'string',
          description: 'Product subcategory'
        },
        location: {
          bsonType: 'object',
          required: ['city', 'state'],
          properties: {
            city: { bsonType: 'string' },
            state: { bsonType: 'string' },
            coordinates: {
              bsonType: 'object',
              properties: {
                latitude: { bsonType: 'double' },
                longitude: { bsonType: 'double' }
              }
            }
          }
        },
        pricePoints: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              price: { bsonType: 'double' },
              quantity: { bsonType: 'double' },
              vendorReputation: { bsonType: 'double' },
              transactionVolume: { bsonType: 'int' },
              timeOfDay: { bsonType: 'string' },
              dayOfWeek: { bsonType: 'string' }
            }
          }
        },
        timestamp: {
          bsonType: 'date',
          description: 'When this data was recorded'
        }
      }
    }
  }
});

db.createCollection('transactions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['transactionId', 'vendorId', 'buyerId', 'amount', 'status'],
      properties: {
        transactionId: { bsonType: 'string' },
        vendorId: { bsonType: 'string' },
        buyerId: { bsonType: 'string' },
        productId: { bsonType: 'string' },
        negotiationSessionId: { bsonType: 'string' },
        amount: { bsonType: 'double' },
        currency: { bsonType: 'string' },
        paymentMethod: { bsonType: 'string' },
        status: {
          bsonType: 'string',
          enum: ['pending', 'completed', 'failed', 'cancelled', 'disputed']
        },
        timestamps: {
          bsonType: 'object',
          properties: {
            initiated: { bsonType: 'date' },
            completed: { bsonType: 'date' },
            cancelled: { bsonType: 'date' }
          }
        },
        metadata: {
          bsonType: 'object',
          properties: {
            location: { bsonType: 'object' },
            negotiationDuration: { bsonType: 'int' },
            culturalContext: { bsonType: 'object' },
            priceDiscoveryData: { bsonType: 'object' },
            feedbackSubmitted: { bsonType: 'bool' }
          }
        }
      }
    }
  }
});

db.createCollection('negotiation_sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sessionId', 'vendorId', 'buyerId', 'productId', 'status'],
      properties: {
        sessionId: { bsonType: 'string' },
        vendorId: { bsonType: 'string' },
        buyerId: { bsonType: 'string' },
        productId: { bsonType: 'string' },
        status: {
          bsonType: 'string',
          enum: ['active', 'paused', 'completed', 'cancelled']
        },
        currentOffer: { bsonType: 'object' },
        negotiationHistory: { bsonType: 'array' },
        culturalContext: { bsonType: 'object' },
        startedAt: { bsonType: 'date' },
        lastActivity: { bsonType: 'date' },
        completedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('analytics_events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['eventType', 'userId', 'timestamp'],
      properties: {
        eventType: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        sessionId: { bsonType: 'string' },
        data: { bsonType: 'object' },
        timestamp: { bsonType: 'date' },
        metadata: { bsonType: 'object' }
      }
    }
  }
});

// Create indexes for better query performance
db.market_data.createIndex({ 'category': 1, 'location.city': 1, 'timestamp': -1 });
db.market_data.createIndex({ 'location.coordinates': '2dsphere' });
db.market_data.createIndex({ 'timestamp': -1 });

db.transactions.createIndex({ 'transactionId': 1 }, { unique: true });
db.transactions.createIndex({ 'vendorId': 1, 'timestamps.completed': -1 });
db.transactions.createIndex({ 'buyerId': 1, 'timestamps.completed': -1 });
db.transactions.createIndex({ 'status': 1, 'timestamps.initiated': -1 });

db.negotiation_sessions.createIndex({ 'sessionId': 1 }, { unique: true });
db.negotiation_sessions.createIndex({ 'vendorId': 1, 'status': 1 });
db.negotiation_sessions.createIndex({ 'buyerId': 1, 'status': 1 });
db.negotiation_sessions.createIndex({ 'lastActivity': -1 });

db.analytics_events.createIndex({ 'eventType': 1, 'timestamp': -1 });
db.analytics_events.createIndex({ 'userId': 1, 'timestamp': -1 });
db.analytics_events.createIndex({ 'timestamp': -1 });

// Insert sample data for development
db.market_data.insertMany([
  {
    category: 'vegetables',
    subcategory: 'leafy_greens',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      coordinates: { latitude: 19.0760, longitude: 72.8777 }
    },
    pricePoints: [
      {
        price: 25.0,
        quantity: 1.0,
        vendorReputation: 4.2,
        transactionVolume: 150,
        timeOfDay: '08:00',
        dayOfWeek: 'Monday'
      }
    ],
    timestamp: new Date()
  },
  {
    category: 'fruits',
    subcategory: 'seasonal',
    location: {
      city: 'Delhi',
      state: 'Delhi',
      coordinates: { latitude: 28.6139, longitude: 77.2090 }
    },
    pricePoints: [
      {
        price: 80.0,
        quantity: 1.0,
        vendorReputation: 4.5,
        transactionVolume: 200,
        timeOfDay: '09:30',
        dayOfWeek: 'Tuesday'
      }
    ],
    timestamp: new Date()
  }
]);

print('MongoDB initialization completed successfully!');