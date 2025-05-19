const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');
const upload = require('../../config/multer');
const parseContent = require('../../middlewares/parseContent');
const router = express.Router();

router
  .route('/')
  .post(
    auth('manage'),
    upload.single('image'),
    parseContent,
    validate(blogValidation.createBlog),
    blogController.createBlog,
  )
  .get(validate(blogValidation.getBlogs), blogController.getBlogs);

router
  .route('/:blogId')
  .get(validate(blogValidation.getBlog), blogController.getBlog)
  .put(
    auth('manage'),
    upload.single('image'),
    parseContent,
    validate(blogValidation.updateBlog),
    blogController.updateBlog,
  )
  .delete(auth('manage'), validate(blogValidation.deleteBlog), blogController.deleteBlog);

router.route('/:blogId/pin').put(auth('manage'), validate(blogValidation.pinBlog), blogController.pinBlog);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: Blog management and retrieval
 */

/**
 * @swagger
 * /blogs:
 *   post:
 *     summary: Create a blog
 *     description: Authenticated users can create blogs. An image file is required.
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - title
 *               - description
 *               - image
 *               - image_title
 *               - content
 *             properties:
 *               label:
 *                 type: string
 *                 description: Blog category or tag
 *               title:
 *                 type: string
 *                 description: Blog title
 *               description:
 *                 type: string
 *                 description: Blog summary
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Blog image file
 *               image_title:
 *                 type: string
 *                 description: Title or alt text for the image
 *               content:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     intro:
 *                       type: string
 *                       description: Introduction text for the content block
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             description: Section title
 *                           paragraphs:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Array of paragraph texts for the section
 *                           listItems:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: List items for the section
 *                 description: Array of content blocks
 *               isPinned:
 *                 type: boolean
 *                 description: Whether the blog is pinned
 *             example:
 *               label: Friendly
 *               title: Social Interactions in 2025
 *               description: A blog about online social trends
 *               image: file
 *               image_title: Social Image
 *               content: |
 *                 [
 *                   {
 *                     "intro": "Video chats are popular in 2025.",
 *                     "sections": [
 *                       {
 *                         "title": "Video Platforms",
 *                         "paragraphs": ["Zoom and others dominate...", "Another paragraph."],
 *                         "listItems": ["Zoom", "Google Meet"]
 *                       }
 *                     ]
 *                   }
 *                 ]
 *               isPinned: false
 *     responses:
 *       "201":
 *         description: Blog created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Blog created successfully
 *                 blog:
 *                   $ref: '#/components/schemas/Blog'
 *       "400":
 *         description: Invalid input or title already taken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Blog title already taken
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all blogs
 *     description: Retrieve a paginated list of blogs.
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: label
 *         schema:
 *           type: string
 *         description: Filter by blog label
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by blog title
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author ID
 *       - in: query
 *         name: isPinned
 *         schema:
 *           type: boolean
 *         description: Filter by pinned status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field (e.g., createdAt:desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of blogs per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Current page number
 *     responses:
 *       "200":
 *         description: Blogs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Blogs retrieved successfully
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /blogs/{blogId}:
 *   get:
 *     summary: Get blog by ID
 *     description: Retrieve a single blog by its ID.
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       "200":
 *         description: Blog retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Blog retrieved successfully
 *                 blog:
 *                   $ref: '#/components/schemas/Blog'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Blog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Blog not found
 *
 *   put:
 *     summary: Update blog
 *     description: Only the blog's author or admins can update a blog. Image is optional.
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 description: Blog category or tag
 *               title:
 *                 type: string
 *                 description: Blog title
 *               description:
 *                 type: string
 *                 description: Blog summary
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Blog image file (optional)
 *               image_title:
 *                 type: string
 *                 description: Title or alt text for the image
 *               content:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     intro:
 *                       type: string
 *                       description: Introduction text for the content block
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             description: Section title
 *                           paragraphs:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Array of paragraph texts for the section
 *                           listItems:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: List items for the section
 *                 description: Array of content blocks
 *               isPinned:
 *                 type: boolean
 *                 description: Whether the blog is pinned
 *             example:
 *               title: Updated Social Interactions
 *               content: |
 *                 [
 *                   {
 *                     "intro": "Updated intro.",
 *                     "sections": [
 *                       {
 *                         "title": "Updated Video Platforms",
 *                         "paragraphs": ["Updated Zoom description.", "Another updated paragraph."],
 *                         "listItems": ["Zoom", "Google Meet"]
 *                       }
 *                     ]
 *                   }
 *                 ]
 *               isPinned: true
 *     responses:
 *       "200":
 *         description: Blog updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Blog updated successfully
 *                 blog:
 *                   $ref: '#/components/schemas/Blog'
 *       "400":
 *         description: Invalid input or title already taken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Blog title already taken
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Blog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Blog not found
 *
 *   delete:
 *     summary: Delete blog
 *     description: Only the blog's author or admins can delete a blog (soft delete).
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       "204":
 *         description: Blog deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Blog deleted successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Blog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Blog not found
 */

/**
 * @swagger
 * /blogs/{blogId}/pin:
 *   put:
 *     summary: Pin a blog
 *     description: Only the blog's author or admins can pin a blog. Only one blog can be pinned at a time.
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       "200":
 *         description: Blog pinned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Blog pinned successfully
 *                 blog:
 *                   $ref: '#/components/schemas/Blog'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Blog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Blog not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Blog ID
 *         label:
 *           type: string
 *           description: Blog category or tag
 *         title:
 *           type: string
 *           description: Blog title
 *         description:
 *           type: string
 *           description: Blog summary
 *         image:
 *           type: string
 *           description: URL of the blog image
 *         image_title:
 *           type: string
 *           description: Title or alt text for the image
 *         content:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               intro:
 *                 type: string
 *                 description: Introduction text for the content block
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       description: Section title
 *                     paragraphs:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of paragraph texts for the section
 *                     listItems:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List items for the section
 *           description: Array of content blocks
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *           description: Author details
 *         isPinned:
 *           type: boolean
 *           description: Whether the blog is pinned
 *         deleteAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date of soft deletion, null if not deleted
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *       example:
 *         id: "507f1f77bcf86cd799439011"
 *         label: Friendly
 *         title: Social Interactions in 2025
 *         description: A blog about online social trends
 *         image: https://res.cloudinary.com/example/image/upload/blog_image.jpg
 *         image_title: Social Image
 *         content:
 *           - intro: Video chats are popular in 2025.
 *             sections:
 *               - title: Video Platforms
 *                 paragraphs: ["Zoom and others dominate...", "Another paragraph."]
 *                 listItems: ["Zoom", "Google Meet"]
 *         author:
 *           id: "507f1f77bcf86cd799439012"
 *           name: John Doe
 *           email: john.doe@example.com
 *         isPinned: false
 *         deleteAt: null
 *         createdAt: 2025-04-26T10:00:00.000Z
 *         updatedAt: 2025-04-26T10:00:00.000Z
 */
