const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { statisticService } = require('../services');
const MESSAGES = require('../constants/messages');

const getUserStatistics = catchAsync(async (req, res) => {
  const results = await statisticService.getUserStatistics();

  if (!results) {
    res.status(httpStatus.NOT_FOUND).send({
      message: MESSAGES.STATISTIC.GET_USER_STATISTICS_FAILED,
    });
    throw new ApiError(httpStatus.NOT_FOUND, MESSAGES.STATISTIC.GET_USER_STATISTICS_FAILED);
  }
  
  res.status(httpStatus.OK).send({
    message: MESSAGES.STATISTIC.GET_USER_STATISTICS_SUCCESS,
    results,
  });
});

const getConnectionStatistics = catchAsync(async (req, res) => {
  const results = await statisticService.getConnectionStatistics();

  if (!results) {
    res.status(httpStatus.NOT_FOUND).send({
      message: MESSAGES.STATISTIC.GET_CONNECTION_STATISTICS_FAILED,
    });
    throw new ApiError(httpStatus.NOT_FOUND, MESSAGES.STATISTIC.GET_CONNECTION_STATISTICS_FAILED);
  }

  res.status(httpStatus.OK).send({
    message: MESSAGES.STATISTIC.GET_CONNECTION_STATISTICS_SUCCESS,
    results,
  });
});

const getWeeklyConnectionStatistics = catchAsync(async (req, res) => {
  const results = await statisticService.getWeeklyConnectionStatistics();

  if (!results) {
    res.status(httpStatus.NOT_FOUND).send({
      message: MESSAGES.STATISTIC.GET_WEEKLY_CONNECTION_STATISTICS_FAILED,
    });
    throw new ApiError(httpStatus.NOT_FOUND, MESSAGES.STATISTIC.GET_WEEKLY_CONNECTION_STATISTICS_FAILED);
  }

  res.status(httpStatus.OK).send({
    message: MESSAGES.STATISTIC.GET_WEEKLY_CONNECTION_STATISTICS_SUCCESS,
    results,
  });
});

const getReviewStatistics = catchAsync(async (req, res) => {
  const results = await statisticService.getReviewStatistics();

  if (!results) {
    res.status(httpStatus.NOT_FOUND).send({
      message: MESSAGES.STATISTIC.GET_REVIEW_STATISTICS_FAILED,
    });
    throw new ApiError(httpStatus.NOT_FOUND, MESSAGES.STATISTIC.GET_REVIEW_STATISTICS_FAILED);
  }

  res.status(httpStatus.OK).send({
    message: MESSAGES.STATISTIC.GET_REVIEW_STATISTICS_SUCCESS,
    results,
  });
});

const getLivestreamStatistics = catchAsync(async (req, res) => {
  const results = await statisticService.getLivestreamStatistics();

  if (!results) {
    res.status(httpStatus.NOT_FOUND).send({
      message: MESSAGES.STATISTIC.GET_LIVESTREAM_STATISTICS_FAILED,
    });
    throw new ApiError(httpStatus.NOT_FOUND, MESSAGES.STATISTIC.GET_LIVESTREAM_STATISTICS_FAILED);
  }

  res.status(httpStatus.OK).send({
    message: MESSAGES.STATISTIC.GET_LIVESTREAM_STATISTICS_SUCCESS,
    results,
  });
});

module.exports = {
  getUserStatistics,
  getConnectionStatistics,
  getWeeklyConnectionStatistics,
  getReviewStatistics,
  getLivestreamStatistics,
};
