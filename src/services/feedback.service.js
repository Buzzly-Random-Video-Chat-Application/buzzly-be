const httpStatus = require('http-status');
const { Feedback } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a feedback
 * @param {Object} feedbackBody
 * @returns {Promise<Feedback>}
 */
const createFeedback = async (feedbackBody) => {
  return Feedback.create(feedbackBody);
};

/**
 * Query for feedbacks
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryFeedbacks = async (filter, options) => {
  const sortBy = options.sortBy || 'createdAt:desc';
  const updatedOptions = { ...options, sortBy };
  const feedbacks = await Feedback.paginate(filter, updatedOptions);
  return feedbacks;
};

/**
 * Update feedback by ID
 * @param {ObjectId} feedbackId
 * @param {Object} updateBody
 * @returns {Promise<Feedback>}
 */
const updateFeedback = async (feedbackId, updateBody) => {
  const feedback = await getFeedback(feedbackId);
  if (!feedback) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feedback not found');
  }
  Object.assign(feedback, updateBody);
  await feedback.save();
  return feedback;
};

/**
 * Delete feedback by ID
 * @param {ObjectId} feedbackId
 * @returns {Promise<Feedback>}
 */
const deleteFeedback = async (feedbackId) => {
  const feedback = await getFeedback(feedbackId);
  if (!feedback) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feedback not found');
  }
  await feedback.deleteOne();
  return feedback;
};

/**
 * Get feedback by ID
 * @param {ObjectId} id
 * @returns {Promise<Feedback>}
 */
const getFeedback = async (id) => {
  const feedback = await Feedback.findById(id);
  return feedback;
};

module.exports = {
  createFeedback,
  queryFeedbacks,
  updateFeedback,
  deleteFeedback,
  getFeedback,
};
