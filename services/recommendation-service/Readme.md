# Recommendation Service

## Overview

The Recommendation Service generates personalized product recommendations for users in the e-commerce personalized notification system. It tracks user behavior, processes user activity data, and applies recommendation algorithms to suggest relevant products.

## Features

- Track user activity (views, cart additions, purchases, etc.)
- Generate personalized recommendations based on user behavior
- Consider user preferences and activity patterns
- Use sophisticated scoring algorithms for recommendation relevance
- Schedule batch recommendation generation
- Publish recommendation events to the message broker

## Technical Stack

- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Messaging**: RabbitMQ for event consumption and publishing
- **Scheduling**: Node-cron for batch processing
- **Testing**: Jest with Supertest

## API Endpoints

### POST /api/recommendations/activities

Create a new user activity (view, cart, purchase, etc.).

**Request Body:**

```json
{
  "userId": "607f1f77bcf86cd799439011",
  "productId": "60a123456789abcdef123459",
  "activityType": "view",
  "metadata": {
    "viewDuration": 120
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "activity": {
      "_id": "60b123456789abcdef123456",
      "userId": "607f1f77bcf86cd799439011",
      "productId": "60a123456789abcdef123459",
      "activityType": "view",
      "metadata": {
        "viewDuration": 120
      },
      "timestamp": "2023-01-01T00:00:00.000Z",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### GET /api/recommendations/users/:userId

Get recommendations for a specific user.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recommendations": {
      "id": "60c123456789abcdef123456",
      "userId": "607f1f77bcf86cd799439011",
      "products": [
        {
          "product": {
            "id": "60a123456789abcdef123459",
            "name": "Smartphone X",
            "description": "Latest smartphone with amazing features",
            "price": 999.99,
            "imageUrl": "https://example.com/smartphone-x.jpg",
            "category": "electronics",
            "rating": 4.5
          },
          "score": 0.9,
          "reason": "similar_purchase"
        },
        {
          "product": {
            "id": "60a123456789abcdef12345a",
            "name": "Laptop Pro",
            "description": "Powerful laptop for professionals",
            "price": 1499.99,
            "imageUrl": "https://example.com/laptop-pro.jpg",
            "category": "electronics",
            "rating": 4.7
          },
          "score": 0.8,
          "reason": "trending"
        }
      ],
      "createdAt": "2023-01-01T00:00:00.000Z",
      "expiresAt": "2023-01-08T00:00:00.000Z"
    }
  }
}
```

### POST /api/recommendations/users/:userId/generate

Generate new recommendations for a specific user.

**Request Body:**

```json
{
  "preferences": {
    "categories": ["electronics", "books", "clothing"]
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recommendations": {
      "_id": "60c123456789abcdef123456",
      "userId": "607f1f77bcf86cd799439011",
      "products": [
        {
          "productId": "60a123456789abcdef123459",
          "score": 0.9,
          "reason": "similar_purchase"
        },
        {
          "productId": "60a123456789abcdef12345a",
          "score": 0.8,
          "reason": "trending"
        }
      ],
      "expiresAt": "2023-01-08T00:00:00.000Z",
      "sent": false,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### POST /api/recommendations/batch

Generate recommendations for all users in a batch process.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "success": 42,
    "failed": 3,
    "total": 45
  }
}
```

### PATCH /api/recommendations/:recommendationId/sent

