const express = require('express');
const auth = require('../../middlewares/auth');
const { statisticController } = require('../../controllers');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: User and connection statistics management
 */

/**
 * @swagger
 * /statistics/users:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve statistics about total, male, and female users, including percentage change compared to the previous week. Requires authentication and manage permission.
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User statistics retrieved successfully
 *                 results:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                           description: Total number of users
 *                           example: 1000
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage change compared to the previous week
 *                           example: 5.25
 *                     male:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                           description: Number of male users
 *                           example: 600
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage change compared to the previous week
 *                           example: 4.0
 *                     female:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                           description: Number of female users
 *                           example: 400
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage change compared to the previous week
 *                           example: 7.5
 *                     other:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage change compared to the previous week
 *                           example: 3.0
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.route('/users').get(auth('manage'), statisticController.getUserStatistics);

/**
 * @swagger
 * /statistics/connections:
 *   get:
 *     summary: Get connection statistics
 *     description: Retrieve statistics about total and live connections, including percentage change compared to the previous week. Requires authentication and manage permission.
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Connection statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Connection statistics retrieved successfully
 *                 results:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                           description: Total number of connections
 *                           example: 500
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage change compared to the previous week
 *                           example: 8.75
 *                     live:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                           description: Number of live connections
 *                           example: 100
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage change compared to the previous week
 *                           example: 12.5
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.route('/connections').get(auth('manage'), statisticController.getConnectionStatistics);

/**
 * @swagger
 * /statistics/connections/weekly:
 *   get:
 *     summary: Get weekly connection statistics
 *     description: Retrieve weekly statistics for connections, formatted for bar chart display. Requires authentication and manage permission.
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Weekly connection statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Weekly connection statistics retrieved successfully
 *                 results:
 *                   type: object
 *                   properties:
 *                     labels:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["M", "T", "W", "T", "F", "S", "S"]
 *                     datasets:
 *                       type: object
 *                       properties:
 *                         label:
 *                           type: string
 *                           example: Connections
 *                         data:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           example: [50, 20, 10, 22, 50, 10, 40]
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.route('/connections/weekly').get(auth('manage'), statisticController.getWeeklyConnectionStatistics);

/**
 * @swagger
 * /statistics/reviews:
 *   get:
 *     summary: Get review statistics
 *     description: Retrieve statistics about total and negative reviews (rating <= 2), including percentage change compared to the previous week. Requires authentication and manage permission.
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Review statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Review statistics retrieved successfully
 *                 results:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                           description: Total number of reviews
 *                           example: 100
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage change compared to the previous week
 *                           example: 25.0
 *                     negative:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                           description: Number of negative reviews (rating <= 2)
 *                           example: 20
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage change compared to the previous week
 *                           example: 33.33
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.route('/reviews').get(auth('manage'), statisticController.getReviewStatistics);

module.exports = router;
