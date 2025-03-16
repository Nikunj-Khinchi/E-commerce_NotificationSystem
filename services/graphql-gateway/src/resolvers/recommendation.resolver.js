// services/graphql-gateway/src/resolvers/recommendation.resolver.js
const recommendationResolvers = {
    Query: {
        getUserRecommendations: async (_, args, { dataSources, user }) => {
            if (!user) {
                throw new Error('Authentication required');
            }

            return dataSources.recommendationAPI.getUserRecommendations(user.id);
        }
    },

    Mutation: {
        createUserActivity: async (_, { input }, { dataSources, user }) => {
            if (!user) {
                throw new Error('Authentication required');
            }

            const activityData = {
                userId: user.id,
                productId: input.productId,
                activityType: input.activityType,
                metadata: input.metadata || {}
            };

            await dataSources.recommendationAPI.createUserActivity(activityData);

            return true;
        }
    }
};

module.exports = recommendationResolvers;