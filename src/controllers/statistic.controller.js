const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { statisticService } = require('../services');
const MESSAGES = require('../constants/messages');

const getUserStatistics = catchAsync(async (req, res) => {
  const results = await statisticService.getUserStatistics();
  res.status(httpStatus.OK).send({
    message: MESSAGES.STATISTIC.GET_USER_STATISTICS_SUCCESS,
    results,
  });
});

const getConnectionStatistics = catchAsync(async (req, res) => {
  const results = await statisticService.getConnectionStatistics();
  res.status(httpStatus.OK).send({
    message: MESSAGES.STATISTIC.GET_CONNECTION_STATISTICS_SUCCESS,
    results,
  });
});

const getWeeklyConnectionStatistics = catchAsync(async (req, res) => {
  const results = await statisticService.getWeeklyConnectionStatistics();
  res.status(httpStatus.OK).send({
    message: MESSAGES.STATISTIC.GET_WEEKLY_CONNECTION_STATISTICS_SUCCESS,
    results,
  });
});

const getReviewStatistics = catchAsync(async (req, res) => {
  const results = await statisticService.getReviewStatistics();
  res.status(httpStatus.OK).send({
    message: MESSAGES.STATISTIC.GET_REVIEW_STATISTICS_SUCCESS,
    results,
  });
});

module.exports = {
  getUserStatistics,
  getConnectionStatistics,
  getWeeklyConnectionStatistics,
  getReviewStatistics,
};
