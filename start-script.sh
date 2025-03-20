#!/bin/bash

echo "Starting infrastructure services..."

# Start MongoDB, Redis, and RabbitMQ
docker-compose up -d mongodb redis rabbitmq
echo "Waiting for infrastructure services to be healthy..."
sleep 15

# Start monitoring stack
echo "Starting monitoring services..."
docker-compose up -d prometheus grafana
echo "Waiting for monitoring services..."
sleep 15

# Start application services
echo "Starting user service..."
docker-compose up -d user-service
sleep 10

echo "Starting notification and recommendation services..."
docker-compose up -d notification-service recommendation-service
sleep 15

# Start gateway last
echo "Starting GraphQL Gateway..."
docker-compose up -d graphql-gateway

# Check service status
echo "All services started. Checking status..."
docker-compose ps

# Monitor logs for errors
echo "Monitoring logs for errors..."
docker-compose logs -f | grep -i "error"