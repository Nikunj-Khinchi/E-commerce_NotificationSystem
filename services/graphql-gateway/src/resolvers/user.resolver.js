// services/graphql-gateway/src/resolvers/user.resolver.js
const userResolvers = {
    Query: {
        getUser: async (_, args, { dataSources, user }) => {
            if (!user) {
                throw new Error('Authentication required');
            }

            return dataSources.userAPI.getUser(user.id, user.token);
        }
    },

    Mutation: {
        registerUser: async (_, { input }, { dataSources }) => {
            return dataSources.userAPI.registerUser(input);
        },

        loginUser: async (_, { input }, { dataSources }) => {
            return dataSources.userAPI.loginUser(input);
        },

        updateUserPreferences: async (_, { preferences }, { dataSources, user }) => {
            if (!user) {
                throw new Error('Authentication required');
            }

            return dataSources.userAPI.updateUserPreferences(user.id, preferences, user.token);
        }
    }
};

module.exports = userResolvers;