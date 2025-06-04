const httpStatus = require('http-status');
const { Connection } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a connection
 * @param {Object} connectionBody
 * @returns {Promise<Connection>}
 */
const createConnection = async (connectionBody) => {
  return Connection.create(connectionBody);
};

/**
 * Query for connections
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryConnections = async (filter, options) => {
  const connections = await Connection.paginate(filter, options);
  return connections;
};

/**
 * Get connection by roomId
 * @param {String} roomId
 * @returns {Promise<Connection>}
 */
const getConnection = async (roomId) => {
  const connection = await Connection.findOne({ roomId });
  if (!connection) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Connection not found');
  }
  return connection;
};

/**
 * Update connection by roomId
 * @param {String} roomId
 * @param {Object} updateBody
 * @returns {Promise<Connection>}
 */
const updateConnection = async (roomId, updateBody) => {
  const connection = await getConnection(roomId);
  Object.assign(connection, updateBody);
  await connection.save();
  return connection;
};

/**
 * Delete connection by roomId
 * @param {String} roomId
 * @returns {Promise<Connection>}
 */
const deleteConnection = async (roomId) => {
  const connection = await getConnection(roomId);
  await connection.deleteOne();
  return connection;
};

module.exports = {
  createConnection,
  queryConnections,
  getConnection,
  updateConnection,
  deleteConnection,
};
