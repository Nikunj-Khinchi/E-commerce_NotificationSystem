# E-commerce Personalized Notification System

A microservices-based personalized notification system for an e-commerce platform. This system handles user preferences, notifications, and personalized recommendations.

## Architecture Diagram

![E-commerce Notification System Architecture](./Architecture%20Diagram.drawio.png)

### System Components:
- **GraphQL Gateway**: API gateway providing unified interface
- **Microservices**: User, Notification, and Recommendation services
- **Message Broker**: RabbitMQ for asynchronous communication
- **Databases**: MongoDB for persistence
- **Caching**: Redis for performance optimization
- **Monitoring Stack**: Prometheus and Grafana for observability



## Architecture Overview

This system is built using a microservices architecture with the following components:

1. **User Service**: Manages user registration, authentication, and preferences
2. **Notification Service**: Handles storing and retrieving notifications, marking them as read
3. **Recommendation Service**: Generates personalized product recommendations based on user activity
4. **GraphQL Gateway**: Provides a unified API that aggregates data from all services
5. **Message Broker (RabbitMQ)**: Facilitates asynchronous communication between services
6. **Scheduled Jobs**: Handles periodic tasks like sending promotions and order updates

All services use MongoDB for persistence and communicate through both REST APIs and message queues.

## Prerequisites

- Docker and Docker Compose
- Node.js (v14 or later)
- Rabbitmq and MongoDB
- Redis
- Prometheus and Grafana
- Postman
- npm or yarn

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/e-commerce-notification-system.git
cd e-commerce-notification-system
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit the `.env` file to set your preferred configuration.

### 3. Start the services with Docker Compose

```bash
docker-compose up -d
```

This will start all services, MongoDB, and RabbitMQ in detached mode.

### 4. Check the status of services

```bash
docker-compose ps
```

### 5. Access GraphQL Playground

Open your browser and navigate to:

```
http://localhost:4000/graphql
```

## API Documentation

#### Postmans Collection Link  : [Postman Collection](https://documenter.getpostman.com/view/25932409/2sAYkEsLDK)

### GraphQL Endpoints

The GraphQL API gateway exposes the following main queries and mutations:

#### User Service

- `registerUser`: Register a new user
- `loginUser`: Authenticate and get JWT token
- `updateUserPreferences`: Update notification preferences
- `getUser`: Get user details

#### Notification Service

- `getNotifications`: Get user's notifications
- `markNotificationAsRead`: Mark a notification as read
- `getUnreadNotificationsCount`: Get count of unread notifications

#### Recommendation Service

- `getRecommendations`: Get personalized product recommendations

Example queries and mutations can be found in the GraphQL Playground.

## Testing

Each service includes unit tests. To run tests for all services:

```bash
docker-compose run user-service npm test
docker-compose run notification-service npm test
docker-compose run recommendation-service npm test
```

## Monitoring

RabbitMQ provides a management interface accessible at:

```
http://localhost:15672
```

- Username: guest
- Password: guest

## Service Details

### User Service (Port 3001)

Handles user management, authentication, and preferences.

### Notification Service (Port 3002)

Manages notifications, marking them as read, and scheduled notifications.

### Recommendation Service (Port 3003)

Generates personalized recommendations based on user activity.

### GraphQL Gateway (Port 4000)

Provides a unified API for client applications.

## Troubleshooting

If you encounter issues:

1. Check container logs:

```bash
docker-compose logs [service-name]
```

2. Restart services:

```bash
docker-compose restart [service-name]
```

3. Rebuild and restart:

```bash
docker-compose up -d --build
```


## Monitoring and Metrics

### Prometheus Integration

The system uses Prometheus for metrics collection. Each service exposes metrics at `/metrics` endpoint:

- User Service: `http://localhost:3001/metrics`
- Notification Service: `http://localhost:3002/metrics`
- Recommendation Service: `http://localhost:3003/metrics`
- GraphQL Gateway: `http://localhost:4000/metrics`

Key metrics tracked:

```plaintext
# RabbitMQ Metrics
rabbitmq_queue_size{queue="user.created"} 5
rabbitmq_messages_published_total{exchange="user.events",routing_key="user.created"} 10
rabbitmq_messages_consumed_total{queue="notifications"} 15
rabbitmq_connection_status 1

# HTTP Metrics
http_request_duration_seconds{path="/api/users",method="POST"}
http_requests_total{status="200",method="GET"}

# Service Metrics
process_cpu_usage
process_memory_usage
```

### Grafana Monitoring Setup

1. Access Grafana dashboard:
```
http://localhost:3000
```
- Username: `admin`
- Password: `admin`

2. Add Prometheus data source:
- Click "Add data source"
- Select "Prometheus"
- URL: `http://localhost:9090`
- Click "Save & Test"

