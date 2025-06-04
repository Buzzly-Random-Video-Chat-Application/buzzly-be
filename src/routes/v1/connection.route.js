const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { connectionValidation } = require('../../validations');
const { connectionController } = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(auth('create'), validate(connectionValidation.createConnection), connectionController.createConnection)
  .get(auth('get'), validate(connectionValidation.queryConnections), connectionController.queryConnections);

router
  .route('/:roomId')
  .get(auth('get'), validate(connectionValidation.getConnection), connectionController.getConnection)
  .patch(auth('update'), validate(connectionValidation.updateConnection), connectionController.updateConnection)
  .delete(auth('delete'), validate(connectionValidation.deleteConnection), connectionController.deleteConnection);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Connections
 *   description: APIs for managing connections
 */

/**
 * @swagger
 * /connections:
 *   post:
 *     summary: Create a new connection
 *     description: Create a connection between two users. Only authenticated users can create a connection. The connectionId is automatically generated.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - p1UserId
 *               - p2UserId
 *             properties:
 *               roomId:
 *                 type: string
 *               p1UserId:
 *                 type: string
 *               p2UserId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Connection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Connection'
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
 *   get:
 *     summary: Get a list of connections
 *     description: Retrieve a paginated list of connections based on filters.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isLive
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
 *         description: Connections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Connection'
 *                 page:
 *                   type: number
 *                 limit:
 *                   type: number
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
 */

/**
 * @swagger
 * /connections/{roomId}:
 *   get:
 *     summary: Get a connection by ID
 *     description: Retrieve a connection by its unique identifier.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Connection retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Connection'
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
 *   patch:
 *     summary: Update a connection by ID
 *     description: Update a connection by its unique identifier.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: string
 *               p1UserId:
 *                 type: string
 *               p2UserId:
 *                 type: string
 *               isLive:
 *                 type: boolean
 *     responses:
 *       "200":
 *         description: Connection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Connection'
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
 *   delete:
 *     summary: Delete a connection by ID
 *     description: Delete a connection by its unique identifier.
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *     responses:
 *       "200":
 *         description: Connection deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Connection:
 *       type: object
 *       properties:
 *         roomId:
 *           type: string
 *         p1UserId:
 *           type: string
 *         p2UserId:
 *           type: string
 *         isLive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */