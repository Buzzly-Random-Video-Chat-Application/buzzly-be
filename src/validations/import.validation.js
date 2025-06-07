const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createImport = {
  body: Joi.object().keys({
    fileName: Joi.string().required(),
    fileUrl: Joi.string().required(),
    entryDate: Joi.date().required(),
  }),
};

const queryImports = {
  query: Joi.object().keys({
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const getImport = {
  params: Joi.object().keys({
    importId: Joi.string().custom(objectId).required(),
  }),
};

const deleteImport = {
  params: Joi.object().keys({
    importId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createImport,
  queryImports,
  getImport,
  deleteImport,
};