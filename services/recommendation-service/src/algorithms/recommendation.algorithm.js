const Product = require('../models/product.model');
const UserActivity = require('../models/userActivity.model');
const config = require('../config');

const generateRecommendations = async (userId, userPreferences = {}) => {
    try {
        // Step 1: Get user's activity history
        const userActivities = await UserActivity.find({ userId })
            .sort({ timestamp: -1 })
            .populate('productId')
            .limit(50);

        if (userActivities.length === 0) {
            // If no activity, return popular products based on preferences
            return await getPopularRecommendations(userId, userPreferences);
        }

        // Step 2: Extract product categories and IDs from user activities
        const viewedProductIds = new Set();
        const viewedCategories = new Set();
        const purchasedCategories = new Set();
        const cartCategories = new Set();
        const searchedCategories = new Set();

        userActivities.forEach(activity => {
            if (activity.productId) {
                viewedProductIds.add(activity.productId._id.toString());

                if (activity.activityType === 'view') {
                    viewedCategories.add(activity.productId.category);
                } else if (activity.activityType === 'purchase') {
                    purchasedCategories.add(activity.productId.category);
                } else if (activity.activityType === 'cart') {
                    cartCategories.add(activity.productId.category);
                } else if (activity.activityType === 'search' && activity.metadata && activity.metadata.searchQuery) {
                    searchedCategories.add(activity.metadata.searchQuery);
                }
            }
        });

        // Step 3: Find products in viewed and purchased categories that user hasn't viewed
        let candidateProducts = await Product.find({
            _id: { $nin: Array.from(viewedProductIds) },
            $or: [
                { category: { $in: Array.from(purchasedCategories) } },
                { category: { $in: Array.from(viewedCategories) } },
                { category: { $in: Array.from(cartCategories) } },
                { category: { $in: Array.from(searchedCategories) } }
            ],
            inStock: true
        }).sort({ rating: -1 });

        // If not enough candidates, add popular products
        if (candidateProducts.length < config.recommendations.maxRecommendations) {
            const additionalProducts = await Product.find({
                _id: { $nin: Array.from(viewedProductIds) },
                category: { $nin: [...purchasedCategories, ...viewedCategories, ...cartCategories, ...searchedCategories] },
                inStock: true
            })
                .sort({ rating: -1 })
                .limit(config.recommendations.maxRecommendations - candidateProducts.length);

            candidateProducts = [...candidateProducts, ...additionalProducts];
        }

        // Step 4: Score and rank products
        const scoredProducts = await scoreProducts(userId, candidateProducts, userActivities, userPreferences);

        // Step 5: Return top recommendations
        return scoredProducts
            .filter(product => product.score >= config.recommendations.minimumScore)
            .slice(0, config.recommendations.maxRecommendations);
    } catch (error) {
        logger.error('Error generating recommendations:', error);
        throw error;
    }
};