Mark a recommendation as sent.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recommendation": {
      "_id": "60c123456789abcdef123456",
      "sent": true,
      "sentAt": "2023-01-02T00:00:00.000Z"
    }
  }
}
```

## Recommendation Algorithm

The recommendation algorithm considers multiple factors:

1. **User Activity History**:

   - Products viewed
   - Products added to cart
   - Products purchased
   - Search queries

2. **Category Preferences**:

   - User's explicitly stated category preferences
   - Categories user has shown interest in through activity

3. **Product Attributes**:

   - Product ratings
   - Product tags
   - Product categories

4. **Time Weighting**:

   - Recent activities are weighted more heavily
   - Time decay factor applied to older activities

5. **Scoring System**:
   - Products are scored from 0 to 1
   - Multiple factors combined with appropriate weights
   - Minimum score threshold applied (default: 0.3)

For new users with limited activity, the system falls back to popular products in their preferred categories.

## Event Consumption

The Recommendation Service consumes the following events from RabbitMQ:

### user.created

Used to initialize user data for new users.

### user.preferences.updated

Used to update recommendation generation based on new user preferences.

### user.activity

Used to record user activity for recommendation processing.

## Event Publishing

The Recommendation Service publishes the following events to RabbitMQ:

### recommendation.created

Published when new recommendations are generated for a user.

```json
{
  "recommendationId": "60c123456789abcdef123456",
  "userId": "607f1f77bcf86cd799439011",
  "products": [
    {
      "id": "60a123456789abcdef123459",
      "name": "Smartphone X",
      "price": 999.99,
      "imageUrl": "https://example.com/smartphone-x.jpg",
      "category": "electronics"
    },
    {
      "id": "60a123456789abcdef12345a",
      "name": "Laptop Pro",
      "price": 1499.99,
      "imageUrl": "https://example.com/laptop-pro.jpg",
      "category": "electronics"
    }
  ],
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## Database Schema

### Product Model

```javascript
{
  name: String,           // Required
  description: String,    // Required
  price: Number,          // Required, min: 0
  imageUrl: String,       // Required
  category: String,       // Required, indexed
  tags: [String],         // Default: [], indexed
  rating: Number,         // Default: 0, min: 0, max: 5
  inStock: Boolean,       // Default: true
  createdAt: Date,        // Automatically added
  updatedAt: Date         // Automatically updated
}
```

### UserActivity Model

```javascript
{
  userId: String,         // Required, indexed
  productId: ObjectId,    // Required, ref: 'Product'
  activityType: String,   // Required: 'view', 'cart', 'purchase', 'wishlist', 'search'
  timestamp: Date,        // Default: Date.now, indexed
  metadata: {             // Additional data based on activity type
    viewDuration: Number,
    quantity: Number,
    searchQuery: String,
    price: Number,
    orderId: String
  },
  createdAt: Date,        // Automatically added
  updatedAt: Date         // Automatically updated
}
```

### Recommendation Model

```javascript
{
  userId: String,         // Required, indexed
  products: [{            // Required
    productId: ObjectId,  // Required, ref: 'Product'
    score: Number,        // Required, min: 0, max: 1
    reason: String        // Required: 'similar_purchase', 'similar_view', 'popular_in_category', etc.
  }],
  createdAt: Date,        // Default: Date.now, indexed
  expiresAt: Date,        // Required, indexed, TTL index
  metadata: Object,       // Additional data
  sent: Boolean,          // Default: false
  sentAt: Date            // Default: null
}
```

## Configuration

The Recommendation Service can be configured via environment variables:

- `PORT`: The port the service runs on (default: 3003)
- `MONGODB_URI`: MongoDB connection URI
- `RABBITMQ_URI`: RabbitMQ connection URI
- `RECOMMENDATIONS_MAX`: Maximum number of recommendations per user (default: 5)
- `RECOMMENDATIONS_EXPIRY_DAYS`: Days until recommendations expire (default: 7)
- `RECOMMENDATIONS_MIN_SCORE`: Minimum score threshold (default: 0.3)
- `RECOMMENDATIONS_SCHEDULER_CRON`: Cron schedule for batch generation (default: `0 1 * * *`)

## Local Development

1. Install dependencies:

```bash
cd services/recommendation-service
npm install
```

2. Start the service in development mode:

```bash
npm run dev
```

## Testing

Run the Recommendation Service tests:

```bash
npm test
```

## Docker Deployment

The Recommendation Service can be deployed as a Docker container using the provided Dockerfile:

```bash
docker build -t recommendation-service .
docker run -p 3003:3003 -e MONGODB_URI=mongodb://mongodb:27017/recommendation-service -e RABBITMQ_URI=amqp://rabbitmq:5672 recommendation-service
```

Or with docker-compose:

```bash
docker-compose up recommendation-service
```
