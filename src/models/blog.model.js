const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const blogSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error('Invalid image URL');
        }
      },
    },
    image_title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: [
        {
          intro: {
            type: String,
            required: true,
            trim: true,
          },
          sections: {
            type: [
              {
                title: {
                  type: String,
                  required: true,
                  trim: true,
                },
                paragraphs: {
                  type: [String],
                  required: true,
                  default: [],
                  validate(value) {
                    if (value.length > 50) {
                      throw new Error('Paragraphs cannot exceed 50 items');
                    }
                  },
                },
                listItems: {
                  type: [String],
                  default: [],
                  validate(value) {
                    if (value.length > 20) {
                      throw new Error('List items cannot exceed 20 items');
                    }
                  },
                },
                _id: false, // Disable _id for sections
              },
            ],
            default: [],
            validate(value) {
              if (value.length > 50) {
                throw new Error('Sections cannot exceed 50 per content block');
              }
            },
          },
          _id: false, // Disable _id for content blocks
        },
      ],
      default: [],
      validate(value) {
        if (value.length > 10) {
          throw new Error('Content blocks cannot exceed 10 per blog');
        }
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    deleteAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

blogSchema.plugin(toJSON);
blogSchema.plugin(paginate);

/**
 * Check if blog title is taken
 * @param {string} title - The blog's title
 * @param {ObjectId} [excludeBlogId] - The id of the blog to be excluded
 * @returns {Promise<boolean>}
 */
blogSchema.statics.isTitleTaken = async function (title, excludeBlogId) {
  const blog = await this.findOne({ title, _id: { $ne: excludeBlogId } });
  return !!blog;
};

/**
 * Pin new blog and unpin old pinned blogs
 * @param {ObjectId} blogId - The id of the blog to be pinned
 * @returns {Promise<Blog>}
 */
blogSchema.statics.changePinnedBlog = async function (blogId) {
  const blog = await this.findById(blogId);
  if (!blog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
  }
  const oldPinnedBlog = await this.findOne({ isPinned: true });
  if (oldPinnedBlog) {
    oldPinnedBlog.isPinned = false;
    await oldPinnedBlog.save();
  }
  blog.isPinned = true;
  await blog.save();
  return blog;
};

/**
 * @typedef Blog
 */
const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
