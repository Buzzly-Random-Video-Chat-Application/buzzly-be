const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { livestreamService } = require('../services');
const MESSAGES = require('../constants/messages');

const createLivestream = catchAsync(async (req, res) => {
  const result = await livestreamService.createLivestream(req.body);
  res.status(httpStatus.CREATED).send({
    message: MESSAGES.LIVESTREAM.CREATE_SUCCESS,
    result,
  });
});

const queryLivestreams = catchAsync(async (req, res) => {
  const filter = req.query;
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  const { results, page, limit, totalPages, totalResults } = await livestreamService.queryLivestreams(filter, options);
  res.send({
    message: MESSAGES.LIVESTREAM.GET_STREAMS_SUCCESS,
    results,
    page,
    limit,
    totalPages,
    totalResults,
  });
});

const getLivestream = catchAsync(async (req, res) => {
  const result = await livestreamService.getLivestream(req.params.livestreamId);
  res.send({
    message: MESSAGES.LIVESTREAM.GET_STREAM_SUCCESS,
    result,
  });
});

const updateLivestream = catchAsync(async (req, res) => {
  const result = await livestreamService.updateLivestream(req.params.livestreamId, req.body);
  res.send({
    message: MESSAGES.LIVESTREAM.UPDATE_SUCCESS,
    result,
  });
});

const deleteLivestream = catchAsync(async (req, res) => {
  await livestreamService.deleteLivestream(req.params.livestreamId);
  res.status(httpStatus.OK).send({
    message: MESSAGES.LIVESTREAM.DELETE_SUCCESS,
  });
});

module.exports = {
  createLivestream,
  queryLivestreams,
  getLivestream,
  updateLivestream,
  deleteLivestream,
};
