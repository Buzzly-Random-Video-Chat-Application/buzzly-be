const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { feedbackValidation } = require('../../validations');
const { feedbackController } = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(validate(feedbackValidation.createFeedback), feedbackController.createFeedback)
  .get(auth('manage'), validate(feedbackValidation.queryFeedbacks), feedbackController.queryFeedbacks);

router
  .route('/:feedbackId')
  .patch(auth('manage'), validate(feedbackValidation.updateFeedback), feedbackController.updateFeedback)
  .delete(auth('manage'), validate(feedbackValidation.deleteFeedback), feedbackController.deleteFeedback)
  .get(auth('manage'), validate(feedbackValidation.getFeedback), feedbackController.getFeedback);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Feedbacks
 *   description: Feedback management and retrieval
 */

/**
 * @swagger
 * /feedbacks:
 *   post:
 *     summary: Create a feedback
 *     description: Create a new feedback. Requires authentication and create permission.
 *     tags: [Feedbacks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - title
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the user submitting the feedback
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user submitting the feedback
 *               title:
 *                 type: string
 *                 description: Title of the feedback
 *               message:
 *                 type: string
 *                 description: Content of the feedback
 *             example:
 *               name: John Doe
 *               email: john.doe@example.com
 *               title: App Improvement Suggestion
 *               message: I think adding a dark mode would be great!
 *     responses:
 *       "201":
 *         description: Feedback created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feedback created successfully
 *                 feedback:
 *                   $ref: '#/components/schemas/Feedback'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all feedbacks
 *     description: Retrieve a paginated list of feedbacks. Requires authentication and manage permission.
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isProcessed
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field (e.g., name:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Current page number
 *     responses:
 *       "200":
 *         description: Feedbacks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feedbacks retrieved successfully
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *               example:
 *                 message: Feedbacks retrieved successfully
 *                 results:
 *                   - id: 60d0fe4f5311236168a109cb
 *                     name: John Doe
 *                     email: john.doe@example.com
 *                     title: App Improvement Suggestion
 *                     message: I think adding a dark mode would be great!
 *                     isProcessed: false
 *                     createdAt: 2025-05-09T12:00:00Z
 *                     updatedAt: 2025-05-09T12:00:00Z
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *                 totalResults: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /feedbacks/{feedbackId}:
 *   get:
 *     summary: Get feedback by ID
 *     description: Retrieve a single feedback by its ID. Requires authentication and get permission.
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       "200":
 *         description: Feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feedback retrieved successfully
 *                 result:
 *                   $ref: '#/components/schemas/Feedback'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update feedback
 *     description: Update an existing feedback by ID. Requires authentication and update permission.
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the user submitting the feedback
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user submitting the feedback
 *               title:
 *                 type: string
 *                 description: Title of the feedback
 *               message:
 *                 type: string
 *                 description: Content of the feedback
 *               isProcessed:
 *                 type: boolean
 *                 description: Whether the feedback has been processed
 *             example:
 *               isProcessed: true
 *     responses:
 *       "200":
 *         description: Feedback updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feedback updated successfully
 *                 result:
 *                   $ref: '#/components/schemas/Feedback'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete feedback
 *     description: Delete a feedback by ID. Requires authentication and delete permission.
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       "204":
 *         description: Feedback deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feedback deleted successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Feedback ID
 *         name:
 *           type: string
 *           description: Name of the user submitting the feedback
 *         email:
 *           type: string
 *           description: Email of the user submitting the feedback
 *         title:
 *           type: string
 *           description: Title of the feedback
 *         message:
 *           type: string
 *           description: Content of the feedback
 *         isProcessed:
 *           type: boolean
 *           description: Whether the feedback has been processed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *       example:
 *         id: 60d0fe4f5311236168a109cb
 *         name: John Doe
 *         email: john.doe@example.com
 *         title: App Improvement Suggestion
 *         message: I think adding a dark mode would be great!
 *         isProcessed: false
 *         createdAt: 2025-05-09T12:00:00Z
 *         updatedAt: 2025-05-09T12:00:00Z
 */
