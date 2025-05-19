const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { blogService } = require('../services');
const cloudinary = require('../config/cloudinary');
const MESSAGES = require('../constants/messages');

const createBlog = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image file is required');
  }
  const image = await cloudinary.uploadImage(req.file.buffer);
  const result = await blogService.createBlog({
    ...req.body,
    author: req.user._id,
    image: image.secure_url,
  });
  res.status(httpStatus.CREATED).send({
    message: MESSAGES.BLOG.CREATE_SUCCESS,
    result,
  });
});

const getBlogs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['label', 'title', 'author', 'isPinned']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const { results, page, limit, totalPages, totalResults } = await blogService.getBlogs(filter, options);
  res.send({
    message: MESSAGES.BLOG.GET_BLOGS_SUCCESS,
    results,
    page,
    limit,
    totalPages,
    totalResults,
  });
});

const getBlog = catchAsync(async (req, res) => {
  const result = await blogService.getBlog(req.params.blogId);
  res.send({
    message: MESSAGES.BLOG.GET_BLOG_SUCCESS,
    result,
  });
});

const updateBlog = catchAsync(async (req, res) => {
  if (req.file) {
    const image = await cloudinary.uploadImage(req.file.buffer);
    req.body.image = image.secure_url;
  }
  const result = await blogService.updateBlog(req.params.blogId, req.body);
  res.send({
    message: MESSAGES.BLOG.UPDATE_SUCCESS,
    result,
  });
});

const deleteBlog = catchAsync(async (req, res) => {
  await blogService.deleteBlog(req.params.blogId);
  res.status(httpStatus.NO_CONTENT).send({
    message: MESSAGES.BLOG.DELETE_SUCCESS,
  });
});

const pinBlog = catchAsync(async (req, res) => {
  const result = await blogService.pinBlog(req.params.blogId);
  res.send({
    message: MESSAGES.BLOG.PIN_SUCCESS,
    result,
  });
});

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  pinBlog,
};
