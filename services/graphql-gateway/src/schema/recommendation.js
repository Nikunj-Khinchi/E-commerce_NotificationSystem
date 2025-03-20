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
    _id: ID!
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
    _id: ID!
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

  input GenerateRecommendationsInput {
    categories: [String]
  }

  extend type Query {
    getUserRecommendations: Recommendations!
  }

  # New types for generateUserRecommendations
  type GeneratedProductRecommendation {
    _id: ID!
    productId: ID!
    score: Float!
    reason: RecommendationReason!
  }

  type GeneratedRecommendations {
    _id: ID!
    userId: ID!
    products: [GeneratedProductRecommendation!]!
    expiresAt: String!
    sent: Boolean!
    sentAt: String
    createdAt: String!
    updatedAt: String!
  }

  extend type Mutation {
    createUserActivity(input: UserActivityInput!): Boolean!
    generateUserRecommendations(preferences: GenerateRecommendationsInput): GeneratedRecommendations!
    # markRecommendationAsSent(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;