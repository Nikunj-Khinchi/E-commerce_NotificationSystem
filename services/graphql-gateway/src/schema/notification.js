// services/graphql-gateway/src/schema/notification.js
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  enum NotificationType {
    promotion
    order_update
    recommendation
  }

  type NotificationContent {
    message: String
    discount: String
    expiresAt: String
    imageUrl: String
    orderId: String
    status: String
    products: [ProductPreview]
    updatedAt: String
  }

  type ProductPreview {
    id: ID!
    name: String!
    price: Float!
    imageUrl: String
    category: String
  }

  type Notification {
    _id: ID!
    userId: ID!
    type: NotificationType!
    title: String!
    content: NotificationContent!
    read: Boolean!
    sentAt: String!
    readAt: String
    createdAt: String!
    updatedAt: String!
  }

  type NotificationPagination {
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }

  type NotificationsResponse {
    notifications: [Notification!]!
    pagination: NotificationPagination!
  }

  type ReadAllNotificationsResponse {
    updated: Int!
  }

  input NotificationsFilterInput {
    limit: Int
    offset: Int
    read: Boolean
    type: NotificationType
  }

  extend type Query {
    getUserNotifications(filter: NotificationsFilterInput): NotificationsResponse!
    getUnreadNotificationsCount: Int!
  }

  extend type Mutation {
    markNotificationAsRead(notificationId: ID!): Notification!
    markAllNotificationsAsRead: ReadAllNotificationsResponse!
  }
`;

module.exports = typeDefs;