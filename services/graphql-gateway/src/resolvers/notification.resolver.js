const notificationResolvers = {
    Query: {
        getUserNotifications: async (_, { filter = {} }, { dataSources, user }) => {
            if (!user) {
                throw new Error('Authentication required');
            }

            return dataSources.notificationAPI.getUserNotifications(user.id, filter);
        },

        getUnreadNotificationsCount: async (_, args, { dataSources, user }) => {
            if (!user) {
                throw new Error('Authentication required');
            }

            const result = await dataSources.notificationAPI.getUnreadCount(user.id);
            return result;
        }
    },

    Mutation: {
        markNotificationAsRead: async (_, { notificationId }, { dataSources, user }) => {
            if (!user) {
                throw new Error('Authentication required');
            }

            return dataSources.notificationAPI.markNotificationAsRead(user.id, notificationId);
        },

        markAllNotificationsAsRead: async (_, args, { dataSources, user }) => {
            if (!user) {
                throw new Error('Authentication required');
            }

            return dataSources.notificationAPI.markAllNotificationsAsRead(user.id);
        },

        // createNotification: async (_, { input }, { dataSources, user }) => {
        //     // Verify if user has admin privileges or is creating for themselves
        //     if (!user) {
        //         throw new Error('Authentication required');
        //     }
        //     return dataSources.notificationAPI.createNotification(input);
        // }
    }
};

module.exports = notificationResolvers;