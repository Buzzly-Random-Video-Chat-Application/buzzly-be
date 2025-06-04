const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { connectionService } = require('../services');
const MESSAGES = require('../constants/messages');
const pick = require('../utils/pick');

const createConnection = catchAsync(async (req, res) => {
  const result = await connectionService.createConnection(req.body);
  res.status(httpStatus.CREATED).send({
    message: MESSAGES.CONNECTION.CREATE_SUCCESS,
    result,
  });
});

const queryConnections = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['isLive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const { results, page, limit, totalPages, totalResults } = await connectionService.queryConnections(filter, options);
  res.send({
    message: MESSAGES.CONNECTION.GET_CONNECTIONS_SUCCESS,
    results,
    page,
    limit,
    totalPages,
    totalResults,
  });
});

const getConnection = catchAsync(async (req, res) => {
  const result = await connectionService.getConnection(req.params.roomId);
  res.send({
    message: MESSAGES.CONNECTION.GET_CONNECTION_SUCCESS,
    result,
  });
});

const updateConnection = catchAsync(async (req, res) => {
  const result = await connectionService.updateConnection(req.params.roomId, req.body);
  res.send({
    message: MESSAGES.CONNECTION.UPDATE_SUCCESS,
    result,
  });
});

const deleteConnection = catchAsync(async (req, res) => {
  await connectionService.deleteConnection(req.params.roomId);
  res.status(httpStatus.OK).send({
    message: MESSAGES.CONNECTION.DELETE_SUCCESS,
  });
});

module.exports = {
  createConnection,
  queryConnections,
  getConnection,
  updateConnection,
  deleteConnection,
};