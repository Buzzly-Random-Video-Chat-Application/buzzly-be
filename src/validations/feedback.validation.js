const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createFeedback = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    userId: Joi.string().custom(objectId).required(),
  }),
};
const queryFeedbacks = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};
const updateFeedback = {
  params: Joi.object().keys({
    feedbackId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({ 
        isProcessed: Joi.boolean(),
    })
    .min(1),
};
const deleteFeedback = {
  params: Joi.object().keys({
    feedbackId: Joi.string().custom(objectId).required(),
  }),
};
const getFeedback = {
  params: Joi.object().keys({
    feedbackId: Joi.string().custom(objectId).required(),
  }),
};
module.exports = {
  createFeedback,
  queryFeedbacks,
  updateFeedback,
  deleteFeedback,
  getFeedback,
};