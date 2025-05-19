const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { reviewService } = require('../services');
const MESSAGES = require('../constants/messages');

const createReview = catchAsync(async (req, res) => {
  const result = await reviewService.createReview(req.body);
  res.status(httpStatus.CREATED).send({
    message: MESSAGES.REVIEW.CREATE_SUCCESS,
    result,
  });
});

const queryReviews = catchAsync(async (req, res) => {
  const filter = req.query;
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  const { results, page, limit, totalPages, totalResults } = await reviewService.queryReviews(filter, options);
  res.send({
    message: MESSAGES.REVIEW.GET_REVIEWS_SUCCESS,
    results,
    page,
    limit,
    totalPages,
    totalResults,
  });
});

const updateReview = catchAsync(async (req, res) => {
  const result = await reviewService.updateReview(req.params.reviewId, req.body);
  res.send({
    message: MESSAGES.REVIEW.UPDATE_SUCCESS,
    result,
  });
});

const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.params.reviewId);
  res.status(httpStatus.NO_CONTENT).send({
    message: MESSAGES.REVIEW.DELETE_SUCCESS,
  });
});

const getAppRating = catchAsync(async (req, res) => {
  const { average, belowAverage, excellent, good, poor, rating, reviewCount } = await reviewService.getAppRating();
  res.send({
    message: MESSAGES.REVIEW.APP_RATING_SUCCESS,
    average,
    belowAverage,
    excellent,
    good,
    poor,
    rating,
    reviewCount,
  });
});

module.exports = {
  createReview,
  queryReviews,
  updateReview,
  deleteReview,
  getAppRating,
};
