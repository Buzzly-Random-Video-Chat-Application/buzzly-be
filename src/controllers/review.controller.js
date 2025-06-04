const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { reviewService } = require('../services');
const MESSAGES = require('../constants/messages');
const pick = require('../utils/pick');

const createReview = catchAsync(async (req, res) => {
  const result = await reviewService.createReview(req.body);
  res.status(httpStatus.CREATED).send({
    message: MESSAGES.REVIEW.CREATE_SUCCESS,
    result,
  });
});

const queryReviews = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['rating']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
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
