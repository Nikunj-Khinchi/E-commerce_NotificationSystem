# User Service

## Overview

The User Service manages user accounts, authentication, and user preferences for the e-commerce personalized notification system. It handles user registration, login, JWT token generation, and preference management.

## Features

- User registration and account creation
- Authentication and JWT token generation
- User profile management
- User preferences storage and retrieval
- Event publishing for user-related events

## Technical Stack

- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Messaging**: RabbitMQ for event publishing
- **Testing**: Jest with Supertest

## API Endpoints

### Public Endpoints

#### POST /api/users/register

Register a new user.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "preferences": {
    "notifications": {
      "promotions": true,
      "order_updates": true,
      "recommendations": true
    },
    "categories": ["electronics", "books"]
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "607f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": {
        "notifications": {
          "promotions": true,
          "order_updates": true,
          "recommendations": true
        },
        "categories": ["electronics", "books"]
      }
    },
    "token": "jwt-token-here"
  }
}
```

#### POST /api/users/login

Authenticate a user and return a JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "607f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": {
        "notifications": {
          "promotions": true,
          "order_updates": true,
          "recommendations": true
        },
        "categories": ["electronics", "books"]
      }
    },
    "token": "jwt-token-here"
  }
}
```

### Protected Endpoints (Require Authentication)

#### GET /api/users/me

Get the authenticated user's details.

**Headers:**

```
Authorization: Bearer jwt-token-here
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "607f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": {
        "notifications": {
          "promotions": true,
          "order_updates": true,
          "recommendations": true
        },
        "categories": ["electronics", "books"]
      }
    }
  }
}
```

#### PATCH /api/users/preferences

Update the authenticated user's preferences.

**Headers:**

```
Authorization: Bearer jwt-token-here
```

**Request Body:**

```json
{
  "preferences": {
    "notifications": {
      "promotions": false,
      "order_updates": true,
      "recommendations": true
    },
    "categories": ["electronics", "books", "clothing"]
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "607f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": {
        "notifications": {
          "promotions": false,
          "order_updates": true,
          "recommendations": true
        },
        "categories": ["electronics", "books", "clothing"]
      }
    }
  }
}
```

## Event Publishing

The User Service publishes the following events to RabbitMQ:

### user.created

Published when a new user is registered.

```json
{
  "userId": "607f1f77bcf86cd799439011",
  "email": "john@example.com",
  "name": "John Doe",
  "preferences": {
    "notifications": {
      "promotions": true,
      "order_updates": true,
      "recommendations": true
    },
    "categories": ["electronics", "books"]
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### user.preferences.updated

Published when a user updates their preferences.

```json
{
  "userId": "607f1f77bcf86cd799439011",
  "preferences": {
    "notifications": {
      "promotions": false,
      "order_updates": true,
      "recommendations": true
    },
    "categories": ["electronics", "books", "clothing"]
  },
  "timestamp": "2023-01-02T00:00:00.000Z"
}
```

## Database Schema

### User Model

```javascript
{
  name: String,         // Required
  email: String,        // Required, Unique
  password: String,     // Required (stored as a bcrypt hash)
  preferences: {
    notifications: {
      promotions: Boolean,     // Default: true
      order_updates: Boolean,  // Default: true
      recommendations: Boolean // Default: true
    },
    categories: [String]       // Default: []
  },
  createdAt: Date,      // Automatically added
  updatedAt: Date       // Automatically updated
}
```

## Configuration

The User Service can be configured via environment variables:

- `PORT`: The port the service runs on (default: 3001)
- `MONGODB_URI`: MongoDB connection URI
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRY`: JWT token expiry (default: "24h")
- `RABBITMQ_URI`: RabbitMQ connection URI

## Local Development

1. Install dependencies:

```bash
cd services/user-service
npm install
```

2. Start the service in development mode:

```bash
npm run dev
```

## Testing

Run the User Service tests:

```bash
npm test
```

## Docker Deployment

The User Service can be deployed as a Docker container using the provided Dockerfile:

```bash
docker build -t user-service .
docker run -p 3001:3001 -e MONGODB_URI=mongodb://mongodb:27017/user-service -e RABBITMQ_URI=amqp://rabbitmq:5672 user-service
```

Or with docker-compose:

```bash
docker-compose up user-service
```
