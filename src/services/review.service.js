const httpStatus = require('http-status');
const { Review } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a review
 * @param {Object} reviewBody
 * @returns {Promise<Review>}
 */
const createReview = async (reviewBody) => {
  return Review.create(reviewBody);
};

/**
 * Query for reviews
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryReviews = async (filter, options) => {
  const reviews = await Review.paginate(filter, options);
  return reviews;
};

/**
 * Update review by ID
 * @param {ObjectId} reviewId
 * @param {Object} updateBody
 * @returns {Promise<Review>}
 */
const updateReview = async (reviewId, updateBody) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }
  Object.assign(review, updateBody);
  await review.save();
  return review;
};

/**
 * Delete review by ID
 * @param {ObjectId} reviewId
 * @returns {Promise<Review>}
 */
const deleteReview = async (reviewId) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }
  await review.remove();
  return review;
};

/**
 * Get app rating statistics
 * @returns {Promise<Object>}
 */
const getAppRating = async () => {
  const result = await Review.aggregate([
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
        excellent: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        good: { $sum: { $cond: [{ $and: [{ $gte: ['$rating', 4] }, { $lt: ['$rating', 5] }] }, 1, 0] } },
        average: { $sum: { $cond: [{ $and: [{ $gte: ['$rating', 3] }, { $lt: ['$rating', 4] }] }, 1, 0] } },
        belowAverage: { $sum: { $cond: [{ $and: [{ $gte: ['$rating', 2] }, { $lt: ['$rating', 3] }] }, 1, 0] } },
        poor: { $sum: { $cond: [{ $and: [{ $gte: ['$rating', 1] }, { $lt: ['$rating', 2] }] }, 1, 0] } },
      },
    },
  ]);

  const stats = result[0] || {};
  const totalReviews = stats.reviewCount || 0;

  if (totalReviews === 0) {
    return {
      rating: 0,
      reviewCount: 0,
      excellent: 0,
      good: 0,
      average: 0,
      belowAverage: 0,
      poor: 0,
    };
  }

  return {
    rating: stats.averageRating ? parseFloat(stats.averageRating.toFixed(2)) : 0,
    reviewCount: totalReviews,
    excellent: (stats.excellent / totalReviews) * 100,
    good: (stats.good / totalReviews) * 100,
    average: (stats.average / totalReviews) * 100,
    belowAverage: (stats.belowAverage / totalReviews) * 100,
    poor: (stats.poor / totalReviews) * 100,
  };
};

module.exports = {
  createReview,
  queryReviews,
  updateReview,
  deleteReview,
  getAppRating,
};
