const httpStatus = require('http-status');
const { Import } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a import
 * @param {Object} importBody
 * @returns {Promise<Import>}
 */
const createImport = async (importBody) => {
  if (await Import.isFileNameTaken(importBody.fileName)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'File name already taken');
  }
  return Import.create(importBody);
};

/**
 * Query for imports
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryImports = async (filter, options) => {
  const imports = await Import.paginate(filter, options);
  const populatedImports = await Import.populate(imports.results, { path: 'author' });
  return {
    ...imports,
    results: populatedImports,
  };
};

/**
 * Get import by importId
 * @param {ObjectId} importId
 * @returns {Promise<Import>}
 */
const getImport = async (importId) => {
  const importModel = await Import.findById(importId);
  if (!importModel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Import not found');
  }
  return importModel;
};

/**
 * Delete import by importId
 * @param {ObjectId} importId
 * @returns {Promise<Import>}
 */
const deleteImport = async (importId) => {
  await Import.findByIdAndDelete(importId);
};

module.exports = {
  createImport,
  queryImports,
  deleteImport,
  getImport,
};