const scoreProducts = async (userId, candidateProducts, userActivities, userPreferences) => {
    // Extract user preferred categories from preferences
    const preferredCategories = new Set(
        userPreferences.categories || []
    );

    // Count activities by category
    const categoryActivityCounts = {};
    const productInteractions = {};

    userActivities.forEach(activity => {
        if (activity.productId && activity.productId.category) {
            const category = activity.productId.category;

            // Count category interactions
            if (!categoryActivityCounts[category]) {
                categoryActivityCounts[category] = {
                    purchase: 0,
                    cart: 0,
                    view: 0,
                    wishlist: 0,
                    search: 0,
                    total: 0
                };
            }

            categoryActivityCounts[category][activity.activityType]++;
            categoryActivityCounts[category].total++;

            // Also track specific product interactions
            if (!productInteractions[activity.productId._id.toString()]) {
                productInteractions[activity.productId._id.toString()] = {
                    product: activity.productId,
                    activities: []
                };
            }

            productInteractions[activity.productId._id.toString()].activities.push(activity);
        }
    });

    // Calculate time decay factor based on recency of activities
    const now = new Date();
    const calculateTimeDecay = (activityDate) => {
        const daysDiff = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));
        return Math.pow(config.recommendations.timeDecayFactor, daysDiff);
    };

    // Score each candidate product
    return candidateProducts.map(product => {
        let score = 0;
        let reason = 'popular_in_category';

        // Base score from product rating (0-1 scale)
        const ratingScore = product.rating / 5;
        score += ratingScore * 0.2;

        // Category preference boost
        if (preferredCategories.has(product.category)) {
            score += 0.2;
        }

        // Category interaction boost
        if (categoryActivityCounts[product.category]) {
            // Give more weight to purchases and cart additions
            const purchaseWeight = categoryActivityCounts[product.category].purchase * config.recommendations.activityWeights.purchase;
            const cartWeight = categoryActivityCounts[product.category].cart * config.recommendations.activityWeights.cart;
            const viewWeight = categoryActivityCounts[product.category].view * config.recommendations.activityWeights.view;
            const wishlistWeight = categoryActivityCounts[product.category].wishlist * config.recommendations.activityWeights.wishlist;
            const searchWeight = categoryActivityCounts[product.category].search * config.recommendations.activityWeights.search;

            const totalWeight = purchaseWeight + cartWeight + viewWeight + wishlistWeight + searchWeight;
            const categoryActivityScore = Math.min(totalWeight / 10, 0.5); // Cap at 0.5

            score += categoryActivityScore;

            // Determine reason based on highest activity weight
            if (purchaseWeight >= cartWeight && purchaseWeight >= viewWeight && purchaseWeight >= wishlistWeight && purchaseWeight >= searchWeight) {
                reason = 'similar_purchase';
            } else if (cartWeight >= viewWeight && cartWeight >= wishlistWeight && cartWeight >= searchWeight) {
                reason = 'frequently_bought_together';
            } else if (viewWeight >= wishlistWeight && viewWeight >= searchWeight) {
                reason = 'similar_view';
            } else if (wishlistWeight >= searchWeight) {
                reason = 'wishlist_recommendation';
            }
        }

        // Find similar products the user has interacted with
        let similarProductScore = 0;
        for (const [productId, interaction] of Object.entries(productInteractions)) {
            // Check if products share tags
            const interactedProduct = interaction.product;
            const sharedTags = interactedProduct.tags.filter(tag => product.tags.includes(tag));

            if (sharedTags.length > 0) {
                // Calculate similarity score based on shared tags and interaction types
                const tagSimilarity = sharedTags.length / Math.max(interactedProduct.tags.length, product.tags.length);

                // Apply time decay and activity weights to each interaction
                interaction.activities.forEach(activity => {
                    const timeDecay = calculateTimeDecay(activity.timestamp);
                    const activityWeight = config.recommendations.activityWeights[activity.activityType] || 0.1;
                    similarProductScore += tagSimilarity * activityWeight * timeDecay;
                });
            }
        }

        // Cap and add the similar product score
        score += Math.min(similarProductScore, 0.3);

        // If very high activity is trending in this category, boost the score
        if (categoryActivityCounts[product.category] && categoryActivityCounts[product.category].total > 10) {
            score += 0.1;
            reason = 'trending';
        }

        // Normalize score to 0-1 range
        score = Math.min(Math.max(score, 0), 1);

        return {
            productId: product._id,
            score,
            reason
        };
    }).sort((a, b) => b.score - a.score);
};


const getPopularRecommendations = async (userId, userPreferences = {}) => {
    try {
        const preferredCategories = userPreferences.categories || [];

        // Get popular products in preferred categories if available
        let products = [];

        if (preferredCategories.length > 0) {
            products = await Product.find({
                category: { $in: preferredCategories },
                inStock: true
            })
                .sort({ rating: -1 })
                .limit(config.recommendations.maxRecommendations);
        }

        // If not enough products from preferred categories, add overall popular products
        if (products.length < config.recommendations.maxRecommendations) {
            const additionalProducts = await Product.find({
                category: { $nin: preferredCategories },
                inStock: true
            })
                .sort({ rating: -1 })
                .limit(config.recommendations.maxRecommendations - products.length);

            products = [...products, ...additionalProducts];
        }

        // Score products based on rating and category preference
        return products.map(product => {
            let score = product.rating / 5; // Base score from rating

            // Boost score for preferred categories
            if (preferredCategories.includes(product.category)) {
                score += 0.2;
            }

            // Cap score at 1
            score = Math.min(score, 1);

            return {
                productId: product._id,
                score,
                reason: 'popular_in_category'
            };
        });
    } catch (error) {
        logger.error('Error getting popular recommendations:', error);
        throw error;
    }
};

module.exports = {
    generateRecommendations
};