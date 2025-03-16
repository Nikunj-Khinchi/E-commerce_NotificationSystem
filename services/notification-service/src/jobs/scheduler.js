// services/notification-service/src/jobs/scheduler.js
const cron = require('node-cron');
const config = require('../config');
const orderUpdateJob = require('./orderUpdate.job');
const promotionJob = require('./promotion.job');
const logger = require('../utils/logger');

/**
 * Initialize all scheduled jobs
 */
const initScheduler = () => {
    // Schedule order update job
    cron.schedule(config.scheduler.orderUpdates.cron, async () => {
        try {
            await orderUpdateJob.processOrderUpdates();
        } catch (error) {
            logger.error('Error in order update job:', error);
        }
    });

    // Schedule promotion job
    cron.schedule(config.scheduler.promotions.cron, async () => {
        try {
            await promotionJob.processPromotions();
        } catch (error) {
            logger.error('Error in promotion job:', error);
        }
    });

    logger.info('Scheduler initialized');
};

module.exports = {
    initScheduler
};