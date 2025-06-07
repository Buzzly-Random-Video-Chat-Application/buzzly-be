const Joi = require('joi');
const { objectId } = require('./custom.validation');

const blogContentSectionSchema = Joi.object().keys({
  title: Joi.string().required().trim(),
  paragraphs: Joi.array().items(Joi.string().trim()).required().max(50).min(1).default([]),
  listItems: Joi.array().items(Joi.string().trim()).max(20).default([]),
});

const blogContentSchema = Joi.object().keys({
  intro: Joi.string().required().trim(),
  sections: Joi.array().items(blogContentSectionSchema).max(50).default([]),
});

const createBlog = {
  body: Joi.object().keys({
    label: Joi.string().required().trim(),
    title: Joi.string().required().trim(),
    description: Joi.string().required().trim(),
    image_title: Joi.string().required().trim(),
    content: Joi.alternatives()
      .try(Joi.array().items(blogContentSchema).max(10).min(1), blogContentSchema)
      .custom((value) => {
        if (!Array.isArray(value)) {
          return [value];
        }
        return value;
      }, 'Wrap single content object in array')
      .required(),
    isPinned: Joi.boolean().required().default(false),
  }),
};

const getBlogs = {
  query: Joi.object().keys({
    isPinned: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId).required(),
  }),
};

const updateBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      label: Joi.string().trim(),
      title: Joi.string().trim(),
      description: Joi.string().trim(),
      image_title: Joi.string().trim(),
      content: Joi.array().items(blogContentSchema).max(10).min(1).default([]),
      isPinned: Joi.boolean(),
    })
    .min(1),
};

const deleteBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId).required(),
  }),
};

const pinBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId).required(),
  }),
};

const importBlogs = {
  body: Joi.object().keys({}),
};

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  pinBlog,
  importBlogs,
};
