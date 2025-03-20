const userResolvers = require('./user.resolver');
const notificationResolvers = require('./notification.resolver');
const recommendationResolvers = require('./recommendation.resolver');

// Base resolvers
const baseResolvers = {
    Query: {
        health: () => 'OK'
    },
    Mutation: {
        _empty: () => ''
    }
};

// Combine all resolvers
const resolvers = [
    baseResolvers,
    userResolvers,
    notificationResolvers,
    recommendationResolvers
];

module.exports = resolvers;