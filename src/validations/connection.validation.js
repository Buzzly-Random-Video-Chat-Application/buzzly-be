const Joi = require('joi');
const { uuid } = require('./custom.validation');

const createConnection = {
  body: Joi.object().keys({
    roomId: Joi.string().required(),
    p1UserId: Joi.string().required(),
    p2UserId: Joi.string().required(),
  }),
};

const queryConnections = {
    query: Joi.object().keys({
        isLive: Joi.boolean(),
        sortBy: Joi.string().optional(),
        limit: Joi.number().integer().optional(),
        page: Joi.number().integer().optional(),
    }),
};

const getConnection = {
    params: Joi.object().keys({
        roomId: Joi.string().custom(uuid).required(),
    }),
};

const updateConnection = {
    params: Joi.object().keys({
        roomId: Joi.string().custom(uuid).required(),
    }),
    body: Joi.object().keys({
        roomId: Joi.string().custom(uuid).optional(),
        p1UserId: Joi.string().optional(),
        p2UserId: Joi.string().optional(),
        isLive: Joi.boolean().optional(),
    }),
};

const deleteConnection = {
    params: Joi.object().keys({
        roomId: Joi.string().custom(uuid).required(),
    }),
};

module.exports = {
    createConnection,
    queryConnections,
    getConnection,
    updateConnection,
    deleteConnection,
}