3. Import pre-configured dashboard:
- Navigate to: [Service Monitoring Dashboard](http://localhost:3000/explore?schemaVersion=1&panes=%7B%229wh%22%3A%7B%22datasource%22%3A%22aeg8ogwyfcfeoa%22%2C%22queries%22%3A%5B%7B%22refId%22%3A%22A%22%2C%22expr%22%3A%22users_http_request_duration_seconds_count%22%2C%22range%22%3Atrue%2C%22instant%22%3Atrue%2C%22datasource%22%3A%7B%22type%22%3A%22prometheus%22%2C%22uid%22%3A%22aeg8ogwyfcfeoa%22%7D%2C%22editorMode%22%3A%22builder%22%2C%22legendFormat%22%3A%22__auto%22%2C%22useBackend%22%3Afalse%2C%22disableTextWrap%22%3Afalse%2C%22fullMetaSearch%22%3Afalse%2C%22includeNullMetadata%22%3Atrue%7D%2C%7B%22refId%22%3A%22B%22%2C%22expr%22%3A%22notifications_http_request_duration_seconds_count%22%2C%22range%22%3Atrue%2C%22instant%22%3Atrue%2C%22datasource%22%3A%7B%22type%22%3A%22prometheus%22%2C%22uid%22%3A%22aeg8ogwyfcfeoa%22%7D%2C%22editorMode%22%3A%22builder%22%2C%22legendFormat%22%3A%22__auto%22%2C%22useBackend%22%3Afalse%2C%22disableTextWrap%22%3Afalse%2C%22fullMetaSearch%22%3Afalse%2C%22includeNullMetadata%22%3Atrue%7D%2C%7B%22refId%22%3A%22C%22%2C%22expr%22%3A%22graphql_request_duration_seconds_count%22%2C%22range%22%3Atrue%2C%22instant%22%3Atrue%2C%22datasource%22%3A%7B%22type%22%3A%22prometheus%22%2C%22uid%22%3A%22aeg8ogwyfcfeoa%22%7D%2C%22editorMode%22%3A%22builder%22%2C%22legendFormat%22%3A%22__auto%22%2C%22useBackend%22%3Afalse%2C%22disableTextWrap%22%3Afalse%2C%22fullMetaSearch%22%3Afalse%2C%22includeNullMetadata%22%3Atrue%7D%2C%7B%22refId%22%3A%22D%22%2C%22expr%22%3A%22rabbitmq_messages_consumed_total%22%2C%22range%22%3Atrue%2C%22instant%22%3Atrue%2C%22datasource%22%3A%7B%22type%22%3A%22prometheus%22%2C%22uid%22%3A%22aeg8ogwyfcfeoa%22%7D%2C%22editorMode%22%3A%22builder%22%2C%22legendFormat%22%3A%22__auto%22%2C%22useBackend%22%3Afalse%2C%22disableTextWrap%22%3Afalse%2C%22fullMetaSearch%22%3Afalse%2C%22includeNullMetadata%22%3Atrue%7D%2C%7B%22refId%22%3A%22E%22%2C%22expr%22%3A%22rabbitmq_messages_published_total%22%2C%22range%22%3Atrue%2C%22instant%22%3Atrue%2C%22datasource%22%3A%7B%22type%22%3A%22prometheus%22%2C%22uid%22%3A%22aeg8ogwyfcfeoa%22%7D%2C%22editorMode%22%3A%22builder%22%2C%22legendFormat%22%3A%22__auto%22%2C%22useBackend%22%3Afalse%2C%22disableTextWrap%22%3Afalse%2C%22fullMetaSearch%22%3Afalse%2C%22includeNullMetadata%22%3Atrue%7D%5D%2C%22range%22%3A%7B%22from%22%3A%22now-1h%22%2C%22to%22%3A%22now%22%7D%7D%7D&orgId=1)

Available Metrics:
- HTTP request durations by service
- Message broker statistics
- Service health metrics
- Resource utilization

Note: Ensure all services are running before accessing the dashboard.

1. **Service Overview**
   - Request rates and latencies
   - Error rates
   - CPU and memory usage

2. **RabbitMQ Monitoring**
   - Queue sizes
   - Message rates
   - Connection status
   - Dead letter queue metrics

3. **API Performance**
   - Response times
   - Status codes
   - Request volumes
   - Error rates by endpoint


## Quick Start

1. Start all services including monitoring:
```bash
docker-compose up -d
```

2. Access the services:
- GraphQL Playground: http://localhost:4000/graphql
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090
- RabbitMQ Management: http://localhost:15672 (guest/guest)

3. View metrics:
- User Service: http://localhost:3001/metrics
- Notification Service: http://localhost:3002/metrics
- Recommendation Service: http://localhost:3003/metrics
- GraphQL Gateway: http://localhost:4000/metrics
