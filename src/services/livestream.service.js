const httpStatus = require('http-status');
const { Livestream } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a livestream
 * @param {Object} livestreamBody
 * @returns {Promise<Livestream>}
 */
const createLivestream = async (livestreamBody) => {
  return Livestream.create(livestreamBody);
};

/**
 * Query for livestreams
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryLivestreams = async (filter, options) => {
  const sortBy = options.sortBy || 'createdAt:desc';
  const updatedOptions = { ...options, sortBy };
  const livestreams = await Livestream.paginate(filter, updatedOptions);
  return livestreams;
};

/**
 * Get livestream by livestreamId
 * @param {ObjectId} livestreamId
 * @returns {Promise<Livestream>}
 */
const getLivestream = async (livestreamId) => {
  const livestream = await Livestream.findById(livestreamId);
  if (!livestream) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livestream not found');
  }
  return livestream;
};

/**
 * Update livestream by livestreamId
 * @param {ObjectId} livestreamId
 * @param {Object} updateBody
 * @returns {Promise<Livestream>}
 */
const updateLivestream = async (livestreamId, updateBody) => {
  const livestream = await getLivestream(livestreamId);
  Object.assign(livestream, updateBody);
  await livestream.save();
  return livestream;
};

/**
 * Delete livestream by livestreamId
 * @param {ObjectId} livestreamId
 * @returns {Promise<Livestream>}
 */
const deleteLivestream = async (livestreamId) => {
  const livestream = await getLivestream(livestreamId);
  await livestream.deleteOne();
  return livestream;
};

/**
 * Get all active livestreams
 * @param {Object} options
 * @param {string} [options.excludeId] - Livestream ID to exclude from the results
 * @returns {Promise<Livestream[]>}
 */
async function getActiveLivestreams({ excludeId }) {
  const query = { isLive: true };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return await Livestream.find(query);
}

module.exports = {
  createLivestream,
  queryLivestreams,
  getLivestream,
  updateLivestream,
  deleteLivestream,
  getActiveLivestreams,
};
