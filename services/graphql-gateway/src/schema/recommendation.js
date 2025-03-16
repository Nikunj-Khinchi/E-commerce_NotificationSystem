// services/graphql-gateway/src/schema/recommendation.js
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  enum RecommendationReason {
    similar_purchase
    similar_view
    popular_in_category
    trending
    frequently_bought_together
    wishlist_recommendation
  }

  enum ActivityType {
    view
    cart
    purchase
    wishlist
    search
  }

  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    imageUrl: String!
    category: String!
    rating: Float!
  }

  type RecommendedProduct {
    product: Product!
    score: Float!
    reason: RecommendationReason!
  }

  type Recommendations {
    id: ID!
    userId: ID!
    products: [RecommendedProduct!]!
    createdAt: String!
    expiresAt: String!
  }

  input ActivityMetadataInput {
    viewDuration: Int
    quantity: Int
    searchQuery: String
    price: Float
    orderId: String
  }

  input UserActivityInput {
    productId: ID!
    activityType: ActivityType!
    metadata: ActivityMetadataInput
  }

  extend type Query {
    getUserRecommendations: Recommendations!
  }

  extend type Mutation {
    createUserActivity(input: UserActivityInput!): Boolean!
  }
`;

module.exports = typeDefs;