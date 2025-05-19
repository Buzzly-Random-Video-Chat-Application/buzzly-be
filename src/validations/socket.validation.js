const Joi = require('joi');

const socket = {
  query: Joi.object().keys({}),
};

module.exports = {
  socket,
};
