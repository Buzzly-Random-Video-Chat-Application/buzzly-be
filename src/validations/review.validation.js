const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createReview = {
  body: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
    rating: Joi.number().min(0).max(5).required(),
    review: Joi.string().optional(),
  }),
};

const queryReviews = {
  query: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      rating: Joi.number().min(0).max(5),
      review: Joi.string(),
    })
    .min(1),
};

const deleteReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createReview,
  queryReviews,
  updateReview,
  deleteReview,
};