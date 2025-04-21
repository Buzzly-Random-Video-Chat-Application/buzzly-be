const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const reviewValidation = require('../../validations/review.validation');
const reviewController = require('../../controllers/review.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('create'), validate(reviewValidation.createReview), reviewController.createReview)
  .get(validate(reviewValidation.queryReviews), reviewController.queryReviews);

router
  .route('/:reviewId')
  .patch(auth('update'), validate(reviewValidation.updateReview), reviewController.updateReview)
  .delete(auth('delete'), validate(reviewValidation.deleteReview), reviewController.deleteReview);

router
  .route('/app-rating')
  .get(reviewController.getAppRating);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review management and retrieval
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a review
 *     description: Create a new review. Requires authentication and createReview permission.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 5
 *               review:
 *                 type: string
 *             required:
 *               - userId
 *               - rating
 *             example:
 *               userId: "60d0fe4f5311236168a109ca"
 *               rating: 4.5
 *               review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 rating:
 *                   type: number
 *                   format: float
 *                 review:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *               example:
 *                 _id: "60d0fe4f5311236168a109cb"
 *                 userId: "60d0fe4f5311236168a109ca"
 *                 rating: 4.5
 *                 review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
 *                 createdAt: "2023-10-01T12:00:00Z"
 *                 updatedAt: "2023-10-01T12:00:00Z"
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   get:
 *     summary: Get all reviews
 *     description: Retrieve a list of reviews. Requires authentication and queryReviews permission.
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter reviews by user ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field (e.g., rating:asc, createdAt:desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of reviews per page (default = 10)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Current page number (default = 1)
 *     responses:
 *       "200":
 *         description: A list of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       rating:
 *                         type: number
 *                         format: float
 *                       review:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *               example:
 *                 results:
 *                   - _id: "60d0fe4f5311236168a109cb"
 *                     userId: "60d0fe4f5311236168a109ca"
 *                     rating: 4.5
 *                     review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
 *                     createdAt: "2023-10-01T12:00:00Z"
 *                     updatedAt: "2023-10-01T12:00:00Z"
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *                 totalResults: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /reviews/{reviewId}:
 *   patch:
 *     summary: Update a review
 *     description: Update an existing review by ID. Requires authentication and updateReview permission.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 5
 *               review:
 *                 type: string
 *             example:
 *               rating: 5.0
 *               review: "Even better now!"
 *     responses:
 *       "200":
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 rating:
 *                   type: number
 *                   format: float
 *                 review:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *               example:
 *                 _id: "60d0fe4f5311236168a109cb"
 *                 userId: "60d0fe4f5311236168a109ca"
 *                 rating: 5.0
 *                 review: "Even better now!"
 *                 createdAt: "2023-10-01T12:00:00Z"
 *                 updatedAt: "2023-10-02T12:00:00Z"
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Delete a review
 *     description: Delete a review by ID. Requires authentication and deleteReview permission.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to delete
 *     responses:
 *       "204":
 *         description: Review deleted successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /reviews/app-rating:
 *   get:
 *     summary: Get app rating statistics
 *     description: Retrieve the average rating and percentage distribution of all reviews. No authentication required.
 *     tags: [Reviews]
 *     responses:
 *       "200":
 *         description: App rating statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rating:
 *                   type: number
 *                   format: float
 *                   description: The average rating of all reviews
 *                 reviewCount:
 *                   type: integer
 *                   description: Total number of reviews
 *                 excellent:
 *                   type: number
 *                   format: float
 *                   description: Percentage of reviews with rating = 5
 *                 good:
 *                   type: number
 *                   format: float
 *                   description: Percentage of reviews with rating >= 4
 *                 average:
 *                   type: number
 *                   format: float
 *                   description: Percentage of reviews with rating >= 3
 *                 belowAverage:
 *                   type: number
 *                   format: float
 *                   description: Percentage of reviews with rating >= 2
 *                 poor:
 *                   type: number
 *                   format: float
 *                   description: Percentage of reviews with rating >= 1
 *               example:
 *                 rating: 4.2
 *                 reviewCount: 100
 *                 excellent: 80.0
 *                 good: 5.0
 *                 average: 5.0
 *                 belowAverage: 10.0
 *                 poor: 0.0
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * components:
 *   responses:
 *     Unauthorized:
 *       description: Unauthorized
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *             example:
 *               message: "Unauthorized"
 *     Forbidden:
 *       description: Forbidden
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *             example:
 *               message: "Forbidden"
 *     NotFound:
 *       description: Not Found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *             example:
 *               message: "Resource not found"
 *     BadRequest:
 *       description: Bad Request
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *             example:
 *               message: "Invalid request data"
 *     InternalServerError:
 *       description: Internal Server Error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *             example:
 *               message: "Internal server error"
 */