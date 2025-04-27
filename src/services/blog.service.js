const httpStatus = require('http-status');
const { Blog } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a blog
 * @param {Object} blogBody
 * @returns {Promise<Blog>}
 */
const createBlog = async (blogBody) => {
  if (await Blog.isTitleTaken(blogBody.title)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Blog title already taken');
  }
  return Blog.create(blogBody);
};

/**
 * Query for blogs
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const getBlogs = async (filter, options) => {
  const defaultSort = options.sortBy || 'createdAt:desc';
  const updatedOptions = { ...options, sortBy: defaultSort, populate: 'author' };
  const finalFilter = { ...filter, deleteAt: null }; // Exclude soft-deleted blogs
  const blogs = await Blog.paginate(finalFilter, updatedOptions);
  return blogs;
};

/**
 * Get blog by ID
 * @param {ObjectId} blogId
 * @returns {Promise<Blog>}
 */
const getBlog = async (blogId) => {
  const blog = await Blog.findById(blogId).populate('author');
  if (!blog || blog.deleteAt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
  }
  return blog;
};

/**
 * Update blog by ID
 * @param {ObjectId} blogId
 * @param {Object} updateBody
 * @returns {Promise<Blog>}
 */
const updateBlog = async (blogId, updateBody) => {
  const blog = await Blog.findById(blogId);
  if (!blog || blog.deleteAt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
  }
  if (updateBody.title && (await Blog.isTitleTaken(updateBody.title, blogId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Blog title already taken');
  }
  Object.assign(blog, updateBody);
  await blog.save();
  return blog.populate('author');
};

/**
 * Delete blog by ID (soft delete)
 * @param {ObjectId} blogId
 * @returns {Promise<Blog>}
 */
const deleteBlog = async (blogId) => {
  const blog = await Blog.findById(blogId);
  if (!blog || blog.deleteAt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
  }
  blog.deleteAt = new Date();
  await blog.save();
  return blog;
};

/**
 * Pin blog by ID
 * @param {ObjectId} blogId
 * @returns {Promise<Blog>}
 */
const pinBlog = async (blogId) => {
  const blog = await Blog.findById(blogId);
  if (!blog || blog.deleteAt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
  }
  const currentPinnedBlog = await Blog.findOne({ isPinned: true });
  if (currentPinnedBlog) {
    currentPinnedBlog.isPinned = false;
    await currentPinnedBlog.save();
  }
  blog.isPinned = true;
  await blog.save();
  return blog.populate('author');
};

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  pinBlog,
};