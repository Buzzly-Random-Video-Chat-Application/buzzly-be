const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { reviewService } = require('../services');

const createReview = catchAsync(async (req, res) => {
  const review = await reviewService.createReview(req.body);
  res.status(httpStatus.CREATED).send(review);
});

const queryReviews = catchAsync(async (req, res) => {
  const filter = req.query;
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  const result = await reviewService.queryReviews(filter, options);
  res.send(result);
});

const updateReview = catchAsync(async (req, res) => {
  const review = await reviewService.updateReview(req.params.reviewId, req.body);
  res.send(review);
});

const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.params.reviewId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getAppRating = catchAsync(async (req, res) => {
  const appRating = await reviewService.getAppRating();
  res.send(appRating);
});

module.exports = {
  createReview,
  queryReviews,
  updateReview,
  deleteReview,
  getAppRating,
};