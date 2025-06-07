const httpStatus = require('http-status');
const validator = require('validator');
const { Blog } = require('../models');
const ApiError = require('../utils/ApiError');
const XLSX = require('xlsx');

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
  const blogs = await Blog.paginate(filter, options);
  const populatedBlogs = await Blog.populate(blogs.results, { path: 'author' });
  return {
    ...blogs,
    results: populatedBlogs
  };
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
  if (updateBody.isPinned) {
    await Blog.changePinnedBlog(blogId);
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
  blog.isPinned = !blog.isPinned;
  await blog.save();
  return blog;
};

/**
 * Import blogs from a file
 * @param {Object} file
 * @param {ObjectId} authorId
 * @returns {Promise<Array<Object>>}
 */
const importBlogs = async (file, authorId) => {
  if (
    file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
    file.mimetype !== 'application/vnd.ms-excel'
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Excel files (.xlsx, .xls) are supported');
  }

  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const mainSheet = workbook.Sheets['Main Information'];
  const contentSheet = workbook.Sheets['Content Details'];
  const instructionSheet = workbook.Sheets['Instructions'];

  if (!mainSheet || !contentSheet || !instructionSheet) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Excel file must contain "Main Information", "Content Details", and "Instructions" sheets');
  }

  const mainData = XLSX.utils.sheet_to_json(mainSheet);
  const contentData = XLSX.utils.sheet_to_json(contentSheet);

  const blogGroups = {};

  mainData.forEach(row => {
    const blogTitle = row.title?.trim();
    if (!blogTitle) return;

    blogGroups[blogTitle] = {
      label: row.label?.trim(),
      title: blogTitle,
      description: row.description?.trim(),
      image: row.image_url?.trim(),
      image_title: row.image_title?.trim(),
      content: [{ intro: row.intro_content?.trim(), sections: [] }],
      author: authorId,
      isPinned: row.isPinned === 'true' || row.isPinned === true,
    };
  });

  contentData.forEach(row => {
    const blogTitle = row.blog_title?.trim();
    const sectionTitle = row.section_title?.trim();
    if (!blogTitle || !sectionTitle || !blogGroups[blogTitle]) return;

    const blog = blogGroups[blogTitle];
    let section = blog.content[0].sections.find(s => s.title === sectionTitle);

    if (!section) {
      section = { title: sectionTitle, paragraphs: [], listItems: [] };
      blog.content[0].sections.push(section);
    }

    if (row.paragraph?.trim()) {
      section.paragraphs.push(row.paragraph.trim());
    }
    if (row.list_item?.trim()) {
      section.listItems.push(row.list_item.trim());
    }
  });

  const blogs = Object.values(blogGroups);
  const results = [];

  for (const blog of blogs) {
    try {
      if (!blog.label || !blog.title || !blog.description || !blog.image || !blog.image_title || !blog.content[0].intro) {
        throw new Error('Missing required fields');
      }

      if (!validator.isURL(blog.image)) {
        throw new Error(`Invalid image URL for blog "${blog.title}"`);
      }

      if (blog.content[0].sections.length === 0) {
        throw new Error(`Blog "${blog.title}" must have at least one section`);
      }

      blog.content[0].sections.forEach(section => {
        if (!section.title) {
          throw new Error(`Section in blog "${blog.title}" must have a title`);
        }
        if (section.paragraphs.length === 0 && section.listItems.length === 0) {
          throw new Error(`Section "${section.title}" in blog "${blog.title}" must have at least one paragraph or list item`);
        }
      });

      if (await Blog.isTitleTaken(blog.title)) {
        throw new Error(`Blog title "${blog.title}" is already taken`);
      }

      const newBlog = await createBlog(blog);
      results.push({ success: true, blog: newBlog });
    } catch (err) {
      results.push({
        success: false,
        error: err.message,
        blog: { title: blog.title, label: blog.label, description: blog.description },
      });
    }
  }

  return results;
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
