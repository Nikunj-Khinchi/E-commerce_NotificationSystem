# Notification Service

## Overview

The Notification Service manages all aspects of notifications in the e-commerce personalized notification system. It handles creating, storing, retrieving, and managing the read status of notifications. It also includes schedulers for generating promotional notifications and order update notifications.

## Features

- Create and store notifications of various types
- Retrieve notifications with filtering and pagination
- Mark notifications as read/unread
- Count unread notifications
- Schedule promotional notifications based on user preferences
- Schedule order update notifications
- Consume events from other services to generate relevant notifications

## Technical Stack

- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Messaging**: RabbitMQ for event consumption and publishing
- **Scheduling**: Node-cron for scheduled jobs
- **Testing**: Jest with Supertest

## API Endpoints

### GET /api/notifications/users/:userId

Get notifications for a specific user.

**Query Parameters:**

- `limit`: Maximum number of notifications to return (default: 20)
- `offset`: Number of notifications to skip (default: 0)
- `read`: Filter by read status (`true` or `false`)
- `type`: Filter by notification type (`promotion`, `order_update`, or `recommendation`)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "60a123456789abcdef123456",
        "userId": "607f1f77bcf86cd799439011",
        "type": "promotion",
        "title": "Weekend Sale",
        "content": {
          "message": "Get 20% off on all products",
          "discount": "20%",
          "imageUrl": "https://example.com/sale.jpg"
        },
        "read": false,
        "sentAt": "2023-01-01T00:00:00.000Z",
        "readAt": null,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### GET /api/notifications/users/:userId/unread-count

Get the count of unread notifications for a user.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### PATCH /api/notifications/users/:userId/:notificationId/read

Mark a specific notification as read.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "60a123456789abcdef123456",
      "read": true,
      "readAt": "2023-01-02T00:00:00.000Z"
    }
  }
}
```

### PATCH /api/notifications/users/:userId/read-all

Mark all notifications as read for a user.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "updated": 5
  }
}
```

### POST /api/notifications

Create a new notification.

**Request Body:**

```json
{
  "userId": "607f1f77bcf86cd799439011",
  "type": "promotion",
  "title": "Weekend Sale",
  "content": {
    "message": "Get 20% off on all products",
    "discount": "20%",
    "imageUrl": "https://example.com/sale.jpg"
  },
  "metadata": {
    "promotionId": "PROMO-1234"
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "60a123456789abcdef123456",
      "userId": "607f1f77bcf86cd799439011",
      "type": "promotion",
      "title": "Weekend Sale",
      "content": {
        "message": "Get 20% off on all products",
        "discount": "20%",
        "imageUrl": "https://example.com/sale.jpg"
      },
      "read": false,
      "sentAt": "2023-01-01T00:00:00.000Z",
      "readAt": null,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

## Event Consumption

The Notification Service consumes the following events from RabbitMQ:

### user.created

Consumed to create a welcome notification for new users.

### user.preferences.updated

Consumed to update notification delivery based on user preferences.

### recommendation.created

Consumed to create recommendation notifications based on personalized product recommendations.

## Scheduled Jobs

The Notification Service includes the following scheduled jobs:

### Promotion Job

Runs daily at noon (`0 12 * * *`) to send promotional notifications to users based on their preferences and categories of interest.

### Order Update Job

Runs every 30 minutes (`*/30 * * * *`) to send updates about order status changes.

## Database Schema

### Notification Model

```javascript
{
  userId: String,        // Required
  type: String,          // Required: 'promotion', 'order_update', or 'recommendation'
  title: String,         // Required
  content: {             // Required
    message: String,     // Required
    discount: String,
    expiresAt: Date,
    imageUrl: String,
    orderId: String,
    status: String,
    products: Array,
    updatedAt: Date
  },
  read: Boolean,         // Default: false
  sentAt: Date,          // Default: Date.now
  readAt: Date,          // Default: null
  metadata: Object,      // Additional data (promotionId, orderId, etc.)
  createdAt: Date,       // Automatically added
  updatedAt: Date        // Automatically updated
}
```

## Configuration

The Notification Service can be configured via environment variables:

- `PORT`: The port the service runs on (default: 3002)
- `MONGODB_URI`: MongoDB connection URI
- `RABBITMQ_URI`: RabbitMQ connection URI
- `SCHEDULER_PROMOTIONS_CRON`: Cron schedule for promotions (default: `0 12 * * *`)
- `SCHEDULER_ORDER_UPDATES_CRON`: Cron schedule for order updates (default: `*/30 * * * *`)

## Local Development

1. Install dependencies:

```bash
cd services/notification-service
npm install
```

2. Start the service in development mode:

```bash
npm run dev
```

## Testing

Run the Notification Service tests:

```bash
npm test
```

## Docker Deployment

The Notification Service can be deployed as a Docker container using the provided Dockerfile:

```bash
docker build -t notification-service .
docker run -p 3002:3002 -e MONGODB_URI=mongodb://mongodb:27017/notification-service -e RABBITMQ_URI=amqp://rabbitmq:5672 notification-service
```

Or with docker-compose:

```bash
docker-compose up notification-service
```
