const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createLivestream = {
  body: Joi.object().keys({
    livestreamName: Joi.string().required().trim(),
    livestreamGreeting: Joi.string().allow('').required().trim(),
    livestreamAnnouncement: Joi.string().allow('').required().trim(),
    host: Joi.object()
      .keys({
        userId: Joi.string().custom(objectId).required(),
        socketId: Joi.string().required(),
      })
      .required(),
  }),
};

const queryLivestreams = {
  query: Joi.object().keys({
    isLive: Joi.boolean().optional(),

    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const getLivestream = {
  params: Joi.object().keys({
    livestreamId: Joi.string().custom(objectId).required(),
  }),
};

const updateLivestream = {
  params: Joi.object().keys({
    livestreamId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      livestreamName: Joi.string().optional().trim(),
      livestreamGreeting: Joi.string().allow('').optional().trim(),
      livestreamAnnouncement: Joi.string().allow('').optional().trim(),
      isLive: Joi.boolean().optional(),
    })
    .min(1),
};

const deleteLivestream = {
  params: Joi.object().keys({
    livestreamId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createLivestream,
  queryLivestreams,
  getLivestream,
  updateLivestream,
  deleteLivestream,
};
