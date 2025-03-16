// services/graphql-gateway/src/schema/index.js
const { gql } = require('apollo-server-express');
const userSchema = require('./user');
const notificationSchema = require('./notification');
const recommendationSchema = require('./recommendation');

// Base schema
const baseSchema = gql`
  type Query {
    health: String!
  }

  type Mutation {
    _empty: String
  }
`;

// Combine all schemas
const typeDefs = [
    baseSchema,
    userSchema,
    notificationSchema,
    recommendationSchema
];

module.exports = typeDefs;