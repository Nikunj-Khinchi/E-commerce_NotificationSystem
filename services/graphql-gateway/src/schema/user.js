const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type UserPreferences {
    notifications: NotificationPreferences
    categories: [String]
  }

  type NotificationPreferences {
    promotions: Boolean
    order_updates: Boolean
    recommendations: Boolean
  }

  type User {
    _id: ID!
    name: String!
    email: String!
    preferences: UserPreferences
    createdAt: String
    updatedAt: String
  }

  type AuthResponse {
    user: User!
    token: String!
  }

  input NotificationPreferencesInput {
    promotions: Boolean
    order_updates: Boolean
    recommendations: Boolean
  }

  input UserPreferencesInput {
    notifications: NotificationPreferencesInput
    categories: [String]
  }

  input RegisterUserInput {
    name: String!
    email: String!
    password: String!
    preferences: UserPreferencesInput
  }

  input LoginUserInput {
    email: String!
    password: String!
  }

  extend type Query {
    getUser: User
  }

  extend type Mutation {
    registerUser(input: RegisterUserInput!): AuthResponse!
    loginUser(input: LoginUserInput!): AuthResponse!
    updateUserPreferences(preferences: UserPreferencesInput!): User!
  }
`;

module.exports = typeDefs;
