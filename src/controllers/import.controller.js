const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { importService } = require('../services');
const MESSAGES = require('../constants/messages');
const pick = require('../utils/pick');

/**
 * Create a import
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Import>}
 */
const createImport = catchAsync(async (req, res) => {
  const result = await importService.createImport({
    ...req.body,
    author: req.user._id,
  });
  res.status(httpStatus.CREATED).send({
    message: MESSAGES.IMPORT.CREATE_SUCCESS,
    result,
  });
});

/**
 * Query for imports
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<QueryResult>}
 */
const queryImports = catchAsync(async (req, res) => {
  const filter = {};
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const { results, page, limit, totalPages, totalResults } = await importService.queryImports(filter, options);
  res.send({
    message: MESSAGES.IMPORT.GET_IMPORTS_SUCCESS,
    results,
    page,
    limit,
    totalPages,
    totalResults,
  });
});

const getImport = catchAsync(async (req, res) => {
  const result = await importService.getImport(req.params.importId);
  res.send({
    message: MESSAGES.IMPORT.GET_IMPORT_SUCCESS,
    result,
  });
});

const deleteImport = catchAsync(async (req, res) => {
  await importService.deleteImport(req.params.importId);
  res.send({
    message: MESSAGES.IMPORT.DELETE_SUCCESS,
  });
});

module.exports = {
  createImport,
  queryImports,
  getImport,
  deleteImport,
};