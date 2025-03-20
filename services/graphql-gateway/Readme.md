# GraphQL Gateway

## Overview

The GraphQL Gateway serves as the unified API entry point for the e-commerce personalized notification system. It aggregates data from the User Service, Notification Service, and Recommendation Service, providing a single endpoint for clients to interact with.

## Features

- Unified GraphQL API for client applications
- Authentication and authorization management
- Request routing to appropriate microservices
- Data aggregation from multiple services
- In-memory caching for performance optimization
- Rate limiting and request validation

## Technical Stack

- **Runtime**: Node.js with Express
- **GraphQL**: Apollo Server
- **Authentication**: JWT validation
- **Caching**: Node-Cache for in-memory caching
- **Security**: GraphQL Shield for permission rules
- **Testing**: Jest with Apollo Server Testing

## GraphQL Schema

The GraphQL Gateway exposes the following main types and operations:

### Types

- User: User account information
- UserPreferences: User notification and category preferences
- Notification: User notification details
- Recommendations: Personalized product recommendations
- Product: Product information

### Queries

- `health`: Health check endpoint
- `getUser`: Get current authenticated user
- `getUserNotifications`: Get notifications for the current user
- `getUnreadNotificationsCount`: Get count of unread notifications
- `getUserRecommendations`: Get personalized recommendations

### Mutations

- `registerUser`: Register a new user
- `loginUser`: Authenticate a user and get JWT token
- `updateUserPreferences`: Update user preferences
- `markNotificationAsRead`: Mark a notification as read
- `markAllNotificationsAsRead`: Mark all notifications as read
- `createNotification`: Create a new notification
- `generateUserRecommendations`: Generate new recommendations
- `createUserActivity`: Record user activity (view, cart, etc.)

## Authentication & Authorization

The GraphQL Gateway handles authentication and authorization:

1. **Authentication**: JWT tokens are validated in the context middleware
2. **Authorization**: GraphQL Shield is used to define permission rules
3. **Access Control**:
   - Some operations are public (health, register, login)
   - Authenticated operations require a valid JWT token
   - Resource-specific operations verify ownership


## Data Sources

The GraphQL Gateway communicates with the following data sources:

### UserAPI

Handles user-related operations (registration, login, preferences).

### NotificationAPI

Handles notification operations (get, mark as read, create).

### RecommendationAPI

Handles recommendation operations (get, generate, activity tracking).

## Caching Strategy

The GraphQL Gateway implements caching for frequently accessed data:

1. **Cache Keys**: Based on operation and user ID
2. **TTL (Time To Live)**: Configurable via environment variables
3. **Cache Invalidation**:
   - On mutation operations
   - When data becomes stale
   - Using pattern-based invalidation

Example caching implementation:

```javascript
const cachedData = await cache.getOrFetch(
  `user:${userId}`,
  async () => {
    const data = await fetchFromService();
    return data;
  },
  3600 // TTL in seconds
);
```

## GraphQL Playground

The GraphQL Playground is available in non-production environments at `/graphql`, providing:

- Interactive query editor
- Schema documentation
- Request history
- Response inspector

## Configuration

The GraphQL Gateway can be configured via environment variables:

- `PORT`: The port the service runs on (default: 4000)
- `USER_SERVICE_URL`: URL of the User Service
- `NOTIFICATION_SERVICE_URL`: URL of the Notification Service
- `RECOMMENDATION_SERVICE_URL`: URL of the Recommendation Service
- `JWT_SECRET`: Secret key for JWT validation
- `CACHE_TTL`: Cache TTL in seconds (default: 300)
- `PLAYGROUND`: Enable/disable GraphQL Playground (default: true in dev, false in prod)

## Local Development

1. Install dependencies:

```bash
cd services/graphql-gateway
npm install
```

2. Start the service in development mode:

```bash
npm run dev
```

3. Access the GraphQL Playground:

```
http://localhost:4000/graphql
```

## Testing

Run the GraphQL Gateway tests:

```bash
npm test
```

## Example Queries

### Register a user

```graphql
mutation RegisterUser($input: RegisterUserInput!) {
  registerUser(input: $input) {
    user {
      id
      name
      email
      preferences {
        notifications {
          promotions
          order_updates
          recommendations
        }
        categories
      }
    }
    token
  }
}

# Variables:
{
  "input": {
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
}
```

### Login

```graphql
mutation LoginUser($input: LoginUserInput!) {
  loginUser(input: $input) {
    user {
      id
      name
      email
    }
    token
  }
}

# Variables:
{
  "input": {
    "email": "john@example.com",
    "password": "securepassword123"
  }
}
```

### Get User Notifications

```graphql
query GetUserNotifications($filter: NotificationsFilterInput) {
  getUserNotifications(filter: $filter) {
    notifications {
      id
      type
      title
      content {
        message
        imageUrl
      }
      read
      sentAt
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}

# Variables:
{
  "filter": {
    "limit": 10,
    "offset": 0,
    "read": false
  }
}
```

### Mark Notification as Read

```graphql
mutation MarkNotificationAsRead($notificationId: ID!) {
  markNotificationAsRead(notificationId: $notificationId) {
    id
    read
    readAt
  }
}

# Variables:
{
  "notificationId": "60a123456789abcdef123456"
}
```

### Get User Recommendations

```graphql
query GetUserRecommendations {
  getUserRecommendations {
    id
    products {
      product {
        id
        name
        description
        price
        imageUrl
        category
        rating
      }
      score
      reason
    }
    createdAt
    expiresAt
  }
}
```

### Generate Recommendations

```graphql
mutation GenerateRecommendations($preferences: GenerateRecommendationsInput) {
  generateUserRecommendations(preferences: $preferences) {
    id
    products {
      product {
        id
        name
        price
        category
      }
      reason
    }
  }
}

# Variables:
{
  "preferences": {
    "categories": ["electronics", "books", "clothing"]
  }
}
```

### Record User Activity

```graphql
mutation CreateUserActivity($input: UserActivityInput!) {
  createUserActivity(input: $input)
}

# Variables:
{
  "input": {
    "productId": "60a123456789abcdef123459",
    "activityType": "view",
    "metadata": {
      "viewDuration": 120
    }
  }
}
```

## Docker Deployment

The GraphQL Gateway can be deployed as a Docker container using the provided Dockerfile:

```bash
docker build -t graphql-gateway .
docker run -p 4000:4000 \
  -e USER_SERVICE_URL=http://user-service:3001 \
  -e NOTIFICATION_SERVICE_URL=http://notification-service:3002 \
  -e RECOMMENDATION_SERVICE_URL=http://recommendation-service:3003 \
  -e JWT_SECRET=your-secret-key \
  graphql-gateway
```

Or with docker-compose:

```bash
docker-compose up graphql-gateway
```
